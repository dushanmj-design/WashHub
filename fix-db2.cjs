const fs = require('fs');
let content = fs.readFileSync('src/database.ts', 'utf8');

content = content.replace(
  "const phone = order.customer_mobile || (order.supervisor_data?.order_details?.customer?.telephone) || 'Unknown';",
  "const phone = order.customer_mobile || ((order as any).supervisor_data?.order_details?.customer?.telephone) || 'Unknown';"
);
content = content.replace(
  "READY FOR PICKUP!\`, 'success');",
  "READY FOR PICKUP!\`, 'info');"
);

fs.writeFileSync('src/database.ts', content);
