const fs = require('fs');
let content = fs.readFileSync('src/components/AdminReports.tsx', 'utf8');

content = content.replace(
  "o.customer_name || 'N/A',",
  '// Escape quotes and commas\n      `"${(o.customer_name || \'N/A\').replace(/"/g, \'""\')}"`,'
);

fs.writeFileSync('src/components/AdminReports.tsx', content);
