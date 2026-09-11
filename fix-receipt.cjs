const fs = require('fs');
let content = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

// Add QRCodeSVG import
content = content.replace(
  "import { Printer, Check } from 'lucide-react';",
  "import { Printer, Check } from 'lucide-react';\nimport { QRCodeSVG } from 'qrcode.react';"
);

// We'll define a Receipt template function inside the component to render the receipt HTML.
const templateFunc = `
  const billNumber = payload.barcode ? payload.barcode.replace('WB-', '') : '1025';

  const renderReceipt = (isVendorCopy: boolean) => (
    <div className="bg-white text-black font-serif relative pb-2 mx-auto" style={{ width: '300px', fontFamily: '"Times New Roman", Times, serif' }}>
      {/* Header */}
      <div className="text-center text-white bg-zinc-800 pb-1 pt-2 px-2" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")', backgroundSize: 'cover' }}>
        <h1 className="text-4xl font-bold tracking-tight mb-1" style={{ fontFamily: '"Arial Black", Arial, sans-serif' }}>Wash Hub</h1>
        <div className="text-xs uppercase tracking-widest font-sans font-semibold mb-1 opacity-90">Premium Laundry</div>
        <div className="text-[10px] uppercase tracking-wider font-sans mb-1 pb-1 border-b border-white/20">Customer Receipt</div>
        <div className="flex justify-between items-end mt-1 px-1">
          <div className="text-left leading-tight">
            <div className="text-[10px] opacity-70">DATE</div>
            <div className="text-xs font-bold">{orderDetails.order_metadata.date}</div>
          </div>
          <div className="text-right leading-tight">
            <div className="text-[10px] opacity-70">TIME</div>
            <div className="text-xs font-bold">{orderDetails.order_metadata.time}</div>
          </div>
        </div>
      </div>
      
      {/* Customer Info */}
      <div className="border-[1.5px] border-black m-1 mt-2 p-1.5 flex flex-col gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-baseline border-b border-black pb-1">
          <span className="text-[10px] font-bold">NAME:</span>
          <span className="text-xs font-bold uppercase truncate max-w-[150px]">{orderDetails.customer.name}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] font-bold">TEL:</span>
          <span className="text-xs font-bold">{orderDetails.customer.telephone}</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 mt-2 border-y-2 border-black py-1">
        <div className="text-[10px] font-bold tracking-widest uppercase">Bill No:</div>
        <div className="text-xl font-bold tracking-wider">{billNumber}</div>
      </div>

      <div className="flex w-full mt-2">
        {/* Left Col */}
        <div className="w-[50%] pr-2 flex flex-col justify-start">
          <div className="flex flex-col text-sm font-bold">
            <div className="flex justify-between border-b border-black/30 pb-0.5">
              <span>Qty:</span><span>{orderDetails.specs.quantity || 0}</span>
            </div>
            <div className="flex justify-between border-b border-black/30 pb-0.5 mt-1">
              <span>Wgt:</span><span>{orderDetails.specs.weight_kg ? \`\${orderDetails.specs.weight_kg}kg\` : '-'}</span>
            </div>
            <div className="flex justify-between pb-0.5 mt-1">
              <span>Del:</span><span className="text-xs">{orderDetails.order_metadata.delivery_date}</span>
            </div>
          </div>
          
          <div className="flex flex-col text-[11px] font-bold mt-2 space-y-1 italic">
            <div className="flex justify-between items-center">
              <span>Fold</span>
              <div className="w-4 h-4 border border-black flex items-center justify-center">
                {orderDetails.specs.packaging === 'fold' && <span>✓</span>}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Hanger</span>
              <div className="w-4 h-4 border border-black flex items-center justify-center">
                {orderDetails.specs.packaging === 'hanger' && <span>✓</span>}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Col */}
        <div className="w-[50%] pl-2 flex flex-col space-y-1 justify-start border-l-2 border-black">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Wash {orderDetails.services.wash && '✓'}</span>
            <span>{orderDetails.billing.wash_amount > 0 ? orderDetails.billing.wash_amount.toFixed(0) : '-'}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Dry {orderDetails.services.dry && '✓'}</span>
            <span>{orderDetails.billing.dry_amount > 0 ? orderDetails.billing.dry_amount.toFixed(0) : '-'}</span>
          </div>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Iron {orderDetails.services.iron && '✓'}</span>
            <span>{orderDetails.billing.iron_amount > 0 ? orderDetails.billing.iron_amount.toFixed(0) : '-'}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[2px] bg-black my-2"></div>

      {/* Totals Section */}
      <div className="space-y-1 mb-2 px-2 text-sm">
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>Rs. {orderDetails.billing.total_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>ADVANCE</span>
          <span>Rs. {orderDetails.billing.advance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-base">
          <span>BALANCE</span>
          <span>Rs. {orderDetails.billing.balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="w-full border-t-2 border-black border-dashed my-2"></div>
      
      {isVendorCopy && (
        <div className="flex flex-col items-center justify-center mb-2">
           <div className="text-[10px] font-bold mb-1">SCAN WHEN READY</div>
           <QRCodeSVG value={payload.barcode} size={100} level="M" />
        </div>
      )}

      {/* Footer */}
      <div className="bg-black text-white text-center py-1 text-[10px] font-bold mb-2">
        Open 7.30 am. to 7.30 pm.
      </div>

      <div className="text-[9px] leading-tight space-y-1 pb-1 font-sans px-1 text-center">
        <p>Please bring this bill at collection.</p>
        <p>Collect items within 30 days.</p>
        {isVendorCopy && <p className="font-bold border-t border-black pt-1">VENDOR COPY - DO NOT GIVE TO CUSTOMER</p>}
      </div>
    </div>
  );
`;

const existingBlock = /const billNumber = payload\.barcode \? payload\.barcode\.replace\('WB-', ''\) : '1025';\s*return \(\s*<div className=\{`bg-white/m;

// We will inject our new logic and the hidden wrapper.
content = content.replace(existingBlock, templateFunc + `
  return (
    <div className={\`bg-white w-full flex flex-col overflow-hidden mx-auto \${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[90vh] max-w-lg"}\`}>
`);

// Now replace handlePrint
content = content.replace(
  "const el = document.getElementById('supervisor-receipt-print');\n    if (el) {\n      printHtml(el.innerHTML, 'Supervisor Receipt');\n    }",
  "const el = document.getElementById('supervisor-receipt-print');\n    if (el) {\n      // Use standard printHtml which adds basic styles. The element itself contains the page breaks.\n      printHtml(el.innerHTML, 'Supervisor Receipt');\n    }"
);

// We need to replace the entire preview area with our new receipt template.
// Find the <div id="supervisor-receipt-print" ...> block to the end of the file.
// We'll replace it.

const regex = /<div id="supervisor-receipt-print"[\s\S]*<\/div>\s*<\/div>\s*<\/div>\s*<div className="p-4 bg-slate-50/;

content = content.replace(regex, `
        {/* Visible Preview (Customer Copy) */}
        <div className="scale-90 md:scale-100 origin-top flex justify-center pb-8 shadow-2xl">
           {renderReceipt(false)}
        </div>

        {/* Hidden Container for Actual Printing (1x Customer, 2x Vendor) */}
        <div id="supervisor-receipt-print" className="hidden">
           {renderReceipt(false)}
           <div style={{ pageBreakAfter: 'always', margin: '20px 0' }}></div>
           {renderReceipt(true)}
           <div style={{ pageBreakAfter: 'always', margin: '20px 0' }}></div>
           {renderReceipt(true)}
        </div>
      </div>
      <div className="p-4 bg-slate-50/`);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', content);
