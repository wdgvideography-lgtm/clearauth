import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { invite_token, full_name, username, password } = await req.json();

    if (!invite_token) {
      return Response.json({ error: 'Invite token required' }, { status: 400 });
    }

    // Find the invite record
    const records = await base44.asServiceRole.entities.ClearAuthUser.list();
    const inviteUser = records.find((r: any) =>
      r.invite_token === invite_token && r.invite_used === false
    );

    if (!inviteUser) {
      return Response.json({ error: 'Invalid or already used invite link' }, { status: 404 });
    }

    // Peek mode — just validate the token exists
    if (full_name === '__peek__') {
      return Response.json({ success: true, role: inviteUser.role, company_name: inviteUser.company_name });
    }

    if (!full_name || !username || !password) {
      return Response.json({ error: 'All fields required' }, { status: 400 });
    }
    if (password.length < 4) {
      return Response.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Check username not already taken in this company
    const taken = records.find((r: any) =>
      r.username?.toLowerCase() === username.toLowerCase() &&
      r.company_id === inviteUser.company_id &&
      r.id !== inviteUser.id
    );
    if (taken) {
      return Response.json({ error: 'Username already taken — please choose another' }, { status: 409 });
    }

    // Hash password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update the invite record to activate it
    await base44.asServiceRole.entities.ClearAuthUser.update(inviteUser.id, {
      full_name,
      username,
      password_hash: passwordHash,
      invite_used: true,
      status: 'active',
    });

    const updatedUser = await base44.asServiceRole.entities.ClearAuthUser.get(inviteUser.id);

    const safeUser = {
      id: updatedUser.id,
      full_name: updatedUser.full_name,
      username: updatedUser.username,
      role: updatedUser.role,
      company_id: updatedUser.company_id,
      company_name: updatedUser.company_name,
      department: updatedUser.department,
      allowed_approvers: updatedUser.allowed_approvers,
      allow_all_approvers: updatedUser.allow_all_approvers,
    };

    return Response.json({ success: true, user: safeUser });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
