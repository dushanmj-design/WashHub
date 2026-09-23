import React, { useState, useEffect } from 'react';
import { Waves, Wind, Flame, ShieldCheck, Shirt, Blinds, Bed, Package, Layers, Tag, Lock, Check } from 'lucide-react';

interface SupervisorIntakeProps {
  onSubmit: (payload: any) => void;
  isLoading: boolean;
  activeTenantId?: string;
  activeRole?: string;
  orders?: any[];
}

export default function SupervisorIntake({ onSubmit, isLoading, orders = [] }: SupervisorIntakeProps) {
  const [mobile, setMobile] = useState('');
  const handleMobileChange = (val: string) => {
    setMobile(val);
    if (orders && val.length >= 9) {
      const existing = orders.find(o => o.customer_mobile === val || (o.supervisor_data && o.supervisor_data.order_details && o.supervisor_data.order_details.customer && o.supervisor_data.order_details.customer.telephone === val));
      if (existing) {
        const foundName = existing.customer_name || (existing.supervisor_data && existing.supervisor_data.order_details && existing.supervisor_data.order_details.customer.name);
        if (foundName) setName(foundName);
      }
    }
  };
  const [name, setName] = useState('');
  
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Default with all services unselected - all billing amount fields are strictly frozen until selected on screen
  const [services, setServices] = useState({ wash: false, dry: false, iron: false, dc: false });
  const [category, setCategory] = useState<string[]>(['Cloths']);
  const [formError, setFormError] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packaging, setPackaging] = useState<'fold' | 'hanger' | null>(null);
  const [hangerQty, setHangerQty] = useState('0');

  const togglePackaging = (pkg: 'fold' | 'hanger') => {
    setPackaging(prev => prev === pkg ? null : pkg);
  };

  const [washAmount, setWashAmount] = useState('');
  const [dryAmount, setDryAmount] = useState('');
  const [ironAmount, setIronAmount] = useState('');
  const [dcAmount, setDcAmount] = useState('');
  const [advance, setAdvance] = useState('');

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

  return (
    <form onSubmit={handleFormSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full flex flex-col lg:flex-row text-slate-800 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}} />

      {/* Left Column */}
      <div className="flex-1 flex flex-col border-r border-slate-200">
        
        {/* Header */}
        <header className="bg-slate-900 text-slate-100 p-4 sm:p-5 shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">Wash hub (Pvt) LTD.</h1>
            <div className="text-xs sm:text-sm font-semibold opacity-90 text-right">
              <div>TEL: 011-1234567</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Telephone</label>
                <input required value={mobile} onChange={e => handleMobileChange(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 py-2.5 px-3 text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm font-medium placeholder-slate-500" placeholder="Phone Number" type="tel" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-slate-600 bg-slate-800 py-2.5 px-3 text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm font-medium placeholder-slate-500" placeholder="Customer Name" type="text" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Date</label>
                <div className="w-full bg-slate-800 border border-slate-600 rounded-md py-2.5 px-3 text-slate-200 sm:text-sm flex items-center shadow-inner font-medium">
                  <span>{currentDate}</span> <span className="ml-2 text-xs text-slate-500">(Auto)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Time</label>
                <div className="w-full bg-slate-800 border border-slate-600 rounded-md py-2.5 px-3 text-slate-200 sm:text-sm flex items-center shadow-inner font-medium">
                  <span>{currentTime}</span> <span className="ml-2 text-xs text-slate-500">(Auto)</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-5 space-y-5 bg-white overflow-y-auto">
          
          {/* Services */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Services (Enables Billing Boxes)</h3>
              <span className="text-[11px] text-slate-400 font-medium">Click to select/unselect</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* WASH */}
              <button
                type="button"
                onClick={() => toggleService('wash')}
                className={`relative p-3.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group ${
                  services.wash 
                    ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${services.wash ? 'bg-amber-200/80 text-amber-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Waves className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-sm tracking-wide">WASH</div>
                <div className={`text-[10px] font-semibold ${services.wash ? 'text-amber-800' : 'text-slate-400'}`}>Wash Load</div>
                {services.wash && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* DRY */}
              <button
                type="button"
                onClick={() => toggleService('dry')}
                className={`relative p-3.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group ${
                  services.dry 
                    ? 'bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${services.dry ? 'bg-emerald-200/80 text-emerald-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Wind className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-sm tracking-wide">DRY</div>
                <div className={`text-[10px] font-semibold ${services.dry ? 'text-emerald-800' : 'text-slate-400'}`}>Tumble Dry</div>
                {services.dry && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* IRON */}
              <button
                type="button"
                onClick={() => toggleService('iron')}
                className={`relative p-3.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group ${
                  services.iron 
                    ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-sm ring-2 ring-blue-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${services.iron ? 'bg-blue-200/80 text-blue-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <Flame className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-sm tracking-wide">IRON</div>
                <div className={`text-[10px] font-semibold ${services.iron ? 'text-blue-800' : 'text-slate-400'}`}>Steam Press</div>
                {services.iron && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>

              {/* D/C */}
              <button
                type="button"
                onClick={() => toggleService('dc')}
                className={`relative p-3.5 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer text-center group ${
                  services.dc 
                    ? 'bg-pink-50/80 border-pink-500 text-pink-950 shadow-sm ring-2 ring-pink-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${services.dc ? 'bg-pink-200/80 text-pink-800' : 'bg-slate-200/70 text-slate-400'}`}>
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div className="font-black text-sm tracking-wide">D/C</div>
                <div className={`text-[10px] font-semibold ${services.dc ? 'text-pink-800' : 'text-slate-400'}`}>Dry Clean</div>
                {services.dc && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Item Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                type="button" 
                onClick={() => toggleCategory('Cloths')} 
                className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  category.includes('Cloths') 
                    ? 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Shirt className="w-4 h-4 shrink-0" />
                <span>Cloths</span>
                {category.includes('Cloths') && <Check className="w-3.5 h-3.5 ml-auto stroke-[3]" />}
              </button>
              
              <button 
                type="button" 
                onClick={() => toggleCategory('Curtain')} 
                className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  category.includes('Curtain') 
                    ? 'bg-teal-600 border-teal-700 text-white shadow-md ring-2 ring-teal-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Blinds className="w-4 h-4 shrink-0" />
                <span>Curtain</span>
                {category.includes('Curtain') && <Check className="w-3.5 h-3.5 ml-auto stroke-[3]" />}
              </button>

              <button 
                type="button" 
                onClick={() => toggleCategory('Bed Sheets')} 
                className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  category.includes('Bed Sheets') 
                    ? 'bg-purple-600 border-purple-700 text-white shadow-md ring-2 ring-purple-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Bed className="w-4 h-4 shrink-0" />
                <span>Bed Sheets</span>
                {category.includes('Bed Sheets') && <Check className="w-3.5 h-3.5 ml-auto stroke-[3]" />}
              </button>

              <button 
                type="button" 
                onClick={() => toggleCategory('Others')} 
                className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  category.includes('Others') 
                    ? 'bg-slate-700 border-slate-800 text-white shadow-md ring-2 ring-slate-400/30' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Others</span>
                {category.includes('Others') && <Check className="w-3.5 h-3.5 ml-auto stroke-[3]" />}
              </button>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* Measurements */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="w-20 text-lg font-bold text-slate-700">Weight</label>
                <div className="relative flex-1">
                  <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="block w-full rounded-md border border-slate-300 py-2 pl-4 pr-12 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-lg font-semibold text-right" placeholder="0.00" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                    <span className="text-slate-500 sm:text-lg font-medium">kg</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-lg font-bold text-slate-700 mb-2">Delivery Date</label>
                <div className="relative">
                  <input required type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="block w-full rounded-md border-2 border-[#f97316] py-2 px-4 text-slate-900 shadow-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 sm:text-lg font-bold bg-[#fff7ed] cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="w-12 text-lg font-bold text-slate-700">Qty</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="block w-32 rounded-md border border-slate-300 py-2 px-4 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-lg text-center font-semibold" placeholder="0" />
                <span className="text-sm text-slate-500 font-bold whitespace-nowrap">(Iron/Dry clean)</span>
              </div>
              
              {/* Packaging Mode (Fold vs Hanger) with picture icons */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <button 
                  type="button" 
                  onClick={() => togglePackaging('fold')} 
                  className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer ${
                    packaging === 'fold'
                      ? 'bg-pink-50 border-pink-400 text-pink-900 shadow-xs ring-2 ring-pink-300/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${packaging === 'fold' ? 'bg-pink-200 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black">Fold</div>
                      <div className="text-[10px] text-slate-500">Folded stack</div>
                    </div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${packaging === 'fold' ? 'border-pink-600 bg-pink-600' : 'border-slate-300'}`}>
                    {packaging === 'fold' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </button>

                <button 
                  type="button" 
                  onClick={() => togglePackaging('hanger')} 
                  className={`p-3 rounded-lg border-2 flex items-center justify-between transition-all cursor-pointer ${
                    packaging === 'hanger'
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-300/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${packaging === 'hanger' ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black">Hanger</div>
                      <div className="text-[10px] text-slate-500">On hanger</div>
                    </div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${packaging === 'hanger' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                    {packaging === 'hanger' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-lg font-bold text-slate-700">Hanger Given Qty</label>
                <input type="number" disabled={packaging !== 'hanger'} value={hangerQty} onChange={e => setHangerQty(e.target.value)} className="block w-24 rounded-md border-2 border-[#fcd34d] py-2 px-3 text-slate-900 shadow-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:text-lg text-center font-bold bg-[#fef3c7] disabled:opacity-50" placeholder="0" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-[40%] bg-[#f8fafc] flex flex-col p-4 sm:p-5 border-t lg:border-t-0 lg:border-l border-slate-200 shrink-0">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
          <h2 className="text-xl font-bold text-slate-800">Billing Summary</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
            {[services.wash && 'Wash', services.dry && 'Dry', services.iron && 'Iron', services.dc && 'DC'].filter(Boolean).length} Active
          </span>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-xs font-bold flex items-start gap-2 shadow-xs">
            <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>{formError}</div>
          </div>
        )}
        
        <div className="space-y-3 text-base mb-4">
          {/* Wash Amount */}
          <div className="flex justify-between items-center">
            <span className={`font-bold flex items-center gap-1.5 ${services.wash ? 'text-slate-800' : 'text-slate-400'}`}>
              <Waves className="w-4 h-4 text-amber-500" />
              <span>Wash Amount</span>
            </span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-2.5 font-medium text-sm">Rs.</span>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  disabled={!services.wash}
                  value={washAmount} 
                  onChange={e => setWashAmount(e.target.value)} 
                  className={`w-24 rounded border px-2 py-1 text-right font-bold text-sm outline-none transition-all ${
                    services.wash 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner' 
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

          {/* Dry Amount */}
          <div className="flex justify-between items-center">
            <span className={`font-bold flex items-center gap-1.5 ${services.dry ? 'text-slate-800' : 'text-slate-400'}`}>
              <Wind className="w-4 h-4 text-emerald-500" />
              <span>Dry Amount</span>
            </span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-2.5 font-medium text-sm">Rs.</span>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  disabled={!services.dry}
                  value={dryAmount} 
                  onChange={e => setDryAmount(e.target.value)} 
                  className={`w-24 rounded border px-2 py-1 text-right font-bold text-sm outline-none transition-all ${
                    services.dry 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner' 
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

          {/* Iron Amount */}
          <div className="flex justify-between items-center">
            <span className={`font-bold flex items-center gap-1.5 ${services.iron ? 'text-slate-800' : 'text-slate-400'}`}>
              <Flame className="w-4 h-4 text-blue-500" />
              <span>Iron Amount</span>
            </span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-2.5 font-medium text-sm">Rs.</span>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  disabled={!services.iron}
                  value={ironAmount} 
                  onChange={e => setIronAmount(e.target.value)} 
                  className={`w-24 rounded border px-2 py-1 text-right font-bold text-sm outline-none transition-all ${
                    services.iron 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner' 
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

          {/* D/C Amount */}
          <div className="flex justify-between items-center">
            <span className={`font-bold flex items-center gap-1.5 ${services.dc ? 'text-slate-800' : 'text-slate-400'}`}>
              <ShieldCheck className="w-4 h-4 text-pink-500" />
              <span>D/C Amount</span>
            </span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-2.5 font-medium text-sm">Rs.</span>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01" 
                  disabled={!services.dc}
                  value={dcAmount} 
                  onChange={e => setDcAmount(e.target.value)} 
                  className={`w-24 rounded border px-2 py-1 text-right font-bold text-sm outline-none transition-all ${
                    services.dc 
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner' 
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

        <div className="mt-auto space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xl">
            <span className="font-bold text-slate-800">TTL Amount</span>
            <div className="flex items-center font-bold text-slate-800 w-40 justify-end">
              <span className="mr-3">Rs.</span>
              <span className="w-24 text-right">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-600 font-medium">Advance</span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-3">Rs.</span>
              <input type="number" step="0.01" value={advance} onChange={e => setAdvance(e.target.value)} className="w-24 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center text-xl border-t border-slate-200 pt-4">
            <span className="font-bold text-emerald-600">Balance</span>
            <div className="flex items-center font-bold text-emerald-600 w-40 justify-end">
              <span className="mr-3">Rs.</span>
              <span className="w-24 text-right">{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <button disabled={isLoading} type="submit" className="mt-8 w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow text-xl tracking-wide transition-colors disabled:opacity-70 flex justify-center items-center">
          {isLoading ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </form>
  );
}
