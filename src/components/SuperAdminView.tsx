import React, { useState, useEffect } from 'react';
import { UserCheck, Edit2, ShieldAlert, Shield, Plus, Building2, ExternalLink, Box, Printer, Users, Store, Tag, Trash2 } from 'lucide-react';
import { Tenant } from '../types';
import { PaginatedList } from './PaginatedList';
import { apiFetch } from '../lib/offlineSync';

interface SuperAdminViewProps {
  tenants: Tenant[];
  onOnboardTenant: (data: { name: string; subdomain: string }) => void;
  onUpdateTenant?: (id: string, name: string) => void;
  isLoading: boolean;
  onClose: () => void;
}

function SuperAdminModuleManager({ activeTab, tenants }: { activeTab: string, tenants: Tenant[] }) {
  const [selectedTenant, setSelectedTenant] = useState<string>(tenants[0]?.id || '');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({});

  const endpoints: Record<string, string> = {
    'inventory': '/api/inventory',
    'pos_items': '/api/pos-items',
    'branches': '/api/branches',
    'customers': '/api/customers',
    'printers': '/api/printers',
    'staff': '/api/users'
  };

  useEffect(() => {
    if (selectedTenant && activeTab !== 'tenants') {
      fetchData();
    }
  }, [selectedTenant, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = endpoints[activeTab];
      const res = await apiFetch(endpoint, {
        headers: {
          'x-tenant-id': selectedTenant,
          'x-user-role': 'super_admin'
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const endpoint = endpoints[activeTab];
      const res = await apiFetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': selectedTenant,
          'x-user-role': 'super_admin'
        }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = endpoints[activeTab];
      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': selectedTenant,
          'x-user-role': 'super_admin'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({});
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'branches':
        return (
          <>
            <input type="text" placeholder="Branch Name" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="text" placeholder="Location" required value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
          </>
        );
      case 'pos_items':
        return (
          <>
            <input type="text" placeholder="Item Name" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="number" placeholder="Price" required value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <select value={formData.type || 'service'} onChange={e => setFormData({...formData, type: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white">
              <option value="service">Service</option>
              <option value="product">Product</option>
            </select>
          </>
        );
      case 'inventory':
        return (
          <>
            <input type="text" placeholder="Branch ID" required value={formData.branch_id || ''} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="text" placeholder="Item Name" required value={formData.item_name || ''} onChange={e => setFormData({...formData, item_name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="number" placeholder="Quantity" required value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
          </>
        );
      case 'printers':
        return (
          <>
            <input type="text" placeholder="Printer Name" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="text" placeholder="IP Address" required value={formData.ip_address || ''} onChange={e => setFormData({...formData, ip_address: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="text" placeholder="Branch ID (Optional)" value={formData.branch_id || ''} onChange={e => setFormData({...formData, branch_id: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
          </>
        );
      case 'staff':
        return (
          <>
            <input type="text" placeholder="Full Name" required value={formData.full_name || ''} onChange={e => setFormData({...formData, full_name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="email" placeholder="Email" required value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <input type="password" placeholder="Password" required value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white" />
            <select value={formData.role || 'user'} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white">
              <option value="user">User</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </>
        );
      default:
        return <p className="text-sm text-slate-500">Creation not supported here.</p>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
        <label className="text-sm text-slate-300 font-medium shrink-0">Select Tenant:</label>
        <select 
          value={selectedTenant} 
          onChange={e => setSelectedTenant(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-white rounded px-3 py-1.5 text-sm w-full max-w-sm"
        >
          {tenants.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
          ))}
        </select>
      </div>

      <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center justify-between">
          <span>Manage {activeTab.replace('_', ' ')}</span>
        </h4>
        
        {activeTab !== 'customers' && (
          <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4 bg-slate-800 p-3 rounded-lg border border-slate-700">
            {renderForm()}
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 text-sm rounded transition shrink-0 ml-auto">
              Add New
            </button>
          </form>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-slate-500 text-sm py-4 text-center">Loading...</p>
          ) : data.length === 0 ? (
            <p className="text-slate-500 text-sm py-4 text-center">No records found.</p>
          ) : (
            <PaginatedList
              items={data}
              itemsPerPage={10}
              sortByDateDesc={(item) => item.created_at || item.last_updated}
              listClassName="space-y-2"
              renderItem={(item: any) => (
                <div key={item.id || item.mobile_number} className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 hover:border-slate-700 transition">
                  <div className="text-sm">
                    <strong className="text-slate-200 block">{item.name || item.item_name || item.full_name || item.mobile_number}</strong>
                    <span className="text-slate-500 text-xs">
                      {item.location || item.email || item.ip_address || item.type || (item.quantity !== undefined ? `Qty: ${item.quantity}` : null) || item.address}
                    </span>
                  </div>
                  {activeTab !== 'customers' && (
                    <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:text-rose-400 p-2 rounded hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminView({ tenants, onOnboardTenant, onUpdateTenant, isLoading, onClose }: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState('tenants');
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editingTenantName, setEditingTenantName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !subdomain.trim()) {
      setError('Both business name and subdomain are required.');
      return;
    }

    const cleanSubdomain = subdomain.trim().toLowerCase();
    const isAlphanumeric = /^[a-z0-9]+$/i.test(cleanSubdomain);
    if (!isAlphanumeric) {
      setError('Subdomain must contain letters and numbers only.');
      return;
    }

    if (tenants.some(t => t.subdomain === cleanSubdomain)) {
      setError(`Subdomain '${cleanSubdomain}' is already taken.`);
      return;
    }

    onOnboardTenant({ name: name.trim(), subdomain: cleanSubdomain });
    setName('');
    setSubdomain('');
  };

  const renderContent = () => {
    if (activeTab === 'tenants') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Onboard New Laundry Business
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-medium">
                  ⚠️ {error}
                </p>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g., UltraSpin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Subdomain ID</label>
                <div className="flex rounded-lg shadow-sm">
                  <input
                    type="text"
                    placeholder="ultraspin"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-l-lg text-xs px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <span className="inline-flex items-center px-2.5 rounded-r-lg border border-l-0 border-slate-700 bg-slate-800 text-[10px] text-slate-400 font-mono">
                    .washhub.com
                  </span>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                {isLoading ? 'Processing...' : 'Spin Up Tenant'}
              </button>
            </form>
          </div>
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Client Tenant Registry
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
              <PaginatedList
                items={tenants}
                itemsPerPage={6}
                sortByDateDesc={(t) => t.created_at}
                listClassName="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
                renderItem={(tenant) => (
                  <div key={tenant.id} className="bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded border border-cyan-400/10">
                          ID: {tenant.id}
                        </span>
                      </div>
                      {editingTenantId === tenant.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={editingTenantName}
                            onChange={(e) => setEditingTenantName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded text-xs px-2 py-1 text-white outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => {
                              if (onUpdateTenant && editingTenantName.trim()) {
                                onUpdateTenant(tenant.id, editingTenantName.trim());
                              }
                              setEditingTenantId(null);
                            }}
                            className="text-xs bg-emerald-600 text-white px-2 rounded hover:bg-emerald-500"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-1.5">
                          <h5 className="font-bold text-slate-200 text-sm">{tenant.name}</h5>
                          <button 
                            onClick={() => { setEditingTenantId(tenant.id); setEditingTenantName(tenant.name); }}
                            className="text-slate-500 hover:text-cyan-400"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 font-mono mt-1">https://{tenant.subdomain}.cycleon.pos</p>
                    </div>
                    
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      );
    }
    return <SuperAdminModuleManager activeTab={activeTab} tenants={tenants} />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col max-w-6xl mx-auto w-full overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500/20 p-2 rounded-xl border border-cyan-500/30">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">System Administrator Console</h2>
              <p className="text-xs text-slate-500 font-mono">Global platform management & tenant provisioning</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Exit Console
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden mt-6 gap-6">
          <div className="w-full md:w-48 shrink-0 flex flex-col gap-1 overflow-y-auto pr-2">
            {[
              { id: 'tenants', label: 'Tenants', icon: Building2 },
              { id: 'inventory', label: 'Location Inventory', icon: Box },
              { id: 'pos_items', label: 'POS Items', icon: Tag },
              { id: 'branches', label: 'Manage Branches', icon: Store },
              { id: 'customers', label: 'Manage Customers', icon: UserCheck },
              { id: 'printers', label: 'Manage Printers', icon: Printer },
              { id: 'staff', label: 'Manage Staff', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                  activeTab === tab.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
