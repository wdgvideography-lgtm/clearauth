import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, password } = await req.json();

    if (!user_id || !password) {
      return Response.json({ error: 'Missing user_id or password' }, { status: 400 });
    }

    // Find user
    const user = await base44.asServiceRole.entities.ClearAuthUser.get(user_id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password before allowing deletion
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (passwordHash !== user.password_hash) {
      return Response.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Don't allow company accounts to delete themselves this way
    if (user.role === 'company') {
      return Response.json({ error: 'Company accounts cannot be deleted this way' }, { status: 403 });
    }

    // Remove this user from any allowed_approvers lists
    const allUsers = await base44.asServiceRole.entities.ClearAuthUser.list();
    for (const u of allUsers) {
      if (u.allowed_approvers && u.allowed_approvers.includes(user_id)) {
        await base44.asServiceRole.entities.ClearAuthUser.update(u.id, {
          allowed_approvers: u.allowed_approvers.filter((id: string) => id !== user_id)
        });
      }
    }

    // Delete the user
    await base44.asServiceRole.entities.ClearAuthUser.delete(user_id);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
