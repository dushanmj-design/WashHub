const fs = require('fs');

let printUtils = fs.readFileSync('src/lib/printUtils.ts', 'utf8');
printUtils = printUtils.replace(
  'padding: 10px;',
  `padding: 0;
            width: 100%;
          }
          .receipt-page {
             width: 100%;
             max-width: 80mm;
             margin: 0 auto;
             padding: 10px 0;
             page-break-after: always;
             display: flex;
             justify-content: center;`
);
fs.writeFileSync('src/lib/printUtils.ts', printUtils);

let receiptContent = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');
receiptContent = receiptContent.replace(
  `        {/* Hidden Container for Actual Printing (1x Customer, 1x Vendor) */}
        <div id="supervisor-receipt-print" className="hidden">
           {renderReceipt(false)}
           <div style={{ pageBreakAfter: 'always', margin: '20px 0' }}></div>
           {renderReceipt(true)}
        </div>`,
  `        {/* Hidden Container for Actual Printing (1x Customer, 1x Vendor) */}
        <div id="supervisor-receipt-print" className="hidden">
           <div className="receipt-page" style={{ width: '100%', display: 'flex', justifyContent: 'center', pageBreakAfter: 'always' }}>
             {renderReceipt(false)}
           </div>
           <div className="receipt-page" style={{ width: '100%', display: 'flex', justifyContent: 'center', pageBreakAfter: 'always' }}>
             {renderReceipt(true)}
           </div>
        </div>`
);
fs.writeFileSync('src/components/SupervisorReceipt.tsx', receiptContent);
