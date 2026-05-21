import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Accept both 'employee_name' (new) and 'driver_name' (legacy)
    const employeeName = body.employee_name || body.driver_name;
    if (!employeeName || !body.request_type) {
      return Response.json({ error: 'Missing required fields: employee_name and request_type' }, { status: 400 });
    }

    // Normalise to driver_name for DB field compatibility
    const record = await base44.asServiceRole.entities.ApprovalRequest.create({
      ...body,
      driver_name: employeeName,
      employee_name: employeeName,
    });

    return Response.json({ success: true, record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
