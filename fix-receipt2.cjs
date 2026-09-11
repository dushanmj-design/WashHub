const fs = require('fs');
let content = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

// Fix Line 155 duplicate string
content = content.replace(
  'w-full flex flex-col overflow-hidden mx-auto ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[90vh] max-w-lg"}`}>',
  ''
);

// Fix Line 183 and missing closing div
content = content.replace(
  '</div>\n      <div className="p-4 bg-slate-50/ border-t',
  '</div>\n      </div>\n      <div className="p-4 bg-slate-50 border-t'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', content);
