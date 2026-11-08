import React, { useState, useEffect, useRef } from 'react';
import { 
  Waves, Wind, Flame, ShieldCheck, Shirt, Blinds, Bed, Package, 
  Layers, Tag, Lock, Check, Phone, User, Calendar, Clock, 
  Keyboard, CheckCircle2, X
} from 'lucide-react';
import PosVirtualKeypad from './PosVirtualKeypad';

interface SupervisorIntakeProps {
  onSubmit: (payload: any) => void;
  isLoading: boolean;
  activeTenantId?: string;
  activeRole?: string;
  orders?: any[];
}

export default function SupervisorIntake({ onSubmit, isLoading, orders = [] }: SupervisorIntakeProps) {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Default with all services unselected - all billing amount fields are strictly frozen until selected on screen
  const [services, setServices] = useState({ wash: false, dry: false, iron: false, dc: false });
  const [category, setCategory] = useState<string[]>(['Clothes']);
  const [formError, setFormError] = useState<string | null>(null);

  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packaging, setPackaging] = useState<'fold' | 'hanger' | null>(null);
  const [hangerQty, setHangerQty] = useState('0');

  const [washAmount, setWashAmount] = useState('');
  const [dryAmount, setDryAmount] = useState('');
  const [ironAmount, setIronAmount] = useState('');
  const [dcAmount, setDcAmount] = useState('');
  const [advance, setAdvance] = useState('');

  // POS Touch Keypad & Keyboard support
  const [posKeypadEnabled, setPosKeypadEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pos_keypad_enabled') === 'true';
  });

  const [activeKeypad, setActiveKeypad] = useState<{
    field: string;
    label: string;
    mode: 'numeric' | 'text';
  } | null>(null);

  // Soft keyboard dismissal tracker for device keyboard
  const [isInputFocused, setIsInputFocused] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleMobileChange = (val: string) => {
    setMobile(val);
    if (orders && val.length >= 9) {
      const existing = orders.find(
        o => o.customer_mobile === val || 
        (o.supervisor_data?.order_details?.customer?.telephone === val)
      );
      if (existing) {
        const foundName = existing.customer_name || (existing.supervisor_data?.order_details?.customer?.name);
        if (foundName) setName(foundName);
      }
    }
  };

  const toggleCategory = (cat: string) => {
    setCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const togglePackaging = (pkg: 'fold' | 'hanger') => {
    setPackaging(prev => prev === pkg ? null : pkg);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const totalAmount = 
    (services.wash ? (parseFloat(washAmount) || 0) : 0) + 
    (services.dry ? (parseFloat(dryAmount) || 0) : 0) + 
    (services.iron ? (parseFloat(ironAmount) || 0) : 0) +
    (services.dc ? (parseFloat(dcAmount) || 0) : 0);

  const balance = Math.max(0, totalAmount - (parseFloat(advance) || 0));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!services.wash && !services.dry && !services.iron && !services.dc) {
      setFormError('Please select at least one service (Wash, Dry, Iron, or D/C) on screen to enable billing amounts.');
      return;
    }
    setFormError(null);

    // Dismiss any active keyboard
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    setActiveKeypad(null);

    const payload = {
      order_details: {
        customer: { name, telephone: mobile },
        order_metadata: { date: currentDate, time: currentTime, delivery_date: deliveryDate },
        services,
        item_category: category,
        specs: {
          weight_kg: parseFloat(weight) || 0,
          quantity: parseInt(quantity) || 0,
          packaging,
          hanger_given_qty: packaging === 'hanger' ? (parseInt(hangerQty) || 0) : 0
        },
        billing: {
          wash_amount: services.wash ? (parseFloat(washAmount) || 0) : 0,
          dry_amount: services.dry ? (parseFloat(dryAmount) || 0) : 0,
          iron_amount: services.iron ? (parseFloat(ironAmount) || 0) : 0,
          dc_amount: services.dc ? (parseFloat(dcAmount) || 0) : 0,
          total_amount: totalAmount,
          advance: parseFloat(advance) || 0,
          balance: balance
        },
        status: 'pending'
      }
    };
    onSubmit(payload);
  };

  const toggleService = (key: keyof typeof services) => {
    setFormError(null);
    setServices(prev => {
      const nextVal = !prev[key];
      // Freeze and clear the amount when deselected
      if (!nextVal) {
        if (key === 'wash') setWashAmount('');
        if (key === 'dry') setDryAmount('');
        if (key === 'iron') setIronAmount('');
        if (key === 'dc') setDcAmount('');
      }
      return { ...prev, [key]: nextVal };
    });
  };

  const togglePosKeypad = () => {
    const nextVal = !posKeypadEnabled;
    setPosKeypadEnabled(nextVal);
    localStorage.setItem('pos_keypad_enabled', String(nextVal));
    if (!nextVal) setActiveKeypad(null);
  };

  const dismissSoftKeyboard = () => {
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    setIsInputFocused(false);
    setActiveKeypad(null);
  };

  // Helper to get value of field currently bound to PosVirtualKeypad
  const getKeypadValue = (field: string) => {
    switch (field) {
      case 'mobile': return mobile;
      case 'name': return name;
      case 'weight': return weight;
      case 'quantity': return quantity;
      case 'advance': return advance;
      case 'washAmount': return washAmount;
      case 'dryAmount': return dryAmount;
      case 'ironAmount': return ironAmount;
      case 'dcAmount': return dcAmount;
      case 'hangerQty': return hangerQty;
      default: return '';
    }
  };

  const setKeypadValue = (field: string, val: string) => {
    switch (field) {
      case 'mobile': handleMobileChange(val); break;
      case 'name': setName(val); break;
      case 'weight': setWeight(val); break;
      case 'quantity': setQuantity(val); break;
      case 'advance': setAdvance(val); break;
      case 'washAmount': setWashAmount(val); break;
      case 'dryAmount': setDryAmount(val); break;
      case 'ironAmount': setIronAmount(val); break;
      case 'dcAmount': setDcAmount(val); break;
      case 'hangerQty': setHangerQty(val); break;
    }
  };

  const handleFieldFocus = (field: string, label: string, mode: 'numeric' | 'text') => {
    setIsInputFocused(true);
    if (posKeypadEnabled) {
      setActiveKeypad({ field, label, mode });
    }
  };

  return (
    <form 
      onSubmit={handleFormSubmit}
      className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden w-full flex flex-col text-slate-800 font-sans"
    >
      <style dangerouslySetInnerHTML={{__html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />

      {/* COMPACT TOP HEADER BAR - Minimal vertical height, all info visible */}
      <header className="bg-slate-900 text-slate-100 px-3.5 py-2.5 sm:px-4 sm:py-3 shrink-0 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Brand & Phone */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white">LaundroPOS</h1>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              TEL: 011-1234567
            </span>
          </div>

          {/* Date, Time & Keyboard Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                {currentDate}
              </span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                {currentTime}
              </span>
            </div>

            {/* Touch POS Keypad Mode Toggle */}
            <button
              type="button"
              onClick={togglePosKeypad}
              title={posKeypadEnabled ? "POS Touch Keypad is ON (Android keyboard suppressed). Tap to switch to Device Keyboard" : "Using Device Keyboard. Tap to enable built-in POS Touch Keypad & Numpad"}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                posKeypadEnabled 
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>{posKeypadEnabled ? 'Touch Pad: ON' : 'Device Keybd'}</span>
            </button>
          </div>
        </div>

        {/* Customer Input Row: Telephone & Customer Name side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-0.5 uppercase tracking-wider">Telephone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                ref={phoneInputRef}
                required 
                value={mobile} 
                onChange={e => handleMobileChange(e.target.value)}
                onFocus={() => handleFieldFocus('mobile', 'Telephone', 'numeric')}
                onBlur={() => !posKeypadEnabled && setIsInputFocused(false)}
                inputMode={posKeypadEnabled ? 'none' : 'tel'}
                enterKeyHint="next"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    nameInputRef.current?.focus();
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 pl-8 pr-2.5 text-white shadow-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-semibold placeholder-slate-500" 
                placeholder="Phone Number (e.g. 077...)" 
                type="tel" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-0.5 uppercase tracking-wider">Customer Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                ref={nameInputRef}
                required 
                value={name} 
                onChange={e => setName(e.target.value)}
                onFocus={() => handleFieldFocus('name', 'Customer Name', 'text')}
                onBlur={() => !posKeypadEnabled && setIsInputFocused(false)}
                inputMode={posKeypadEnabled ? 'none' : 'text'}
                enterKeyHint="done"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLElement).blur();
                  }
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/90 py-1.5 pl-8 pr-2.5 text-white shadow-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-semibold placeholder-slate-500" 
                placeholder="Customer Name" 
                type="text" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* MAIN BODY - 2-Column Responsive Landscape Grid fitted to visible screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 sm:p-4 bg-slate-50/50">
        
        {/* LEFT COLUMN: Services, Categories, Specs (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          
          {/* 1. SELECT SERVICES (Icon sizes preserved: w-6 h-6 stroke-[2.5] with compact ergonomic padding) */}
          <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Select Services</h3>
              <span className="text-[10px] text-slate-400 font-semibold">Click to activate billing rows</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* WASH */}
              <button
                type="button"
                onClick={() => toggleService('wash')}
                className={`relative py-2 px-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group ${
                  services.wash 
                    ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-400/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${services.wash ? 'bg-amber-200 text-amber-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Waves className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-xs tracking-wide">WASH</div>
                <div className={`text-[10px] font-semibold ${services.wash ? 'text-amber-800' : 'text-slate-400'}`}>Wash Load</div>
                {services.wash && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* DRY */}
              <button
                type="button"
                onClick={() => toggleService('dry')}
                className={`relative py-2 px-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group ${
                  services.dry 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs ring-2 ring-emerald-400/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${services.dry ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Wind className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-xs tracking-wide">DRY</div>
                <div className={`text-[10px] font-semibold ${services.dry ? 'text-emerald-800' : 'text-slate-400'}`}>Tumble Dry</div>
                {services.dry && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* IRON */}
              <button
                type="button"
                onClick={() => toggleService('iron')}
                className={`relative py-2 px-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group ${
                  services.iron 
                    ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-2 ring-blue-400/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${services.iron ? 'bg-blue-200 text-blue-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Flame className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-xs tracking-wide">IRON</div>
                <div className={`text-[10px] font-semibold ${services.iron ? 'text-blue-800' : 'text-slate-400'}`}>Steam Press</div>
                {services.iron && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* D/C */}
              <button
                type="button"
                onClick={() => toggleService('dc')}
                className={`relative py-2 px-2.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-center group ${
                  services.dc 
                    ? 'bg-pink-50 border-pink-500 text-pink-950 shadow-xs ring-2 ring-pink-400/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2 rounded-lg transition-colors ${services.dc ? 'bg-pink-200 text-pink-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-xs tracking-wide">D/C</div>
                <div className={`text-[10px] font-semibold ${services.dc ? 'text-pink-800' : 'text-slate-400'}`}>Dry Clean</div>
                {services.dc && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* 2. ITEM CATEGORY */}
          <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Item Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button 
                type="button" 
                onClick={() => toggleCategory('Clothes')} 
                className={`py-1.5 px-2.5 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  category.includes('Clothes') 
                    ? 'bg-blue-600 border-blue-700 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Shirt className="w-4 h-4 shrink-0" />
                <span>Clothes</span>
                {category.includes('Clothes') && <Check className="w-3 h-3 ml-auto stroke-[3]" />}
              </button>
              
              <button 
                type="button" 
                onClick={() => toggleCategory('Curtains')} 
                className={`py-1.5 px-2.5 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  category.includes('Curtains') 
                    ? 'bg-teal-600 border-teal-700 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Blinds className="w-4 h-4 shrink-0" />
                <span>Curtains</span>
                {category.includes('Curtains') && <Check className="w-3 h-3 ml-auto stroke-[3]" />}
              </button>

              <button 
                type="button" 
                onClick={() => toggleCategory('Bed Sheets')} 
                className={`py-1.5 px-2.5 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  category.includes('Bed Sheets') 
                    ? 'bg-purple-600 border-purple-700 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Bed className="w-4 h-4 shrink-0" />
                <span>Bed Sheets</span>
                {category.includes('Bed Sheets') && <Check className="w-3 h-3 ml-auto stroke-[3]" />}
              </button>

              <button 
                type="button" 
                onClick={() => toggleCategory('Others')} 
                className={`py-1.5 px-2.5 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  category.includes('Others') 
                    ? 'bg-slate-700 border-slate-800 text-white shadow-xs' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Others</span>
                {category.includes('Others') && <Check className="w-3 h-3 ml-auto stroke-[3]" />}
              </button>
            </div>
          </section>

          {/* 3. SPECS & PACKAGING (Clean 2x2 Grid) */}
          <section className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Specs & Packaging</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Weight */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Weight</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={weight} 
                    onChange={e => setWeight(e.target.value)}
                    onFocus={() => handleFieldFocus('weight', 'Weight (kg)', 'numeric')}
                    onBlur={() => !posKeypadEnabled && setIsInputFocused(false)}
                    inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                    enterKeyHint="done"
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                    className="block w-full rounded-lg border border-slate-300 py-1.5 pl-3 pr-9 text-slate-900 shadow-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-bold text-right" 
                    placeholder="0.00" 
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <span className="text-slate-500 text-xs font-bold">kg</span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Quantity (Pieces)</label>
                  <span className="text-[10px] text-slate-400 font-medium">(Iron / D/C)</span>
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)}
                    onFocus={() => handleFieldFocus('quantity', 'Quantity (pcs)', 'numeric')}
                    onBlur={() => !posKeypadEnabled && setIsInputFocused(false)}
                    inputMode={posKeypadEnabled ? 'none' : 'numeric'}
                    enterKeyHint="done"
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                    className="block w-full rounded-lg border border-slate-300 py-1.5 pl-3 pr-9 text-slate-900 shadow-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-bold text-right" 
                    placeholder="0" 
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                    <span className="text-slate-500 text-xs font-bold">pcs</span>
                  </div>
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Date</label>
                <input 
                  required 
                  type="date" 
                  value={deliveryDate} 
                  onChange={e => setDeliveryDate(e.target.value)} 
                  className="block w-full rounded-lg border-2 border-orange-400 py-1.5 px-2.5 text-slate-900 shadow-xs focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-xs font-bold bg-orange-50/60 cursor-pointer" 
                />
              </div>

              {/* Packaging Mode (Fold vs Hanger) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Packaging Type</label>
                <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => togglePackaging('fold')} 
                    className={`h-8 px-2 rounded-md border flex items-center justify-between transition-all cursor-pointer ${
                      packaging === 'fold'
                        ? 'bg-pink-100 border-pink-400 text-pink-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-pink-700" />
                      <span className="text-xs font-black">Fold</span>
                    </div>
                    {packaging === 'fold' && <Check className="w-3 h-3 text-pink-700 stroke-[3]" />}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => togglePackaging('hanger')} 
                    className={`h-8 px-2 rounded-md border flex items-center justify-between transition-all cursor-pointer ${
                      packaging === 'hanger'
                        ? 'bg-blue-100 border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-700" />
                      <span className="text-xs font-black">Hanger</span>
                    </div>
                    {packaging === 'hanger' && <Check className="w-3 h-3 text-blue-700 stroke-[3]" />}
                  </button>
                </div>

                {/* Hanger Quantity Input */}
                {packaging === 'hanger' && (
                  <div className="mt-1.5 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md p-1.5 animate-fade-in">
                    <label className="text-[11px] font-bold text-amber-900">Hangers Given:</label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0"
                        value={hangerQty} 
                        onChange={e => setHangerQty(e.target.value)}
                        onFocus={() => handleFieldFocus('hangerQty', 'Hangers Given (pcs)', 'numeric')}
                        inputMode={posKeypadEnabled ? 'none' : 'numeric'}
                        enterKeyHint="done"
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                        className="w-14 rounded border border-amber-300 py-0.5 px-1.5 text-slate-900 text-xs text-center font-bold bg-white" 
                        placeholder="0" 
                      />
                      <span className="text-[10px] text-amber-800 font-bold">pcs</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Live Billing Summary & Complete Order Action (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
              <h2 className="text-base font-bold text-slate-800">Billing Summary</h2>
              <span className="text-xs font-semibold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                {[services.wash && 'Wash', services.dry && 'Dry', services.iron && 'Iron', services.dc && 'DC'].filter(Boolean).length} Selected
              </span>
            </div>

            {formError && (
              <div className="mb-2.5 p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-bold flex items-start gap-1.5 shadow-xs">
                <Lock className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <div>{formError}</div>
              </div>
            )}
            
            {/* Direct Service Rates */}
            <div className="space-y-2 mb-3">
              {/* Wash */}
              <div className="flex justify-between items-center py-0.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${services.wash ? 'text-slate-800' : 'text-slate-400'}`}>
                  <Waves className="w-4 h-4 text-amber-500" />
                  <span>Wash</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold">Rs.</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={!services.wash}
                      value={washAmount} 
                      onChange={e => setWashAmount(e.target.value)}
                      onFocus={() => handleFieldFocus('washAmount', 'Wash Amount (Rs.)', 'numeric')}
                      inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                      enterKeyHint="done"
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                      className={`w-28 rounded-md border px-2 py-1 text-right font-black text-xs outline-none transition-all ${
                        services.wash 
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner' 
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none pl-6'
                      }`} 
                      placeholder={services.wash ? "0.00" : "Frozen"} 
                    />
                    {!services.wash && (
                      <Lock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* Dry */}
              <div className="flex justify-between items-center py-0.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${services.dry ? 'text-slate-800' : 'text-slate-400'}`}>
                  <Wind className="w-4 h-4 text-emerald-500" />
                  <span>Dry</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold">Rs.</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={!services.dry}
                      value={dryAmount} 
                      onChange={e => setDryAmount(e.target.value)}
                      onFocus={() => handleFieldFocus('dryAmount', 'Dry Amount (Rs.)', 'numeric')}
                      inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                      enterKeyHint="done"
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                      className={`w-28 rounded-md border px-2 py-1 text-right font-black text-xs outline-none transition-all ${
                        services.dry 
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner' 
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none pl-6'
                      }`} 
                      placeholder={services.dry ? "0.00" : "Frozen"} 
                    />
                    {!services.dry && (
                      <Lock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* Iron */}
              <div className="flex justify-between items-center py-0.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${services.iron ? 'text-slate-800' : 'text-slate-400'}`}>
                  <Flame className="w-4 h-4 text-blue-500" />
                  <span>Iron</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold">Rs.</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={!services.iron}
                      value={ironAmount} 
                      onChange={e => setIronAmount(e.target.value)}
                      onFocus={() => handleFieldFocus('ironAmount', 'Iron Amount (Rs.)', 'numeric')}
                      inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                      enterKeyHint="done"
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                      className={`w-28 rounded-md border px-2 py-1 text-right font-black text-xs outline-none transition-all ${
                        services.iron 
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner' 
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none pl-6'
                      }`} 
                      placeholder={services.iron ? "0.00" : "Frozen"} 
                    />
                    {!services.iron && (
                      <Lock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>

              {/* D/C */}
              <div className="flex justify-between items-center py-0.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${services.dc ? 'text-slate-800' : 'text-slate-400'}`}>
                  <ShieldCheck className="w-4 h-4 text-pink-500" />
                  <span>D/C</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-bold">Rs.</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01" 
                      disabled={!services.dc}
                      value={dcAmount} 
                      onChange={e => setDcAmount(e.target.value)}
                      onFocus={() => handleFieldFocus('dcAmount', 'D/C Amount (Rs.)', 'numeric')}
                      inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                      enterKeyHint="done"
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                      className={`w-28 rounded-md border px-2 py-1 text-right font-black text-xs outline-none transition-all ${
                        services.dc 
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 shadow-inner' 
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed select-none pl-6'
                      }`} 
                      placeholder={services.dc ? "0.00" : "Frozen"} 
                    />
                    {!services.dc && (
                      <Lock className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Totals & Advance Breakdown */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                <span>TTL Amount</span>
                <div className="flex items-center gap-1 font-mono font-black text-base text-slate-900">
                  <span className="text-xs text-slate-500 font-sans">Rs.</span>
                  <span>{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Advance Paid</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Rs.</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={advance} 
                    onChange={e => setAdvance(e.target.value)}
                    onFocus={() => handleFieldFocus('advance', 'Advance Amount (Rs.)', 'numeric')}
                    inputMode={posKeypadEnabled ? 'none' : 'decimal'}
                    enterKeyHint="done"
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLElement).blur(); }}
                    className="w-24 bg-white border border-slate-300 rounded px-2 py-0.5 text-right font-black text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none shadow-xs" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm font-black border-t border-slate-200 pt-1.5 text-emerald-700">
                <span>Balance Due</span>
                <div className="flex items-center gap-1 font-mono font-black text-base">
                  <span className="text-xs text-emerald-600 font-sans">Rs.</span>
                  <span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COMPLETE ORDER BUTTON */}
          <button 
            disabled={isLoading} 
            type="submit" 
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black py-3 px-4 rounded-xl shadow-md text-base tracking-wide transition-all disabled:opacity-70 flex justify-center items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>{isLoading ? 'Processing Order...' : `Complete Order · Rs. ${totalAmount.toFixed(2)}`}</span>
          </button>
        </div>

      </div>

      {/* Floating Device Keyboard Dismissal Button (Shown on mobile/tablet when input focused) */}
      {!posKeypadEnabled && isInputFocused && (
        <div className="fixed bottom-3 right-3 z-[180] animate-fade-in">
          <button
            type="button"
            onClick={dismissSoftKeyboard}
            className="flex items-center gap-1.5 bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-full shadow-2xl border-2 border-cyan-400 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
            <span>Close Keyboard</span>
          </button>
        </div>
      )}

      {/* On-Screen Touch POS Keypad */}
      {posKeypadEnabled && activeKeypad && (
        <PosVirtualKeypad
          isOpen={true}
          mode={activeKeypad.mode}
          fieldName={activeKeypad.label}
          value={getKeypadValue(activeKeypad.field)}
          onChange={(newVal) => setKeypadValue(activeKeypad.field, newVal)}
          onClose={() => setActiveKeypad(null)}
          onNext={() => {
            if (activeKeypad.field === 'mobile') {
              setActiveKeypad({ field: 'name', label: 'Customer Name', mode: 'text' });
            } else if (activeKeypad.field === 'name') {
              setActiveKeypad({ field: 'weight', label: 'Weight (kg)', mode: 'numeric' });
            } else {
              setActiveKeypad(null);
            }
          }}
        />
      )}
    </form>
  );
}
