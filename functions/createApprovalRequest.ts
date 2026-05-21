import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (!body.driver_name || !body.request_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const record = await base44.asServiceRole.entities.ApprovalRequest.create(body);
    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
