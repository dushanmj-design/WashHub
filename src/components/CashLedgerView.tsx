import React, { useState } from 'react';
import { Coins, Plus, TrendingDown, ArrowDownLeft, ArrowUpRight, DollarSign, Delete, Sparkles, Coffee, Box, ShieldAlert } from 'lucide-react';
import { CashLedger, TransactionType } from '../types';
import { PaginatedList } from './PaginatedList';

interface CashLedgerViewProps {
  ledger: CashLedger[];
  onAddTransaction: (data: { amount: number; transaction_type: TransactionType; note: string }) => void;
  isLoading: boolean;
}

const COMMON_NOTE_PRESETS = [
  { label: 'Laundry Powder Purchase', icon: Box },
  { label: 'Shift Close Register Settle', icon: Coins },
  { label: 'Staff Tea/Refreshments', icon: Coffee },
  { label: 'Petty Cash Replenish', icon: Sparkles },
];

export default function CashLedgerView({ ledger, onAddTransaction, isLoading }: CashLedgerViewProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('OUT');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Audit totals calculation in Sri Lankan Rupees
  const totalIn = ledger
    .filter(tx => tx.transaction_type === 'IN')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalOut = ledger
    .filter(tx => tx.transaction_type === 'OUT')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const runningBalance = totalIn - totalOut;

  // Numpad input handler
  const handleNumpadPress = (value: string) => {
    setError('');
    let currentVal = amount;

    if (value === 'clear') {
      currentVal = '';
    } else if (value === 'back') {
      currentVal = currentVal.slice(0, -1);
    } else {
      if (value === '.' && currentVal.includes('.')) return;
      currentVal += value;
    }

    setAmount(currentVal);
  };

  // Quick increments
  const injectCash = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + value).toString());
  };

  const selectNotePreset = (presetText: string) => {
    setNote(presetText);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Amount must be a positive Rupee (LKR) value.');
      return;
    }

    if (!note.trim()) {
      setError('Please select or write a specific description note for audit logs.');
      return;
    }

    onAddTransaction({
      amount: numericAmount,
      transaction_type: type,
      note: note.trim()
    });

    setAmount('');
    setNote('');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-md animate-fade-in space-y-6" id="cash-ledger-view">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-150 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-950">Cash Drawer Ledger</h3>
            <p className="text-xs text-slate-500">Record cashier shifts, manual expenses, payouts, and cash drawer reconciliations.</p>
          </div>
        </div>

        {/* Floating balance indicator */}
        <div className="bg-slate-950 text-white px-5 py-3 rounded-xl text-center shadow-md min-w-[150px]">
          <span className="text-[9px] text-slate-400 block uppercase font-mono tracking-widest font-bold">POS Drawer Balance</span>
          <span className="font-mono text-base sm:text-lg font-black text-emerald-400">
            Rs. {runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Grid: Entry form + History list */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left: Touch Parameters and Presets (7 cols) */}
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Add Ledger Transaction
            </h4>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 font-medium animate-fade-in">
                ⚠️ {error}
              </p>
            )}

            {/* Direction Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Transaction Direction</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'OUT'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-4 ring-rose-500/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  id="tx-type-out"
                >
                  <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                  <span>Cash Out (Expense)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`py-3.5 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    type === 'IN'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-4 ring-emerald-500/10'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                  id="tx-type-in"
                >
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  <span>Cash In (Deposit)</span>
                </button>
              </div>
            </div>

            {/* Input Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Transaction Amount (Rs.)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  placeholder="0"
                  value={amount}
                  readOnly
                  className="w-full bg-white border border-slate-200 rounded-xl text-base px-3.5 py-3 font-mono outline-none cursor-default font-bold ring-2 ring-cyan-500/10 focus:border-cyan-500"
                  id="tx-amount"
                  required
                />
                <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold uppercase font-mono">LKR</span>
              </div>

              {/* Quick Preset notes increments */}
              <div className="flex gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => injectCash(100)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => injectCash(500)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +500
                </button>
                <button
                  type="button"
                  onClick={() => injectCash(1000)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +1000
                </button>
                <button
                  type="button"
                  onClick={() => injectCash(5000)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  +5000
                </button>
              </div>
            </div>

            {/* Note entry & Preset triggers */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Description / Audit Note</label>
              <input
                type="text"
                placeholder="Write custom audit detail here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl text-sm px-3.5 py-3 outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                id="tx-note"
                required
              />

              {/* Preset Note chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Quick Preset Logs</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {COMMON_NOTE_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => selectNotePreset(preset.label)}
                        className={`py-2 px-3 bg-white border text-[11px] font-bold rounded-lg transition text-left flex items-center gap-1.5 cursor-pointer ${
                          note === preset.label
                            ? 'border-cyan-600 bg-cyan-50/10 text-cyan-800'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right: Virtual Numpad & Submit buttons (5 cols) */}
        <div className="xl:col-span-5 flex flex-col justify-between bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4" id="ledger-keypad">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 font-bold block">Touch keyboard</span>
              <h5 className="text-sm font-bold text-slate-200">Amount Input</h5>
            </div>
            
            <div className="text-right font-mono text-cyan-300 font-bold text-base bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[100px]">
              Rs. {amount || '0'}
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

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md flex justify-center items-center gap-1.5 cursor-pointer active:scale-95 mt-2"
            id="submit-ledger-btn-touch"
          >
            <span>{isLoading ? 'Posting Ledger Transaction...' : 'Post Cash Transaction'}</span>
          </button>
        </div>

      </div>

      {/* History List */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingDown className="h-4 w-4" />
          Shift Transaction Audit Ledger
        </h4>

        {ledger.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs">
            📂 No ledger movements registered for this tenant.
          </div>
        ) : (
          <PaginatedList<CashLedger>
            items={ledger}
            itemsPerPage={10}
            sortByDateDesc={(tx) => tx.created_at}
            listClassName="space-y-2"
            renderItem={(tx) => {
              const isIn = tx.transaction_type === 'IN';
              return (
                <div 
                  key={tx.id} 
                  className="bg-white border border-slate-150 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:shadow-sm transition"
                  id={`ledger-card-${tx.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      isIn 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isIn ? <ArrowUpRight className="h-4.5 w-4.5" /> : <ArrowDownLeft className="h-4.5 w-4.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{tx.note}</p>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                        {new Date(tx.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs font-bold">
                    <span className={isIn ? 'text-emerald-600' : 'text-rose-600'}>
                      {isIn ? '+' : '-'}Rs. {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
