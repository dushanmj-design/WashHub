const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `      const workflowStr = Object.keys(payload.services).filter(k => payload.services[k]).join('_');

      const result = await db.createOrder(
        tenantId,
        {
          customer_mobile: payload.customer.telephone,
          customer_name: payload.customer.name,
          workflow: workflowStr as WorkflowType, // We might need a flexible way to store this, or just use existing enums
          weight: payload.specs.weight_kg,
          pieces: payload.specs.quantity,
          rate_per_kg: 0, 
        }
      );
      
      // Since createOrder doesn't take all manual billing amounts directly in our db, 
      // we might need to forcefully update the order to set the manual amounts
      // Let's create an update method or just patch it using our existing mock
      // Wait, let's use the db method properly if possible, or add createSupervisorOrder in db.
      
      // We'll just return a formatted object mimicking the order
      const completedOrder = {
        ...result,
        status: 'completed',
        estimated_amount: payload.billing.total_amount,
        final_amount: payload.billing.total_amount,
        workflow: workflowStr
      };
      
      // Update in DB (Firebase)
      // For now we'll rely on the existing schema which has estimated_amount.
      
      res.json({ success: true, order: completedOrder });`;

const replacement = `      const result = await db.createSupervisorOrder(tenantId, payload);
      res.json({ success: true, order: result.order });`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
