import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.ClearAuthUser.list();

    // Filter to this company only, exclude password hashes
    const users = records
      .filter((r: any) => r.company_id === company_id)
      .map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        username: r.username,
        role: r.role,
        status: r.status,
        invite_used: r.invite_used,
        invite_token: r.invite_token,
        department: r.department,
        allowed_approvers: r.allowed_approvers || [],
        allow_all_approvers: r.allow_all_approvers || false,
        company_id: r.company_id,
        company_name: r.company_name,
      }));

    return Response.json({ success: true, users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
