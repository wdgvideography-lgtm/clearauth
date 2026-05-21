import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { message } = body;

    // Try different SDK channel methods
    const client = base44 as any;
    console.log('SDK keys:', Object.keys(client));
    console.log('Channels:', client.channels ? Object.keys(client.channels) : 'none');

    return Response.json({ keys: Object.keys(client), channels: client.channels ? Object.keys(client.channels) : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
