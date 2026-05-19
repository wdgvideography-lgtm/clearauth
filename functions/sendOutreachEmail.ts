import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const { lead_id } = body;

    if (!lead_id) {
      return Response.json({ error: "lead_id is required" }, { status: 400 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!lead.email) {
      return Response.json({ error: "Lead has no email address" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    const sentEmails = await base44.asServiceRole.entities.OutreachEmail.filter({ lead_id });
    const nextStep = (sentEmails?.length ?? 0) + 1;

    if (nextStep > 3) {
      return Response.json({ message: "Sequence complete for this lead" }, { status: 200 });
    }

    const businessName = lead.business_name || "your business";
    const contactName = lead.contact_name || "there";
    const location = lead.location || "your area";

    const sequences: Record<number, { subject: string; body: string }> = {
      1: {
        subject: `We want to run ${businessName}'s entire marketing`,
        body: `Hi ${contactName},

I came across ${businessName} and honestly — the work you're doing deserves a much bigger audience.

My name's Will from WDG. We're a full-service marketing agency that takes over the entire marketing operation for local businesses like yours. Not just a website. Not just a few social posts. Everything.

Here's what that looks like in practice:

— A completely rebuilt, modern website designed to convert visitors into customers
— Full social media management across Instagram, Facebook, TikTok and more — daily content, community engagement, growth strategy
— Professional videography — brand films, product showcases, behind-the-scenes content
— YouTube brand documentaries — long-form films that tell your story and rank on search for years
— Ongoing strategy and reporting so you always know what's working

The businesses we work with don't think about their marketing anymore. That's our job.

I'd love to show you what a full marketing takeover could look like for ${businessName} specifically. Would you be open to a 20-minute call this week?

Best,
Will
WDG Videography & Marketing
assistant.wdg@gmail.com`,
      },
      2: {
        subject: `Re: Running ${businessName}'s marketing`,
        body: `Hi ${contactName},

Just following up in case my last message got buried.

To give you a clearer picture of what we do — we recently worked with a local business similar to ${businessName}. Within 90 days they had a new website live, a consistent social media presence building real followers, and a brand documentary on YouTube that's still bringing them in new customers today.

That's what we mean when we say full-service. We don't hand you a website and disappear. We sit alongside your business and manage every part of how the world sees you online.

If you've ever thought "we really need to sort out our marketing" — that's exactly the conversation we'd love to have.

Fancy a quick call this week? I can walk you through what we'd do specifically for ${businessName}.

Best,
Will
WDG Videography & Marketing
assistant.wdg@gmail.com`,
      },
      3: {
        subject: `Last one from WDG — full marketing takeover for ${businessName}`,
        body: `Hi ${contactName},

I'll make this my last message — I don't want to clog up your inbox.

But I did want to leave you with this:

Most businesses in ${location} are invisible online. They have a patchy social media presence, a website that hasn't been touched in years, and no video content at all. Their competitors are quietly taking their customers.

We fix all of that — website, social media, photography, videography, YouTube documentaries — completely managed by us so you can focus on running your business.

If that's ever something ${businessName} wants to explore, just reply to this email and we'll pick it up from there. No pressure, no pitch call until you're ready.

Wishing you a great week.

Will
WDG Videography & Marketing
assistant.wdg@gmail.com`,
      },
    };

    const email = sequences[nextStep];

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

    await base44.asServiceRole.entities.OutreachEmail.create({
      lead_id,
      subject: email.subject,
      body: email.body,
      sequence_step: nextStep,
      status: "Sent",
      sent_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Lead.update(lead_id, {
      status: "Contacted",
      last_contacted: new Date().toISOString().split("T")[0],
      next_followup: new Date(Date.now() + (nextStep === 1 ? 4 : 6) * 86400000).toISOString().split("T")[0],
    });

    return Response.json({ success: true, step: nextStep, sent_to: lead.email });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
