import React from 'react';
import { Bell, Smartphone, Send, MessageSquare, AlertTriangle, Clock } from 'lucide-react';
import { SimulatedNotification } from '../types';
import { PaginatedList } from './PaginatedList';

interface NotificationLogProps {
  notifications: SimulatedNotification[];
  onClose: () => void;
  isOpen: boolean;
}

export default function NotificationLog({ notifications, onClose, isOpen }: NotificationLogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 text-slate-100 z-50 shadow-2xl flex flex-col animate-fade-in" id="notification-drawer">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-cyan-400" />
          <h3 className="font-display font-bold text-sm text-white">Live Notification Triggers</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white font-semibold px-2 py-1 bg-slate-850 rounded hover:bg-slate-800"
          id="close-notif-btn"
        >
          Close
        </button>
      </div>

      {/* Subheader */}
      <div className="px-4 py-2 bg-slate-950 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Simulated SMS & WhatsApp logs</span>
        <span>{notifications.length} logged</span>
      </div>

      {/* Notification Stream */}
      <div className="flex-1 p-4 scrollbar">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            📭 No messages dispatched yet. Operations will trigger automatic logs here.
          </div>
        ) : (
          <PaginatedList
            items={notifications}
            itemsPerPage={10}
            sortByDateDesc={(notif) => notif.created_at}
            listClassName="space-y-3"
            renderItem={(notif) => {
              const isWhatsapp = notif.type === 'whatsapp';
              const isSupervisorAlert = notif.message.includes('SUPERVISOR ALERT');
              return (
                <div 
                  key={notif.id} 
                  className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                    isSupervisorAlert 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
                      : isWhatsapp 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' 
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100'
                  }`}
                  id={`notif-card-${notif.id}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                      isSupervisorAlert 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : isWhatsapp 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {isSupervisorAlert ? '⚠️ Supervisor Alert' : isWhatsapp ? '💬 WhatsApp API' : '📱 SMS Dispatcher'}
                    </span>
                    
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notif.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="font-sans leading-relaxed text-slate-300 font-medium">
                    {notif.message}
                  </p>
                  <div className="border-t border-slate-800/60 pt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px]">
                      👤 {notif.customer_name}
                    </span>
                    <span className="font-mono">
                      📞 {notif.customer_mobile}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}