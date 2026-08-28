const fs = require('fs');
let code = fs.readFileSync('src/components/FinalBillView.tsx', 'utf8');

const target1 = `const changeDue = Math.max(0, payload.received_cash - payload.final_amount);`;
const replacement1 = `
  const changeDue = Math.max(0, payload.received_cash - payload.final_amount);
  const balanceDue = Math.max(0, payload.final_amount - payload.received_cash);
`;

const target2 = `<div class="row"><strong>CHANGE:</strong> <span>Rs. \${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>`;
const replacement2 = `
            <div class="row"><strong>CHANGE:</strong> <span>Rs. \${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            \${balanceDue > 0 ? \`<div class="row" style="color: #000; font-weight: bold; border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px;"><strong>BALANCE DUE:</strong> <span>Rs. \${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>\` : ''}
`;

const target3 = `            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px] font-bold">Change</span>
              <span className="font-bold">Rs. {changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>`;
const replacement3 = `
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 uppercase tracking-widest font-mono text-[10px] font-bold">Change</span>
              <span className="font-bold">Rs. {changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 mt-2 text-rose-600">
                <span className="uppercase tracking-widest font-mono text-[10px] font-bold">Balance Due</span>
                <span className="font-bold font-mono">Rs. {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

fs.writeFileSync('src/components/FinalBillView.tsx', code);
