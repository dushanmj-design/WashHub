import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Coins, 
  PlusCircle, 
  QrCode, 
  Shield, 
  Tag, 
  Receipt,
  Bell,
  RefreshCw,
  Building2,
  AlertTriangle,
  WifiOff, CheckCircle2
} from 'lucide-react';

import { Tenant, UserRole, Order, CashLedger, SimulatedNotification } from './types';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';
import OrderIntake from './components/OrderIntake';
import SupervisorIntake from './components/SupervisorIntake';
import BarcodeScanner from './components/BarcodeScanner';
import StickerView from './components/StickerView';
import CashLedgerView from './components/CashLedgerView';
import SuperAdminView from './components/SuperAdminView';
import NotificationLog from './components/NotificationLog';
import BillingCheckout from './components/BillingCheckout';
import FinalBillView from './components/FinalBillView';
import SupervisorReceipt from './components/SupervisorReceipt';
import LoginView from './components/LoginView';
import { apiFetch, syncOfflineQueue } from './lib/offlineSync';

export default function App() {
  // Shared States
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  
  // Isolated States
  const [orders, setOrders] = useState<Order[]>([]);
  const [ledger, setLedger] = useState<CashLedger[]>([]);
  const [notifications, setNotifications] = useState<SimulatedNotification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // Auxiliary UI Toggles
  const [activeTab, setActiveTab] = useState<'operations' | 'scan' | 'billing' | 'ledger' | 'dashboard'>('operations');
  const [stickerPayload, setStickerPayload] = useState<any>(null);
  const [finalBillPayload, setFinalBillPayload] = useState<any>(null);
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 1. Initial Load: Get all tenants
  useEffect(() => {
    fetchTenants();

    const handleOnline = async () => {
      setIsOffline(false);
      await syncOfflineQueue();
      if (activeTenant) refreshTenantData();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Refresh active tenant state on tenant / role modification
  useEffect(() => {
    if (activeTenant) {
      refreshTenantData();
    }
  }, [activeTenant, activeRole]);

  // Network Fetching Helpers
  const fetchTenants = async () => {
    try {
      const res = await apiFetch('/api/tenants');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTenants(data);
        if (data.length > 0 && !activeTenant) {
          setActiveTenant(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tenants registry:', err);
    }
  };

  const refreshTenantData = async () => {
    if (!activeTenant) return;
    setErrorMessage('');
    const headers = {
      'x-tenant-id': activeTenant.id,
      'x-user-role': activeRole,
      'Content-Type': 'application/json'
    };

    try {
      if (!navigator.onLine) {
        // Load from cache
        const cachedOrders = localStorage.getItem(`cycleon_orders_${activeTenant.id}`);
        const cachedLedger = localStorage.getItem(`cycleon_ledger_${activeTenant.id}`);
        if (cachedOrders) setOrders(JSON.parse(cachedOrders));
        if (cachedLedger) setLedger(JSON.parse(cachedLedger));
        return;
      }

      const [ordersRes, ledgerRes, notifRes, statsRes] = await Promise.all([
        apiFetch('/api/orders', { headers }),
        apiFetch('/api/cash-ledger', { headers }),
        apiFetch('/api/notifications', { headers }),
        apiFetch('/api/dashboard/stats', { headers })
      ]);

      const [ordersData, ledgerData, notifData, statsData] = await Promise.all([
        ordersRes.json(),
        ledgerRes.json(),
        notifRes.json(),
        statsRes.json()
      ]);

      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        localStorage.setItem(`cycleon_orders_${activeTenant.id}`, JSON.stringify(ordersData));
      }
      if (Array.isArray(ledgerData)) {
        setLedger(ledgerData);
        localStorage.setItem(`cycleon_ledger_${activeTenant.id}`, JSON.stringify(ledgerData));
      }
      if (Array.isArray(notifData)) setNotifications(notifData);
      if (statsData && !statsData.error) setDashboardStats(statsData);
    } catch (e) {
      console.error('Failed sync cycle for tenant data:', e);
      // Fallback to cache
      const cachedOrders = localStorage.getItem(`cycleon_orders_${activeTenant.id}`);
      const cachedLedger = localStorage.getItem(`cycleon_ledger_${activeTenant.id}`);
      if (cachedOrders) setOrders(JSON.parse(cachedOrders));
      if (cachedLedger) setLedger(JSON.parse(cachedLedger));
    }
  };

  // --- ACTIONS CONTROLLER ---

  // 1. Super Admin: Onboard a new business
  const handleOnboardTenant = async (data: { name: string; subdomain: string }) => {
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const newTenant = await res.json();
      if (newTenant.error) {
        setErrorMessage(newTenant.error);
      } else if (!newTenant.offline) {
        await fetchTenants();
        setActiveTenant(newTenant);
        setShowSuperAdmin(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateTenant = async (id: string, name: string) => {
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch(`/api/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const updatedTenant = await res.json();
      if (updatedTenant.error) {
        setErrorMessage(updatedTenant.error);
      } else if (!updatedTenant.offline) {
        await fetchTenants();
        if (activeTenant?.id === id) {
          setActiveTenant(updatedTenant);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Update failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. Order Intake Submission
  
  const handleSupervisorIntake = async (payload: any) => {
    if (!activeTenant) return;
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      // Create a specific API route or just use the existing one with a special flag
      // Wait, the user said "Once entered final bill should be printed."
      // So we can send it to a new backend route or just trigger the local state
      
      const res = await apiFetch('/api/supervisor-orders', {
        method: 'POST',
        headers: {
          'x-tenant-id': activeTenant.id,
          'x-user-role': activeRole,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create manual order');
      
      // Update local state
      setOrders([resData.order, ...orders]);
      
      // Trigger Final Bill print automatically
      setFinalBillPayload({
        barcode: resData.order.barcode_id,
        customer: resData.order.customer_name || payload.order_details.customer.name,
        mobile: resData.order.customer_mobile || payload.order_details.customer.telephone,
        services: (resData.order.workflow || 'CUSTOM').replace(/_/g, ', ').toUpperCase(),
        weight: payload.order_details.specs.weight_kg.toString(),
        pieces: payload.order_details.specs.quantity.toString(),
        in_date: new Date().toLocaleDateString(),
        est_amount: payload.order_details.billing.total_amount,
        final_amount: payload.order_details.billing.total_amount,
        received_cash: payload.order_details.billing.advance || payload.order_details.billing.total_amount,
        shopName: activeTenant.name || 'Wash Hub',
        isSupervisor: true,
        supervisor_data: resData.order.supervisor_data || payload
      });
      
      setSuccessMessage('Manual Order Settled & Invoiced!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

const handleOrderIntake = async (orderData: {
    customer_mobile: string;
    customer_name: string;
    workflow: any;
    weight: number;
    pieces?: number;
    rate_per_kg: number;
    ironing_rate_per_piece?: number;
  }) => {
    if (!activeTenant) return;
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        headers: {
          'x-tenant-id': activeTenant.id,
          'x-user-role': activeRole,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      const result = await res.json();
      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.offline) {
        setErrorMessage('Saved locally. Will sync when back online.');
      } else {
        setStickerPayload(result.stickerPayload);
        await refreshTenantData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Intake recording error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. Barcode status sequencer scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1000;
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error('Audio beep failed', err);
    }
  };

  const handleScanBarcode = async (barcodeId: string) => {
    if (!activeTenant) return;
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch('/api/orders/workflow/update', {
        method: 'PATCH',
        headers: {
          'x-tenant-id': activeTenant.id,
          'x-user-role': activeRole,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcode_id: barcodeId })
      });
      const result = await res.json();
      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.offline) {
        setErrorMessage('Saved locally. Will sync when back online.');
      } else {
        await refreshTenantData();
        playBeep();
        setSuccessMessage(`Success! Barcode ${barcodeId} advanced to ${result.nextStatus}`);
        setTimeout(() => setSuccessMessage(''), 2500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Barcode lookup failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. Billing closeout checkout
  const handleCloseOrder = async (orderId: string, finalAmount: number, receivedCash: number) => {
    if (!activeTenant) return;
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch(`/api/orders/${orderId}/close`, {
        method: 'POST',
        headers: {
          'x-tenant-id': activeTenant.id,
          'x-user-role': activeRole,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ final_amount: finalAmount, received_cash: receivedCash })
      });
      const result = await res.json();
      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.offline) {
        setErrorMessage('Saved locally. Will sync when back online.');
      } else {
        await refreshTenantData();
        if (result.order) {
          const o = result.order;
          setFinalBillPayload({
            barcode: o.barcode_id,
            customer: o.customer_name,
            mobile: o.customer_mobile,
            services: o.workflow.replace(/_/g, ' '),
            weight: `${o.weight} kg`,
            pieces: o.pieces ? `${o.pieces} pcs` : undefined,
            in_date: o.created_at,
            est_amount: o.estimated_amount,
            final_amount: finalAmount,
            received_cash: receivedCash,
            shopName: activeTenant?.name || 'Wash Bay'
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. Manual cash ledger posting
  const handleAddLedgerTransaction = async (data: {
    amount: number;
    transaction_type: any;
    note: string;
  }) => {
    if (!activeTenant) return;
    setIsActionLoading(true);
    setErrorMessage('');
    try {
      const res = await apiFetch('/api/cash-ledger', {
        method: 'POST',
        headers: {
          'x-tenant-id': activeTenant.id,
          'x-user-role': activeRole,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.offline) {
        setErrorMessage('Saved locally. Will sync when back online.');
      } else {
        await refreshTenantData();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ledger filing error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTenantChange = (tenantId: string) => {
    const selected = tenants.find((t) => t.id === tenantId);
    if (selected) {
      setActiveTenant(selected);
      setStickerPayload(null);
    }
  };

  const handleLogout = () => {
    setSessionUser(null);
    setActiveTenant(null);
  };

  if (!sessionUser) {
    return <LoginView onLogin={(session) => {
      setSessionUser(session.user);
      if (session.tenant) {
        setActiveTenant(session.tenant);
      }
      setActiveRole(session.user.role);
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans antialiased" id="cycleon-root">
      
      {/* Top Controller Bar */}
      <Header
        tenants={tenants}
        activeTenant={activeTenant}
        onTenantChange={handleTenantChange}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        onLogout={handleLogout}
        onOpenSuperAdmin={() => setShowSuperAdmin(true)}
        notificationsCount={notifications.length}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
      />

      {/* Main workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Connection Isolation Header */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                Tenant Row-Level Security State 
                {isOffline && <span className="flex items-center text-rose-500 font-bold"><WifiOff className="h-3 w-3 mr-1"/> OFFLINE MODE</span>}
              </span>
              <strong className="text-sm font-semibold text-slate-900 font-display">
                Connected: {activeTenant?.name} (Subdomain: {activeTenant?.subdomain})
              </strong>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono text-[11px] text-slate-500">
            <span>Query Context Role: </span>
            <strong className="uppercase text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-md font-bold">
              {activeRole}
            </strong>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="bg-rose-50 text-rose-700 border border-rose-200 text-sm px-4 py-3 rounded-2xl font-medium animate-fade-in flex items-center gap-2" id="global-error">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Global Success Popup */}
        {successMessage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pointer-events-none">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl pointer-events-auto transform transition-all p-6 text-center border-2 border-emerald-500 shadow-emerald-500/20 flex flex-col items-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Scan Successful!</h3>
              <p className="text-sm text-slate-500 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Super Admin Modal */}
        {showSuperAdmin && (
          <SuperAdminView
            tenants={tenants}
            onOnboardTenant={handleOnboardTenant}
            onUpdateTenant={handleUpdateTenant}
            isLoading={isActionLoading}
            onClose={() => setShowSuperAdmin(false)}
          />
        )}

        {/* Final Bill Modal */}
        {finalBillPayload && activeTab !== "operations" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar">
              {finalBillPayload.isSupervisor ? (
                <SupervisorReceipt payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} />
              ) : (
                <FinalBillView payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} />
              )}
            </div>
          </div>
        )}

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px" id="tabs-bar">
          
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'operations'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-ops"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Cycle Operations</span>
          </button>
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'scan'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-scan"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'billing'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-billing"
          >
            <Receipt className="h-4 w-4" />
            <span>Billing Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-cyan-600 text-cyan-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
            id="tab-ledger"
          >
            <Coins className="h-4 w-4" />
            <span>Cash Drawer Book</span>
          </button>

          {(activeRole === 'admin' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-cyan-600 text-cyan-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              id="tab-admin"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Admin Console</span>
            </button>
          )}

        </div>

        {/* Tab Views routers */}
        <div className="grid grid-cols-1 gap-6">
          
          {/* 1. OPERATIONS TAB */}
          {activeTab === 'operations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="operations-view">
              {/* Order Intake Form */}
              <div className="lg:col-span-2">
                
                {activeRole === 'supervisor' ? (
                  <SupervisorIntake 
                    onSubmit={handleSupervisorIntake}
                    isLoading={isActionLoading}
                    activeTenantId={activeTenant?.id}
                    activeRole={activeRole}
                  />
                ) : (
                  <OrderIntake 
                    onSubmit={handleOrderIntake} 
                    isLoading={isActionLoading} 
                    activeTenantId={activeTenant?.id}
                    activeRole={activeRole}
                  />
                )}

              </div>

              {/* Spool / Print Sticker Preview & Barcode Scanner OR Final Bill */}
              <div className="flex flex-col h-[calc(100vh-12rem)] sticky top-6">
                {finalBillPayload ? (
                  <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
                    <div className="w-full h-full">
                      {finalBillPayload.isSupervisor ? (
                        <SupervisorReceipt payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />
                      ) : (
                        <FinalBillView payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />
                      )}
                    </div>
                  </div>
                ) : (
                  <StickerView payload={stickerPayload} onClose={() => setStickerPayload(null)} />
                )}
              </div>
            </div>
          )}

          {/* 1.5 SCAN TAB */}
          {activeTab === 'scan' && (
            <div className="animate-fade-in" id="scan-view">
              <BarcodeScanner orders={orders} onScanBarcode={handleScanBarcode} isLoading={isActionLoading} />
            </div>
          )}

          {/* 2. BILLING TAB */}
          {activeTab === 'billing' && (
            <div className="animate-fade-in" id="billing-view">
              <BillingCheckout 
                orders={orders} 
                onCloseOrder={handleCloseOrder} 
                isLoading={isActionLoading} 
              />
            </div>
          )}

          {/* 3. CASH LEDGER TAB */}
          {activeTab === 'ledger' && (
            <div className="animate-fade-in" id="ledger-view">
              <CashLedgerView 
                ledger={ledger} 
                onAddTransaction={handleAddLedgerTransaction} 
                isLoading={isActionLoading} 
              />
            </div>
          )}

          {/* 4. ADMIN ANALYTICS TAB */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in" id="dashboard-view">
              <AdminDashboard 
                stats={dashboardStats} 
                onRefresh={refreshTenantData} 
                activeRole={activeRole}
                activeTenant={activeTenant}
              />
            </div>
          )}

        </div>

      </main>

      {/* Slide-out SMS simulated logger notifications drawer */}
      <NotificationLog
        notifications={notifications}
        onClose={() => setShowNotifications(false)}
        isOpen={showNotifications}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs text-center font-mono">
        <p>© 2026 Wash Bay Laundry POS. High-Isolation Multi-Tenant Client Architecture.</p>
        <p className="mt-1 text-[10px] text-slate-500">Row-Level Database Guard activated. Postgres schema compliant.</p>
      </footer>

    </div>
  );
}
