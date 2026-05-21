import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, user_id, full_name, username, password, department } = body;

    if (!action || !user_id) {
      return Response.json({ error: 'action and user_id required' }, { status: 400 });
    }

    if (action === 'delete') {
      await base44.asServiceRole.entities.ClearAuthUser.delete(user_id);
      return Response.json({ success: true });
    }

    if (action === 'update') {
      const updateData: any = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (username !== undefined) updateData.username = username;
      if (department !== undefined) updateData.department = department;

      if (password) {
        // Hash password (simple approach — store bcrypt-style)
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        updateData.password_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      await base44.asServiceRole.entities.ClearAuthUser.update(user_id, updateData);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
