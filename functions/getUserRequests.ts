import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return Response.json({ error: 'Missing user_id or role' }, { status: 400 });
    }

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    let records = [];

    if (role === 'driver') {
      records = await base44.asServiceRole.entities.ApprovalRequest.filter({
        driver_user_id: user_id
      });
    } else if (role === 'approver') {
      records = await base44.asServiceRole.entities.ApprovalRequest.filter({
        approver_user_id: user_id
      });
    }

    // Filter out records older than 2 weeks (based on created_date)
    const filtered = records.filter((r: any) => {
      const created = new Date(r.created_date || r.created_at || 0);
      return created >= new Date(twoWeeksAgo);
    });

    // Sort newest first
    filtered.sort((a: any, b: any) =>
      new Date(b.created_date || 0).getTime() - new Date(a.created_date || 0).getTime()
    );

    return Response.json({ records: filtered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
