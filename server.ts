// @ts-nocheck
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { db } from './src/database';
import { WorkflowType } from './src/types';
import { sendSMSGoMessage, getSMSGoStatus, normalizeSriLankanPhone } from './src/lib/smsService';

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // Middleware to resolve multi-tenant context from headers
  const getTenantContext = (req: Request) => {
    const tenantId = (req.headers['x-tenant-id'] as string) || '';
    const userRole = (req.headers['x-user-role'] as string) || 'user';
    return { tenantId, userRole };
  };

  // --- API ENDPOINTS ---

  // 1. Health check
  app.get('/api/health', async (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // 2. Tenants & Onboarding
  app.get('/api/tenants', async (req: Request, res: Response) => {
    try {
      const list = await db.getTenants();
      const sanitized = list.map((t: any) => ({
        ...t,
        name: (t.name || 'WashHub').replace(/wash\s*bay/gi, 'WashHub'),
        subdomain: (t.subdomain || 'washhub').replace(/wash\s*bay/gi, 'washhub')
      }));
      res.json(sanitized);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tenants', async (req: Request, res: Response) => {
    const { name, subdomain } = req.body;
    if (!name || !subdomain) {
      return res.status(400).json({ error: 'Name and subdomain are required' });
    }
    try {
      const tenant = await db.createTenant(name, subdomain);
      res.status(201).json(tenant);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/tenants/:id', async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    try {
      const tenant = await db.updateTenant(req.params.id, name);
      res.json(tenant);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 3. Simulated Authentication login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
      const session = await db.loginUser(email, password);
      if (session && session.tenant) {
        session.tenant.name = (session.tenant.name || 'WashHub').replace(/wash\s*bay/gi, 'WashHub');
        session.tenant.subdomain = (session.tenant.subdomain || 'washhub').replace(/wash\s*bay/gi, 'washhub');
      }
      res.json(session);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  });

  
  // Reset Password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    // In a real application, this would send an email.
    // For this prototype, we'll just return a success message.
    try {
      res.json({ message: 'If the email exists, a password reset link has been sent.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Get active customers
  app.get('/api/customers', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const list = await db.getCustomers(tenantId, userRole);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4.1 Lookup customer by phone
  app.get('/api/customers/lookup/:phone', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const customers = await db.getCustomers(tenantId, userRole);
      const phoneToMatch = req.params.phone.trim();
      const customer = customers.find(c => c.mobile_number === phoneToMatch || c.mobile_number === `+94${phoneToMatch.substring(1)}` || c.mobile_number.endsWith(phoneToMatch.substring(1)));
      if (customer) {
        return res.json(customer);
      }
      return res.status(404).json({ error: 'Not found' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Get active users (staff)
  app.get('/api/users', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const list = await db.getUsers(tenantId, userRole);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) return res.status(400).json({ error: 'Missing active Tenant ID header' });
    try {
      if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { full_name, email, role, password, branch_id } = req.body;
      const result = await db.createUser(tenantId, full_name, email, role, password, branch_id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (userRole !== 'super_admin' && userRole !== 'admin' && userRole !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await db.deleteUser(req.params.id);
    res.json({ success: true });
  });

  // EXTENSIONS: Branches, POS, Inventory, Printers
  const createStandardRoutes = (path: string, getFn: any, createFn: any, deleteFn: any) => {
    app.get(path, async (req, res) => {
      const { tenantId, userRole } = getTenantContext(req);
      if (!tenantId) return res.status(400).json({ error: 'Missing tenant' });
      res.json(await getFn(tenantId, userRole));
    });
    app.post(path, async (req, res) => {
      const { tenantId, userRole } = getTenantContext(req);
      if (!tenantId) return res.status(400).json({ error: 'Missing tenant' });
      try {
        const result = await createFn(tenantId, req.body);
        res.json(result);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });
    app.delete(`${path}/:id`, async (req, res) => {
      await deleteFn(req.params.id);
      res.json({ success: true });
    });
  };

  createStandardRoutes('/api/branches', 
    async (t: string, r: string) => await db.getBranches(t, r), 
    async (t: string, b: any) => await db.createBranch(t, b.name, b.location), 
    async (id: string) => await db.deleteBranch(id)
  );

  createStandardRoutes('/api/pos-items', 
    async (t: string, r: string) => await db.getPOSItems(t, r), 
    async (t: string, b: any) => await db.createPOSItem(t, b.name, b.price, b.type), 
    async (id: string) => await db.deletePOSItem(id)
  );

  createStandardRoutes('/api/inventory', 
    async (t: string, r: string) => await db.getInventory(t, r), 
    async (t: string, b: any) => await db.createInventory(t, b.branch_id, b.item_name, b.quantity), 
    async (id: string) => await db.deleteInventory(id)
  );

  createStandardRoutes('/api/printers', 
    async (t: string, r: string) => await db.getPrinters(t, r), 
    async (t: string, b: any) => await db.createPrinter(t, b.name, b.ip_address, b.branch_id), 
    async (id: string) => await db.deletePrinter(id)
  );

  // Network Thermal Printer Raw ESC/POS Socket Dispatcher
  app.post('/api/printers/network-print', async (req: Request, res: Response) => {
    const { ip_address, port = 9100, data_base64 } = req.body;
    if (!ip_address || !data_base64) {
      return res.status(400).json({ error: 'IP address and data payload are required' });
    }

    try {
      const buffer = Buffer.from(data_base64, 'base64');
      const targetPort = parseInt(port, 10) || 9100;

      const client = new net.Socket();
      client.setTimeout(4000); // 4-second timeout for LAN thermal printer

      client.connect(targetPort, ip_address, () => {
        client.write(buffer, () => {
          client.end();
          res.json({ success: true, message: `Successfully sent print command to network printer at ${ip_address}:${targetPort}` });
        });
      });

      client.on('error', (err) => {
        client.destroy();
        res.status(502).json({ error: `Could not connect to printer at ${ip_address}:${targetPort} - ${err.message}` });
      });

      client.on('timeout', () => {
        client.destroy();
        res.status(504).json({ error: `Connection timed out to printer at ${ip_address}:${targetPort}` });
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal network printer error' });
    }
  });


  // 6. Get/Create Orders (Order Intake)
  app.get('/api/orders', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const list = await db.getOrders(tenantId, userRole);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  
  app.post('/api/supervisor-orders', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    if (userRole !== 'supervisor') {
      return res.status(403).json({ error: 'Only supervisors can use this endpoint' });
    }

    try {
      const payload = req.body.order_details;
      // We will map this to the existing Order type or create a specialized record.
      // But we must return an order compatible with the existing frontend
      
      const result = await db.createSupervisorOrder(tenantId, payload);
      res.json({ success: true, order: result.order });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

app.post('/api/orders', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }

    const { customer_mobile, customer_name, workflow, weight, pieces, rate_per_kg, ironing_rate_per_piece } = req.body;

    if (!customer_mobile || !customer_name || !workflow || weight === undefined || !rate_per_kg) {
      return res.status(400).json({ error: 'Missing required order fields: customer_mobile, customer_name, workflow, weight, rate_per_kg' });
    }

    try {
      const result = await db.createOrder(
        tenantId,
        {
          customer_mobile,
          customer_name,
          workflow: workflow as WorkflowType,
          weight: parseFloat(weight),
          pieces: pieces ? parseInt(pieces, 10) : undefined,
          rate_per_kg: parseFloat(rate_per_kg),
          ironing_rate_per_piece: ironing_rate_per_piece ? parseFloat(ironing_rate_per_piece) : undefined
        },
        userRole
      );
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Get Order by Barcode
  app.get('/api/orders/barcode/:barcode', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID' });
    }
    try {
      const order = await db.getOrderByBarcode(tenantId, req.params.barcode, userRole);
      if (!order) {
        return res.status(404).json({ error: 'No order found matching barcode ID' });
      }
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SMS Gateway Status Endpoint
  app.get('/api/sms/status', async (req: Request, res: Response) => {
    try {
      const status = await getSMSGoStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // SMS Gateway Direct Test Endpoint
  app.post('/api/sms/test', async (req: Request, res: Response) => {
    const { to, message, mask } = req.body;
    if (!to) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }
    try {
      const result = await sendSMSGoMessage({
        to,
        message: message || 'Test message from Wash Hub via SMSGo gateway.',
        mask
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Helper: Process order completion and SMS dispatch via SMSGo
  async function processOrderReadyAndSms(tenantId: string, barcode_id: string, userRole: string = 'supervisor') {
    let cleanBarcode = (barcode_id || '').trim();
    if (cleanBarcode.includes('scan/')) {
      const parts = cleanBarcode.split('scan/');
      cleanBarcode = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
    } else if (cleanBarcode.includes('scan=')) {
      const m = cleanBarcode.match(/scan=([^&#\s]+)/);
      if (m) cleanBarcode = decodeURIComponent(m[1]).trim();
    }

    const effectiveTenantId = tenantId || 't-1';
    const order = await db.updateOrderStatus(effectiveTenantId, cleanBarcode, userRole);
    
    // Extract customer contact details
    const rawPhone = order.customer_mobile || 
                     (order as any).supervisor_data?.order_details?.customer?.telephone || 
                     (order as any).supervisor_data?.customer?.telephone || 
                     '';
    
    const customerName = order.customer_name || 
                         (order as any).supervisor_data?.order_details?.customer?.name || 
                         (order as any).supervisor_data?.customer?.name || 
                         'Customer';
    
    const totalAmount = order.final_amount || 
                        order.estimated_amount || 
                        (order as any).supervisor_data?.order_details?.billing?.total_amount || 
                        0;
    
    const advance = (order as any).supervisor_data?.order_details?.billing?.advance || 0;
    const balance = Math.max(0, totalAmount - advance);
    const balanceStr = balance > 0 ? `Rs. ${balance.toFixed(2)}` : 'PAID';

    let shopName = 'WashHub';
    try {
      const tenant = await db.getTenant(order.tenant_id || effectiveTenantId);
      if (tenant?.name) shopName = tenant.name;
    } catch {
      // Use default
    }
    shopName = (shopName || 'WashHub').replace(/wash\s*bay/gi, 'WashHub');

    // Compose SMS text (without balance as requested)
    const smsMessage = `${shopName}: Hello ${customerName}, your laundry order #${order.barcode_id || cleanBarcode} is washed, packed, and READY FOR PICKUP! Thank you!`;

    // Trigger SMS dispatch through SMSGo Gateway
    const smsResult = await sendSMSGoMessage({
      to: rawPhone,
      message: smsMessage,
      campaignName: 'Supervisor_Scan'
    });

    // Update Firestore database notifications and order SMS record
    if (smsResult.success) {
      await db.createNotification(
        order.tenant_id || effectiveTenantId,
        `[SMS DISPATCHED via SMSGo] to ${smsResult.phone}: "${smsMessage}"`,
        'info'
      );
      await db.updateOrderSmsStatus(order.id, {
        sms_sent: true,
        sms_phone: smsResult.phone,
        sms_status: 'dispatched',
        sms_dispatched_at: new Date().toISOString(),
        sms_message: smsMessage
      });
    } else if (smsResult.reason === 'MASK_REQUIRED') {
      await db.createNotification(
        order.tenant_id || effectiveTenantId,
        `[SMSGo Gateway Alert] Order ${cleanBarcode} ready. SMS queued for ${smsResult.phone}. Please register/approve an SMSGo Sender Mask (e.g. WashHub) in your smsgo.lk dashboard.`,
        'warning'
      );
      await db.updateOrderSmsStatus(order.id, {
        sms_sent: false,
        sms_phone: smsResult.phone,
        sms_status: 'mask_required',
        sms_message: smsMessage
      });
    } else {
      await db.createNotification(
        order.tenant_id || effectiveTenantId,
        `[SMSGo Gateway Notice] Order ${cleanBarcode} ready. SMS to ${smsResult.phone}: ${smsResult.error}`,
        'warning'
      );
      await db.updateOrderSmsStatus(order.id, {
        sms_sent: false,
        sms_phone: smsResult.phone,
        sms_status: 'error',
        sms_message: smsMessage
      });
    }

    return {
      order,
      cleanBarcode,
      customerName,
      rawPhone,
      phone: smsResult.phone || rawPhone,
      smsMessage,
      smsResult,
      balanceStr,
      shopName
    };
  }

  // 8. Workflow updates via barcode/QR scanning (Supervisor & Staff)
  app.all(['/api/orders/workflow/update', '/api/orders/scan'], async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    const barcode_id = req.body?.barcode_id || req.body?.barcode || req.query?.barcode || (req.body && typeof req.body === 'string' ? req.body : '');
    if (!barcode_id) {
      return res.status(400).json({ error: 'Barcode ID is required' });
    }

    try {
      const data = await processOrderReadyAndSms(tenantId || 't-1', barcode_id, userRole);
      res.json({
        ...data.order,
        barcode_id: data.cleanBarcode,
        sms_sent: data.smsResult.success,
        sms_dispatched: data.smsResult.success,
        sms_provider: 'SMSGo.lk Gateway',
        sms_reason: data.smsResult.reason,
        customer_phone: data.phone,
        sms_message: data.smsMessage,
        sms_error: data.smsResult.error,
        sms_response: data.smsResult.response
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 8.1 Public QR Scan Endpoint (handles phone camera scans directly without login barriers)
  app.all(['/scan/:barcode', '/api/scan-public/:barcode'], async (req: Request, res: Response) => {
    const { barcode } = req.params;
    const isApiRequest = req.path.startsWith('/api/') || req.headers.accept?.includes('application/json');

    try {
      const data = await processOrderReadyAndSms('t-1', barcode, 'supervisor');

      if (isApiRequest) {
        return res.json({
          success: true,
          ...data.order,
          barcode_id: data.cleanBarcode,
          sms_sent: data.smsResult.success,
          sms_dispatched: data.smsResult.success,
          sms_provider: 'SMSGo.lk Gateway',
          sms_reason: data.smsResult.reason,
          customer_phone: data.phone,
          sms_message: data.smsMessage,
          sms_error: data.smsResult.error
        });
      }

      // Render standalone, responsive mobile HTML confirmation screen
      const isSuccess = data.smsResult.success;
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Ready & SMS Dispatched - ${data.shopName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 font-sans">
  <div class="max-w-md w-full bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
    <!-- Header -->
    <div class="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
      <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-white/10">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-black uppercase tracking-tight">${data.shopName}</h1>
      <p class="text-emerald-100 font-medium text-sm mt-0.5">Order #${data.cleanBarcode} is Marked Ready!</p>
    </div>

    <!-- Body Content -->
    <div class="p-6 space-y-4">
      <!-- Status Banner -->
      <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-950 flex items-start gap-3">
        <svg class="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <strong class="font-extrabold text-sm block">SMS Successfully Dispatched</strong>
          <span class="text-xs text-emerald-800">Customer notified via SMSGo Gateway (Mask: LaundroPOS).</span>
        </div>
      </div>

      <!-- Order & SMS Meta Card -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
        <div class="flex justify-between items-center pb-2 border-b border-slate-200">
          <span class="font-bold text-slate-500 uppercase">Customer Name:</span>
          <span class="font-mono font-bold text-slate-900">${data.customerName}</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-slate-200">
          <span class="font-bold text-slate-500 uppercase">Mobile Phone:</span>
          <span class="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">${data.phone}</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-slate-200">
          <span class="font-bold text-slate-500 uppercase">Order Status:</span>
          <span class="font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">READY FOR PICKUP</span>
        </div>
        <div class="flex justify-between items-center pb-2 border-b border-slate-200">
          <span class="font-bold text-slate-500 uppercase">Balance Due:</span>
          <span class="font-mono font-black text-slate-900 text-sm">${data.balanceStr}</span>
        </div>
        <div class="space-y-1 pt-1">
          <span class="font-bold text-slate-500 uppercase block text-[10px]">Dispatched SMS Message:</span>
          <div class="bg-white p-3 rounded-xl border border-slate-200 font-sans italic text-slate-800 text-[11px] leading-relaxed shadow-inner">
            "${data.smsMessage}"
          </div>
        </div>
      </div>

      <!-- Action Button -->
      <a href="/" class="block w-full text-center py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-md transition-all">
        Open WashHub POS Console
      </a>
    </div>
  </div>
</body>
</html>`);
    } catch (err: any) {
      if (isApiRequest) {
        return res.status(404).json({ error: err.message || 'Order not found' });
      }
      res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${err.message || 'Order Notice'} - WashHub</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white text-slate-900 rounded-3xl shadow-2xl p-6 text-center">
    <div class="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    </div>
    <h2 class="text-xl font-bold text-slate-900">${err.message || 'Order Notice'}</h2>
    <p class="text-sm text-slate-500 mt-1">Barcode: <strong class="font-mono">${barcode}</strong></p>
    <p class="text-xs text-slate-500 mt-2">${err.message?.includes('delivered') ? 'This order has already been marked as collected and delivered to the customer.' : 'Could not locate an active laundry order with this barcode.'}</p>
    <a href="/" class="mt-5 inline-block py-2.5 px-6 bg-slate-900 text-white font-bold rounded-xl text-sm">Return to POS</a>
  </div>
</body>
</html>`);
    }
  });

  // 9. Billing closeout with final estimation discrepancy checks
  app.post('/api/orders/:id/close', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }

    const { id } = req.params;
    const { final_amount, received_cash } = req.body;

    if (final_amount === undefined || received_cash === undefined) {
      return res.status(400).json({ error: 'final_amount and received_cash are required parameters' });
    }

    try {
      const order = await db.closeOrder(
        tenantId,
        id,
        parseFloat(final_amount),
        parseFloat(received_cash),
        userRole
      );
      res.json({ message: 'Order completed, billed and closed successfully', order });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // 10. Cash Ledger transactions
  app.get('/api/cash-ledger', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const list = await db.getCashLedger(tenantId, userRole);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/cash-ledger', async (req: Request, res: Response) => {
    const { tenantId } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }

    const { amount, transaction_type, note } = req.body;
    if (!amount || !transaction_type || !note) {
      return res.status(400).json({ error: 'amount, transaction_type, and note are required' });
    }

    try {
      const entry = await db.createCashTransaction(
        tenantId,
        parseFloat(amount),
        transaction_type,
        note
      );
      res.status(201).json(entry);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Simulated Notification logs
  app.get('/api/notifications', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }
    try {
      const list = await db.getNotifications(tenantId, userRole);
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Real-time admin reporting and analytics dashboard
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID' });
    }

    try {
      const orders = await db.getOrders(tenantId, userRole);
      const ledger = await db.getCashLedger(tenantId, userRole);

      // Status counters
      const statusCounts = {
        wash: orders.filter(o => o.status === 'wash').length,
        dry: orders.filter(o => o.status === 'dry').length,
        iron: orders.filter(o => o.status === 'iron').length,
        completed: orders.filter(o => o.status === 'completed').length,
        delivered: orders.filter(o => o.status === 'delivered').length
      };

      // Financial analytics
      let cashIn = 0;
      let cashOut = 0;

      ledger.forEach(tx => {
        if (tx.transaction_type === 'IN') {
          cashIn += tx.amount;
        } else {
          cashOut += tx.amount;
        }
      });

      const discrepancies = orders.filter(o => o.is_discrepancy_flagged).length;

      res.json({
        jobStatuses: statusCounts,
        cashIn,
        cashOut,
        netCashFlow: cashIn - cashOut,
        totalOrdersCount: orders.length,
        discrepanciesCount: discrepancies,
        recentDiscrepantOrders: orders.filter(o => o.is_discrepancy_flagged).slice(0, 5)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE MIDDLEWARE AND STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CycleOn Backend] Live at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Backend Init Fail]:', err);
});
