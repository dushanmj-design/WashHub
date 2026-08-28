import { PaginatedList } from './PaginatedList';
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Coins, 
  AlertTriangle, 
  FileSpreadsheet, 
  DollarSign, 
  CheckCircle, 
  Play, 
  ShieldAlert,
  Users,
  UserPlus,
  Trash2
} from 'lucide-react';
import { Order, OrderStatus, Tenant, User } from '../types';
import { apiFetch } from '../lib/offlineSync';

interface DashboardStats {
  jobStatuses: Record<OrderStatus, number>;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  totalOrdersCount: number;
  discrepanciesCount: number;
  recentDiscrepantOrders: Order[];
}

interface AdminDashboardProps {
  stats: DashboardStats | null;
  onRefresh: () => void;
  activeRole: string;
  activeTenant: Tenant | null;
}

export default function AdminDashboard({ stats, onRefresh, activeRole, activeTenant }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin'|'supervisor'|'user'>('user');
  
  useEffect(() => {
    if (activeTenant && activeRole !== 'user') {
      fetchUsers();
    }
  }, [activeTenant, activeRole]);

  const fetchUsers = async () => {
    try {
      const res = await apiFetch('/api/users', {
        headers: {
          'x-tenant-id': activeTenant?.id || '',
          'x-user-role': activeRole,
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': activeTenant?.id || '',
          'x-user-role': activeRole,
        },
        body: JSON.stringify({
          full_name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
        })
      });
      if (res.ok) {
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        setIsAddingUser(false);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await apiFetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': activeTenant?.id || '',
          'x-user-role': activeRole,
        }
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (activeRole === 'user') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center animate-fade-in" id="user-warning">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-amber-900 font-display">Administrative Console Locked</h3>
        <p className="text-sm text-amber-700 mt-1 max-w-md mx-auto">
          Operational Staff can perform order intake, update sticker statuses, and log cash transactions. Please switch your role to <strong>Admin (Owner)</strong> or <strong>Super Admin</strong> in the header to view business performance analytics.
        </p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400" id="loading-dashboard">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
        <p className="text-sm font-mono">Synchronizing financial analytics ledger...</p>
      </div>
    );
  }

  // Define colors for each order status
  const statusColors: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    wash: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Washing Cycle' },
    dry: { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', label: 'Drying Cycle' },
    iron: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'Ironing Cycle' },
    completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Ready for Pickup' },
    delivered: { bg: 'bg-slate-100 text-slate-700 border-slate-200', text: 'text-slate-600', label: 'Settled & Delivered' }
  };

  return (
    <div className="space-y-6 animate-slide-up" id="admin-dashboard">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-cyan-600" />
            Financial & Cycle Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Real-time business audit, job state monitoring and fraud indicators.</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shadow-sm"
          id="refresh-stats-btn"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Grid of basic KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Net Cash Flow Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Business Capital</span>
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              Rs. {stats.netCashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                +Rs. {stats.cashIn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in
              </span>
              <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                -Rs. {stats.cashOut.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} out
              </span>
            </div>
          </div>
        </div>

        {/* Total Active Jobs */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders Processed</span>
            <div className="bg-cyan-100 p-2 rounded-xl text-cyan-600">
              <Play className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {stats.totalOrdersCount}
            </span>
            <p className="text-xs text-slate-500 mt-2">
              Active queues: <strong className="text-slate-800 font-mono">{stats.jobStatuses.wash + stats.jobStatuses.dry + stats.jobStatuses.iron + stats.jobStatuses.completed}</strong> in progress
            </p>
          </div>
        </div>

        {/* Discrepancies Indicator */}
        <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition ${
          stats.discrepanciesCount > 0 
            ? 'bg-rose-50/50 border-rose-100' 
            : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimate Discrepancies</span>
            <div className={`p-2 rounded-xl ${
              stats.discrepanciesCount > 0 
                ? 'bg-rose-100 text-rose-600' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-bold font-mono ${
              stats.discrepanciesCount > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {stats.discrepanciesCount}
            </span>
            <p className="text-xs text-slate-500 mt-2">
              {stats.discrepanciesCount > 0 
                ? '⚠️ Supervisor inspection is recommended for flagged orders' 
                : '✅ Invoice calculations align perfectly with estimations'
              }
            </p>
          </div>
        </div>

      </div>

      {/* Cycle Stage Distribution Bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Real-Time Stage Queue Loads</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(Object.keys(statusColors) as OrderStatus[]).map((status) => {
            const count = stats.jobStatuses[status] || 0;
            const config = statusColors[status];
            return (
              <div key={status} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${config.bg}`}>
                <span className="text-xl font-bold font-mono">{count}</span>
                <span className="text-[11px] font-medium mt-1 uppercase tracking-tight">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Discrepancy Alerts Details */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Audit Ledger: Active Discrepancy Warnings
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">
              Requires attention
            </span>
          </div>

          {stats.recentDiscrepantOrders.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm">
              🛡️ Perfect calculations! No billing mismatches logged on final invoices.
            </div>
          ) : (
            <PaginatedList
              items={stats.recentDiscrepantOrders}
              itemsPerPage={5}
              sortByDateDesc={(order) => order.created_at}
              listClassName="space-y-3"
              renderItem={(order) => {
                const diff = order.final_amount ? order.final_amount - order.estimated_amount : 0;
                const percentDiff = ((diff / order.estimated_amount) * 100).toFixed(0);
                return (
                  <div 
                    key={order.id} 
                    className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                          {order.barcode_id}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {order.customer_name} ({order.customer_mobile})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Workflow: <strong className="text-slate-700">{order.workflow === 'wash_dry_iron' ? 'Wash, Dry, Iron' : 'Wash, Dry'}</strong> | Weight: <strong className="text-slate-700">{order.weight} kg</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">Estimate vs Final Invoice</p>
                        <p className="text-sm font-medium text-slate-700">
                          Rs. {order.estimated_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ➔ <strong className="text-rose-600 font-bold">Rs. {order.final_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        </p>
                      </div>
                      <div className="bg-rose-100 text-rose-700 font-bold font-mono text-xs px-2.5 py-1.5 rounded-lg border border-rose-200">
                        +{percentDiff}%
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>

        {/* Staff / Branch Management */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-600" />
              Manage Branch Staff
            </h3>
            <button 
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="text-xs flex items-center gap-1 font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 px-2 py-1 rounded transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {isAddingUser ? 'Cancel' : 'Add User'}
            </button>
          </div>
          
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input type="text" required value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input type="email" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input type="password" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as any)} className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm">
                  <option value="user">Operational Staff (User)</option>
                  <option value="supervisor">Supervisor (Manager)</option>
                  <option value="admin">Branch Owner (Admin)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-cyan-600 text-white rounded py-1.5 text-sm font-medium hover:bg-cyan-700">Save User</button>
            </form>
          )}

          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No staff members found.</p>
            ) : (
              <PaginatedList<User>
                items={users}
                itemsPerPage={5}
                sortByDateDesc={(user) => user.created_at}
                listClassName="space-y-2"
                renderItem={(user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{user.full_name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mt-1 inline-block">
                        {user.role}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
