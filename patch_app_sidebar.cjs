const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// The StickerView section in App.tsx right now is:
//               {/* Spool / Print Sticker Preview & Barcode Scanner OR Final Bill */}
//               <div className="space-y-6 flex flex-col">
//                 {finalBillPayload ? (

// Let's modify it to take full height and remove any overflow issues.
code = code.replace(
  '              {/* Spool / Print Sticker Preview & Barcode Scanner OR Final Bill */}\n              <div className="space-y-6 flex flex-col">',
  '              {/* Spool / Print Sticker Preview & Barcode Scanner OR Final Bill */}\n              <div className="flex flex-col h-[calc(100vh-12rem)] sticky top-6">'
);

fs.writeFileSync('src/App.tsx', code);
