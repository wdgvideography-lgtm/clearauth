import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { company_id } = body;

    const allRecords = await base44.asServiceRole.entities.ApprovalRequest.list();

    // If company_id supplied, only return that company's requests
    // We match by looking up the approver_user_id or driver_user_id in ClearAuthUser
    if (company_id) {
      const allUsers = await base44.asServiceRole.entities.ClearAuthUser.list();
      const companyUserIds = new Set(
        allUsers
          .filter((u: any) => u.company_id === company_id)
          .map((u: any) => u.id)
      );
      const filtered = allRecords.filter((r: any) =>
        companyUserIds.has(r.approver_user_id) || companyUserIds.has(r.driver_user_id)
      );
      return Response.json({ records: filtered });
    }

    return Response.json({ records: allRecords });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
