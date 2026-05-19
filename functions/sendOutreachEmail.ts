import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { lead_id } = body;

    if (!lead_id) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    // Get the lead
    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.email) {
      return Response.json({ error: "Lead has no email address" }, { status: 400 });
    }

    // Get Gmail access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    // Determine which step to send
    const sentEmails = await base44.asServiceRole.entities.OutreachEmail.filter({ lead_id });
    const nextStep = (sentEmails?.length || 0) + 1;

    if (nextStep > 3) {
      return Response.json({ message: "Sequence complete for this lead" }, { status: 200 });
    }

    const businessName = lead.business_name || "your business";
    const contactName = lead.contact_name || "there";
    const location = lead.location || "your area";

    const sequences: Record<number, { subject: string; body: string }> = {
      1: {
        subject: `Your website deserves better, ${businessName}`,
        body: `Hi ${contactName},\n\nI came across ${businessName} and I have to say — what you're doing is impressive. But I noticed your website isn't quite doing your business justice.\n\nAt WDG, we help local businesses like yours get a complete digital upgrade — from a modern, high-converting website to professional videography and full social media management.\n\nWe've helped businesses in ${location} go from invisible online to fully booked.\n\nWould you be open to a quick 15-minute call this week to see if we'd be a good fit?\n\nBest,\nWDG Videography & Marketing\nassistant.wdg@gmail.com`,
      },
      2: {
        subject: `Re: Your website deserves better, ${businessName}`,
        body: `Hi ${contactName},\n\nJust wanted to bump this up in case it got buried!\n\nA lot of the businesses we work with came to us with a website that was costing them customers without them even knowing it. We redesign, reshoot, and manage everything so you don't have to.\n\nHappy to show you a few examples of what we've done for similar businesses in ${location}.\n\nWorth a quick chat?\n\nBest,\nWDG Videography & Marketing\nassistant.wdg@gmail.com`,
      },
      3: {
        subject: `Last note from WDG`,
        body: `Hi ${contactName},\n\nI'll keep this short — I know you're busy.\n\nWe specialize in helping local businesses get a website and online presence that actually works. If now isn't the right time, no worries at all. But if you ever want to explore what a full digital upgrade could look like for ${businessName}, we'd love to chat.\n\nFeel free to reply anytime.\n\nAll the best,\nWDG Videography & Marketing\nassistant.wdg@gmail.com`,
      },
    };

    const email = sequences[nextStep];

    // Build RFC 2822 MIME message
    const mimeMessage = [
      `From: WDG Videography <assistant.wdg@gmail.com>`,
      `To: ${lead.email}`,
      `Subject: ${email.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `MIME-Version: 1.0`,
      ``,
      email.body,
    ].join("\r\n");

    const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    if (!sendResponse.ok) {
      const err = await sendResponse.text();
      return Response.json({ error: err }, { status: 500 });
    }

    // Log the sent email
    await base44.asServiceRole.entities.OutreachEmail.create({
      lead_id,
      subject: email.subject,
      body: email.body,
      sequence_step: nextStep,
      status: "Sent",
      sent_at: new Date().toISOString(),
    });

    // Update lead status and follow-up date
    const daysUntilNextFollowup = nextStep === 1 ? 4 : 6;
    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: "Contacted",
      last_contacted: new Date().toISOString().split("T")[0],
      next_followup: new Date(Date.now() + daysUntilNextFollowup * 86400000).toISOString().split("T")[0],
    });

    return Response.json({ success: true, step: nextStep, sent_to: lead.email });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
