import React, { useState } from 'react';
import { Receipt, CheckSquare, Coins, AlertTriangle, ShieldAlert, Smile, Delete, Sparkles } from 'lucide-react';
import { Order } from '../types';
import { PaginatedList } from './PaginatedList';

interface BillingCheckoutProps {
  orders: Order[];
  onCloseOrder: (orderId: string, finalAmount: number, receivedCash: number) => void;
  onScanReady?: (barcode: string) => Promise<void>;
  isLoading: boolean;
}

type SettleFieldName = 'finalAmount' | 'receivedCash';

export default function BillingCheckout({ orders, onCloseOrder, onScanReady, isLoading }: BillingCheckoutProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [receivedCash, setReceivedCash] = useState('');
  const [activeField, setActiveField] = useState<SettleFieldName>('finalAmount');
  const [error, setError] = useState('');

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


  // Only completed orders can be checked out
  const readyOrders = orders.filter((o) => o.status === 'completed');

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setFinalAmount(order.estimated_amount.toString());
    setReceivedCash(order.estimated_amount.toString());
    setActiveField('receivedCash'); // Typically, they want to type received cash next
    setError('');
  };

  // Virtual Keypad entry handler
  const handleNumpadPress = (value: string) => {
    setError('');
    let currentVal = activeField === 'finalAmount' ? finalAmount : receivedCash;

    if (value === 'clear') {
      currentVal = '';
    } else if (value === 'back') {
      currentVal = currentVal.slice(0, -1);
    } else {
      if (value === '.' && currentVal.includes('.')) return;
      currentVal += value;
    }

    if (activeField === 'finalAmount') {
      setFinalAmount(currentVal);
    } else {
      setReceivedCash(currentVal);
    }
  };

  // Preset Cash Injections (LKR Denominations)
  const injectCashDenomination = (amount: number) => {
    const current = parseFloat(receivedCash) || 0;
    setReceivedCash((current + amount).toString());
    setActiveField('receivedCash');
  };

  const setExactAmount = () => {
    setReceivedCash(finalAmount);
    setActiveField('receivedCash');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOrder) return;

    const numericFinal = parseFloat(finalAmount);
    const numericCash = parseFloat(receivedCash);

    if (isNaN(numericFinal) || numericFinal <= 0) {
      setError('Final invoice amount must be a positive Rupee value.');
      return;
    }

    if (isNaN(numericCash) || numericCash < numericFinal) {
      setError('Cash received must cover or exceed the final invoice amount.');
      return;
    }

    onCloseOrder(selectedOrder.id, numericFinal, numericCash);
    setSelectedOrder(null);
  };

  // Calculate live change
  const changeDue = selectedOrder && receivedCash && finalAmount
    ? Math.max(0, parseFloat(receivedCash) - parseFloat(finalAmount))
    : 0;

  // Check if discrepancy would trigger (>5% difference)
  const isDiscrepancyWarning = selectedOrder && finalAmount
    ? Math.abs(parseFloat(finalAmount) - selectedOrder.estimated_amount) > (selectedOrder.estimated_amount * 0.05)
    : false;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-md animate-fade-in space-y-6" id="billing-checkout">
      
      {/* Block Header */}
      <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
        <div className="bg-cyan-100 text-cyan-700 p-2.5 rounded-xl">
          <Receipt className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-slate-950">Billing & Checkout Desk</h3>
          <p className="text-xs text-slate-500">Deliver finished laundry bags, accept LKR cash payments, and audit estimates.</p>
        </div>
      </div>

      
      {onScanReady && (
          <form onSubmit={handleScanSubmit} className="mb-6 p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex gap-3 shadow-sm">
            <input 
              type="text" 
              autoFocus 
              value={scanInput} 
              onChange={e => setScanInput(e.target.value)} 
              placeholder="Scan Vendor QR (Barcode) here to mark as Ready for Pickup..." 
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm shadow-sm" 
            />
            <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition shadow">
              Mark Ready & SMS
            </button>
          </form>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        
        {/* Left Side: Orders Picker Rack & Invoice Parameters */}
        <div className="xl:col-span-7 space-y-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Completed Laundry Bags Ready for Pickup ({readyOrders.length})
          </span>
          
          {readyOrders.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl text-sm bg-slate-50/50" id="empty-completed-alert">
              😊 Excellent! No finished laundry bags currently waiting in the pickup racks.
            </div>
          ) : (
            <PaginatedList<Order>
              items={readyOrders}
              itemsPerPage={10}
              sortByDateDesc={(o) => o.created_at}
              listClassName="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              renderItem={(order) => (
                <div 
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  className={`border-2 rounded-xl p-4 transition-all cursor-pointer hover:shadow-sm ${
                    selectedOrder?.id === order.id
                      ? 'border-cyan-600 bg-cyan-50/30'
                      : 'border-slate-150 bg-slate-50/20 hover:border-slate-300'
                  }`}
                  id={`checkout-card-${order.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded border border-emerald-200">
                        {order.barcode_id}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Smile className="h-3.5 w-3.5" /> Ready
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-850 truncate">{order.customer_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{order.customer_mobile}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Est. Bill (LKR):</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        Rs. {order.estimated_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            />
          )}
          {/* Settle Panel (visible if selected) */}
          {selectedOrder && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Settle Selected Order
              </h4>
              
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">ID: {selectedOrder.barcode_id}</span>
                  <span className="font-mono text-cyan-700 font-bold">Workflow: {selectedOrder.workflow === 'wash_dry_iron' ? 'Wash, Dry, Iron' : 'Wash, Dry'}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-600">
                  <span>Customer: <strong>{selectedOrder.customer_name}</strong></span>
                  <span>Intake Estimate: <strong className="font-mono text-slate-900">Rs. {selectedOrder.estimated_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Final Surcharged Invoice amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Final Invoice Amount (Rs.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={finalAmount}
                      onFocus={() => setActiveField('finalAmount')}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 outline-none font-mono transition-all ${
                        activeField === 'finalAmount'
                          ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                          : 'border-slate-200'
                      }`}
                      id="final-billing-amount"
                      required
                    />
                  </div>
                </div>

                {/* Cash received */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Received Cash (Rs.)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={receivedCash}
                      onFocus={() => setActiveField('receivedCash')}
                      onChange={(e) => setReceivedCash(e.target.value)}
                      className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 outline-none font-mono transition-all ${
                        activeField === 'receivedCash'
                          ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                          : 'border-slate-200'
                      }`}
                      id="received-cash"
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Quick Cash helpers */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={setExactAmount}
                  className="px-3 py-1.5 bg-cyan-100 text-cyan-800 hover:bg-cyan-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Exact Amount</span>
                </button>
                <button
                  type="button"
                  onClick={() => injectCashDenomination(100)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => injectCashDenomination(500)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => injectCashDenomination(1000)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +1000
                </button>
                <button
                  type="button"
                  onClick={() => injectCashDenomination(5000)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +5000
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Right Side: Virtual Numpad & Change Drawer (visible if order selected) */}
        <div className="xl:col-span-5 flex flex-col justify-between bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4" id="checkout-sidebar">
          
          {!selectedOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12 px-4 space-y-3">
              <CheckSquare className="h-12 w-12 text-slate-700 animate-pulse" />
              <p className="text-sm font-bold">Billing Settle Active</p>
              <p className="text-xs max-w-xs text-slate-500">
                Tap on an active finished laundry card on the left to activate this settlement terminal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4" id="billing-form">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">Touch billing</span>
                  <h5 className="text-sm font-bold text-slate-200">
                    Active: <span className="text-white font-mono">{activeField === 'finalAmount' ? 'Final invoice' : 'Received cash'}</span>
                  </h5>
                </div>
                
                {/* Highlighted current value preview */}
                <div className="text-right font-mono text-cyan-300 font-bold text-base bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[100px]">
                  Rs. {activeField === 'finalAmount' ? (finalAmount || '0') : (receivedCash || '0')}
                </div>
              </div>

              {/* Keypad Grid */}
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadPress(num)}
                    className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 text-white font-mono text-lg font-bold rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    {num}
                  </button>
                ))}

                {/* Decimal point */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('.')}
                  className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 text-white font-mono text-lg font-bold rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  .
                </button>

                {/* Zero */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 text-white font-mono text-lg font-bold rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  0
                </button>

                {/* Double Zero */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('00')}
                  className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 text-white font-mono text-lg font-bold rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  00
                </button>

                {/* Clear All */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('clear')}
                  className="col-span-1 h-12 bg-rose-950 text-rose-200 text-xs font-bold rounded-xl transition flex items-center justify-center cursor-pointer active:scale-95"
                >
                  CLEAR
                </button>

                {/* Backspace */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('back')}
                  className="col-span-2 h-12 bg-amber-955 hover:bg-amber-900 text-amber-200 font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                >
                  <Delete className="h-4.5 w-4.5" />
                  <span className="text-[10px] uppercase">Backspace</span>
                </button>
              </div>

              {/* Cyclic Field toggler */}
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <button
                  type="button"
                  onClick={() => setActiveField('finalAmount')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    activeField === 'finalAmount'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Final Bill
                </button>
                <button
                  type="button"
                  onClick={() => setActiveField('receivedCash')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    activeField === 'receivedCash'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  Cash Received
                </button>
              </div>

              {/* Settle Change Ledger Indicator */}
              <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-500 uppercase">Change Due (LKR):</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    Rs. {changeDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Discrepancy warning indicator */}
              {isDiscrepancyWarning && (
                <div className="bg-amber-950/40 text-amber-300 border border-amber-900 text-[10px] p-3 rounded-xl flex gap-2 leading-tight">
                  <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
                  <p>
                    <strong>Estimate discrepancy (&gt;5%):</strong> Settle will trigger an automatic Supervisor Audit Flag.
                  </p>
                </div>
              )}

              {/* Deliver laundry trigger */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md flex justify-center items-center gap-1.5 cursor-pointer active:scale-95"
                id="deliver-laundry-btn"
              >
                <span>{isLoading ? 'Settling Payment...' : 'Deliver Laundry & Close Shift'}</span>
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
