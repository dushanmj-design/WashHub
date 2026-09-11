const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '<BillingCheckout \n              orders={orders} \n              onCloseOrder={handleCloseOrder} \n              isLoading={isActionLoading} \n            />',
  '<BillingCheckout \n              orders={orders} \n              onCloseOrder={handleCloseOrder} \n              onScanReady={handleScanBarcode}\n              isLoading={isActionLoading} \n            />'
);
fs.writeFileSync('src/App.tsx', content);

let checkoutContent = fs.readFileSync('src/components/BillingCheckout.tsx', 'utf8');
checkoutContent = checkoutContent.replace(
  'onCloseOrder: (orderId: string, finalAmount: number, receivedCash: number) => void;',
  'onCloseOrder: (orderId: string, finalAmount: number, receivedCash: number) => void;\n  onScanReady?: (barcode: string) => Promise<void>;'
);

checkoutContent = checkoutContent.replace(
  'export default function BillingCheckout({ orders, onCloseOrder, isLoading }: BillingCheckoutProps) {',
  'export default function BillingCheckout({ orders, onCloseOrder, onScanReady, isLoading }: BillingCheckoutProps) {'
);

const renderAdd = `
  const [scanInput, setScanInput] = useState('');

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim() || !onScanReady) return;
    try {
      await onScanReady(scanInput.trim());
      setScanInput('');
    } catch (err) {
      // API error handled upstream
    }
  };
`;
checkoutContent = checkoutContent.replace(
  'const [error, setError] = useState(\'\');',
  'const [error, setError] = useState(\'\');\n' + renderAdd
);

const topHeaderReplace = `
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full max-h-[85vh]">
      {/* Left Side: Order List */}
      <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        {onScanReady && (
          <form onSubmit={handleScanSubmit} className="p-4 border-b border-slate-200 bg-slate-50 flex gap-2">
            <input 
              type="text" 
              autoFocus 
              value={scanInput} 
              onChange={e => setScanInput(e.target.value)} 
              placeholder="Scan Vendor QR (Barcode) here to mark as Ready for Pickup..." 
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono" 
            />
            <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition">
              Mark Ready
            </button>
          </form>
        )}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
`;

checkoutContent = checkoutContent.replace(
  `  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full max-h-[85vh]">
      {/* Left Side: Order List */}
      <div className="xl:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">`,
  topHeaderReplace
);

fs.writeFileSync('src/components/BillingCheckout.tsx', checkoutContent);
