// @ts-nocheck
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './src/database';
import { WorkflowType } from './src/types';

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
      res.json(list);
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

  // 8. Workflow updates via barcode scanning
  app.patch('/api/orders/workflow/update', async (req: Request, res: Response) => {
    const { tenantId, userRole } = getTenantContext(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing active Tenant ID header' });
    }

    const { barcode_id } = req.body;
    if (!barcode_id) {
      return res.status(400).json({ error: 'Barcode ID is required' });
    }

    try {
      const result = await db.updateOrderStatus(tenantId, barcode_id, userRole);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
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
