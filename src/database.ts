import fs from 'fs';
import path from 'path';
import { 
  Tenant, 
  User, 
  Customer, 
  Order, 
  CashLedger, 
  SimulatedNotification, 
  WorkflowType, 
  OrderStatus,
  TransactionType,
  Branch,
  POSItem,
  InventoryItem,
  Printer
} from './types';



// @ts-nocheck
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "tangential-theme-2n50x",
  apiKey: "AIzaSyD-_luGshZAuSc_KNquCnYQqij5tQn4T6g",
  authDomain: "tangential-theme-2n50x.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app, "ai-studio-cycleonpos-ef30f3c8-b05f-4029-b178-2cca0b8e2f4b");

class Database {
  private async getByTenant<T>(coll: string, tenantId: string): Promise<T[]> {
    const q = query(collection(firestore, coll), where('tenant_id', '==', tenantId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as T);
  }
  private async getAll<T>(coll: string): Promise<T[]> {
    const snap = await getDocs(collection(firestore, coll));
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as T);
  }
  private async createDoc<T>(coll: string, id: string, data: any): Promise<T> {
    const cleanedData = Object.fromEntries(Object.entries({ ...data, id }).filter(([_, v]) => v !== undefined));
    await setDoc(doc(firestore, coll, id), cleanedData);
    return cleanedData as T;
  }
  private async deleteDoc(coll: string, id: string): Promise<void> {
    await deleteDoc(doc(firestore, coll, id));
  }

  public async getTenants(userRole?: string): Promise<Tenant[]> {
    return this.getAll<Tenant>('tenants');
  }

  public async createTenant(name: string, subdomain: string): Promise<Tenant> {
    const id = 't-' + Date.now();
    return this.createDoc<Tenant>('tenants', id, { name, subdomain, created_at: new Date().toISOString() });
  }

  public async updateTenant(tenantId: string, name: string): Promise<Tenant> {
    const d = doc(firestore, 'tenants', tenantId);
    await setDoc(d, { name }, { merge: true });
    const snap = await getDoc(d);
    return snap.data() as Tenant;
  }

  public async loginUser(email: string, password?: string): Promise<{ user: User; tenant?: Tenant }> {
    const q = query(collection(firestore, 'users'), where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('User not found');
    const user = snap.docs[0].data() as User;
    if (user.password !== password) throw new Error('Invalid credentials');
    
    if (user.tenant_id) {
      const ts = await getDoc(doc(firestore, 'tenants', user.tenant_id));
      return { user, tenant: ts.data() as Tenant };
    }
    return { user };
  }

  public async getUsers(tenantId: string, role?: string): Promise<User[]> {
    return this.getByTenant<User>('users', tenantId);
  }

  public async createUser(tenantId: string, full_name: string, email: string, role: 'admin' | 'user', password?: string, branch_id?: string): Promise<User> {
    const id = 'u-' + Date.now();
    return this.createDoc<User>('users', id, { tenant_id: tenantId, full_name, email, role, password, branch_id, created_at: new Date().toISOString() });
  }
  public async deleteUser(userId: string): Promise<void> {
    await this.deleteDoc('users', userId);
  }

  public async getCustomers(tenantId: string, role?: string): Promise<Customer[]> {
    return this.getByTenant<Customer>('customers', tenantId);
  }

  public async getOrCreateCustomer(tenantId: string, mobileNumber: string, name: string, address?: string, role?: string): Promise<Customer> {
    const q = query(collection(firestore, 'customers'), where('tenant_id', '==', tenantId), where('mobile_number', '==', mobileNumber));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data() as Customer;
    const id = 'c-' + Date.now();
    return this.createDoc<Customer>('customers', id, { tenant_id: tenantId, mobile_number: mobileNumber, name, address, created_at: new Date().toISOString() });
  }

  public async getOrders(tenantId: string, role?: string): Promise<Order[]> {
    return this.getByTenant<Order>('orders', tenantId);
  }

  public async createOrder(
    tenantId: string,
    data: { customer_mobile: string; customer_name: string; workflow: WorkflowType; weight: number; pieces?: number; rate_per_kg: number; ironing_rate_per_piece?: number },
    role?: string
  ): Promise<{ order: Order; stickerPayload: any }> {
    const customer = await this.getOrCreateCustomer(tenantId, data.customer_mobile, data.customer_name);
    const barcode_id = 'WB-' + Date.now().toString().slice(-6);
    let estimated_amount = data.weight * data.rate_per_kg;
    if (data.workflow === 'wash_dry_iron' && data.pieces && data.ironing_rate_per_piece) {
      estimated_amount += data.pieces * data.ironing_rate_per_piece;
    }
    
    const id = 'o-' + Date.now();
    const newOrder: Order = {
      id, tenant_id: tenantId, barcode_id, customer_mobile: customer.mobile_number, customer_name: customer.name,
      workflow: data.workflow, weight: data.weight, pieces: data.pieces, 
      estimated_amount, ironing_rate_per_piece: data.ironing_rate_per_piece, is_discrepancy_flagged: false, status: 'wash', created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    };
    await this.createDoc<Order>('orders', id, newOrder);

    let shopName = 'Wash Hub';
    const ts = await getDoc(doc(firestore, 'tenants', tenantId));
    if (ts.exists()) {
      shopName = ts.data().name || shopName;
    }

    const stickerPayload = {
      barcode: barcode_id, customer: customer.name, mobile: customer.mobile_number, services: data.workflow.replace(/_/g, ' '),
      weight: data.weight + ' kg', pieces: data.pieces ? data.pieces + ' pcs' : 'N/A', in_date: newOrder.created_at,
      est_amount: estimated_amount, shopName
    };
    return { order: newOrder, stickerPayload };
  }

  public async getOrderByBarcode(tenantId: string, barcodeId: string, role?: string): Promise<Order | undefined> {
    const q = query(collection(firestore, 'orders'), where('tenant_id', '==', tenantId), where('barcode_id', '==', barcodeId));
    const snap = await getDocs(q);
    return snap.empty ? undefined : snap.docs[0].data() as Order;
  }

  
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
      workflow: payload.services ? Object.keys(payload.services).filter(k => payload.services[k]).join('_') : 'wash_dry_iron',
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
public async updateOrderStatus(tenantId: string, barcodeId: string, role?: string): Promise<Order> {
    const order = await this.getOrderByBarcode(tenantId, barcodeId, role);
    if (!order) throw new Error('Order not found');
    const flow = ['wash', 'dry', 'iron', 'completed', 'delivered'];
    const idx = flow.indexOf(order.status);
    if (idx >= 0 && idx < flow.length - 1) {
      order.status = flow[idx + 1] as any;
      order.updated_at = new Date().toISOString();
      const cleanOrder = Object.fromEntries(Object.entries(order).filter(([_, v]) => v !== undefined)); await setDoc(doc(firestore, 'orders', order.id), cleanOrder);
      await this.createNotification(tenantId, `Order ${barcodeId} moved to ${order.status}`, 'info');
    }
    return order;
  }

  public async closeOrder(tenantId: string, orderId: string, finalAmount: number, receivedCash: number, role?: string): Promise<Order> {
    const snap = await getDoc(doc(firestore, 'orders', orderId));
    if (!snap.exists()) throw new Error('Order not found');
    const order = snap.data() as Order;
    order.status = 'delivered';
    (order as any).final_amount = finalAmount;
    (order as any).received_cash = receivedCash;
    order.updated_at = new Date().toISOString();
    (order as any).is_discrepancy_flagged = Math.abs(order.estimated_amount - finalAmount) > 5;
    const cleanOrder = Object.fromEntries(Object.entries(order).filter(([_, v]) => v !== undefined)); await setDoc(doc(firestore, 'orders', orderId), cleanOrder);

    await this.createCashTransaction(tenantId, receivedCash, 'IN', `Order ${order.barcode_id} Payment`);
    
    if ((order as any).is_discrepancy_flagged) {
      await this.createNotification(tenantId, `Discrepancy flag on ${order.barcode_id}. Est: ${order.estimated_amount}, Final: ${finalAmount}`, 'warning');
    }
    return order;
  }

  public async getCashLedger(tenantId: string, role?: string): Promise<CashLedger[]> {
    return this.getByTenant<CashLedger>('cash_ledger', tenantId);
  }

  public async createCashTransaction(tenantId: string, amount: number, type: 'IN' | 'OUT', note: string): Promise<CashLedger> {
    const id = 'l-' + Date.now();
    return this.createDoc<CashLedger>('cash_ledger', id, { tenant_id: tenantId, amount, transaction_type: type, note, timestamp: new Date().toISOString() });
  }

  public async getNotifications(tenantId: string, role?: string): Promise<SimulatedNotification[]> {
    return this.getByTenant<SimulatedNotification>('notifications', tenantId);
  }

  public async createNotification(tenantId: string, message: string, level: 'info' | 'warning' | 'critical'): Promise<SimulatedNotification> {
    const id = 'n-' + Date.now();
    return this.createDoc<SimulatedNotification>('notifications', id, { tenant_id: tenantId, message, level, timestamp: new Date().toISOString() });
  }

  public async getBranches(tenantId: string, role?: string): Promise<Branch[]> {
    return this.getByTenant<Branch>('branches', tenantId);
  }
  public async createBranch(tenantId: string, name: string, location: string): Promise<Branch> {
    return this.createDoc<Branch>('branches', 'b-' + Date.now(), { tenant_id: tenantId, name, location, is_active: true });
  }
  public async deleteBranch(id: string): Promise<void> { await this.deleteDoc('branches', id); }

  public async getPOSItems(tenantId: string, role?: string): Promise<POSItem[]> {
    return this.getByTenant<POSItem>('pos_items', tenantId);
  }
  public async createPOSItem(tenantId: string, name: string, price: number, type: 'service' | 'product'): Promise<POSItem> {
    return this.createDoc<POSItem>('pos_items', 'p-' + Date.now(), { tenant_id: tenantId, name, price, type });
  }
  public async deletePOSItem(id: string): Promise<void> { await this.deleteDoc('pos_items', id); }

  public async getInventory(tenantId: string, role?: string): Promise<InventoryItem[]> {
    return this.getByTenant<InventoryItem>('inventory', tenantId);
  }
  public async createInventory(tenantId: string, branchId: string, itemName: string, quantity: number): Promise<InventoryItem> {
    return this.createDoc<InventoryItem>('inventory', 'i-' + Date.now(), { tenant_id: tenantId, branch_id: branchId, item_name: itemName, quantity, last_updated: new Date().toISOString() });
  }
  public async deleteInventory(id: string): Promise<void> { await this.deleteDoc('inventory', id); }

  public async getPrinters(tenantId: string, role?: string): Promise<Printer[]> {
    return this.getByTenant<Printer>('printers', tenantId);
  }
  public async createPrinter(tenantId: string, name: string, ipAddress: string, branchId?: string): Promise<Printer> {
    return this.createDoc<Printer>('printers', 'pr-' + Date.now(), { tenant_id: tenantId, name, ip_address: ipAddress, branch_id: branchId, status: 'online' });
  }
  public async deletePrinter(id: string): Promise<void> { await this.deleteDoc('printers', id); }
}
export const db = new Database();
