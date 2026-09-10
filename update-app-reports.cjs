const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Import AdminReports
content = content.replace(
  "import AdminDashboard from './components/AdminDashboard';",
  "import AdminDashboard from './components/AdminDashboard';\nimport AdminReports from './components/AdminReports';"
);

// Update activeTab state type
content = content.replace(
  "useState<'operations' | 'scan' | 'billing' | 'ledger' | 'dashboard'>",
  "useState<'operations' | 'scan' | 'billing' | 'ledger' | 'dashboard' | 'reports'>"
);

// Add Reports tab to Workspace Navigation Tabs
const reportsTabBtn = `
          {(activeRole === 'admin' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={\`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer \${
                activeTab === 'reports'
                  ? 'border-cyan-600 text-cyan-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }\`}
            >
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">Reports</span>
            </button>
          )}
`;

content = content.replace(
  "{/* 3. CASH LEDGER TAB */}",
  `${reportsTabBtn.trim()}
          {/* 3. CASH LEDGER TAB */}`
);

// Add Reports view content
const reportsView = `
          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="animate-fade-in" id="reports-view">
              <AdminReports orders={orders} />
            </div>
          )}
`;

content = content.replace(
  "{/* 3. CASH LEDGER TAB */}",
  `${reportsView.trim()}

          {/* 3. CASH LEDGER TAB */}`
);

fs.writeFileSync('src/App.tsx', content);
