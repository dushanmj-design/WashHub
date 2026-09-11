const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Hide Scan Workflow for supervisor
content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('scan'\)\}[\s\S]*?<span>Scan Workflow<\/span>\s*<\/button>/m,
  `{(activeRole !== 'supervisor') && (
          $&
        )}`
);

// Hide Cash Drawer Book for supervisor
content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('ledger'\)\}[\s\S]*?<span>Cash Drawer Book<\/span>\s*<\/button>/m,
  `{(activeRole !== 'supervisor') && (
          $&
        )}`
);

// Rename Cycle Operations to New Order for supervisor
content = content.replace(
  '<span>Cycle Operations</span>',
  '<span>{activeRole === \'supervisor\' ? \'New Order\' : \'Cycle Operations\'}</span>'
);

// Rename Billing Desk to Order Summary / Checkout for supervisor
content = content.replace(
  '<span>Billing Desk</span>',
  '<span>{activeRole === \'supervisor\' ? \'Order Summary & Checkout\' : \'Billing Desk\'}</span>'
);

fs.writeFileSync('src/App.tsx', content);
