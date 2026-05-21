import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { token, action, denial_reason, approver_note } = body;

    if (!token || !action) {
      return Response.json({ error: 'Missing token or action' }, { status: 400 });
    }

    if (!['Approved', 'Denied'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find request by token
    const records = await base44.asServiceRole.entities.ApprovalRequest.filter({ approval_token: token });
    if (!records || records.length === 0) {
      return Response.json({ error: 'Request not found' }, { status: 404 });
    }

    const record = records[0];

    if (record.status !== 'Pending') {
      return Response.json({ error: 'Request already processed', status: record.status }, { status: 409 });
    }

    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return Response.json({ error: 'Approval link has expired' }, { status: 410 });
    }

    const now = new Date().toISOString();
    const updateData: Record<string, string> = {
      status: action,
      approved_at: now,
    };

    if (action === 'Denied' && denial_reason) {
      updateData.denial_reason = denial_reason;
    }

    // Save approver note regardless of action (Approved or Denied)
    if (approver_note) {
      updateData.approver_note = approver_note;
    }

    await base44.asServiceRole.entities.ApprovalRequest.update(record.id, updateData);

    const updated = await base44.asServiceRole.entities.ApprovalRequest.get(record.id);

    return Response.json({ success: true, record: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
