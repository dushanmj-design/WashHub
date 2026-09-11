const fs = require('fs');
let content = fs.readFileSync('src/components/BillingCheckout.tsx', 'utf8');

const target = '<div className="grid grid-cols-1 xl:grid-cols-12 gap-6">';
const replacement = `
      {onScanReady && (
          <form onSubmit={handleScanSubmit} className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex gap-3 shadow-sm">
            <input 
              type="text" 
              autoFocus 
              value={scanInput} 
              onChange={e => setScanInput(e.target.value)} 
              placeholder="Scan Vendor QR (Barcode) here to mark as Ready for Pickup..." 
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm shadow-sm" 
            />
            <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition shadow">
              Mark Ready & SMS
            </button>
          </form>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/BillingCheckout.tsx', content);
