const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Final Bill Modal
const modalMatch = code.match(/\{\/\* Final Bill Modal \*\/\}([\s\S]*?)(?=\{\/\* Workspace Navigation Tabs \*\/\})/);
if (modalMatch) {
  code = code.replace(modalMatch[0], '');
}

// Ensure activeTab is set to operations when bill is generated from billing
code = code.replace(
  'const handleCloseOrder = async (orderId: string, finalAmount: number, receivedCash: number) => {',
  'const handleCloseOrder = async (orderId: string, finalAmount: number, receivedCash: number) => {'
);
// Inside handleCloseOrder, find setFinalBillPayload and add setActiveTab
code = code.replace(
  'setFinalBillPayload(billPayload);',
  'setFinalBillPayload(billPayload);\n      setActiveTab("operations"); // Jump to operations tab to show the bill in the sticker space'
);

fs.writeFileSync('src/App.tsx', code);
