import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { company_id, company_name, role } = await req.json();

    if (!company_id || !role) {
      return Response.json({ error: 'company_id and role required' }, { status: 400 });
    }

    if (!['employee', 'approver'].includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Generate a unique invite token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');

    // Create a placeholder user record for the invite
    const record = await base44.asServiceRole.entities.ClearAuthUser.create({
      company_id,
      company_name: company_name || '',
      role,
      full_name: '',
      username: '',
      password_hash: '',
      invite_token: token,
      invite_used: false,
      status: 'pending',
      allowed_approvers: [],
      allow_all_approvers: false,
      department: '',
    });

    return Response.json({ success: true, token, user_id: record.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
