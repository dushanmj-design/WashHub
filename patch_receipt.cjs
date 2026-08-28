const fs = require('fs');
let code = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

code = code.replace(
  'interface SupervisorReceiptProps {\n  payload: any;\n  onClose: () => void;\n}',
  'interface SupervisorReceiptProps {\n  payload: any;\n  onClose: () => void;\n  inline?: boolean;\n}'
);

code = code.replace(
  'export default function SupervisorReceipt({ payload, onClose }: SupervisorReceiptProps) {',
  'export default function SupervisorReceipt({ payload, onClose, inline }: SupervisorReceiptProps) {'
);

code = code.replace(
  '<div className="bg-white rounded-xl shadow-xl w-full flex flex-col overflow-hidden max-h-[90vh] max-w-lg mx-auto">',
  '<div className={`bg-white w-full flex flex-col overflow-hidden mx-auto ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[90vh] max-w-lg"}`}>'
);

code = code.replace(
  '<div className="p-4 bg-gray-200 flex justify-center items-center overflow-hidden h-full min-h-[500px]">',
  '<div className={`p-4 bg-gray-200 flex justify-center overflow-hidden h-full ${inline ? "items-start overflow-y-auto" : "items-center min-h-[500px]"}`}>'
);

code = code.replace(
  '{/* Scale Wrapper for Preview */}\n        <div className="transform scale-[0.85] md:scale-95 lg:scale-100 origin-center transition-transform">',
  '{/* Scale Wrapper for Preview */}\n        <div className={`transform origin-top transition-transform ${inline ? "scale-[0.80] lg:scale-[0.90]" : "scale-[0.85] md:scale-95 lg:scale-100 origin-center"}`}>'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', code);
