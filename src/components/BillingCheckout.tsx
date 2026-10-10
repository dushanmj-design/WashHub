import React, { useState } from 'react';
import { Receipt, CheckSquare, Coins, AlertTriangle, ShieldAlert, Smile, Delete, Sparkles, Calendar, RotateCcw } from 'lucide-react';
import { Order } from '../types';
import { PaginatedList } from './PaginatedList';

interface BillingCheckoutProps {
  orders: Order[];
  onCloseOrder: (orderId: string, finalAmount: number, receivedCash: number) => void;
  isLoading: boolean;
}

type SettleFieldName = 'finalAmount' | 'receivedCash';

export default function BillingCheckout({ orders, onCloseOrder, isLoading }: BillingCheckoutProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [receivedCash, setReceivedCash] = useState('');
  const [activeField, setActiveField] = useState<SettleFieldName>('finalAmount');
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ready' | 'all' | 'delivered'>('ready');

  const getOrderTimestamp = (o: Order): number => {
    if (!o) return 0;
    if (o.created_at) {
      const t = new Date(o.created_at).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if ((o as any).in_date) {
      const t = new Date((o as any).in_date).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (o.id && typeof o.id === 'string' && o.id.startsWith('o-')) {
      const num = parseInt(o.id.replace('o-', ''), 10);
      if (!isNaN(num)) return num;
    }
    return 0;
  };

  const getOrderDateStr = (o: Order): string => {
    if (!o) return '';
    if (o.created_at) {
      try {
        const d = new Date(o.created_at);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {}
      if (typeof o.created_at === 'string' && o.created_at.length >= 10) {
        return o.created_at.slice(0, 10);
      }
    }
    if ((o as any).in_date) {
      try {
        const d = new Date((o as any).in_date);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {}
    }
    return '';
  };

  // Filter orders by date range and status, strictly sorted with latest order at the top
  const readyOrders = orders
    .filter((o) => {
      if (statusFilter === 'ready' && o.status !== 'completed') return false;
      if (statusFilter === 'delivered' && o.status !== 'delivered') return false;
      const orderDateStr = getOrderDateStr(o);
      if (startDate && orderDateStr && orderDateStr < startDate) return false;
      if (endDate && orderDateStr && orderDateStr > endDate) return false;
      return true;
    })
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

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


      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        
        {/* Left Side: Orders Picker Rack & Invoice Parameters */}
        <div className="xl:col-span-7 space-y-4">
          {/* Header & Date Range Filter Bar */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-cyan-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {statusFilter === 'ready' ? 'Ready Bags' : statusFilter === 'delivered' ? 'Delivered Bags' : 'All Bags'} ({readyOrders.length})
                </span>
                <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                  Latest first
                </span>
              </div>

              {/* Status & Quick Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ready')}
                    className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                      statusFilter === 'ready' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ready Bags
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                      statusFilter === 'all' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('delivered')}
                    className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                      statusFilter === 'delivered' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Delivered
                  </button>
                </div>

                {/* Quick Today selector */}
                <button
                  type="button"
                  onClick={() => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    setStartDate(todayStr);
                    setEndDate(todayStr);
                  }}
                  className="text-[11px] font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Start and End Date Inputs */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/70">
              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-medium text-slate-800 bg-transparent outline-none cursor-pointer"
                  id="checkout-start-date"
                  aria-label="Filter from start date"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-medium text-slate-800 bg-transparent outline-none cursor-pointer"
                  id="checkout-end-date"
                  aria-label="Filter to end date"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition cursor-pointer shadow-2xs"
                  title="Clear date filter"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear Filter</span>
                </button>
              )}
            </div>
          </div>
          
          {readyOrders.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl text-sm bg-slate-50/50" id="empty-completed-alert">
              😊 Excellent! No finished laundry bags currently waiting in the pickup racks.
            </div>
          ) : (
            <PaginatedList<Order>
              items={readyOrders}
              itemsPerPage={10}
              sortByDateDesc={(o) => o.created_at || (o as any).in_date}
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
                        {order.barcode_id ? order.barcode_id.replace(/^WB-?/i, '') : order.id}
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
                  <span className="text-slate-500 font-bold">ID: {selectedOrder.barcode_id ? selectedOrder.barcode_id.replace(/^WB-?/i, '') : selectedOrder.id}</span>
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
                  <div 
                    onClick={() => setActiveField('finalAmount')}
                    className={`w-full bg-white border rounded-xl text-base px-3.5 py-2.5 outline-none font-mono transition-all cursor-pointer flex items-center justify-between select-none ${
                      activeField === 'finalAmount'
                        ? 'border-cyan-600 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/20 text-cyan-950'
                        : 'border-slate-200 text-slate-900 hover:border-slate-300'
                    }`}
                    id="final-billing-amount-touch"
                  >
                    <span className="text-base font-bold">Rs. {finalAmount || '0'}</span>
                    {activeField === 'finalAmount' && (
                      <span className="text-[10px] uppercase font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">Active</span>
                    )}
                  </div>
                </div>

                {/* Cash received */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Received Cash (Rs.)
                  </label>
                  <div 
                    onClick={() => setActiveField('receivedCash')}
                    className={`w-full bg-white border rounded-xl text-base px-3.5 py-2.5 outline-none font-mono transition-all cursor-pointer flex items-center justify-between select-none ${
                      activeField === 'receivedCash'
                        ? 'border-cyan-600 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/20 text-cyan-950'
                        : 'border-slate-200 text-slate-900 hover:border-slate-300'
                    }`}
                    id="received-cash-touch"
                  >
                    <span className="text-base font-bold">Rs. {receivedCash || '0'}</span>
                    {activeField === 'receivedCash' && (
                      <span className="text-[10px] uppercase font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">Active</span>
                    )}
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
            <form 
              onSubmit={handleCheckoutSubmit} 
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="space-y-4" 
              id="billing-form"
            >
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
