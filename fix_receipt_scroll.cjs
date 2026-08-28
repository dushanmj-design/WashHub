const fs = require('fs');

let code = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

// The wrapper currently is:
// <div className="p-4 overflow-y-auto bg-gray-200 flex justify-center custom-scrollbar">
//   {/* Receipt Container */}
//   <div id="supervisor-receipt-print" className="bg-white shadow-md w-[450px] shrink-0 text-black font-serif relative pb-2" style={{ fontFamily: '"Times New Roman", Times, serif' }}>

code = code.replace(
  '<div className="p-4 overflow-y-auto bg-gray-200 flex justify-center custom-scrollbar">',
  '<div className="p-4 bg-gray-200 flex justify-center items-center overflow-hidden h-full min-h-[500px]">'
);

code = code.replace(
  '{/* Receipt Container */}',
  '{/* Scale Wrapper for Preview */}\n        <div className="transform scale-[0.85] md:scale-95 lg:scale-100 origin-center transition-transform">\n        {/* Receipt Container */}'
);

// Close the scale wrapper div
code = code.replace(
  '        </div>\n      </div>\n      \n      <div className="p-4 bg-slate-50',
  '        </div>\n        </div>\n      </div>\n      \n      <div className="p-4 bg-slate-50'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', code);
