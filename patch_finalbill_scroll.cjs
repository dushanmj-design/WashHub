const fs = require('fs');
let code = fs.readFileSync('src/components/FinalBillView.tsx', 'utf8');

code = code.replace(
  '<div className="p-4 bg-gray-200 flex justify-center items-center overflow-hidden min-h-[500px]">',
  '<div className={`p-4 bg-gray-200 flex justify-center ${inline ? "items-start overflow-auto h-full" : "items-center overflow-auto min-h-[500px]"}`}>'
);

code = code.replace(
  '<div className="transform scale-[0.85] md:scale-95 lg:scale-100 origin-center transition-transform">',
  '<div className={`transform origin-top transition-transform ${inline ? "scale-[0.65] sm:scale-[0.75] md:scale-[0.85] lg:scale-100" : "scale-[0.75] md:scale-90 lg:scale-100 origin-top"} mx-auto flex justify-center`}>'
);

fs.writeFileSync('src/components/FinalBillView.tsx', code);
