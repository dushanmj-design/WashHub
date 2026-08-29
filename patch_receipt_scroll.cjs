const fs = require('fs');
let code = fs.readFileSync('src/components/SupervisorReceipt.tsx', 'utf8');

code = code.replace(
  '<div className={`p-4 bg-gray-200 flex justify-center overflow-hidden h-full ${inline ? "items-start overflow-y-auto" : "items-center min-h-[500px]"}`}>',
  '<div className={`p-4 bg-gray-200 flex justify-center h-full ${inline ? "items-start overflow-auto" : "items-center overflow-auto min-h-[500px]"}`}>'
);

// We will also use w-full max-w-[450px] so it shrinks naturally if there's no space, 
// rather than relying strictly on scale.
code = code.replace(
  '<div id="supervisor-receipt-print" className="bg-white shadow-md w-[450px] shrink-0 text-black font-serif relative pb-2"',
  '<div id="supervisor-receipt-print" className="bg-white shadow-md w-[450px] shrink-0 text-black font-serif relative pb-2 mx-auto"'
);

// Actually, scale origin-top-left or origin-top is fine, but let's just make it scale down heavily if needed
code = code.replace(
  '<div className={`transform origin-top transition-transform ${inline ? "scale-[0.80] lg:scale-[0.90]" : "scale-[0.85] md:scale-95 lg:scale-100 origin-center"}`}>',
  '<div className={`transform origin-top transition-transform ${inline ? "scale-[0.65] sm:scale-[0.75] md:scale-[0.85] lg:scale-100" : "scale-[0.75] md:scale-90 lg:scale-100 origin-top"} mx-auto flex justify-center`}>'
);

fs.writeFileSync('src/components/SupervisorReceipt.tsx', code);
