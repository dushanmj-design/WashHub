import React from 'react';
import { Building2, ShieldAlert, User, RefreshCw, Bell, PlusCircle } from 'lucide-react';
import { Tenant, UserRole } from '../types';

interface HeaderProps {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  onTenantChange: (tenantId: string) => void;
  activeRole: UserRole;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
  onOpenSuperAdmin: () => void;
  notificationsCount: number;
  onToggleNotifications: () => void;
}

export default function Header({
  tenants,
  activeTenant,
  onTenantChange,
  activeRole,
  onRoleChange,
  onLogout,
  onOpenSuperAdmin,
  notificationsCount,
  onToggleNotifications,
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800" id="app-header">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-2 gap-2 min-h-[4rem]">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 text-slate-950 p-2 rounded-xl flex items-center justify-center font-display font-bold tracking-wider shadow-lg shadow-cyan-500/20">
              WB
            </div>
            <div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {activeTenant?.name || 'Wash Hub'}
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono px-2 py-0.5 bg-slate-800 text-cyan-400 rounded-full">
                POS v1.2
              </span>
            </div>
          </div>

          {/* Central Tenant Switcher */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <select
              value={activeTenant?.id || ''}
              onChange={(e) => onTenantChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block px-3 py-1.5 text-white cursor-pointer hover:bg-slate-755 transition-all"
              id="tenant-select"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  🏢 {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role selection & Utilities */}
          <div className="flex items-center gap-3">
            
            {/* Quick Access to Tenant Onboarding for Super Admin role */}
            {activeRole === 'super_admin' && (
              <button
                onClick={onOpenSuperAdmin}
                className="flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                title="Super Admin Onboarding Panel"
                id="super-admin-btn"
              >
                <PlusCircle className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline-block">Onboard</span>
              </button>
            )}

            {/* Authenticated User Role Pill */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <div className="text-xs text-slate-200 font-medium uppercase hidden sm:block">
                {activeRole.replace('_', ' ')}
              </div>
              <button onClick={() => onLogout()} className="ml-0 sm:ml-2 text-xs text-rose-400 hover:text-rose-300 uppercase font-bold tracking-wider">Logout</button>
            </div>

            {/* Notification Alert Feed Toggle */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
              id="notif-bell"
            >
              <Bell className="h-4 w-4" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white animate-pulse">
                  {notificationsCount}
                </span>
              )}
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
