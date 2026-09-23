import React, { useState, useEffect } from 'react';
import { Printer, Check, Scissors, HelpCircle, Bluetooth, Tag, ReceiptText, FileText, Wifi, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from '../lib/printUtils';
import { printDirectBluetooth, printDirectRawBT, printDirectRawBTBoth, isWebBluetoothSupported, buildEscPosPayload } from '../lib/bluetoothPrint';
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
  isSupervisor?: boolean;
  packaging?: string;
  hangerQty?: number;
  supervisor_data?: any;
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
  const [cutterFeedMm, setCutterFeedMm] = useState<number>(10);

  useEffect(() => {
    const saved = getSavedNetworkPrinter();
    if (saved) setNetworkPrinter(saved);
  }, []);

  if (!payload) return null;

  const billNumber = payload.barcode ? payload.barcode.replace('WB-', '') : '1025';
  const shopPhone = '011 3041630, 011 2735490';
  const changeDue = Math.max(0, payload.received_cash - payload.final_amount);
  const balanceDue = Math.max(0, payload.final_amount - payload.received_cash);

  // Extract supervisor order details if available
  const supDetails = payload.supervisor_data?.order_details || payload.supervisor_data;
  const supServices = supDetails?.services;
  const supSpecs = supDetails?.specs;
  const supBilling = supDetails?.billing;

  // Determine services strictly based on supervisor data if present, or payload.services
  const hasWash = supServices 
    ? Boolean(supServices.wash) 
    : (!payload.services || payload.services.toLowerCase().includes('wash'));

  const hasDry = supServices 
    ? Boolean(supServices.dry) 
    : Boolean(payload.services && payload.services.toLowerCase().includes('dry'));

  const hasIron = supServices 
    ? Boolean(supServices.iron) 
    : Boolean(payload.services && payload.services.toLowerCase().includes('iron'));

  const hasDC = supServices 
    ? Boolean(supServices.dc) 
    : Boolean(payload.services && (payload.services.toLowerCase().includes('dc') || payload.services.toLowerCase().includes('dry clean')));

  // Packaging selection (Fold vs Hanger) - strictly based on selection, never default to fold
  const isFold = supSpecs?.packaging === 'fold' || (payload as any).packaging === 'fold';
  const isHanger = supSpecs?.packaging === 'hanger' || (payload as any).packaging === 'hanger';
  const hangerQty = supSpecs?.hanger_given_qty ?? (payload as any).hangerQty ?? 0;

  const formattedDate = new Date(payload.in_date || Date.now()).toLocaleDateString('en-GB');
  const formattedTime = new Date(payload.in_date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Build ESC/POS Payload data object
  const getEscPosData = (forVendor: boolean) => ({
    shopName: payload.shopName?.toUpperCase() || 'WASH HUB',
    phone: shopPhone,
    billNumber,
    isVendorCopy: forVendor,
    hasIron,
    hasDC,
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
    const res = printDirectRawBT(getEscPosData(forVendor), cutterFeedMm);
    if (res.success) {
      setBtStatus('✓ Opened RawBT with 100% native 80mm ESC/POS stream!');
      setTimeout(() => setBtStatus(null), 4000);
    } else {
      setBtStatus(`RawBT notice: ${res.message}`);
      setTimeout(() => setBtStatus(null), 5000);
    }
  };

  const handleRawBtPrintBoth = () => {
    const res = printDirectRawBTBoth(getEscPosData(false), getEscPosData(true), cutterFeedMm);
    if (res.success) {
      setBtStatus('✓ Opened RawBT with both slips in 100% native 80mm ESC/POS stream!');
      setTimeout(() => setBtStatus(null), 4000);
    } else {
      setBtStatus(`RawBT notice: ${res.message}`);
      setTimeout(() => setBtStatus(null), 5000);
    }
  };

  // 1. CUSTOMER BILL (Exact replica of the original Wash Hub pre-printed bill format - Compact Fit)
  const renderCustomerBill = () => {
    return (
      <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {/* Brand Header matching original bill */}
        <div className="text-center pb-0.5 border-b border-black">
          <h1 className="text-lg font-black tracking-tight leading-none uppercase font-serif">
            {payload.shopName?.toUpperCase() || 'WASH HUB'}
          </h1>
          <div className="text-[9px] font-bold italic tracking-tight mt-0.5 text-slate-900 leading-tight">We do your laundry right - all day every day</div>
          <div className="text-[8.5px] font-semibold text-slate-800 leading-tight">
            101/C, Galle Road, Mount Lavinia. Tel: {shopPhone}
          </div>
        </div>

        {/* Bill Number & Badge Header */}
        <div className="flex justify-between items-center my-0.5 py-0.5 border-b border-black">
          <div className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
            FINAL CUSTOMER BILL
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-black uppercase tracking-wide">Bill #</span>
            <span className="text-lg font-black tracking-widest leading-none">{billNumber}</span>
          </div>
        </div>

        {/* Customer & Order Metadata Section */}
        <div className="space-y-0.5 text-[11px] font-semibold mb-1 pb-0.5 border-b border-black">
          <div className="flex items-baseline">
            <span className="w-24 shrink-0 font-bold text-slate-800">Customer Name</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-black text-xs uppercase flex-1 truncate">{payload.customer}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-24 shrink-0 font-bold text-slate-800">Contact #</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-bold text-xs flex-1">{payload.mobile}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-24 shrink-0 font-bold text-slate-800">Date</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-bold text-[11px] flex-1">{formattedDate} {formattedTime}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-24 shrink-0 font-bold text-slate-800">Weight</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-black text-xs flex-1">
              Kg {payload.weight} {payload.pieces ? <span className="text-[10px] font-normal text-slate-700 ml-1">({payload.pieces} pcs)</span> : ''}
            </span>
          </div>
        </div>

        {/* Middle Section: Status / Delivery Box (Left) & Services Table (Right) */}
        <div className="grid grid-cols-2 gap-1 mb-1 pb-0.5 border-b border-black">
          {/* Left Column */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">Status</div>
              <div className="border border-black rounded-xs overflow-hidden">
                <div className="bg-black text-white text-[9px] font-black text-center py-0.5 uppercase tracking-wider">
                  Pickup / Settlement
                </div>
                <div className="p-0.5 text-center font-black text-[11px] bg-slate-50 flex items-center justify-center uppercase text-emerald-800">
                  {balanceDue <= 0 ? '✓ Fully Paid' : `Bal: Rs. ${balanceDue.toFixed(2)}`}
                </div>
              </div>
            </div>

            <div className="space-y-0.5 pt-0.5 text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  Fold <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">{isFold ? '✓' : ''}</span>
                </span>
                <span className="flex items-center gap-1">
                  Hanger <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">{isHanger ? '✓' : ''}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-700 text-[10px]">
                Hanger Rec <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">{hangerQty > 0 ? hangerQty : ''}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Services */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 text-[10px] font-bold">
                <span>Services</span>
              </div>
              <div className="border border-black px-1 py-0.2 min-w-[55px] text-right font-black text-[10px] bg-slate-50 uppercase truncate">
                {[hasWash && 'Wash', hasDry && 'Dry', hasIron && 'Iron', hasDC && 'D/C'].filter(Boolean).join(' · ') || 'Wash · Dry'}
              </div>
            </div>

            {hasWash && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>Wash</span>
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">Rs.</span>
                  <div className="border border-black px-1 py-0.2 min-w-[55px] text-right font-black text-[11px] bg-slate-50">
                    {supBilling?.wash_amount ? supBilling.wash_amount.toFixed(2) : payload.final_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {hasDry && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>Dry</span>
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">Rs.</span>
                  <div className="border border-black px-1 py-0.2 min-w-[55px] text-right font-black text-[11px] bg-slate-50">
                    {supBilling?.dry_amount > 0 ? supBilling.dry_amount.toFixed(2) : 'Inc.'}
                  </div>
                </div>
              </div>
            )}

            {hasIron && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>Iron</span>
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">Rs.</span>
                  <div className="border border-black px-1 py-0.2 min-w-[55px] text-right font-black text-[11px] bg-slate-50">
                    {supBilling?.iron_amount > 0 ? supBilling.iron_amount.toFixed(2) : 'Inc.'}
                  </div>
                </div>
              </div>
            )}

            {hasDC && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>D/C</span>
                  <span className="inline-block border border-black w-3.5 h-3.5 text-center leading-3 font-black text-[10px]">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold">Rs.</span>
                  <div className="border border-black px-1 py-0.2 min-w-[55px] text-right font-black text-[11px] bg-slate-50">
                    {supBilling?.dc_amount > 0 ? supBilling.dc_amount.toFixed(2) : 'Inc.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Section: Formatted with outline boxes matching original bill */}
        <div className="space-y-0.5 mb-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wide">TOTAL AMOUNT</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold">Rs.</span>
              <div className="border border-black px-1.5 py-0.2 min-w-[70px] text-right font-black text-xs bg-slate-50">
                {payload.final_amount.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-800">CASH RECEIVED</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold">Rs.</span>
              <div className="border border-black px-1.5 py-0.2 min-w-[70px] text-right font-bold text-[11px] bg-slate-50">
                {payload.received_cash.toFixed(2)}
              </div>
            </div>
          </div>

          {changeDue > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">CHANGE RETURNED</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold">Rs.</span>
                <div className="border border-black px-1.5 py-0.2 min-w-[70px] text-right font-bold text-[11px] bg-emerald-50">
                  {changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wide">
              {balanceDue > 0 ? 'BALANCE DUE' : 'BALANCE TO BE PAID'}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black">Rs.</span>
              <div className={`border border-black px-1.5 py-0.2 min-w-[70px] text-right font-black text-xs ${balanceDue > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100'}`}>
                {balanceDue > 0 ? balanceDue.toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Divider Bar */}
        <div className="h-px bg-black w-full my-0.5"></div>

        {/* Hours Bar */}
        <div className="text-center font-black text-[9px] uppercase tracking-wide my-0.5">
          Open 7.30 am. to 7.30 pm. 365 Days
        </div>

        {/* Footer Terms with Square Bullets (■) from original bill */}
        <div className="text-[8px] leading-tight space-y-0.5 border-t border-black pt-0.5 text-black">
          <p className="flex items-start gap-1">
            <span className="font-black text-[9px]">■</span>
            <span>Please provide your bill at collection</span>
          </p>
          <p className="flex items-start gap-1">
            <span className="font-black text-[9px]">■</span>
            <span>Collect all items before 30 days from billing date</span>
          </p>
          <p className="flex items-start gap-1">
            <span className="font-black text-[9px]">■</span>
            <span>We are not responsible for colorfastness in cloths. Check care labels before wash/dry.</span>
          </p>
        </div>

        {/* Paper Feed & Cutter Clearance Spacer - customizable feed clears knife blade */}
        <div className="receipt-cutter-spacer w-full" style={{ minHeight: `${cutterFeedMm}mm`, height: `${cutterFeedMm}mm` }} aria-hidden="true"></div>
      </div>
    );
  };

  // 2. VENDOR WORKSHOP TAG (Matches Wash Dry.jpeg / Wash Dry Iron.jpeg + QR Code with Compact Sharp Fit)
  const renderVendorTag = () => (
    <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-1" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Outer Card replicating physical tag card */}
      <div className="border border-black p-1 bg-white mb-0.5">
        {/* Brand & Phone Block */}
        <div className="flex justify-between items-start border-b border-black pb-0.5 mb-0.5">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight leading-none">
              {payload.shopName?.toUpperCase() || 'WASH HUB'}
            </h2>
            <div className="text-[9px] font-bold text-slate-800 mt-0.5">Tel: {shopPhone}</div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-black uppercase bg-black text-white px-1.5 py-0.5">
              {[hasWash && 'WASH', hasDry && 'DRY', hasIron && 'IRON', hasDC && 'D/C'].filter(Boolean).join(' · ') || 'WASH · DRY'}
            </span>
          </div>
        </div>

        {/* Form Fields with clear rectangular outline boxes */}
        <div className="space-y-0.5 text-xs">
          
          {/* Wash Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">Wash :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-bold text-[11px] bg-slate-50">
              <span>{hasWash ? '✓ Included' : '[  ]'}</span>
              <span>[ Load ]</span>
            </div>
          </div>

          {/* Dry Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">Dry :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-bold text-[11px] bg-slate-50">
              <span>{hasDry ? '✓ Included' : '[  ]'}</span>
              <span>[ Dryer ]</span>
            </div>
          </div>

          {/* Iron Row */}
          {hasIron && (
            <div className="flex items-center">
              <div className="w-18 shrink-0 font-black text-[11px]">Iron :</div>
              <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-bold text-[11px] bg-slate-50">
                <span>✓ Included</span>
                <span>[ Press ]</span>
              </div>
            </div>
          )}

          {/* D/C Row */}
          {hasDC && (
            <div className="flex items-center">
              <div className="w-18 shrink-0 font-black text-[11px]">D/C :</div>
              <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-bold text-[11px] bg-slate-50">
                <span>✓ Included</span>
                <span>[ Dry Clean ]</span>
              </div>
            </div>
          )}

          {/* Amount Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">Amount :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-black text-xs bg-slate-50">
              <span>Rs. {payload.final_amount.toFixed(2)}</span>
              {balanceDue > 0 && <span className="text-[9px] font-normal text-red-600">(Due: Rs. {balanceDue.toFixed(2)})</span>}
            </div>
          </div>

          {/* In Date Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">In date :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center font-bold text-[11px] bg-slate-50">
              {formattedDate} {formattedTime}
            </div>
          </div>

          {/* Name Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">Name :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center font-black text-[11px] uppercase bg-slate-50 truncate">
              {payload.customer}
            </div>
          </div>

          {/* Weight Row */}
          <div className="flex items-center">
            <div className="w-18 shrink-0 font-black text-[11px]">Weight :</div>
            <div className="flex-1 border border-black px-1.5 py-0.2 min-h-[20px] flex items-center justify-between font-bold text-[11px] bg-slate-50">
              <span>{payload.weight}</span>
              {payload.pieces && <span className="text-[10px] text-slate-700">({payload.pieces} pcs)</span>}
            </div>
          </div>

          {/* Bill # Row */}
          <div className="flex items-center pt-0.5">
            <div className="w-18 shrink-0 font-black text-[11px]">Bill # :</div>
            <div className="flex-1 border border-black px-2 py-0.5 min-h-[24px] flex items-center justify-center font-black text-lg tracking-widest bg-slate-100">
              {billNumber}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center py-1 border-t border-dashed border-black">
        <div className="text-[10px] font-black uppercase tracking-wider mb-0.5">SCAN WHEN READY</div>
        <div className="p-0.5 bg-white border border-black rounded">
          <QRCodeSVG value={payload.barcode || `WB-${billNumber}`} size={68} level="M" />
        </div>
        <div className="font-mono font-black text-[11px] mt-0.5 tracking-wider">{payload.barcode || `WB-${billNumber}`}</div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-700">
          VENDOR COPY · ATTACH TO LAUNDRY SACK
        </div>
      </div>

      {/* Paper Feed & Cutter Clearance Spacer - customizable feed clears knife blade */}
      <div className="receipt-cutter-spacer w-full" style={{ minHeight: `${cutterFeedMm}mm`, height: `${cutterFeedMm}mm` }} aria-hidden="true"></div>
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
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
          className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activePreviewTab === 'vendor'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Vendor Tag ({hasIron ? 'Wash Dry Iron' : 'Wash Dry'})</span>
        </button>
      </div>

      {/* Auto-Cutter Clearance Spacing Control & Cut Fix Guide Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-slate-700 font-bold">
            <Scissors className="w-3.5 h-3.5 text-slate-500" />
            <span>Paper Feed Before Cut:</span>
          </div>
          <div className="inline-flex rounded-md shadow-xs bg-white border border-slate-300 p-0.5">
            {[
              { val: 6, label: '6mm', desc: 'Ultra Compact (Fit Short Paper)' },
              { val: 10, label: '10mm (Std)', desc: 'Standard 80mm POS Roll' },
              { val: 15, label: '15mm', desc: 'Extended Feed' },
              { val: 20, label: '20mm', desc: 'Full Knife Clearance' }
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => setCutterFeedMm(item.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  cutterFeedMm === item.val
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={`Advances ${item.val}mm blank paper past thermal head so auto-cutter knife never cuts receipt text (${item.desc})`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTipsModal(!showTipsModal)}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded border border-amber-300 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Why does it cut before end? (Fix Guide)</span>
        </button>
      </div>

      {/* Bluetooth Status Toast */}
      {btStatus && (
        <div className="bg-blue-50 border-b border-blue-200 px-3 py-1.5 text-xs text-blue-900 font-medium flex items-center justify-between">
          <span>{btStatus}</span>
          <button onClick={() => setBtStatus(null)} className="text-blue-500 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Comprehensive Manual Settings & Premature Cut Fix Guide */}
      {showTipsModal && (
        <div className="bg-amber-50 border-b border-amber-200 p-3.5 text-xs text-amber-950 space-y-2.5 shrink-0 max-h-72 overflow-y-auto">
          <div className="font-black flex items-center justify-between text-amber-900 text-sm">
            <div className="flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-700" />
              <span>How to Fix Receipts Cutting Before the End (2 Simple Solutions)</span>
            </div>
            <button 
              onClick={() => setShowTipsModal(false)}
              className="text-amber-800 hover:text-amber-950 font-bold px-1.5 py-0.5 rounded hover:bg-amber-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-amber-900 leading-relaxed">
            <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 space-y-1">
              <strong className="text-amber-950 block text-xs">A. Why Thermal Printers Cut Before End:</strong>
              <p className="text-slate-800">
                In thermal printers, the physical cutting blade sits <strong>20mm to 25mm downstream</strong> from the thermal printhead. If the paper does not feed enough after printing the last line, the knife cuts before the bill exits!
              </p>
              <div className="bg-emerald-50 text-emerald-900 p-1.5 rounded border border-emerald-200 mt-1 font-medium">
                👉 <strong>Solution:</strong> Select <strong>22mm (Std)</strong> or <strong>28mm (Clear)</strong> on the top bar above. This feeds the bill completely past the cutting blade before the cut executes.
              </div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 space-y-1">
              <strong className="text-amber-950 block text-xs">B. RawBT App Settings (For 100% Perfect Cut):</strong>
              <ul className="list-disc list-inside space-y-1 text-slate-800">
                <li>Open <strong>RawBT app</strong> → <strong>Settings → Printer</strong></li>
                <li>Tap <strong>"Feed before cut" / "Paper feed after print"</strong>: Set to <strong>4 - 6 lines (20mm - 25mm)</strong>.</li>
                <li>Tap <strong>"Paper cut"</strong>: Choose <span className="font-bold text-black">"At the end of job"</span> (Do NOT choose "At each page").</li>
                <li>Under <strong>Paper format</strong>: Ensure it is set to <span className="font-bold text-black">80mm (576 dots)</span>.</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-100/70 p-2 rounded text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              ⚡ <strong>Best Method:</strong> Click the orange <strong>"RawBT Both (80mm)"</strong> button below. It streams native ESC/POS thermal cut commands directly to RawBT, advancing 20mm and executing clean cuts for both slips with zero browser split!
            </span>
          </div>
        </div>
      )}

      {/* Interactive Preview Canvas */}
      <div className={`p-4 bg-gray-200 flex justify-center h-full ${inline ? "items-start overflow-auto" : "items-center overflow-auto min-h-[460px]"}`}>
        <div className="w-full max-w-[340px] shadow-2xl rounded-sm overflow-hidden bg-white">
          {activePreviewTab === 'customer' ? renderCustomerBill() : renderVendorTag()}
        </div>

        {/* Hidden Printable Nodes */}
        <div id="final-bill-customer-print" className="hidden">
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
            {renderCustomerBill()}
          </div>
        </div>

        <div id="final-bill-vendor-print" className="hidden">
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
            {renderVendorTag()}
          </div>
        </div>

        <div id="final-bill-both-print" className="hidden">
          <div className="receipt-page" style={{ width: '100%', pageBreakAfter: 'always', breakAfter: 'page' }}>
            {renderCustomerBill()}
          </div>
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
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
            title="Opens licensed RawBT app with direct 80mm native ESC/POS thermal command stream for current preview slip"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg shadow-sm hover:bg-amber-200 transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-700 fill-amber-600" />
            <span>RawBT {activePreviewTab === 'vendor' ? 'Vendor' : 'Customer'}</span>
          </button>

          <button
            onClick={handleRawBtPrintBoth}
            title="Opens licensed RawBT app and prints both Customer and Vendor slips with clean 20mm advance and auto-cut"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 border border-amber-400 rounded-lg shadow-sm hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <Zap className="h-3.5 w-3.5 text-amber-800 fill-amber-700" />
            <span>RawBT Both (80mm)</span>
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

