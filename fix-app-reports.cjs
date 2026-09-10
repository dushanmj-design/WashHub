const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The faulty injection created a button that looks like:
// {(activeRole === 'admin' || activeRole === 'super_admin') && (
//   <button onClick={() => setActiveTab('reports')} ...
// )}
// above {/* 3. CASH LEDGER TAB */}
// Let's remove it and place it properly.

const incorrectButtonRegex = /\{\(activeRole === 'admin' \|\| activeRole === 'super_admin'\) && \(\s*<button[\s\S]*?onClick=\{\(\) => setActiveTab\('reports'\)\}[\s\S]*?<\/button>\s*\)\}/;
content = content.replace(incorrectButtonRegex, '');

const correctButtonHtml = `
          {(activeRole === 'admin' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={\`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer \${
                activeTab === 'reports'
                  ? 'border-cyan-600 text-cyan-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }\`}
            >
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </button>
          )}
`;

// Insert after Dashboard tab
content = content.replace(
  "<span>Admin Console</span>\n            </button>\n          )}",
  "<span>Admin Console</span>\n            </button>\n          )}\n" + correctButtonHtml
);

fs.writeFileSync('src/App.tsx', content);
