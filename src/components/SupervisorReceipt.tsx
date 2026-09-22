import React, { useState, useEffect } from 'react';
import { Printer, Check, Scissors, HelpCircle, Bluetooth, Tag, ReceiptText, Wifi, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { printHtml } from '../lib/printUtils';
import { printDirectBluetooth, printDirectRawBT, isWebBluetoothSupported, buildEscPosPayload } from '../lib/bluetoothPrint';
import { getSavedNetworkPrinter, sendEscPosToNetworkPrinter, NetworkPrinterConfig } from '../lib/networkPrint';
import NetworkPrinterModal from './NetworkPrinterModal';

interface SupervisorReceiptProps {
  payload: any;
  onClose: () => void;
  inline?: boolean;
}

export default function SupervisorReceipt({ payload, onClose, inline }: SupervisorReceiptProps) {
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

  if (!payload || !payload.supervisor_data) return null;
  
  const rawData = payload.supervisor_data;
  const orderDetails = rawData.order_details || rawData;
  
  const billNumber = payload.barcode ? payload.barcode.replace('WB-', '') : '1025';

  // Extract service flags strictly based on orderDetails.services
  const hasWash = Boolean(
    orderDetails.services ? orderDetails.services.wash : 
    (!payload.services || payload.services.toLowerCase().includes('wash'))
  );

  const hasDry = Boolean(
    orderDetails.services ? orderDetails.services.dry : 
    (payload.services && payload.services.toLowerCase().includes('dry'))
  );

  const hasIron = Boolean(
    orderDetails.services ? orderDetails.services.iron : 
    ((orderDetails.billing?.iron_amount && orderDetails.billing.iron_amount > 0) ||
    (typeof payload.services === 'string' && payload.services.toLowerCase().includes('iron')))
  );

  const hasDC = Boolean(
    orderDetails.services ? orderDetails.services.dc : 
    ((orderDetails.billing?.dc_amount && orderDetails.billing.dc_amount > 0) ||
    (typeof payload.services === 'string' && (payload.services.toLowerCase().includes('dc') || payload.services.toLowerCase().includes('dry clean'))))
  );

  // Check packaging strictly from specs
  const isFold = orderDetails.specs?.packaging === 'fold';
  const isHanger = orderDetails.specs?.packaging === 'hanger';
  const hangerQty = orderDetails.specs?.hanger_given_qty || 0;

  const shopPhone = '011 3041630, 011 2735490';
  const customerName = orderDetails.customer?.name || payload.customer || 'CUSTOMER';
  const customerPhone = orderDetails.customer?.telephone || payload.mobile || '-';
  const inDate = orderDetails.order_metadata?.date || payload.in_date || new Date().toISOString().slice(0, 10);
  const inTime = orderDetails.order_metadata?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const weightDisplay = orderDetails.specs?.weight_kg ? `${orderDetails.specs.weight_kg} kg` : (payload.weight || '-');
  const qtyDisplay = orderDetails.specs?.quantity || payload.pieces || '0';
  const totalDisplay = orderDetails.billing?.total_amount ? orderDetails.billing.total_amount.toFixed(2) : (payload.final_amount || 0).toFixed(2);
  const advanceDisplay = orderDetails.billing?.advance ? orderDetails.billing.advance.toFixed(2) : '0.00';
  const balanceDisplay = orderDetails.billing?.balance ? orderDetails.billing.balance.toFixed(2) : totalDisplay;

  // Build ESC/POS Payload data object
  const getEscPosData = (forVendor: boolean) => ({
    shopName: 'WASH HUB',
    phone: shopPhone,
    billNumber,
    isVendorCopy: forVendor,
    hasIron,
    hasDC,
    date: inDate,
    customerName,
    customerPhone,
    weight: weightDisplay,
    pieces: qtyDisplay,
    washAmount: orderDetails.billing?.wash_amount,
    dryAmount: orderDetails.billing?.dry_amount,
    ironAmount: orderDetails.billing?.iron_amount,
    dcAmount: orderDetails.billing?.dc_amount,
    totalAmount: totalDisplay,
    advanceAmount: advanceDisplay,
    balanceAmount: balanceDisplay,
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
    const el = document.getElementById('supervisor-receipt-print');
    if (el) printHtml(el.innerHTML, `Receipt - Bill #${billNumber}`);
  };

  const handlePrintCustomer = () => {
    if (networkPrinter?.ip_address) {
      handleNetworkPrint(false);
      return;
    }
    const el = document.getElementById('customer-receipt-print');
    if (el) printHtml(el.innerHTML, `Customer Receipt #${billNumber}`);
  };

  const handlePrintVendor = () => {
    if (networkPrinter?.ip_address) {
      handleNetworkPrint(true);
      return;
    }
    const el = document.getElementById('vendor-receipt-print');
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

  // 1. CUSTOMER RECEIPT (Exact replica of original pre-printed bill format)
  const renderCustomerReceipt = () => {
    const deliveryDate = orderDetails.order_metadata?.delivery_date || '-';

    return (
      <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-1.5" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {/* Brand Header matching original bill */}
        <div className="text-center pb-1 border-b-2 border-black">
          <h1 className="text-2xl font-black tracking-tight leading-none uppercase font-serif">Wash Hub</h1>
          <div className="text-[10px] font-bold italic tracking-tight mt-0.5 text-slate-900">We do your laundry right - all day every day</div>
          <div className="text-[10px] font-semibold mt-0.5 text-slate-800">
            101/C, Galle Road, Mount Lavinia. Tel: {shopPhone}
          </div>
        </div>

        {/* Bill Number & Badge Header */}
        <div className="flex justify-between items-end my-1 pb-1 border-b-2 border-black">
          <div className="bg-black text-white px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider">
            CUSTOMER RECEIPT
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-black uppercase tracking-wide">Bill #</span>
            <span className="text-2xl font-black tracking-widest leading-none">{billNumber}</span>
          </div>
        </div>

        {/* Customer & Order Metadata Section */}
        <div className="space-y-0.5 text-xs font-semibold mb-1.5 pb-1 border-b border-black">
          <div className="flex items-baseline">
            <span className="w-28 shrink-0 font-bold text-slate-800">Customer Name</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-black text-sm uppercase flex-1 truncate">{customerName}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0 font-bold text-slate-800">Contact #</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-bold text-sm flex-1">{customerPhone}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0 font-bold text-slate-800">Date</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-bold text-xs flex-1">{inDate} {inTime}</span>
          </div>
          <div className="flex items-baseline">
            <span className="w-28 shrink-0 font-bold text-slate-800">Weight</span>
            <span className="font-bold mr-1">:</span>
            <span className="font-black text-sm flex-1">
              Kg {weightDisplay} {qtyDisplay ? <span className="text-xs font-normal text-slate-700 ml-1">({qtyDisplay} pcs)</span> : ''}
            </span>
          </div>
        </div>

        {/* Middle Section: Status / Delivery Box (Left) & Services Table (Right) */}
        <div className="grid grid-cols-2 gap-1.5 mb-1.5 pb-1 border-b border-black">
          {/* Left Column: Status & Delivery Box & Packaging checkboxes */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-0.5">Status</div>
              {/* Delivery Date Framed Box */}
              <div className="border-2 border-black rounded-sm overflow-hidden">
                <div className="bg-black text-white text-[10px] font-black text-center py-0.5 uppercase tracking-wider">
                  Delivery Date
                </div>
                <div className="p-1 text-center font-black text-xs bg-slate-50 min-h-[24px] flex items-center justify-center">
                  {deliveryDate}
                </div>
              </div>
            </div>

            {/* Checkboxes: Fold / Hanger */}
            <div className="space-y-0.5 pt-1 text-xs font-bold">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1">
                  Fold <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">{isFold ? '✓' : ''}</span>
                </span>
                <span className="flex items-center gap-1">
                  Hanger <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">{isHanger ? '✓' : ''}</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-700 text-[11px]">
                Hanger Rec <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">{hangerQty > 0 ? hangerQty : ''}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Wash / Dry / Iron / D/C with outline boxes */}
          <div className="space-y-1">
            {/* Wash Row */}
            {hasWash && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span>Wash</span>
                  <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold">Rs.</span>
                  <div className="border-2 border-black px-1.5 py-0.5 min-w-[65px] text-right font-black text-xs bg-slate-50">
                    {orderDetails.billing?.wash_amount > 0 ? orderDetails.billing.wash_amount.toFixed(2) : '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Dry Row */}
            {hasDry && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span>Dry</span>
                  <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold">Rs.</span>
                  <div className="border-2 border-black px-1.5 py-0.5 min-w-[65px] text-right font-black text-xs bg-slate-50">
                    {orderDetails.billing?.dry_amount > 0 ? orderDetails.billing.dry_amount.toFixed(2) : '-'}
                  </div>
                </div>
              </div>
            )}

            {/* Iron Row */}
            {hasIron && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span>Iron</span>
                  <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold">Rs.</span>
                  <div className="border-2 border-black px-1.5 py-0.5 min-w-[65px] text-right font-black text-xs bg-slate-50">
                    {orderDetails.billing?.iron_amount > 0 ? orderDetails.billing.iron_amount.toFixed(2) : '-'}
                  </div>
                </div>
              </div>
            )}

            {/* D/C Row */}
            {hasDC && (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <span>D/C</span>
                  <span className="inline-block border-2 border-black w-4 h-4 text-center leading-3 font-black text-xs">✓</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold">Rs.</span>
                  <div className="border-2 border-black px-1.5 py-0.5 min-w-[65px] text-right font-black text-xs bg-slate-50">
                    {orderDetails.billing?.dc_amount > 0 ? orderDetails.billing.dc_amount.toFixed(2) : '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Section: Formatted with outline boxes matching original bill */}
        <div className="space-y-1 mb-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide">TOTAL AMOUNT</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold">Rs.</span>
              <div className="border-2 border-black px-2 py-0.5 min-w-[80px] text-right font-black text-sm bg-slate-50">
                {totalDisplay}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-800">ADVANCE PAID</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold">Rs.</span>
              <div className="border-2 border-black px-2 py-0.5 min-w-[80px] text-right font-bold text-xs bg-slate-50">
                {advanceDisplay}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wide">BALANCE TO BE PAID</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-black">Rs.</span>
              <div className="border-2 border-black px-2 py-0.5 min-w-[80px] text-right font-black text-sm bg-slate-100">
                {balanceDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Solid Black Divider Bar */}
        <div className="h-0.5 bg-black w-full my-1"></div>

        {/* Hours Bar */}
        <div className="text-center font-black text-xs uppercase tracking-wide my-0.5">
          Open 7.30 am. to 7.30 pm. 365 Days
        </div>

        {/* Footer Terms with Square Bullets (■) from original bill */}
        <div className="text-[9px] leading-tight space-y-0.5 border-t border-black pt-1 text-black">
          <p className="flex items-start gap-1">
            <span className="font-black text-xs">■</span>
            <span>Please be kind enough to provide your bill at collection</span>
          </p>
          <p className="flex items-start gap-1">
            <span className="font-black text-xs">■</span>
            <span>Kindly requsted you to collect the all the items before 30 days from the billing date</span>
          </p>
          <p className="flex items-start gap-1">
            <span className="font-black text-xs">■</span>
            <span>We are not responsible for colorfastness in cloths. Check care labels before wash/dry.</span>
          </p>
        </div>

        {/* Paper Feed & Cutter Clearance Spacer - snug 6mm blank feed */}
        <div className="receipt-cutter-spacer w-full" style={{ minHeight: '6mm' }} aria-hidden="true"></div>
      </div>
    );
  };

  // 2. VENDOR WORKSHOP TAG (Matches Wash Dry.jpeg / Wash Dry Iron.jpeg + QR Code with Compact Sharp Fit)
  const renderVendorReceipt = () => (
    <div className="receipt-content-wrapper bg-white text-black font-sans w-full p-1.5" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      
      {/* Outer Card replicating physical tag card */}
      <div className="border-2 border-black p-1.5 bg-white mb-1">
        {/* Brand & Phone Block */}
        <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-1">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight leading-none">Wash Hub</h2>
            <div className="text-[10px] font-bold text-slate-800 mt-0.5">Tel: {shopPhone}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase bg-black text-white px-1.5 py-0.5">
              {[hasWash && 'WASH', hasDry && 'DRY', hasIron && 'IRON', hasDC && 'D/C'].filter(Boolean).join(' · ') || 'WASH · DRY'}
            </span>
          </div>
        </div>

        {/* Form Fields with clear rectangular outline boxes */}
        <div className="space-y-1 text-xs">
          
          {/* Wash Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">Wash :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-bold text-xs bg-slate-50">
              <span>{hasWash ? '✓ Included' : '[  ]'}</span>
              <span>{orderDetails.billing?.wash_amount > 0 ? `Rs. ${orderDetails.billing.wash_amount.toFixed(0)}` : ''}</span>
            </div>
          </div>

          {/* Dry Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">Dry :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-bold text-xs bg-slate-50">
              <span>{hasDry ? '✓ Included' : '[  ]'}</span>
              <span>{orderDetails.billing?.dry_amount > 0 ? `Rs. ${orderDetails.billing.dry_amount.toFixed(0)}` : ''}</span>
            </div>
          </div>

          {/* Iron Row (ONLY present if Wash Dry Iron, per Wash Dry Iron.jpeg) */}
          {hasIron && (
            <div className="flex items-center">
              <div className="w-20 shrink-0 font-black text-xs">Iron :</div>
              <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-bold text-xs bg-slate-50">
                <span>✓ Included</span>
                <span>{orderDetails.billing?.iron_amount > 0 ? `Rs. ${orderDetails.billing.iron_amount.toFixed(0)}` : ''}</span>
              </div>
            </div>
          )}

          {/* D/C Row */}
          {hasDC && (
            <div className="flex items-center">
              <div className="w-20 shrink-0 font-black text-xs">D/C :</div>
              <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-bold text-xs bg-slate-50">
                <span>✓ Included</span>
                <span>{orderDetails.billing?.dc_amount > 0 ? `Rs. ${orderDetails.billing.dc_amount.toFixed(0)}` : ''}</span>
              </div>
            </div>
          )}

          {/* Amount Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">Amount :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-black text-sm bg-slate-50">
              <span>Rs. {totalDisplay}</span>
              {advanceDisplay !== '0.00' && <span className="text-[10px] font-normal text-slate-700">(Bal: Rs. {balanceDisplay})</span>}
            </div>
          </div>

          {/* In Date Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">In date :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center font-bold text-xs bg-slate-50">
              {inDate} {inTime}
            </div>
          </div>

          {/* Name Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">Name :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center font-black text-xs uppercase bg-slate-50 truncate">
              {customerName}
            </div>
          </div>

          {/* Weight Row */}
          <div className="flex items-center">
            <div className="w-20 shrink-0 font-black text-xs">Weight :</div>
            <div className="flex-1 border-2 border-black px-2 py-0.5 min-h-[26px] flex items-center justify-between font-bold text-xs bg-slate-50">
              <span>{weightDisplay}</span>
              <span className="text-[11px] text-slate-700">({qtyDisplay} pcs)</span>
            </div>
          </div>

          {/* Bill # Row */}
          <div className="flex items-center pt-0.5">
            <div className="w-20 shrink-0 font-black text-xs">Bill # :</div>
            <div className="flex-1 border-2 border-black px-2 py-1 min-h-[30px] flex items-center justify-center font-black text-xl tracking-widest bg-slate-100">
              {billNumber}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Section (Always printed with Vendor slip) */}
      <div className="flex flex-col items-center justify-center py-1.5 border-t-2 border-dashed border-black">
        <div className="text-xs font-black uppercase tracking-wider mb-0.5">SCAN WHEN READY</div>
        <div className="p-1 bg-white border-2 border-black rounded">
          <QRCodeSVG value={payload.barcode || `WB-${billNumber}`} size={105} level="M" />
        </div>
        <div className="font-mono font-black text-xs mt-0.5 tracking-wider">{payload.barcode || `WB-${billNumber}`}</div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
          VENDOR COPY · ATTACH TO LAUNDRY SACK
        </div>
      </div>

      {/* Paper Feed & Cutter Clearance Spacer - snug 6mm blank feed */}
      <div className="receipt-cutter-spacer w-full" style={{ minHeight: '6mm' }} aria-hidden="true"></div>
    </div>
  );

  return (
    <div className={`bg-white w-full flex flex-col overflow-hidden mx-auto ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[95vh] max-w-lg"}`}>
      
      {/* Header Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold text-sm sm:text-base">Generated Receipt</h3>
          <span className="text-[11px] bg-slate-800 text-blue-300 px-2 py-0.5 rounded font-mono border border-slate-700">
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
          <span>Customer Receipt</span>
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

      {/* Help / Printer Manual Settings Guide Banner */}
      {showTipsModal && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 text-xs text-amber-950 space-y-2 shrink-0">
          <div className="font-black flex items-center justify-between text-amber-900 text-sm">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Manual Printer & RawBT Settings (Full Width 80mm Alignment)</span>
            </div>
            <button 
              onClick={() => setShowTipsModal(false)}
              className="text-amber-800 hover:text-amber-950 font-bold px-1.5 py-0.5 rounded hover:bg-amber-100"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-amber-900 leading-relaxed">
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <strong className="text-amber-950 block mb-1">1. RawBT App Settings (Fixes Left Alignment):</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                <li>Open <strong>RawBT app</strong> on your Android tablet/phone.</li>
                <li>Tap <strong>Settings → Printer → Paper Format</strong>: Change from <em>58mm (384 dots)</em> to <span className="font-bold text-black">80mm (576 dots)</span>. <em>(Default is 58mm, which shrinks and shifts prints to the left!)</em></li>
                <li>In <strong>Settings → Margins</strong>: Set Left = <strong>0</strong>, Right = <strong>0</strong>.</li>
                <li>In <strong>Settings → Graphics</strong>: Check <span className="font-bold text-black">"Autoscale to paper width"</span> or set Print method to <strong>"Driver (Bitmap)"</strong>.</li>
              </ul>
            </div>

            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <strong className="text-amber-950 block mb-1">2. Android / Browser Print Dialog:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                <li><strong>Paper size:</strong> Choose <span className="font-bold text-black">80mm</span> or <span className="font-bold text-black">Roll Paper 80x297mm</span> (Never leave as ISO A4 or Letter).</li>
                <li><strong>Margins:</strong> Select <span className="font-bold text-black">None</span> (default margins shrink the width).</li>
                <li><strong>Scale:</strong> Select <span className="font-bold text-black">100%</span> or <span className="font-bold text-black">Fit to printable area</span>.</li>
                <li><strong>Options:</strong> Check <span className="font-bold text-black">Background graphics</span>.</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-100/60 p-2 rounded text-[11px] text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              💡 <strong>Direct Bluetooth Option:</strong> If RawBT still resizes, click the <strong>"Direct BT"</strong> button below to print native ESC/POS commands directly to your printer with zero app scaling.
            </span>
          </div>
        </div>
      )}

      {/* Interactive Preview Canvas */}
      <div className={`p-4 bg-gray-200 flex justify-center h-full ${inline ? "items-start overflow-auto" : "items-center overflow-auto min-h-[460px]"}`}>
        <div className="w-full max-w-[340px] shadow-2xl rounded-sm overflow-hidden bg-white">
          {activePreviewTab === 'customer' ? renderCustomerReceipt() : renderVendorReceipt()}
        </div>

        {/* Hidden Printable Nodes */}
        <div id="customer-receipt-print" className="hidden">
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
            {renderCustomerReceipt()}
          </div>
        </div>

        <div id="vendor-receipt-print" className="hidden">
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
            {renderVendorReceipt()}
          </div>
        </div>

        <div id="supervisor-receipt-print" className="hidden">
          <div className="receipt-page" style={{ width: '100%', pageBreakAfter: 'always', breakAfter: 'page' }}>
            {renderCustomerReceipt()}
          </div>
          <div className="receipt-page receipt-page-last" style={{ width: '100%', pageBreakAfter: 'auto', breakAfter: 'auto' }}>
            {renderVendorReceipt()}
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
            <span>Customer (Cut)</span>
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

