const fs = require('fs');
let code = fs.readFileSync('src/database.ts', 'utf8');

const insertion = `
  public async createSupervisorOrder(tenantId: string, payload: any): Promise<{ order: Order }> {
    const customer = await this.getOrCreateCustomer(tenantId, payload.customer.telephone, payload.customer.name);
    const barcode_id = 'WB-' + Date.now().toString().slice(-6);
    const id = 'o-' + Date.now();
    
    // We map the payload into our generic Order interface to keep the frontend list happy,
    // but we can also store the full payload in a sub-object or merge it.
    const newOrder: any = {
      id, 
      tenant_id: tenantId, 
      barcode_id, 
      customer_mobile: customer.mobile_number, 
      customer_name: customer.name,
      workflow: 'wash_dry_iron', // Defaulting for types
      weight: payload.specs.weight_kg, 
      pieces: payload.specs.quantity, 
      estimated_amount: payload.billing.total_amount, 
      final_amount: payload.billing.total_amount,
      is_discrepancy_flagged: false, 
      status: payload.status || 'completed', 
      created_at: new Date().toISOString(), 
      updated_at: new Date().toISOString(),
      supervisor_data: payload // Storing the full manual payload
    };
    
    await this.createDoc('orders', id, newOrder);
    
    // Log the transaction
    const tId = 't-' + Date.now();
    await this.createDoc('ledger', tId, {
      id: tId, tenant_id: tenantId, order_id: id,
      amount: payload.billing.advance,
      transaction_type: 'IN',
      note: 'Supervisor Manual Order Advance/Settlement',
      created_at: new Date().toISOString()
    });
    
    return { order: newOrder };
  }
`;

code = code.replace("public async updateOrderStatus", insertion + "public async updateOrderStatus");
fs.writeFileSync('src/database.ts', code);
