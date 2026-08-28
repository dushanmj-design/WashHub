const fs = require('fs');

let content = fs.readFileSync('src/components/NotificationLog.tsx', 'utf-8');

const startStr = '<div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar">';
const endStr = '    </div>\n  );\n}';

const startIndex = content.indexOf(startStr);
const endIndex = content.lastIndexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `<div className="flex-1 p-4 scrollbar">
        {notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            📭 No messages dispatched yet. Operations will trigger automatic logs here.
          </div>
        ) : (
          <PaginatedList
            items={notifications}
            itemsPerPage={10}
            sortByDateDesc={(notif) => notif.created_at || notif.timestamp}
            listClassName="space-y-3"
            renderItem={(notif) => {
              const isWhatsapp = notif.type === 'whatsapp';
              const isSupervisorAlert = notif.message.includes('SUPERVISOR ALERT');
              return (
                <div 
                  key={notif.id} 
                  className={\`p-3.5 rounded-xl border text-xs space-y-2 transition-all \${
                    isSupervisorAlert 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
                      : isWhatsapp 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' 
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-100'
                  }\`}
                  id={\`notif-card-\${notif.id}\`}
                >
                  <div className="flex items-center justify-between">
                    <span className={\`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono \${
                      isSupervisorAlert 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : isWhatsapp 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }\`}>
                      {isSupervisorAlert ? '⚠️ Supervisor Alert' : isWhatsapp ? '💬 WhatsApp API' : '📱 SMS Dispatcher'}
                    </span>
                    
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(notif.created_at || notif.timestamp).toLocaleTimeString()}
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
}`;

  content = content.substring(0, startIndex) + replacement;
  fs.writeFileSync('src/components/NotificationLog.tsx', content);
} else {
  console.log("Could not find start or end strings");
}
