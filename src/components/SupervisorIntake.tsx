import React, { useState, useEffect } from 'react';

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
  
  const [services, setServices] = useState({ wash: true, dry: true, iron: true, dc: true });
  const [category, setCategory] = useState<string[]>(['Cloths']);

  const toggleCategory = (cat: string) => {
    setCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };
  
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [packaging, setPackaging] = useState<'fold' | 'hanger'>('fold');
  const [hangerQty, setHangerQty] = useState('0');

  const [washAmount, setWashAmount] = useState('');
  const [dryAmount, setDryAmount] = useState('');
  const [ironAmount, setIronAmount] = useState('');
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

  const totalAmount = (parseFloat(washAmount) || 0) + (parseFloat(dryAmount) || 0) + (parseFloat(ironAmount) || 0);
  const balance = Math.max(0, totalAmount - (parseFloat(advance) || 0));

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          hanger_given_qty: parseInt(hangerQty) || 0
        },
        billing: {
          wash_amount: parseFloat(washAmount) || 0,
          dry_amount: parseFloat(dryAmount) || 0,
          iron_amount: parseFloat(ironAmount) || 0,
          total_amount: totalAmount,
          advance: parseFloat(advance) || 0,
          balance: balance
        },
        status: 'pending'
      }
    };
    onSubmit(payload);
  };

  const toggleService = (key: keyof typeof services) => setServices(s => ({ ...s, [key]: !s[key] }));

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button type="button" onClick={() => toggleService('wash')} className={`py-2 rounded-lg border-2 font-bold text-lg tracking-wider transition-all ${services.wash ? 'bg-[#fde047] border-[#eab308] text-[#713f12] shadow-sm' : 'bg-[#fef08a] border-[#fde047] text-[#a16207] opacity-60'}`}>WASH</button>
              <button type="button" onClick={() => toggleService('dry')} className={`py-2 rounded-lg border-2 font-bold text-lg tracking-wider transition-all ${services.dry ? 'bg-[#86efac] border-[#22c55e] text-[#14532d] shadow-sm' : 'bg-[#bbf7d0] border-[#86efac] text-[#166534] opacity-60'}`}>DRY</button>
              <button type="button" onClick={() => toggleService('iron')} className={`py-2 rounded-lg border-2 font-bold text-lg tracking-wider transition-all ${services.iron ? 'bg-[#93c5fd] border-[#3b82f6] text-[#1e3a8a] shadow-sm' : 'bg-[#bfdbfe] border-[#93c5fd] text-[#1e40af] opacity-60'}`}>IRON</button>
              <button type="button" onClick={() => toggleService('dc')} className={`py-2 rounded-lg border-2 font-bold text-lg tracking-wider transition-all ${services.dc ? 'bg-[#f9a8d4] border-[#ec4899] text-[#831843] shadow-sm' : 'bg-[#fbcfe8] border-[#f9a8d4] text-[#9d174d] opacity-60'}`}>D/C</button>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Item Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button type="button" onClick={() => toggleCategory('Cloths')} className={`py-2 rounded border text-sm font-semibold transition-all ${category.includes('Cloths') ? 'bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-500 ring-offset-2' : 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'}`}>Cloths</button>
              <button type="button" onClick={() => toggleCategory('Curtain')} className={`py-2 rounded border text-sm font-semibold transition-all ${category.includes('Curtain') ? 'bg-teal-600 border-teal-700 text-white shadow-md ring-2 ring-teal-500 ring-offset-2' : 'bg-teal-100 border-teal-300 text-teal-800 hover:bg-teal-200'}`}>Curtain</button>
              <button type="button" onClick={() => toggleCategory('Bed Sheets')} className={`py-2 rounded border text-sm font-semibold transition-all ${category.includes('Bed Sheets') ? 'bg-purple-600 border-purple-700 text-white shadow-md ring-2 ring-purple-500 ring-offset-2' : 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200'}`}>Bed Sheets</button>
              <button type="button" onClick={() => toggleCategory('Others')} className={`py-2 rounded border text-sm font-semibold transition-all ${category.includes('Others') ? 'bg-slate-700 border-slate-800 text-white shadow-md ring-2 ring-slate-500 ring-offset-2' : 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'}`}>Others</button>
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
              
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                <button type="button" onClick={() => setPackaging('fold')} className="flex items-center space-x-3 cursor-pointer outline-none">
                  <div className={`h-6 w-6 rounded border flex items-center justify-center ${packaging === 'fold' ? 'bg-[#fbcfe8] border-[#f9a8d4]' : 'bg-white border-slate-300'}`}>
                    {packaging === 'fold' && <div className="h-3 w-3 rounded-sm bg-[#db2777]" />}
                  </div>
                  <span className="text-lg font-bold text-slate-700">Fold</span>
                </button>
                <button type="button" onClick={() => setPackaging('hanger')} className="flex items-center space-x-3 cursor-pointer outline-none">
                  <div className={`h-6 w-6 rounded border flex items-center justify-center ${packaging === 'hanger' ? 'bg-[#bfdbfe] border-[#93c5fd]' : 'bg-white border-slate-300'}`}>
                    {packaging === 'hanger' && <div className="h-3 w-3 rounded-sm bg-[#2563eb]" />}
                  </div>
                  <span className="text-lg font-bold text-slate-700">Hanger</span>
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
        <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Billing Summary</h2>
        
        <div className="space-y-3 text-base mb-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Wash Amount</span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-3 font-medium">Rs.</span>
              <input type="number" step="0.01" value={washAmount} onChange={e => setWashAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Dry Amount</span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-3 font-medium">Rs.</span>
              <input type="number" step="0.01" value={dryAmount} onChange={e => setDryAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Iron Amount</span>
            <div className="flex items-center w-40 justify-end">
              <span className="text-slate-400 mr-3 font-medium">Rs.</span>
              <input type="number" step="0.01" value={ironAmount} onChange={e => setIronAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
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
