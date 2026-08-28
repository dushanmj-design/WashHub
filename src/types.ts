export type UserRole = 'super_admin' | 'admin' | 'supervisor' | 'user';
export type OrderStatus = 'wash' | 'dry' | 'iron' | 'completed' | 'delivered';
export type WorkflowType = 'wash_dry_iron' | 'wash_dry';
export type TransactionType = 'IN' | 'OUT';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  created_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  branch_id?: string;
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  created_at: string;
}

export interface Branch {
  id: string;
  tenant_id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface POSItem {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  type: 'service' | 'product';
  created_at: string;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  branch_id: string;
  item_name: string;
  quantity: number;
  created_at: string;
}

export interface Printer {
  id: string;
  tenant_id: string;
  branch_id?: string;
  name: string;
  ip_address: string;
  status: 'online' | 'offline';
  created_at: string;
}

export interface Customer {
  mobile_number: string;
  tenant_id: string;
  name: string;
  address?: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  customer_mobile: string;
  customer_name?: string; // Derived or denormalized for simplicity
  barcode_id: string;
  workflow: WorkflowType;
  status: OrderStatus;
  weight: number;
  pieces?: number;
  ironing_rate_per_piece?: number;
  estimated_amount: number;
  final_amount?: number;
  is_discrepancy_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashLedger {
  id: string;
  tenant_id: string;
  order_id?: string;
  amount: number;
  transaction_type: TransactionType;
  note: string;
  created_at: string;
}

export interface SimulatedNotification {
  id: string;
  tenant_id: string;
  customer_mobile: string;
  customer_name: string;
  message: string;
  type: 'sms' | 'whatsapp';
  created_at: string;
}
