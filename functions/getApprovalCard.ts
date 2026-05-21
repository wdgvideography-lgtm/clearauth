import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Missing token' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.ApprovalRequest.filter({ approval_token: token });
    if (!records || records.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ record: records[0] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
