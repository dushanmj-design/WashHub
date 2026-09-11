const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<BarcodeScanner onScan={handleScanBarcode}',
  '<BarcodeScanner onScanBarcode={handleScanBarcode}'
);

fs.writeFileSync('src/App.tsx', content);
