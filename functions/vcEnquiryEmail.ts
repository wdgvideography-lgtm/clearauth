import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Allow CORS so the VC website can POST from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { firstName, lastName, email, phone, service, message } = body;

    if (!firstName || !email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    // Get Gmail access token via the connector
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    // Build the email body
    const emailBody = `New enquiry received from the VC Estate Planning website.

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || 'Not provided'}
Service of Interest: ${service || 'Not specified'}

Message:
${message || 'No message provided'}

---
This enquiry was submitted via the contact form at vcestateplanning.co.uk`;

    // Encode as RFC 2822 base64url
    const toAddress = 'enquiries@vcestateplanning.co.uk';
    const fromAddress = 'assistant.wdg@gmail.com';
    const subject = `New Enquiry — ${firstName} ${lastName} — VC Estate Planning`;

    const rawEmail = [
      `From: "VC Estate Planning Website" <${fromAddress}>`,
      `To: ${toAddress}`,
      `Reply-To: ${email}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      emailBody,
    ].join('\r\n');

    const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gmail send error:', err);
      return Response.json({ error: 'Failed to send email', detail: err }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error('vcEnquiryEmail error:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
