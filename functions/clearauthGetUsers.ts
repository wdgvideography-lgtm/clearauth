import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.ClearAuthUser.list();

    // Get company record to extract persisted site list
    const companyRecord = records.find((r: any) => r.company_id === company_id && r.role === 'company');
    let company_sites: string[] = [];
    if (companyRecord?.department) {
      try {
        const parsed = JSON.parse(companyRecord.department);
        if (Array.isArray(parsed)) company_sites = parsed;
      } catch(_) {}
    }

    // Filter to employees/approvers only (not company account itself), exclude password hashes
    const users = records
      .filter((r: any) => r.company_id === company_id && r.role !== 'company')
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
        phone: r.phone || '',
        photo_url: r.photo_url || '',
      }));

    return Response.json({ success: true, users, company_sites });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
