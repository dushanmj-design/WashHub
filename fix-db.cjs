const fs = require('fs');
let content = fs.readFileSync('src/database.ts', 'utf8');

const oldUpdateOrderStatus = `public async updateOrderStatus(tenantId: string, barcodeId: string, role?: string): Promise<Order> {
    const order = await this.getOrderByBarcode(tenantId, barcodeId, role);
    if (!order) throw new Error('Order not found');
    const flow = ['wash', 'dry', 'iron', 'completed', 'delivered'];
    const idx = flow.indexOf(order.status);
    if (idx >= 0 && idx < flow.length - 1) {
      order.status = flow[idx + 1] as any;
      order.updated_at = new Date().toISOString();
      const cleanOrder = Object.fromEntries(Object.entries(order).filter(([_, v]) => v !== undefined)); await setDoc(doc(firestore, 'orders', order.id), cleanOrder);
      await this.createNotification(tenantId, \`Order \${barcodeId} moved to \${order.status}\`, 'info');
    }
    return order;
  }`;

const newUpdateOrderStatus = `public async updateOrderStatus(tenantId: string, barcodeId: string, role?: string): Promise<Order> {
    const order = await this.getOrderByBarcode(tenantId, barcodeId, role);
    if (!order) throw new Error('Order not found');
    
    // Jump straight to completed and trigger SMS
    if (order.status !== 'completed' && order.status !== 'delivered') {
      order.status = 'completed';
      order.updated_at = new Date().toISOString();
      const cleanOrder = Object.fromEntries(Object.entries(order).filter(([_, v]) => v !== undefined)); 
      await setDoc(doc(firestore, 'orders', order.id), cleanOrder);
      
      const phone = order.customer_mobile || (order.supervisor_data?.order_details?.customer?.telephone) || 'Unknown';
      await this.createNotification(tenantId, \`[SMS SENT] to \${phone}: Order \${barcodeId} is washed, ironed and READY FOR PICKUP!\`, 'success');
    } else {
      throw new Error('Order is already completed or delivered');
    }
    return order;
  }`;

content = content.replace(oldUpdateOrderStatus, newUpdateOrderStatus);
fs.writeFileSync('src/database.ts', content);
