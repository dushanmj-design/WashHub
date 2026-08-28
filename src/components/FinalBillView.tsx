import React from 'react';
import { Printer, Check, Copy, FileText, Info } from 'lucide-react';
import { printHtml } from '../lib/printUtils';

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
  if (!payload) {
    return null; // Should not be rendered if null anyway
  }

  
  const changeDue = Math.max(0, payload.received_cash - payload.final_amount);
  const balanceDue = Math.max(0, payload.final_amount - payload.received_cash);


  const simulatePrint = () => {
    printHtml(`
      <html>
        <head>
          <title>${payload.shopName?.toUpperCase() || 'WASH HUB'} Final Bill - ${payload.barcode}</title>
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
            .header { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">${payload.shopName?.toUpperCase() || 'WASH HUB LAUNDRY'}</div>
          <div>FINAL CUSTOMER BILL</div>
          <hr />
          <div class="text-left">
            <div class="row"><strong>ID:</strong> <span>${payload.barcode}</span></div>
            <div class="row"><strong>CLIENT:</strong> <span>${payload.customer}</span></div>
            <div class="row"><strong>PHONE:</strong> <span>${payload.mobile}</span></div>
            <div class="row"><strong>DATE:</strong> <span>${new Date(payload.in_date).toLocaleDateString()}</span></div>
            <div class="row"><strong>WEIGHT:</strong> <span>${payload.weight}</span></div>
            <div class="row"><strong>PIECES:</strong> <span>${payload.pieces || 'N/A'}</span></div>
            <div class="row"><strong>SERVICES:</strong> <span>${payload.services}</span></div>
          </div>
          <hr />
          <div class="text-left">
            <div class="row"><strong>TOTAL:</strong> <span>Rs. ${payload.final_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            <div class="row"><strong>CASH:</strong> <span>Rs. ${payload.received_cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            
            <div class="row"><strong>CHANGE:</strong> <span>Rs. ${changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            ${balanceDue > 0 ? `<div class="row" style="color: #000; font-weight: bold; border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px;"><strong>BALANCE DUE:</strong> <span>Rs. ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>` : ''}

          </div>
          <hr />
          <div>THANK YOU FOR YOUR BUSINESS!</div>
        </body>
      </html>
    `, `${payload.shopName?.toUpperCase() || 'WASH HUB'} Final Bill - ${payload.barcode}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fade-in space-y-4" id="final-bill-view">
      
      {/* Module Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <FileText className="h-3.5 w-3.5 text-emerald-600" />
          Final Customer Bill
        </h4>
        <button 
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
        >
          Close Bill
        </button>
      </div>

      {/* High Fidelity Thermal Sticker Tape Illustration */}
      <div className="mx-auto max-w-[220px] bg-amber-50/20 border-2 border-slate-900 border-dashed rounded-lg p-5 text-slate-900 font-mono text-xs shadow-inner relative overflow-hidden" id="thermal-bill">
        {/* Ribbon decoration at top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-900 via-transparent to-slate-900 bg-[size:10px_4px]" />
        
        {/* Logo print */}
        <div className="text-center space-y-1 mb-4">
          <h5 className="font-display font-black text-sm tracking-widest text-slate-900 border-b border-slate-900 border-double pb-1 uppercase">
            * {payload.shopName?.toUpperCase() || 'WASH HUB'} POS *
          </h5>
          <span className="text-[10px] uppercase font-bold tracking-tighter">FINAL CUSTOMER BILL</span>
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

        {/* Payment Summary */}
        <div className="space-y-2 text-slate-900">
          <div className="flex justify-between">
            <span>TOTAL INVOICE:</span>
            <span className="font-bold">Rs. {payload.final_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>CASH RECEIVED:</span>
            <span>Rs. {payload.received_cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-t border-slate-400 border-dashed pt-2 mt-2">
            <span className="font-bold">CHANGE RETURNED:</span>
            <span className="font-bold">Rs. {changeDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        
        <div className="text-center mt-6 font-bold text-[10px] tracking-widest uppercase">
          Thank you for your business!
        </div>
      </div>

      {/* Simulated controls */}
      <div className="flex justify-center pt-2">
        <button
          onClick={simulatePrint}
          className="flex items-center justify-center w-full gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition cursor-pointer shadow-sm"
          id="physical-print-bill-btn"
        >
          <Printer className="h-4 w-4" />
          <span>Print Final Bill</span>
        </button>
      </div>

    </div>
  );
}
