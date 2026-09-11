const fs = require('fs');
let content = fs.readFileSync('src/components/SupervisorIntake.tsx', 'utf8');

// Header modifications
content = content.replace(
  '<header className="bg-slate-900 text-slate-100 p-6 sm:p-8">',
  '<header className="bg-slate-900 text-slate-100 p-4 sm:p-5 shrink-0">'
);
content = content.replace(
  '<div className="flex justify-between items-center mb-6">',
  '<div className="flex justify-between items-center mb-4">'
);
content = content.replace(
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">',
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">'
);

// Main content modifications
content = content.replace(
  '<div className="p-6 sm:p-8 space-y-8 bg-white">',
  '<div className="p-4 sm:p-5 space-y-5 bg-white overflow-y-auto">'
);

// Buttons padding
content = content.replace(/py-4 rounded-lg/g, 'py-2 rounded-lg');
content = content.replace(/py-3 rounded border/g, 'py-2 rounded border text-sm');

// Measurements section
content = content.replace(
  '<section className="grid grid-cols-1 md:grid-cols-2 gap-8">',
  '<section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">'
);
content = content.replace(/space-y-6/g, 'space-y-4');
content = content.replace(/py-3/g, 'py-2');
content = content.replace(/p-4 rounded-lg/g, 'p-3 rounded-lg');

// Right Column (Billing)
content = content.replace(
  '<div className="w-full lg:w-[40%] bg-[#f8fafc] flex flex-col p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200">',
  '<div className="w-full lg:w-[40%] bg-[#f8fafc] flex flex-col p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-slate-200 shrink-0">'
);
content = content.replace(
  '<h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-200 pb-4">Billing Summary</h2>',
  '<h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Billing Summary</h2>'
);
content = content.replace(
  '<div className="space-y-5 text-lg mb-8">',
  '<div className="space-y-3 text-base mb-4">'
);
content = content.replace(
  '<div className="mt-auto space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">',
  '<div className="mt-auto space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">'
);

fs.writeFileSync('src/components/SupervisorIntake.tsx', content);
