const fs = require('fs');

let receiptContent = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

receiptContent = receiptContent.replace(
  '<div className="bg-white text-black font-serif relative pb-2 mx-auto" style={{ width: \'300px\', fontFamily: \'"Times New Roman", Times, serif\' }}>',
  '<div className="bg-white text-black font-serif relative pb-2 mx-auto w-full" style={{ fontFamily: \'"Times New Roman", Times, serif\' }}>'
);

receiptContent = receiptContent.replace(
  '<div className="scale-90 md:scale-100 origin-top flex justify-center pb-8 shadow-2xl">',
  '<div className="scale-90 md:scale-100 origin-top flex justify-center pb-8 shadow-2xl w-[300px]">'
);

receiptContent = receiptContent.replace(
  /<div className="receipt-page" style={{ width: '100%', display: 'flex', justifyContent: 'center', pageBreakAfter: 'always' }}>/g,
  '<div className="receipt-page" style={{ width: \'100%\', pageBreakAfter: \'always\' }}>'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', receiptContent);
