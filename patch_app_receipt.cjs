const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import SupervisorReceipt")) {
  code = code.replace("import FinalBillView from './components/FinalBillView';", "import FinalBillView from './components/FinalBillView';\nimport SupervisorReceipt from './components/SupervisorReceipt';");
}

const target = `<FinalBillView
                payload={finalBillPayload}
                onClose={() => setFinalBillPayload(null)}
              />`;

const replacement = `{finalBillPayload.isSupervisor ? (
                <SupervisorReceipt payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} />
              ) : (
                <FinalBillView payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} />
              )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
