import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { driver_id, company_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.ClearAuthUser.list();

    // Get all active approvers in company
    const allApprovers = records.filter((r: any) =>
      r.company_id === company_id &&
      r.role === 'approver' &&
      r.status === 'active'
    ).map((r: any) => ({ id: r.id, full_name: r.full_name, username: r.username }));

    if (!driver_id) {
      return Response.json({ success: true, approvers: allApprovers });
    }

    // Get this driver's permissions
    const driver = records.find((r: any) => r.id === driver_id);
    if (!driver) {
      return Response.json({ error: 'Driver not found' }, { status: 404 });
    }

    // If allow_all_approvers or no restrictions set, return all
    if (driver.allow_all_approvers || !driver.allowed_approvers || driver.allowed_approvers.length === 0) {
      return Response.json({ success: true, approvers: allApprovers });
    }

    // Filter to only allowed approvers
    const allowed = allApprovers.filter((a: any) => driver.allowed_approvers.includes(a.id));
    return Response.json({ success: true, approvers: allowed });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
