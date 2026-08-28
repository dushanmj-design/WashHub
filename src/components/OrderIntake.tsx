import React, { useState, useEffect } from 'react';
import { PlusCircle, Scale, Layers, Smartphone, User, DollarSign, Printer, Delete, ArrowUp, ArrowDown } from 'lucide-react';
import { WorkflowType } from '../types';
import { apiFetch } from '../lib/offlineSync';

interface OrderIntakeProps {
  onSubmit: (orderData: {
    customer_mobile: string;
    customer_name: string;
    workflow: WorkflowType;
    weight: number;
    pieces?: number;
    rate_per_kg: number;
    ironing_rate_per_piece?: number;
  }) => void;
  isLoading: boolean;
  activeTenantId?: string;
  activeRole?: string;
}

type ActiveFieldName = 'mobile' | 'name' | 'weight' | 'pieces' | 'ratePerKg' | 'ironingRate';

export default function OrderIntake({ onSubmit, isLoading, activeTenantId, activeRole }: OrderIntakeProps) {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [workflow, setWorkflow] = useState<WorkflowType>('wash_dry_iron');
  const [weight, setWeight] = useState('');
  const adjustWeight = (delta: number) => {
    const current = parseFloat(weight) || 0;
    const next = Math.max(0, current + delta);
    setWeight(next.toFixed(1));
  };
  const [pieces, setPieces] = useState('');
  const adjustPieces = (delta: number) => {
    const current = parseInt(pieces, 10) || 0;
    const next = Math.max(0, current + delta);
    setPieces(next.toString());
  };
  const [ratePerKg, setRatePerKg] = useState('300.00'); // Standard Sri Lankan Rupees rate per kg
  const [ironingRate, setIroningRate] = useState('100.00');

  const [activeField, setActiveField] = useState<ActiveFieldName>('mobile');
  const [isShift, setIsShift] = useState(true);
  const [error, setError] = useState('');

  // Auto calculated estimation in LKR
  const calculatedEstimate = (weight ? parseFloat(weight) * parseFloat(ratePerKg) : 0) + (workflow === 'wash_dry_iron' && pieces ? parseInt(pieces, 10) * parseFloat(ironingRate) : 0);

  // Sync pieces visibility and default rates based on workflow
  useEffect(() => {
    if (workflow === 'wash_dry') {
      setPieces('');
      setRatePerKg('200.00'); // Default for Wash & Dry
    } else {
      setRatePerKg('300.00'); // Default for Wash, Dry & Iron
    }
  }, [workflow]);

  // Lookup customer by mobile number
  useEffect(() => {
    if (mobile.length >= 9 && activeTenantId) {
      const fetchCustomer = async () => {
        try {
          const res = await apiFetch(`/api/customers/lookup/${encodeURIComponent(mobile)}`, {
            headers: {
              'x-tenant-id': activeTenantId,
              'x-user-role': activeRole || 'user',
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.name) {
              setName(data.name);
            }
          }
        } catch (err) {
          console.log('Customer lookup failed or offline');
        }
      };
      // Debounce slightly to avoid rapid fetch while typing
      const timeoutId = setTimeout(fetchCustomer, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [mobile, activeTenantId, activeRole]);

  // Virtual Numpad Action Handler
  const setRatePreset = (rate: number) => {
    setRatePerKg(rate.toFixed(2));
    setActiveField('ratePerKg');
  };


  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile.trim() || !name.trim() || !weight.trim()) {
      setError('Please fill in all mandatory customer and cycle parameters.');
      return;
    }

    const numericWeight = parseFloat(weight);
    if (isNaN(numericWeight) || numericWeight <= 0) {
      setError('Weight must be a positive number of kilograms.');
      return;
    }

    let piecesCount: number | undefined = undefined;
    if (workflow === 'wash_dry_iron') {
      piecesCount = parseInt(pieces, 10);
      if (isNaN(piecesCount) || piecesCount <= 0) {
        setError('Number of pieces is mandatory when including ironing services.');
        return;
      }
    }

    onSubmit({
      customer_mobile: mobile.trim(),
      customer_name: name.trim(),
      workflow,
      weight: numericWeight,
      pieces: piecesCount,
      rate_per_kg: parseFloat(ratePerKg),
      ironing_rate_per_piece: workflow === 'wash_dry_iron' ? parseFloat(ironingRate) : undefined
    });

    // Reset some states for next entry
    setMobile('');
    setName('');
    setWeight('');
    setPieces('');
    setActiveField('mobile');
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-md animate-fade-in space-y-6" id="order-intake">
      
      {/* Block Header */}
      <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
        <div className="bg-cyan-100 text-cyan-700 p-2.5 rounded-xl">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-slate-950">New Order Intake (POS Console)</h3>
          <p className="text-xs text-slate-500">Optimized for high-throughput touch-screen tablet operations.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-4 py-3 rounded-xl font-medium animate-fade-in">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="intake-form">
        
        {/* Left Side: Parameters Form */}
        <div className={`xl:col-span-12 space-y-5 transition-all duration-300`}>
          
          {/* 1. Customer Info */}
          <div className="bg-slate-50/60 p-4 rounded-xl space-y-4 border border-slate-100 relative">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Customer Details</h4>
              <span className="text-[10px] text-cyan-600 font-mono font-bold bg-cyan-50 px-2 py-0.5 rounded">LKR Currency Mode</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g., 0771234567"
                    value={mobile}
                    onFocus={() => { setActiveField('mobile');  }}
                    onChange={(e) => setMobile(e.target.value)}
                    className={`w-full bg-white border rounded-xl text-base px-3.5 py-3 font-mono outline-none transition-all ${
                      activeField === 'mobile'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    }`}
                    id="customer-mobile"
                    required
                  />
                  {activeField === 'mobile' && (
                    <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>
              </div>

              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Customer Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Kamalsiri Perera"
                    value={name}
                    onFocus={() => { setActiveField('name');  }}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full bg-white border rounded-xl text-base px-3.5 py-3 outline-none transition-all ${
                      activeField === 'name'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    }`}
                    id="customer-name"
                    required
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 2. Service Cycle (Workflow) */}
          <div className="bg-slate-50/60 p-4 rounded-xl space-y-3.5 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Select Cycle Path</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Workflow 1 */}
              <button
                type="button"
                onClick={() => setWorkflow('wash_dry_iron')}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between min-h-[110px] cursor-pointer ${
                  workflow === 'wash_dry_iron'
                    ? 'border-cyan-600 bg-cyan-50/30 text-cyan-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
                id="opt-wash-dry-iron"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold">Comprehensive Cycle</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full font-bold">OPTION 1</span>
                </div>
                <p className="text-xs mt-1.5 font-bold text-slate-700">Wash ➔ Dry ➔ Ironing</p>
                <span className="text-[10px] text-slate-400 mt-2 block">Requires Weight & Pieces count</span>
              </button>

              {/* Workflow 2 */}
              <button
                type="button"
                onClick={() => setWorkflow('wash_dry')}
                className={`p-4 text-left rounded-xl border-2 transition-all flex flex-col justify-between min-h-[110px] cursor-pointer ${
                  workflow === 'wash_dry'
                    ? 'border-cyan-600 bg-cyan-50/30 text-cyan-900 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
                id="opt-wash-dry"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-bold">Standard Dry Cycle</span>
                  <span className="text-[9px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold">OPTION 2</span>
                </div>
                <p className="text-xs mt-1.5 font-bold text-slate-700">Wash ➔ Dry Only</p>
                <span className="text-[10px] text-slate-400 mt-2 block">Requires Weight metric only</span>
              </button>

            </div>
          </div>

          {/* 3. Weights & Garments Measures */}
          <div className="bg-slate-50/60 p-4 rounded-xl space-y-4 border border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Quantity & Scaling Metrics</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Weight with Increments */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5 text-slate-400" />
                  Weight (kg) <span className="text-rose-500">*</span>
                </label>
                
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={weight}
                    onFocus={() => { setActiveField('weight');  }}
                    onChange={(e) => setWeight(e.target.value)}
                    className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 font-mono outline-none transition-all ${
                      activeField === 'weight'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    }`}
                    id="garment-weight"
                    required
                  />
                  {activeField === 'weight' && (
                    <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>

                {/* Touch Increments */}
                <div className="flex gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => adjustWeight(-0.5)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition flex items-center justify-center"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWeight(0.5)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition flex items-center justify-center"
                  >
                    +0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWeight(1.0)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition flex items-center justify-center"
                  >
                    +1.0
                  </button>
                </div>
              </div>

              {/* Pieces with Increments */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center gap-1 ${
                  workflow === 'wash_dry_iron' ? 'text-slate-700' : 'text-slate-350'
                }`}>
                  <Layers className="h-3.5 w-3.5" />
                  Garment Pieces {workflow === 'wash_dry_iron' && <span className="text-rose-500">*</span>}
                </label>
                
                <div className="relative">
                  <input
                    type="number"
                    placeholder={workflow === 'wash_dry_iron' ? '0' : 'Disabled'}
                    value={pieces}
                    disabled={workflow !== 'wash_dry_iron'}
                    onFocus={() => {
                      if (workflow === 'wash_dry_iron') {
                        setActiveField('pieces');
                        
                      }
                    }}
                    onChange={(e) => setPieces(e.target.value)}
                    className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 font-mono outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400 ${
                      activeField === 'pieces' && workflow === 'wash_dry_iron'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    }`}
                    id="garment-pieces"
                  />
                  {activeField === 'pieces' && workflow === 'wash_dry_iron' && (
                    <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>

                {/* Touch Increments */}
                <div className="flex gap-1 mt-1.5">
                  <button
                    type="button"
                    disabled={workflow !== 'wash_dry_iron'}
                    onClick={() => adjustPieces(-1)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    disabled={workflow !== 'wash_dry_iron'}
                    onClick={() => adjustPieces(1)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    disabled={workflow !== 'wash_dry_iron'}
                    onClick={() => adjustPieces(5)}
                    className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg text-xs font-bold transition disabled:opacity-40"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Rate Per KG */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">LKR</span>
                  Rate per kg (Rs.)
                </label>
                
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={ratePerKg}
                    readOnly={activeRole === 'user'}
                    onFocus={() => { 
                      if (activeRole !== 'user') {
                        setActiveField('ratePerKg'); 
                         
                      }
                    }}
                    onChange={(e) => {
                      if (activeRole !== 'user') setRatePerKg(e.target.value);
                    }}
                    className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 font-mono outline-none transition-all ${
                      activeField === 'ratePerKg' && activeRole !== 'user'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    } ${activeRole === 'user' ? 'opacity-70 bg-slate-50 cursor-not-allowed' : ''}`}
                    id="pricing-rate"
                    required
                  />
                  {activeField === 'ratePerKg' && (
                    <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>

                {/* Quick Presets */}
                {activeRole !== 'user' && (
                  <div className="flex gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setRatePreset(200)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50 rounded-lg font-bold transition"
                    >
                      200
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatePreset(250)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50 rounded-lg font-bold transition"
                    >
                      250
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatePreset(300)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50 rounded-lg font-bold transition"
                    >
                      300
                    </button>
                    <button
                      type="button"
                      onClick={() => setRatePreset(400)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-600 hover:bg-slate-50 rounded-lg font-bold transition"
                    >
                      400
                    </button>
                  </div>
                )}
              </div>
              {/* Ironing Rate */}
              {workflow === 'wash_dry_iron' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.5 rounded text-slate-600">LKR</span>
                  Ironing Rate/Piece
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    value={ironingRate}
                    readOnly={activeRole === 'user'}
                    onFocus={() => { 
                      if (activeRole !== 'user') setActiveField('ironingRate'); 
                    }}
                    onChange={(e) => {
                      if (activeRole !== 'user') setIroningRate(e.target.value);
                    }}
                    className={`w-full bg-white border rounded-xl text-base px-3 py-2.5 font-mono outline-none transition-all ${
                      activeField === 'ironingRate' && activeRole !== 'user'
                        ? 'border-cyan-500 ring-4 ring-cyan-500/10 font-bold bg-cyan-50/10'
                        : 'border-slate-200'
                    } ${activeRole === 'user' ? 'opacity-70 bg-slate-50 cursor-not-allowed' : ''}`}
                  />
                  {activeField === 'ironingRate' && (
                    <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-cyan-500 animate-ping" />
                  )}
                </div>
              </div>
              )}


            </div>
          </div>

        </div>


        {/* Live Estimation Feed & Intake Action */}
        <div className="col-span-1 xl:col-span-12 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-4">
          <div className="text-center sm:text-left">
            <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Estimated Order Amount</span>
            <span className="text-3xl font-black text-slate-900 font-mono">
              Rs. {calculatedEstimate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm px-8 py-4 rounded-xl transition-all shadow-md shadow-cyan-600/15 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            id="submit-order-btn"
          >
            <Printer className="h-5 w-5" />
            <span>{isLoading ? 'Creating Ledger Record...' : 'Intake & Generate Sticker'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
