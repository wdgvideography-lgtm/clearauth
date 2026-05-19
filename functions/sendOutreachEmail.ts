import { createClient } from "npm:@base44/sdk";

const base44 = createClient({ appId: "6a0c1534017166f536b1ac32" });

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json();
  const { lead_id } = body;

  // Get the lead
  const lead = await base44.asServiceRole.entities.Lead.get(lead_id);
  if (!lead) {
    return new Response(JSON.stringify({ error: "Lead not found" }), { status: 404 });
  }

  // Get Gmail access token
  const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

  // Determine which step to send
  const sentEmails = await base44.asServiceRole.entities.OutreachEmail.filter({ lead_id });
  const nextStep = sentEmails.length + 1;

  if (nextStep > 3) {
    return new Response(JSON.stringify({ message: "Sequence complete for this lead" }), { status: 200 });
  }

  const sequences: Record<number, { subject: string; body: string }> = {
    1: {
      subject: `Your website deserves better, ${lead.business_name}`,
      body: `Hi ${lead.contact_name || "there"},\n\nI came across ${lead.business_name} and I have to say — what you're doing is impressive. But I noticed your website isn't quite doing your business justice.\n\nAt WDG, we help local businesses like yours get a complete digital upgrade — from a modern, high-converting website to professional videography and full social media management.\n\nWe've helped businesses in ${lead.location || "your area"} go from invisible online to fully booked.\n\nWould you be open to a quick 15-minute call this week to see if we'd be a good fit?\n\nBest,\nWDG Videography & Marketing\nassistant.wdg@gmail.com`,
    },
    2: {
      subject: `Re: Your website deserves better, ${lead.business_name}`,
      body: `Hi ${lead.contact_name || "there"},\n\nJust wanted to bump this up in case it got buried!\n\nA lot of the businesses we work with came to us with a website that was costing them customers without them even knowing it. We redesign, reshoot, and manage everything so you don't have to.\n\nHappy to show you a few examples of what we've done for similar businesses in ${lead.location || "your area"}.\n\nWorth a quick chat?\n\nBest,\nWDG Videography & Marketing`,
    },
    3: {
      subject: `Last note from WDG`,
      body: `Hi ${lead.contact_name || "there"},\n\nI'll keep this short — I know you're busy.\n\nWe specialize in helping local businesses get a website and online presence that actually works. If now isn't the right time, no worries at all. But if you ever want to explore what a full digital upgrade could look like for ${lead.business_name}, we'd love to chat.\n\nFeel free to reply anytime.\n\nAll the best,\nWDG Videography & Marketing\nassistant.wdg@gmail.com`,
    },
  };

  const email = sequences[nextStep];

  // Build MIME message
  const mimeMessage = [
    `From: WDG Videography <assistant.wdg@gmail.com>`,
    `To: ${lead.email}`,
    `Subject: ${email.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    email.body,
  ].join("\n");

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
    return new Response(JSON.stringify({ error: err }), { status: 500 });
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

  // Update lead status and last contacted
  await base44.asServiceRole.entities.Lead.update(lead_id, {
    status: "Contacted",
    last_contacted: new Date().toISOString().split("T")[0],
    next_followup: new Date(Date.now() + (nextStep === 1 ? 3 : 6) * 86400000).toISOString().split("T")[0],
  });

  return new Response(JSON.stringify({ success: true, step: nextStep }), { status: 200 });
}
