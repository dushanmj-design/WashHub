import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, RefreshCw, Camera, MessageSquare, Smartphone, Send, Info } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import CameraScanner from './CameraScanner';
import SmsGatewayModal from './SmsGatewayModal';

interface BarcodeScannerProps {
  orders: Order[];
  onScanBarcode: (barcodeId: string) => void;
  isLoading: boolean;
}

export default function BarcodeScanner({ orders, onScanBarcode, isLoading }: BarcodeScannerProps) {
  const [inputBarcode, setInputBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputBarcode.trim()) {
      setShowCamera(true);
      return;
    }
    onScanBarcode(inputBarcode.trim());
    setInputBarcode('');
    
    // Keep focus on input for continuous scanning
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // Filter orders by search or status
  const activeOrders = orders.filter(
    (o) =>
      o.status !== 'delivered' && o.status !== 'completed' &&
      (o.barcode_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_mobile.includes(searchQuery))
  );

  // Pagination logic
  const totalPages = Math.ceil(activeOrders.length / recordsPerPage);
  const paginatedOrders = activeOrders.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Workflow visual configurations
  const workflowStages: Record<string, string[]> = {
    'wash_dry_iron': ['wash', 'dry', 'iron', 'completed'],
    'wash_dry': ['wash', 'dry', 'completed']
  };

  const getStatusStepIndex = (workflow: string, status: OrderStatus): number => {
    const stages = workflowStages[workflow] || [];
    return stages.indexOf(status);
  };

  const statusLabelMap: Record<OrderStatus, string> = {
    pending: 'Intake (In-Progress)',
    wash: 'Wash',
    dry: 'Dry',
    iron: 'Iron',
    completed: 'Completed (Ready)',
    delivered: 'Delivered (Settle)'
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fade-in space-y-6" id="barcode-scanner">
      {showCamera && (
        <CameraScanner 
          onScan={(decoded) => {
            setShowCamera(false);
            onScanBarcode(decoded);
          }} 
          onClose={() => setShowCamera(false)} 
        />
      )}
      
      {/* Block Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-100 text-cyan-700 p-2.5 rounded-xl">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-slate-950">Supervisor QR Scanner & SMS Dispatch</h3>
            <p className="text-xs text-slate-500">Scan laundry sack QR code to complete order and dispatch customer pickup SMS.</p>
          </div>
        </div>

        {/* SMSGo Gateway Status Pill */}
        <button
          onClick={() => setShowSmsModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
          <span>SMS Gateway: Connected (SMSGo.lk)</span>
        </button>
      </div>

      {showSmsModal && (
        <SmsGatewayModal isOpen={showSmsModal} onClose={() => setShowSmsModal(false)} />
      )}

      {/* Info notice about QR scan and automated SMS dispatch */}
      <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-cyan-900">
        <Smartphone className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Automated Customer SMS Dispatch:</strong> When you scan an order QR code, the order is updated to <strong>Ready for Pickup</strong> and an SMS notification is triggered via the <strong>SMSGo Gateway</strong> to the customer's phone number.
        </div>
      </div>

      {/* Interactive Scan Entry */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100" id="scan-terminal">
        <div className="relative flex-1">
          <QrCode className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Scan gun input or paste QR code (e.g. WB-408123)..."
            value={inputBarcode}
            onChange={(e) => setInputBarcode(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-base pl-11 pr-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition font-mono uppercase"
            id="scan-input"
          />
        </div>
        
        {/* Camera Scanner Trigger Button */}
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          className="px-5 py-3 bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          title="Scan using device camera"
        >
          <Camera className="h-4 w-4" />
          <span>Scan Camera</span>
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer w-full sm:w-auto min-h-[50px]"
          id="trigger-scan-btn"
        >
          <span>Submit Scan</span>
        </button>
      </form>

      {/* Orders queue & instant-scan action */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue ({activeOrders.length})</span>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by barcode or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg text-xs pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500 transition"
              id="filter-active-queue"
            />
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-sm" id="empty-queue-alert">
            ⚡ All laundry baskets are checked-out or no active matches found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedOrders.map((order) => {
              const currentStages = workflowStages[order.workflow] || [];
              const currentIndex = getStatusStepIndex(order.workflow, order.status);
              const isCompleted = order.status === 'completed';

              return (
                <div 
                  key={order.id} 
                  className={`border rounded-xl p-4 transition-all hover:border-slate-300 bg-white ${
                    isCompleted ? 'border-emerald-100 shadow-emerald-500/5' : 'border-slate-100'
                  }`}
                  id={`queue-card-${order.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {order.barcode_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 font-mono">
                          {order.workflow === 'wash_dry_iron' ? 'Wash > Dry > Iron' : 'Wash > Dry'}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {order.customer_name} <span className="font-mono text-xs font-normal text-slate-500">({order.customer_mobile})</span>
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        Weight: <strong className="text-slate-600 font-mono">{order.weight} kg</strong>
                        {order.pieces && <> | Pieces: <strong className="text-slate-600 font-mono">{order.pieces} pcs</strong></>}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      
                      {/* Interactive scan trigger */}
                      <button
                        onClick={() => onScanBarcode(order.barcode_id)}
                        disabled={isLoading || isCompleted}
                        className={`text-xs px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-cyan-700 text-white hover:bg-cyan-800 shadow-sm'
                        }`}
                        id={`simulate-scan-${order.id}`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Ready & SMS Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Scan & Send SMS</span>
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                  {/* Flow Steps Visualizer */}
                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <div className="flex items-center justify-between gap-1 w-full relative">
                      {currentStages.map((stage, idx) => {
                        const isPassed = idx <= currentIndex;
                        const isActive = idx === currentIndex;
                        return (
                          <React.Fragment key={stage}>
                            <div className="flex flex-col items-center flex-1 z-10">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] border transition-all ${
                                isActive 
                                  ? 'bg-cyan-600 text-white border-cyan-600 ring-4 ring-cyan-100' 
                                  : isPassed 
                                    ? 'bg-emerald-500 text-white border-emerald-500' 
                                    : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}>
                                {isPassed && !isActive ? '✓' : idx + 1}
                              </div>
                              <span className={`text-[10px] font-medium mt-1 ${
                                isActive 
                                  ? 'text-cyan-700 font-bold' 
                                  : isPassed 
                                    ? 'text-slate-700' 
                                    : 'text-slate-400'
                              }`}>
                                {statusLabelMap[stage as OrderStatus]}
                              </span>
                            </div>
                            {idx < currentStages.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-2 -translate-y-3 z-0 transition-all ${
                                idx < currentIndex ? 'bg-emerald-400' : 'bg-slate-100'
                              }`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
            <span className="text-xs text-slate-500 font-medium">
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, activeOrders.length)} of {activeOrders.length} records
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
