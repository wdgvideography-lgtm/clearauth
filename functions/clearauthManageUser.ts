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
      // 1. Get the user being deleted so we know their role
      const allUsers = await base44.asServiceRole.entities.ClearAuthUser.list();
      const deletedUser = allUsers.find((u: any) => u.id === user_id);

      // 2. Delete the user record
      await base44.asServiceRole.entities.ClearAuthUser.delete(user_id);

      // 3. CASCADE: If they were an approver, remove them from every other user's allowed_approvers list
      if (deletedUser?.role === 'approver') {
        const usersWithAccess = allUsers.filter((u: any) =>
          u.id !== user_id &&
          Array.isArray(u.allowed_approvers) &&
          u.allowed_approvers.includes(user_id)
        );
        for (const u of usersWithAccess) {
          const cleaned = u.allowed_approvers.filter((id: string) => id !== user_id);
          await base44.asServiceRole.entities.ClearAuthUser.update(u.id, {
            allowed_approvers: cleaned,
          });
        }
      }

      // 4. CASCADE: Remove any pending approval requests where this user is the employee or approver
      const allRequests = await base44.asServiceRole.entities.ApprovalRequest.list();
      const relatedRequests = allRequests.filter((r: any) =>
        r.driver_user_id === user_id || r.approver_user_id === user_id
      );
      for (const r of relatedRequests) {
        // Only remove pending ones — keep historical records but nullify the user link
        if (r.status === 'Pending') {
          await base44.asServiceRole.entities.ApprovalRequest.update(r.id, {
            status: 'Cancelled',
            denial_reason: 'User account removed',
          });
        }
      }

      return Response.json({ success: true, cascaded: {
        approver_references_cleaned: deletedUser?.role === 'approver' ? relatedRequests.length : 0,
        pending_requests_cancelled: relatedRequests.filter((r: any) => r.status === 'Pending').length,
      }});
    }

    if (action === 'update') {
      const updateData: any = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (username !== undefined) updateData.username = username;
      if (department !== undefined) updateData.department = department;

      if (password) {
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
