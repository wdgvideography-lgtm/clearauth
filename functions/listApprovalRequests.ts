import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const records = await base44.asServiceRole.entities.ApprovalRequest.list();
    return Response.json({ records });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
