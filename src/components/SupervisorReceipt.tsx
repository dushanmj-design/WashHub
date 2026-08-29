import React from 'react';
import { Printer, Check } from 'lucide-react';
import { printHtml } from '../lib/printUtils';

interface SupervisorReceiptProps {
  payload: any;
  onClose: () => void;
  inline?: boolean;
}

export default function SupervisorReceipt({ payload, onClose, inline }: SupervisorReceiptProps) {
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
    <div className={`bg-white w-full flex flex-col overflow-hidden mx-auto ${inline ? "h-full rounded-none shadow-none" : "rounded-xl shadow-xl max-h-[90vh] max-w-lg"}`}>
      <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
        <h3 className="font-bold">Generated Receipt</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300">
          <Check className="h-5 w-5" />
        </button>
      </div>
      
      {/* Hide scrollbar by using overflow-hidden or setting exact fits */}
      <div className={`p-4 bg-gray-200 flex justify-center h-full ${inline ? "items-start overflow-auto" : "items-center overflow-auto min-h-[500px]"}`}>
        {/* Scale Wrapper for Preview */}
        <div className={`transform origin-top transition-transform ${inline ? "scale-[0.65] sm:scale-[0.75] md:scale-[0.85] lg:scale-100" : "scale-[0.75] md:scale-90 lg:scale-100 origin-top"} mx-auto flex justify-center`}>
        {/* Receipt Container */}
        <div id="supervisor-receipt-print" className="bg-white shadow-md w-[450px] shrink-0 text-black font-serif relative pb-2 mx-auto" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          
          {/* Header */}
          <div className="text-center text-white bg-zinc-800 pb-2 pt-4 px-2" style={{ 
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/black-paper.png")',
            backgroundSize: 'cover'
          }}>
            <h1 className="text-6xl font-bold tracking-tight mb-2" style={{ fontFamily: '"Arial Black", Arial, sans-serif', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Wash Hub</h1>
            <p className="text-[12px] tracking-wide font-sans mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>We do your laundry right - all day every day</p>
          </div>
          
          <div className="px-5 py-4">
            <div className="text-center text-[11px] font-sans font-bold mb-4">
              <p>101/C, Galle Road, Mount Lavinia. Tel: 011 3041630, 011 2735490</p>
            </div>
            
            <div className="flex justify-end mb-4 text-xl">
              <span className="mr-4">Bill #</span>
              <span className="font-bold text-3xl tracking-widest font-serif">{billNumber}</span>
            </div>
            
            {/* Top Info */}
            <div className="space-y-4 mb-6">
              <div className="flex">
                <span className="w-36 font-bold text-lg">Customer Name</span>
                <span className="mr-3 text-lg">:</span>
                <span className="border-b-[1.5px] border-dotted border-gray-400 flex-1 flex items-end pb-0.5 font-sans text-sm font-bold text-blue-900">{orderDetails.customer.name}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold text-lg">Contact #</span>
                <span className="mr-3 text-lg">:</span>
                <span className="border-b-[1.5px] border-dotted border-gray-400 flex-1 flex items-end pb-0.5 font-sans text-sm font-bold text-blue-900">{orderDetails.customer.telephone}</span>
              </div>
              <div className="flex mt-1 pt-1">
                <span className="w-36 font-bold text-lg">Date</span>
                <span className="mr-3 text-lg">:</span>
                <span className="border-b-[1.5px] border-dotted border-gray-400 flex-1 flex items-end pb-0.5 font-sans text-sm font-bold text-blue-900">{orderDetails.order_metadata.date}</span>
              </div>
              <div className="flex">
                <span className="w-36 font-bold text-lg">Weight</span>
                <span className="mr-3 text-lg">: Kg</span>
                <span className="border-b-[1.5px] border-dotted border-gray-400 flex-1 flex items-end pb-0.5 font-sans text-sm font-bold text-blue-900">{orderDetails.specs.weight_kg}</span>
              </div>
            </div>
            
            {/* Middle Section (Grid) */}
            <div className="flex mb-6 mt-4 pb-2">
              {/* Left Col */}
              <div className="w-[45%] pr-1 flex flex-col pt-1">
                <div className="font-bold text-xl mb-3 font-serif">Status</div>
                
                <div className="border-[1.5px] border-black text-center mb-4 pb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="border-b-[1.5px] border-black font-bold py-1 text-md bg-gray-100">Delivery Date</div>
                  <div className="pt-2 pb-1 font-sans font-bold text-xl text-blue-900">{orderDetails.order_metadata.delivery_date}</div>
                </div>
                
                <div className="flex flex-col text-sm font-bold mt-2 space-y-4 font-serif italic text-[15px]">
                  <div className="flex justify-between items-center pr-2">
                    <span>Fold</span>
                    <div className="w-5 h-5 border-[1.5px] border-black rounded-sm flex items-center justify-center">
                      {orderDetails.specs.packaging === 'fold' && <span className="text-sm font-sans font-bold not-italic">✓</span>}
                    </div>
                    <span className="ml-1">Hanger</span>
                    <div className="w-5 h-5 border-[1.5px] border-black rounded-sm flex items-center justify-center">
                      {orderDetails.specs.packaging === 'hanger' && <span className="text-sm font-sans font-bold not-italic">✓</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 justify-center pr-4">
                    <span>Hanger Rec</span>
                    <div className="w-5 h-5 border-[1.5px] border-black rounded-sm flex items-center justify-center">
                       {orderDetails.specs.hanger_given_qty > 0 && <span className="text-sm font-sans font-bold not-italic">✓</span>}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Col */}
              <div className="w-[55%] pl-4 flex flex-col space-y-3 justify-start pt-1 relative">
                {/* Vertical Divider line */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] border-l-[1.5px] border-black"></div>
                
                <div className="flex items-center gap-2">
                  <span className="w-12 italic font-bold text-[17px] font-serif">Wash</span>
                  <div className="w-6 h-6 border-[1.5px] border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.wash && <span className="text-lg font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-[17px]">Rs.</span>
                  <div className="flex-1 border-[1.5px] border-black rounded-md h-9 flex items-center justify-end px-2 font-sans text-sm font-bold text-blue-900 bg-white">
                     {orderDetails.billing.wash_amount > 0 ? orderDetails.billing.wash_amount.toFixed(2) : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 italic font-bold text-[17px] font-serif">Dry</span>
                  <div className="w-6 h-6 border-[1.5px] border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.dry && <span className="text-lg font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-[17px]">Rs.</span>
                  <div className="flex-1 border-[1.5px] border-black rounded-md h-9 flex items-center justify-end px-2 font-sans text-sm font-bold text-blue-900 bg-white">
                     {orderDetails.billing.dry_amount > 0 ? orderDetails.billing.dry_amount.toFixed(2) : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 italic font-bold text-[17px] font-serif">Iron</span>
                  <div className="w-6 h-6 border-[1.5px] border-black rounded-sm shrink-0 flex items-center justify-center">
                     {orderDetails.services.iron && <span className="text-lg font-sans font-bold text-black">✓</span>}
                  </div>
                  <span className="italic font-bold font-serif text-[17px]">Rs.</span>
                  <div className="flex-1 border-[1.5px] border-black rounded-md h-9 flex items-center justify-end px-2 font-sans text-sm font-bold text-blue-900 bg-white">
                     {orderDetails.billing.iron_amount > 0 ? orderDetails.billing.iron_amount.toFixed(2) : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-1 bg-black mb-1"></div>
            <div className="w-full h-[1.5px] bg-black mb-5"></div>
            
            {/* Totals Section */}
            <div className="space-y-3 mb-6 pl-2 pr-1">
              <div className="flex items-center">
                <span className="font-bold text-lg text-left tracking-wide font-serif w-48">TOTAL AMOUNT</span>
                <span className="font-bold text-lg w-8 font-serif">Rs.</span>
                <div className="flex-1 border-[1.5px] border-black rounded-md h-10 flex items-center justify-end px-2 font-sans text-lg font-bold text-blue-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  {orderDetails.billing.total_amount.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-lg text-left tracking-wide font-serif w-48">ADVANCE PAID</span>
                <span className="font-bold text-lg w-8 font-serif">Rs.</span>
                <div className="flex-1 border-[1.5px] border-black rounded-md h-10 flex items-center justify-end px-2 font-sans text-lg font-bold text-blue-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  {orderDetails.billing.advance.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-lg text-left tracking-wide font-serif w-48">BALANCE TO BE PAID</span>
                <span className="font-bold text-lg w-8 font-serif">Rs.</span>
                <div className="flex-1 border-[1.5px] border-black rounded-md h-10 flex items-center justify-end px-2 font-sans text-lg font-bold text-blue-900 shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)]">
                  {orderDetails.billing.balance.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-black mb-1"></div>
            <div className="w-full h-[1px] bg-black mb-3"></div>
            
            {/* Footer */}
            <div className="bg-black text-white text-center py-2 text-sm font-bold italic mb-3 tracking-wide font-sans shadow-md">
              Open 7.30 am. to 7.30 pm. 365 Days
            </div>
            
            <div className="w-full h-[3px] bg-black mb-3 mt-1"></div>
            
            <div className="text-[11px] leading-snug space-y-2 pb-2 font-sans font-bold">
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-black mt-1 shrink-0 rounded-sm"></div>
                <span>Please be kind enough to provide your bill at collection</span>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-black mt-1 shrink-0 rounded-sm"></div>
                <span>kindly requsted you to collect the all the items before 30 days from the billing date</span>
              </div>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 bg-black mt-1 shrink-0 rounded-sm"></div>
                <span>We are not responsible for any colorfastness in cloths, please make sure to read the "Care Label" before provide to washing & drying.</span>
              </div>
            </div>
          </div>
          
        </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50"
        >
          Close
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-500"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}
