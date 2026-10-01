import React, { useState } from 'react';
import { QrCode, CheckCircle2, RefreshCw, MessageSquare, Smartphone, Send, Info } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import SmsGatewayModal from './SmsGatewayModal';

interface BarcodeScannerProps {
  orders: Order[];
  onScanBarcode: (barcodeId: string) => void;
  isLoading: boolean;
}

export default function BarcodeScanner({ orders, onScanBarcode, isLoading }: BarcodeScannerProps) {
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Filter orders by active status
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'completed'
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
      {/* Bluetooth Scanner Status Indicator */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Bluetooth Handheld Scanner Listening</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pull the trigger on your Bluetooth barcode gun anywhere. Order is marked ready and customer pickup SMS is dispatched instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Orders queue & instant-scan action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue ({activeOrders.length})</span>
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
