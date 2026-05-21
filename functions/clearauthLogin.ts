import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Hash the provided password with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Look up user by username
    const records = await base44.asServiceRole.entities.ClearAuthUser.list();
    const user = records.find((r: any) =>
      r.username?.toLowerCase() === username.toLowerCase() &&
      r.status === 'active' &&
      r.invite_used === true
    );

    if (!user) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.password_hash !== passwordHash) {
      return Response.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Return safe user object (no password hash)
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      role: user.role,
      company_id: user.company_id,
      company_name: user.company_name,
      department: user.department,
      allowed_approvers: user.allowed_approvers,
      allow_all_approvers: user.allow_all_approvers,
      phone: user.phone || '',
      photo_url: user.photo_url || '',
    };

    return Response.json({ success: true, user: safeUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
