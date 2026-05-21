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

    const record = records[0];

    // Enrich with profile photos from ClearAuthUser
    try {
      const allUsers = await base44.asServiceRole.entities.ClearAuthUser.list();

      if (record.driver_user_id) {
        const emp = allUsers.find((u: any) => u.id === record.driver_user_id);
        if (emp) {
          record.employee_photo = emp.photo_url || '';
        }
      }

      if (record.approver_user_id) {
        const app = allUsers.find((u: any) => u.id === record.approver_user_id);
        if (app) {
          record.approver_photo = app.photo_url || '';
          if (!record.approver_role && app.department) record.approver_role = app.department;
        }
      }
    } catch (_) {
      // If enrichment fails, still return the record
    }

    return Response.json({ record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
