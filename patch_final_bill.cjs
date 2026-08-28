const fs = require('fs');
let code = fs.readFileSync('src/components/FinalBillView.tsx', 'utf8');

code = code.replace(
  'interface FinalBillViewProps {\n  payload: FinalBillPayload | null;\n  onClose: () => void;\n}',
  'interface FinalBillViewProps {\n  payload: FinalBillPayload | null;\n  onClose: () => void;\n  inline?: boolean;\n}'
);

code = code.replace(
  'export default function FinalBillView({ payload, onClose }: FinalBillViewProps) {',
  'export default function FinalBillView({ payload, onClose, inline }: FinalBillViewProps) {'
);

code = code.replace(
  '<div className="bg-white rounded-xl shadow-xl w-full flex flex-col overflow-hidden max-h-[90vh]">',
  '<div className={`bg-white w-full flex flex-col overflow-hidden ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[90vh]"}`}>'
);

fs.writeFileSync('src/components/FinalBillView.tsx', code);
