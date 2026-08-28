const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "services: resData.order.workflow.replace(/_/g, ', ').toUpperCase(),",
  "services: (resData.order.workflow || 'CUSTOM').replace(/_/g, ', ').toUpperCase(),"
);

fs.writeFileSync('src/App.tsx', code);
