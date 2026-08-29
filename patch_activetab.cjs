const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// The easiest way is to add setActiveTab('operations') after setFinalBillPayload is closed.
// We can use a regex to replace `setFinalBillPayload({...});` with `setFinalBillPayload({...}); setActiveTab('operations');`
code = code.replace(
  /setFinalBillPayload\(\{([\s\S]*?)\}\);/g,
  'setFinalBillPayload({$1});\n      setActiveTab("operations");'
);

fs.writeFileSync('src/App.tsx', code);
