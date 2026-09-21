const fs = require('fs');
let receiptContent = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

receiptContent = receiptContent.replace(
  '<div className="receipt-content-wrapper bg-white text-black font-serif relative pb-2 mx-auto" style={{ fontFamily: \'"Times New Roman", Times, serif\' }}>',
  '<div className="receipt-content-wrapper bg-white text-black font-serif relative pb-2 mx-auto w-full" style={{ fontFamily: \'"Times New Roman", Times, serif\' }}>'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', receiptContent);
