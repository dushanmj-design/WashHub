const fs = require('fs');

const code = `import React from 'react';
import { Printer, Check } from 'lucide-react';
import { printHtml } from '../lib/printUtils';

interface SupervisorReceiptProps {
  payload: any;
  onClose: () => void;
}

export default function SupervisorReceipt({ payload, onClose }: SupervisorReceiptProps) {
  if (!payload || !payload.supervisor_data) return null;
  
  const rawData = payload.supervisor_data;
  const orderDetails = rawData.order_details || rawData;
  
  const handlePrint = () => {
    const el = document.getElementById('supervisor-receipt-print');
    if (el) {
      printHtml(el.innerHTML, 'Supervisor Receipt');
    }
  };

  const billNumber = payload.barcode ? payload.barcode.replace('WB-', '') : '1025';

  return (
    <div className="bg-white rounded-xl shadow-xl w-full flex flex-col overflow-hidden max-h-[90vh] max-w-4xl mx-auto">
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <h3 className="font-bold">Generated Receipt (Standard A4/A5 Format)</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300">
          <Check className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 overflow-y-auto bg-gray-200 flex justify-center custom-scrollbar">
        {/* Receipt Container - Scaled for Standard Printer Width */}
        <div id="supervisor-receipt-print" className="bg-white shadow-md w-full max-w-[750px] shrink-0 text-black font-serif relative" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          
          {/* Header */}
          <div className="text-center text-white bg-zinc-800 pb-3 pt-6 px-4" style={{ 
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")',
            backgroundSize: 'cover'
          }}>
            <h1 className="text-7xl font-bold tracking-tight mb-2" style={{ fontFamily: '"Arial Black", Arial, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Wash Hub</h1>
            <p className="text-lg tracking-wide font-sans mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>We do your laundry right - all day every day</p>
          </div>
          
          <div className="px-8 py-6">
            <div className="text-center text-sm font-sans font-bold mb-6">
              <p>101/C, Galle Road, Mount Lavinia. Tel: 011 3041630, 011 2735490</p>
            </div>
            
            <div className="flex justify-end mb-6 text-2xl">
              <span className="mr-6">Bill #</span>
              <span className="font-bold text-4xl tracking-widest font-serif">{billNumber}</span>
            </div>
            
            {/* Top Info */}
            <div className="space-y-6 mb-8">
              <div className="flex">
                <span className="w-48 font-bold text-2xl">Customer Name</span>
                <span className="mr-4 text-2xl">:</span>
                <span className="border-b-2 border-dotted border-gray-400 flex-1 flex items-end pb-1 font-sans text-xl font-bold text-blue-900">{orderDetails.customer.name}</span>
              </div>
              <div className="flex">
                <span className="w-48 font-bold text-2xl">Contact #</span>
                <span className="mr-4 text-2xl">:</span>
                <span className="border-b-2 border-dotted border-gray-400 flex-1 flex items-end pb-1 font-sans text-xl font-bold text-blue-900">{orderDetails.customer.telephone}</span>
              </div>
              <div className="flex mt-2 pt-2">
                <span className="w-48 font-bold text-2xl">Date</span>
                <span className="mr-4 text-2xl">:</span>
                <span className="border-b-2 border-dotted border-gray-400 flex-1 flex items-end pb-1 font-sans text-xl font-bold text-blue-900">{orderDetails.order_metadata.date}</span>
              </div>
              <div className="flex">
                <span className="w-48 font-bold text-2xl">Weight</span>
                <span className="mr-4 text-2xl">: Kg</span>
                <span className="border-b-2 border-dotted border-gray-400 flex-1 flex items-end pb-1 font-sans text-xl font-bold text-blue-900">{orderDetails.specs.weight_kg}</span>
              </div>
            </div>
            
            {/* Middle Section (Grid) */}
            <div className="flex mb-8 mt-8 pb-4">
              
              {/* Left Col */}
              <div className="w-[45%] pr-4 flex flex-col pt-1">
                <div className="font-bold text-3xl mb-4 font-serif">Status</div>
                
                <div className="border-2 border-black text-center mb-6 pb-2">
                  <div className="border-b-2 border-black font-bold py-2 text-xl bg-gray-200">Delivery Date</div>
                  <div className="pt-3 pb-2 font-sans font-bold text-2xl text-blue-900">{orderDetails.order_metadata.delivery_date}</div>
                </div>
                
                <div className="flex flex-col text-lg font-bold mt-4 space-y-5 font-serif italic text-xl">
                  <div className="flex justify-between items-center">
                    <span>Fold</span>
                    <div className="w-7 h-7 border-2 border-black rounded-sm flex items-center justify-center">
                      {orderDetails.specs.packaging === 'fold' && <span className="text-xl font-sans font-bold not-italic">✓</span>}
                    </div>
                    <span className="ml-2">Hanger</span>
                    <div className="w-7 h-7 border-2 border-black rounded-sm flex items-center justify-center">
                      {orderDetails.specs.packaging === 'hanger' && <span className="text-xl font-sans font-bold not-italic">✓</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 justify-center pt-2">
                    <span>Hanger Rec</span>
                    <div className="w-7 h-7 border-2 border-black rounded-sm flex items-center justify-center">
                       {orderDetails.specs.hanger_given_qty > 0 && <span className="text-xl font-sans font-bold not-italic">✓</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Col */}
              <div className="w-[55%] pl-6 flex flex-col space-y-6 justify-start pt-2 border-l border-gray-300 border-dashed ml-2">
                <div className="flex items-center gap-3">
                  <span className="w-20 italic font-bold text-2xl font-serif">Wash</span>
                  <div className="w-8 h-8 border-2 border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.wash && <span className="text-2xl font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-2xl ml-2">Rs.</span>
                  <div className="flex-1 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-xl font-bold text-blue-900 bg-white shadow-sm">
                     {orderDetails.billing.wash_amount > 0 ? orderDetails.billing.wash_amount.toFixed(2) : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 italic font-bold text-2xl font-serif">Dry</span>
                  <div className="w-8 h-8 border-2 border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.dry && <span className="text-2xl font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-2xl ml-2">Rs.</span>
                  <div className="flex-1 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-xl font-bold text-blue-900 bg-white shadow-sm">
                     {orderDetails.billing.dry_amount > 0 ? orderDetails.billing.dry_amount.toFixed(2) : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-20 italic font-bold text-2xl font-serif">Iron</span>
                  <div className="w-8 h-8 border-2 border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.iron && <span className="text-2xl font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-2xl ml-2">Rs.</span>
                  <div className="flex-1 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-xl font-bold text-blue-900 bg-white shadow-sm">
                     {orderDetails.billing.iron_amount > 0 ? orderDetails.billing.iron_amount.toFixed(2) : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-black mb-1"></div>
            <div className="w-full h-0.5 bg-black mb-8"></div>
            
            {/* Totals Section - Perfectly Aligned Right */}
            <div className="space-y-5 mb-8 flex flex-col items-end">
              <div className="flex items-center justify-between w-[500px]">
                <span className="font-bold text-2xl text-left tracking-wide font-serif whitespace-nowrap">TOTAL AMOUNT</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-2xl font-serif">Rs.</span>
                  <div className="w-48 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-2xl font-bold text-blue-900 bg-white">
                    {orderDetails.billing.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-[500px]">
                <span className="font-bold text-2xl text-left tracking-wide font-serif whitespace-nowrap">ADVANCE PAID</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-2xl font-serif">Rs.</span>
                  <div className="w-48 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-2xl font-bold text-blue-900 bg-white">
                    {orderDetails.billing.advance.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-[500px]">
                <span className="font-bold text-2xl text-left tracking-wide font-serif whitespace-nowrap">BALANCE TO BE PAID</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-2xl font-serif">Rs.</span>
                  <div className="w-48 border-2 border-black rounded-md h-12 flex items-center justify-end px-3 font-sans text-2xl font-bold text-blue-900 bg-white">
                    {orderDetails.billing.balance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-2 bg-black mb-1.5"></div>
            <div className="w-full h-1 bg-black mb-6"></div>
            
            {/* Footer */}
            <div className="bg-black text-white text-center py-3 text-lg font-bold italic mb-4 tracking-wide font-sans shadow-md">
              Open 7.30 am. to 7.30 pm. 365 Days
            </div>
            
            <div className="w-full h-1.5 bg-black mb-4 mt-2"></div>
            
            <div className="text-sm leading-relaxed space-y-2 pb-4 font-sans font-bold px-2">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-black mt-1.5 shrink-0 rounded-sm"></div>
                <span>Please be kind enough to provide your bill at collection</span>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-black mt-1.5 shrink-0 rounded-sm"></div>
                <span>kindly requsted you to collect the all the items before 30 days from the billing date</span>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-black mt-1.5 shrink-0 rounded-sm"></div>
                <span>We are not responsible for any colorfastness in cloths, please make sure to read the "Care Label" before provide to washing & drying.</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-6 py-3 text-base font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-500"
        >
          <Printer className="h-5 w-5" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/SupervisorReceipt.tsx', code);
