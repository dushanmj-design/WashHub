import React, { useState, useEffect } from 'react';
import { Printer, Check, Scissors, HelpCircle, Bluetooth, Tag, ReceiptText, FileText, Wifi, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from '../lib/printUtils';
import { printDirectBluetooth, printDirectRawBT, isWebBluetoothSupported, buildEscPosPayload } from '../lib/bluetoothPrint';
import { getSavedNetworkPrinter, sendEscPosToNetworkPrinter, NetworkPrinterConfig } from '../lib/networkPrint';
import NetworkPrinterModal from './NetworkPrinterModal';

interface FinalBillPayload {
  barcode: string;
  customer: string;
  mobile: string;
  services: string;
  weight: string;
  pieces?: string;
  in_date: string;
  est_amount: number;
  final_amount: number;
  received_cash: number;
  shopName?: string;
}

interface FinalBillViewProps {
  payload: FinalBillPayload | null;
  onClose: () => void;
  inline?: boolean;
}

export default function FinalBillView({ payload, onClose, inline }: FinalBillViewProps) {
  const [activePreviewTab, setActivePreviewTab] = useState<'customer' | 'vendor'>('customer');
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [networkPrinter, setNetworkPrinter] = useState<NetworkPrinterConfig | null>(null);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const saved = getSavedNetworkPrinter();
    if (saved) setNetworkPrinter(saved);
  }, []);

  if (!payload) return null;

  const billNumber = payload.barcode ? payload.barcode.replace('WB-', '') : '1025';
  const shopPhone = '011 3041630, 011 2735490';
  const changeDue = Math.max(0, payload.received_cash - payload.final_amount);
  const balanceDue = Math.max(0, payload.final_amount - payload.received_cash);

  // Check if order includes Iron
  const hasIron = Boolean(
    typeof payload.services === 'string' && payload.services.toLowerCase().includes('iron')
  );

  const formattedDate = new Date(payload.in_date || Date.now()).toLocaleDateString('en-GB');
  const formattedTime = new Date(payload.in_date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Build ESC/POS Payload data object
  const getEscPosData = (forVendor: boolean) => ({
    shopName: payload.shopName?.toUpperCase() || 'WASH HUB',
    phone: shopPhone,
    billNumber,
    isVendorCopy: forVendor,
    hasIron,
    date: formattedDate,
    customerName: payload.customer,
    customerPhone: payload.mobile,
    weight: payload.weight,
    pieces: payload.pieces,
    totalAmount: payload.final_amount.toFixed(2),
    advanceAmount: payload.received_cash.toFixed(2),
    balanceAmount: balanceDue.toFixed(2),
    barcode: payload.barcode || `WB-${billNumber}`
  });

  // Direct Network (LAN/Wi-Fi TCP) Print Handler
  const handleNetworkPrint = async (forVendor: boolean) => {
    if (!networkPrinter || !networkPrinter.ip_address) {
      setShowNetworkModal(true);
      return;
    }

    setIsPrinting(true);
    setBtStatus(`Sending ${forVendor ? 'Vendor' : 'Customer'} slip to ${networkPrinter.ip_address}...`);

    try {
      const escPosData = getEscPosData(forVendor);
      const rawBytes = buildEscPosPayload(escPosData);
      const res = await sendEscPosToNetworkPrinter(
        networkPrinter.ip_address,
        networkPrinter.port || 9100,
        rawBytes
      );

      if (res.success) {
        setBtStatus(`✓ Network print dispatched to ${networkPrinter.ip_address}!`);
        setTimeout(() => setBtStatus(null), 4000);
      } else {
        setBtStatus(`Notice: ${res.message}`);
        setTimeout(() => setBtStatus(null), 6000);
      }
    } catch (err: any) {
      setBtStatus(`Print failed: ${err.message}`);
      setTimeout(() => setBtStatus(null), 6000);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleNetworkPrintBoth = async () => {
    if (!networkPrinter || !networkPrinter.ip_address) {
      setShowNetworkModal(true);
      return;
    }
    setIsPrinting(true);
    setBtStatus(`Sending Customer & Vendor slips to ${networkPrinter.ip_address}...`);

    try {
      const customerBytes = buildEscPosPayload(getEscPosData(false));
      const vendorBytes = buildEscPosPayload(getEscPosData(true));
      const merged = new Uint8Array(customerBytes.length + vendorBytes.length);
      merged.set(customerBytes, 0);
      merged.set(vendorBytes, customerBytes.length);

      const res = await sendEscPosToNetworkPrinter(
        networkPrinter.ip_address,
        networkPrinter.port || 9100,
        merged
      );

      if (res.success) {
        setBtStatus(`✓ Both slips dispatched to network printer!`);
        setTimeout(() => setBtStatus(null), 4000);
      } else {
        setBtStatus(`Notice: ${res.message}`);
        setTimeout(() => setBtStatus(null), 6000);
      }
    } catch (err: any) {
      setBtStatus(`Print failed: ${err.message}`);
      setTimeout(() => setBtStatus(null), 6000);
    } finally {
      setIsPrinting(false);
    }
  };

  // Print Handlers
  const handlePrintBoth = () => {
    if (networkPrinter?.ip_address) {
      handleNetworkPrintBoth();
      return;
    }
    const el = document.getElementById('final-bill-both-print');
    if (el) printHtml(el.innerHTML, `Final Bill - ${billNumber}`);
  };

  const handlePrintCustomer = () => {
    if (networkPrinter?.ip_address) {
      handleNetworkPrint(false);
      return;
    }
    const el = document.getElementById('final-bill-customer-print');
    if (el) printHtml(el.innerHTML, `Customer Bill #${billNumber}`);
  };

  const handlePrintVendor = () => {
    if (networkPrinter?.ip_address) {
      handleNetworkPrint(true);
      return;
    }
    const el = document.getElementById('final-bill-vendor-print');
    if (el) printHtml(el.innerHTML, `Vendor Tag #${billNumber}`);
  };

  const handleBluetoothPrint = async (forVendor: boolean) => {
    setBtStatus('Searching for Bluetooth printer...');
    const res = await printDirectBluetooth(getEscPosData(forVendor));

    if (res.success) {
      setBtStatus('✓ Printed directly via Bluetooth without watermark!');
      setTimeout(() => setBtStatus(null), 4000);
    } else {
      setBtStatus(`Notice: ${res.message}`);
      setTimeout(() => setBtStatus(null), 6000);
    }
  };

  const handleRawBtPrint = (forVendor: boolean) => {
    const res = printDirectRawBT(getEscPosData(forVendor));
    if (res.success) {
      setBtStatus('✓ Opened RawBT with 100% native 80mm ESC/POS stream!');
      setTimeout(() => setBtStatus(null), 4000);
    } else {
      setBtStatus(`RawBT notice: ${res.message}`);
      setTimeout(() => setBtStatus(null), 5000);
    }
  };

  // 1. CUSTOMER BILL (Balanced across full 80mm roll, bold contrast)
  const renderCustomerBill = () => (
    <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-2" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Brand Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <h1 className="text-3xl font-black tracking-tight leading-tight uppercase">
          {payload.shopName?.toUpperCase() || 'WASH HUB'}
        </h1>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-800">Premium Laundry Service</div>
        <div className="text-xs font-semibold mt-0.5">Tel: {shopPhone}</div>
        <div className="mt-1 bg-black text-white py-0.5 px-3 text-xs font-bold uppercase tracking-wider inline-block">
          FINAL CUSTOMER BILL
        </div>
      </div>

      {/* Date & Time Bar */}
      <div className="flex justify-between items-center text-xs font-bold border-b border-black pb-1 mb-2">
        <span>DATE: {formattedDate}</span>
        <span>TIME: {formattedTime}</span>
      </div>

      {/* Bill Number Highlight */}
      <div className="border-2 border-black p-2 text-center mb-2 bg-slate-50">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700">Bill Number</div>
        <div className="text-3xl font-black tracking-widest">{billNumber}</div>
      </div>

      {/* Customer Info Box */}
      <div className="border border-black p-2 mb-2 text-sm space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-slate-700">CLIENT:</span>
          <span className="font-bold uppercase text-sm">{payload.customer}</span>
        </div>
        <div className="flex justify-between items-baseline border-t border-slate-300 pt-1">
          <span className="font-bold text-slate-700">CONTACT:</span>
          <span className="font-bold text-sm">{payload.mobile}</span>
        </div>
      </div>

      {/* Details Table */}
      <div className="border border-black mb-2 text-sm">
        <div className="bg-black text-white font-bold p-1.5 flex justify-between text-xs">
          <span>SERVICE / DETAILS</span>
          <span>INFO</span>
        </div>
        <div className="p-2 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-bold">Services:</span>
            <span className="font-bold uppercase">{payload.services}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-200 pt-1">
            <span>Weight:</span>
            <strong className="text-sm font-bold">{payload.weight}</strong>
          </div>
          {payload.pieces && (
            <div className="flex justify-between items-center border-t border-slate-200 pt-1">
              <span>Pieces:</span>
              <strong className="text-sm font-bold">{payload.pieces}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="border-2 border-black p-2 mb-2 text-base space-y-1.5">
        <div className="flex justify-between font-bold">
          <span>TOTAL AMOUNT:</span>
          <span>Rs. {payload.final_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-slate-800">
          <span>CASH RECEIVED:</span>
          <span>Rs. {payload.received_cash.toFixed(2)}</span>
        </div>
        {changeDue > 0 && (
          <div className="flex justify-between text-sm font-semibold text-emerald-800 border-t border-slate-300 pt-1">
            <span>CHANGE RETURNED:</span>
            <span>Rs. {changeDue.toFixed(2)}</span>
          </div>
        )}
        {balanceDue > 0 && (
          <div className="flex justify-between font-black text-lg border-t-2 border-black pt-1 text-red-700">
            <span>BALANCE DUE:</span>
            <span>Rs. {balanceDue.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs space-y-1 border-t border-black pt-2 text-slate-700">
        <p className="font-bold">Open: 7:30 AM – 7:30 PM</p>
        <p>Please present this bill when collecting your laundry.</p>
        <p>Kindly collect items within 30 days.</p>
        <p className="font-bold uppercase tracking-wider text-black pt-0.5">THANK YOU FOR YOUR BUSINESS!</p>
      </div>
    </div>
  );

  // 2. VENDOR WORKSHOP TAG (Matches Wash Dry.jpeg / Wash Dry Iron.jpeg + QR Code)
  const renderVendorTag = () => (
    <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-2" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Outer Card replicating physical tag card */}
      <div className="border-2 border-black p-2 bg-white mb-2">
        {/* Brand & Phone Block */}
        <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-2">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
              {payload.shopName?.toUpperCase() || 'WASH HUB'}
            </h2>
            <div className="text-xs font-bold text-slate-800 mt-0.5">Tel: {shopPhone}</div>
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase bg-black text-white px-2 py-1">
              {hasIron ? 'WASH · DRY · IRON' : 'WASH · DRY'}
            </span>
          </div>
        </div>

        {/* Form Fields with clear rectangular outline boxes */}
        <div className="space-y-1.5 text-sm">
          
          {/* Wash Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">Wash :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center justify-between font-bold text-sm bg-slate-50">
              <span>✓ Included</span>
              <span>[ Load ]</span>
            </div>
          </div>

          {/* Dry Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">Dry :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center justify-between font-bold text-sm bg-slate-50">
              <span>✓ Included</span>
              <span>[ Dryer ]</span>
            </div>
          </div>

          {/* Iron Row (ONLY present if Wash Dry Iron, per Wash Dry Iron.jpeg) */}
          {hasIron && (
            <div className="flex items-center">
              <div className="w-24 sm:w-28 font-bold text-sm">Iron :</div>
              <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center justify-between font-bold text-sm bg-slate-50">
                <span>✓ Included</span>
                <span>[ Press ]</span>
              </div>
            </div>
          )}

          {/* Amount Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">Amount :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center justify-between font-black text-base bg-slate-50">
              <span>Rs. {payload.final_amount.toFixed(2)}</span>
              {balanceDue > 0 && <span className="text-xs font-semibold text-red-600">(Due: Rs. {balanceDue.toFixed(2)})</span>}
            </div>
          </div>

          {/* In Date Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">In date :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center font-bold text-sm bg-slate-50">
              {formattedDate} {formattedTime}
            </div>
          </div>

          {/* Name Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">Name :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center font-bold text-sm uppercase bg-slate-50 truncate">
              {payload.customer}
            </div>
          </div>

          {/* Weight Row */}
          <div className="flex items-center">
            <div className="w-24 sm:w-28 font-bold text-sm">Weight :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1 min-h-[30px] flex items-center justify-between font-bold text-sm bg-slate-50">
              <span>{payload.weight}</span>
              {payload.pieces && <span className="text-xs text-slate-700">({payload.pieces} pcs)</span>}
            </div>
          </div>

          {/* Bill # Row */}
          <div className="flex items-center pt-0.5">
            <div className="w-24 sm:w-28 font-bold text-sm">Bill # :</div>
            <div className="flex-1 border-2 border-black px-2.5 py-1.5 min-h-[32px] flex items-center justify-center font-black text-2xl tracking-widest bg-slate-100">
              {billNumber}
            </div>
          </div>

        </div>
      </div>

      {/* QR Code Section (Always printed with Vendor slip) */}
      <div className="flex flex-col items-center justify-center py-2.5 border-t-2 border-dashed border-black">
        <div className="text-sm font-black uppercase tracking-wider mb-1.5">SCAN WHEN READY</div>
        <div className="p-2 bg-white border-2 border-black rounded">
          <QRCodeSVG value={payload.barcode || `WB-${billNumber}`} size={140} level="M" />
        </div>
        <div className="font-mono font-bold text-sm mt-1.5 tracking-wider">{payload.barcode || `WB-${billNumber}`}</div>
        <div className="text-xs font-bold uppercase tracking-widest mt-1 text-slate-700">
          VENDOR COPY · ATTACH TO LAUNDRY SACK
        </div>
      </div>

    </div>
  );

  return (
    <div className={`bg-white w-full flex flex-col overflow-hidden mx-auto ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[95vh] max-w-lg"}`}>
      
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm sm:text-base">Final Checkout Bill</h3>
          <span className="text-[11px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded font-mono border border-slate-700">
            80mm / 3-inch Roll
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Network Printer Status Button */}
          <button
            onClick={() => setShowNetworkModal(true)}
            title={networkPrinter ? `Network printer: ${networkPrinter.ip_address}:${networkPrinter.port || 9100}` : 'Configure Network Printer (IP/Port)'}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border transition ${
              networkPrinter?.ip_address
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Wifi className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-mono">
              {networkPrinter?.ip_address ? networkPrinter.ip_address : 'Network Printer'}
            </span>
          </button>

          <button
            onClick={() => setShowTipsModal(!showTipsModal)}
            title="Printer Tips & RawBT Watermark Removal"
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded transition-colors text-slate-300">
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Preview Tab Selector */}
      <div className="bg-slate-100 p-2 border-b border-slate-200 flex justify-center gap-2 shrink-0">
        <button
          onClick={() => setActivePreviewTab('customer')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activePreviewTab === 'customer'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>Customer Bill</span>
        </button>
        <button
          onClick={() => setActivePreviewTab('vendor')}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activePreviewTab === 'vendor'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Vendor Tag ({hasIron ? 'Wash Dry Iron' : 'Wash Dry'})</span>
        </button>
      </div>

      {/* Bluetooth Status Toast */}
      {btStatus && (
        <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 text-xs text-blue-900 font-medium flex items-center justify-between">
          <span>{btStatus}</span>
          <button onClick={() => setBtStatus(null)} className="text-blue-500 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Help / RawBT Tips Accordion Banner */}
      {showTipsModal && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-950 space-y-1.5 shrink-0">
          <div className="font-bold flex items-center gap-1 text-amber-900">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>How to remove RawBT app message & print full width:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
            <li>
              <strong>Remove RawBT Watermark:</strong> RawBT is a 3rd-party Android app. Open RawBT on your Android tablet → tap <strong>Menu (3 lines)</strong> → <strong>License</strong> → Buy License (one-time ~$3-$5 on Google Play) to permanently remove the trial text.
            </li>
            <li>
              <strong>Free alternative without watermark:</strong> Install <strong>"Quick Printer (ESC/POS)"</strong> or <strong>"ESC POS Bluetooth Print Service"</strong> from Google Play, and choose it in Android print dialog.
            </li>
            <li>
              <strong>Direct Bluetooth (No App Needed):</strong> Click the <strong>"Bluetooth Direct"</strong> button below to print directly from Chrome without RawBT!
            </li>
            <li>
              <strong>Spread full width:</strong> In the Android print preview, make sure <strong>Paper Size</strong> is set to <strong>80mm</strong> (not ISO A4), and in RawBT set <strong>Paper width: 80mm (576 dots)</strong>.
            </li>
          </ol>
        </div>
      )}

      {/* Interactive Preview Canvas */}
      <div className={`p-4 bg-gray-200 flex justify-center h-full ${inline ? "items-start overflow-auto" : "items-center overflow-auto min-h-[460px]"}`}>
        <div className="w-full max-w-[340px] shadow-2xl rounded-sm overflow-hidden bg-white">
          {activePreviewTab === 'customer' ? renderCustomerBill() : renderVendorTag()}
        </div>

        {/* Hidden Printable Nodes */}
        <div id="final-bill-customer-print" className="hidden">
          <div className="receipt-page" style={{ width: '100%' }}>
            {renderCustomerBill()}
          </div>
        </div>

        <div id="final-bill-vendor-print" className="hidden">
          <div className="receipt-page" style={{ width: '100%' }}>
            {renderVendorTag()}
          </div>
        </div>

        <div id="final-bill-both-print" className="hidden">
          <div className="receipt-page" style={{ width: '100%', pageBreakAfter: 'always', breakAfter: 'page' }}>
            {renderCustomerBill()}
          </div>
          <div className="receipt-page" style={{ width: '100%', pageBreakAfter: 'always', breakAfter: 'page' }}>
            {renderVendorTag()}
          </div>
        </div>
      </div>
      
      {/* Footer Controls */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 self-start sm:self-center">
          <Scissors className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Single copies trigger automatic printer paper cut</span>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-1.5 w-full sm:w-auto">
          <button
            onClick={onClose}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
          
          <button
            onClick={handlePrintCustomer}
            title="Prints Customer Copy and cuts paper"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-500 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Customer Bill (Cut)</span>
          </button>
          
          <button
            onClick={handlePrintVendor}
            title="Prints Vendor Copy with QR code and cuts paper"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Vendor Tag (Cut)</span>
          </button>
          
          <button
            onClick={handlePrintBoth}
            title="Prints both Customer and Vendor copies"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 rounded-lg shadow-sm hover:bg-slate-700 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Both</span>
          </button>

          <button
            onClick={() => handleRawBtPrint(activePreviewTab === 'vendor')}
            title="Opens licensed RawBT app with direct 80mm native ESC/POS thermal command stream"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg shadow-sm hover:bg-amber-200 transition-colors"
          >
            <Zap className="h-3.5 w-3.5 text-amber-700 fill-amber-600" />
            <span>RawBT (Full 80mm)</span>
          </button>

          {isWebBluetoothSupported() && (
            <button
              onClick={() => handleBluetoothPrint(activePreviewTab === 'vendor')}
              title="Prints directly to Bluetooth printer with NO RawBT app watermark"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-100 transition-colors"
            >
              <Bluetooth className="h-3.5 w-3.5 text-indigo-600" />
              <span>Direct BT</span>
            </button>
          )}
        </div>
      </div>

      {/* Network Printer Configuration Modal */}
      <NetworkPrinterModal
        isOpen={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onPrinterConfigured={(cfg) => setNetworkPrinter(cfg)}
      />

    </div>
  );
}

