import React from 'react';
import { Printer, Check, Copy, Tag, Info } from 'lucide-react';
import { printHtml } from '../lib/printUtils';
import { QRCodeSVG } from 'qrcode.react';

interface StickerPayload {
  barcode: string;
  customer: string;
  mobile: string;
  services: string;
  weight: string;
  pieces?: string;
  in_date: string;
  est_amount: number;
  shopName?: string;
}

interface StickerViewProps {
  payload: StickerPayload | null;
  onClose: () => void;
}

export default function StickerView({ payload, onClose }: StickerViewProps) {
  const [copied, setCopied] = React.useState(false);

  if (!payload) {
    return (
      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400 font-medium">
        <Tag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm">No active print spool. Intake a new order to auto-generate a thermal tag payload.</p>
      </div>
    );
  }

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(payload.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulatePrint = () => {
    const qrSvgString = document.getElementById('qr-code-svg')?.outerHTML || '';
    
    printHtml(`
      <html>
        <head>
          <title>${payload.shopName?.toUpperCase() || 'WASH HUB'} Label Print - ${payload.barcode}</title>
          <style>
            @page { size: 58mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', monospace; 
              padding: 10px 5px; 
              text-align: center; 
              width: 100%;
              max-width: 58mm; 
              margin: 0 auto; 
              color: #000;
              font-size: 11px;
              box-sizing: border-box;
            }
            hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
            .barcode { display: flex; justify-content: center; margin: 10px 0; }
            .header { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .text-left { text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">${payload.shopName?.toUpperCase() || 'WASH HUB LAUNDRY'}</div>
          <div>THERMAL BAGGING TAG</div>
          <hr />
          <div class="text-left">
            <div class="row"><strong>ID:</strong> <span>${payload.barcode}</span></div>
            <div class="row"><strong>CLIENT:</strong> <span>${payload.customer}</span></div>
            <div class="row"><strong>PHONE:</strong> <span>${payload.mobile}</span></div>
            <div class="row"><strong>DATE:</strong> <span>${new Date(payload.in_date).toLocaleDateString()}</span></div>
            <div class="row"><strong>WEIGHT:</strong> <span>${payload.weight}</span></div>
            <div class="row"><strong>PIECES:</strong> <span>${payload.pieces || 'N/A'}</span></div>
            <div class="row"><strong>SERVICES:</strong> <span>${payload.services}</span></div>
            <div class="row"><strong>ESTIMATE:</strong> <span>Rs. ${payload.est_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
          </div>
          <hr />
          <div class="barcode">${qrSvgString}</div>
          <div>${payload.barcode}</div>
        </body>
      </html>
    `, `${payload.shopName?.toUpperCase() || 'WASH HUB'} Label Print - ${payload.barcode}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-in space-y-4" id="sticker-view">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Tag className="h-3.5 w-3.5 text-cyan-600" />
          Printer Spooler (Active Tag)
        </h4>
        <button 
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
          id="clear-sticker-btn"
        >
          Clear spool
        </button>
      </div>

      {/* High Fidelity Thermal Sticker Tape Illustration */}
      <div className="mx-auto max-w-[220px] bg-amber-50/20 border-2 border-slate-900 border-dashed rounded-lg p-5 text-slate-900 font-mono text-xs shadow-inner relative overflow-hidden" id="thermal-tag">
        {/* Ribbon decoration at top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-900 via-transparent to-slate-900 bg-[size:10px_4px]" />
        
        {/* Logo print */}
        <div className="text-center space-y-1 mb-4">
          <h5 className="font-display font-black text-sm tracking-widest text-slate-900 border-b border-slate-900 border-double pb-1 uppercase">
            * {payload.shopName?.toUpperCase() || 'WASH HUB'} POS *
          </h5>
          <span className="text-[10px] uppercase font-bold tracking-tighter">BAGGING & CYCLE TAG</span>
        </div>

        {/* Core fields */}
        <div className="space-y-2 border-b border-slate-400 border-dashed pb-3 mb-3">
          <div className="flex justify-between">
            <span className="font-bold">BARCODE ID:</span>
            <span className="font-bold">{payload.barcode}</span>
          </div>
          <div className="flex justify-between">
            <span>IN-DATE:</span>
            <span>{new Date(payload.in_date).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>CUSTOMER:</span>
            <span className="font-bold truncate max-w-[150px]">{payload.customer}</span>
          </div>
          <div className="flex justify-between">
            <span>CONTACT:</span>
            <span>{payload.mobile}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2 border-b border-slate-400 border-dashed pb-3 mb-3">
          <div className="flex justify-between text-slate-850">
            <span>TOTAL WEIGHT:</span>
            <span className="font-bold">{payload.weight}</span>
          </div>
          <div className="flex justify-between text-slate-850">
            <span>PIECES COUNT:</span>
            <span className="font-bold">{payload.pieces || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-slate-850">
            <span>CYCLE ROUTE:</span>
            <span className="font-bold uppercase text-[10px] bg-slate-950 text-white px-1.5 py-0.5 rounded">
              {payload.services}
            </span>
          </div>
        </div>

        {/* Bottom barcode and number representation */}
        <div className="space-y-2 text-center">
          <div className="bg-white p-2 rounded border border-slate-300 flex justify-center">
            <QRCodeSVG id="qr-code-svg" value={payload.barcode} size={120} level="H" />
          </div>
          <span className="text-[10px] block font-semibold tracking-wider">{payload.barcode}</span>
          <div className="font-bold text-sm border-t border-double border-slate-900 pt-1.5 flex justify-between mt-3">
            <span>EST AMOUNT:</span>
            <span>Rs. {payload.est_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Simulated controls */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={handleCopyBarcode}
          className="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition cursor-pointer"
          id="copy-barcode-btn"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy QR Text</span>
            </>
          )}
        </button>

        <button
          onClick={simulatePrint}
          className="flex items-center justify-center gap-1.5 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
          id="physical-print-btn"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Tag</span>
        </button>
      </div>

      {/* Informative helper alert */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-blue-700 text-[11px] flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Attach this print-tag to the laundry bag. Operational staff can scan this barcode using a gun scanner at each stage to sequentially advance the workflow.
        </p>
      </div>

    </div>
  );
}
