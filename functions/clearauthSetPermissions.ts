import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { driver_id, allow_all_approvers, allowed_approvers } = await req.json();

    if (!driver_id) {
      return Response.json({ error: 'driver_id required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.ClearAuthUser.update(driver_id, {
      allow_all_approvers: allow_all_approvers === true,
      allowed_approvers: allow_all_approvers ? [] : (allowed_approvers || []),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
