const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';

interface SupervisorIntakeProps {
  onSubmit: (payload: any) => void;
  isLoading: boolean;
  activeTenantId?: string;
  activeRole?: string;
}

export default function SupervisorIntake({ onSubmit, isLoading }: SupervisorIntakeProps) {
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  
  const [services, setServices] = useState({ wash: true, dry: false, iron: false, dc: false });
  const [category, setCategory] = useState('Cloths');
  
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
    <form onSubmit={handleFormSubmit} className="bg-white rounded-xl shadow-2xl overflow-hidden w-full flex flex-col lg:flex-row border border-slate-200">
      
      <style dangerouslySetInnerHTML={{__html: \`
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      \`}} />

      {/* Left Column */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        {/* Header */}
        <header className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wider">Wash hub (Pvt) LTD.</h1>
            <div className="text-xs sm:text-sm font-medium opacity-80 text-right">
              <div>TEL: 011-1234567</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 min-h-[44px]" placeholder="Customer Name" type="text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Telephone</label>
                <input required value={mobile} onChange={e => setMobile(e.target.value)} className="w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 min-h-[44px]" placeholder="Phone Number" type="tel" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Date</label>
                <div className="w-full bg-blue-700/50 rounded-md py-2 px-3 text-white sm:text-sm border border-blue-500/30 flex items-center min-h-[44px]">
                  <span>{currentDate}</span> <span className="ml-2 text-xs opacity-70">(Auto)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-1">Time</label>
                <div className="w-full bg-blue-700/50 rounded-md py-2 px-3 text-white sm:text-sm border border-blue-500/30 flex items-center min-h-[44px]">
                  <span>{currentTime}</span> <span className="ml-2 text-xs opacity-70">(Auto)</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Services */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button type="button" onClick={() => toggleService('wash')} className={\`\${services.wash ? 'opacity-100 shadow-md' : 'opacity-40'} bg-[#fde047] hover:bg-yellow-400 text-yellow-900 font-bold py-4 rounded-lg transition-all border-2 border-yellow-500 text-lg uppercase tracking-wide min-h-[44px] flex justify-center items-center\`}>WASH</button>
              <button type="button" onClick={() => toggleService('dry')} className={\`\${services.dry ? 'opacity-100 shadow-md' : 'opacity-40'} bg-[#86efac] hover:bg-green-400 text-green-900 font-bold py-4 rounded-lg transition-all border-2 border-green-500 text-lg uppercase tracking-wide min-h-[44px] flex justify-center items-center\`}>DRY</button>
              <button type="button" onClick={() => toggleService('iron')} className={\`\${services.iron ? 'opacity-100 shadow-md' : 'opacity-40'} bg-[#93c5fd] hover:bg-blue-400 text-blue-900 font-bold py-4 rounded-lg transition-all border-2 border-blue-500 text-lg uppercase tracking-wide min-h-[44px] flex justify-center items-center\`}>IRON</button>
              <button type="button" onClick={() => toggleService('dc')} className={\`\${services.dc ? 'opacity-100 shadow-md' : 'opacity-40'} bg-[#f9a8d4] hover:bg-pink-400 text-pink-900 font-bold py-4 rounded-lg transition-all border-2 border-pink-500 text-lg uppercase tracking-wide min-h-[44px] flex justify-center items-center\`}>D/C</button>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Item Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['Cloths', 'Curtain', 'Bed Sheets', 'Others'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={\`font-semibold py-3 rounded border transition-colors min-h-[44px] \${category === cat ? 'bg-amber-200 border-amber-400 text-amber-900 shadow-sm' : 'bg-gray-100 border-gray-300 text-gray-700'}\`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-gray-200" />

          {/* Measurements */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <label className="w-20 text-lg font-bold text-gray-700">Weight</label>
                <div className="relative flex-1">
                  <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="block w-full rounded-md border-0 py-3 pl-4 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-lg sm:leading-6 min-h-[44px] text-right font-semibold" placeholder="0.00" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 sm:text-lg font-medium">kg</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Delivery Date</label>
                <div className="relative">
                  <input required type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-2 ring-inset ring-orange-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-lg sm:leading-6 min-h-[44px] font-bold bg-orange-50" />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center space-x-4">
                <label className="w-12 text-lg font-bold text-gray-700">Qty</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-lg sm:leading-6 min-h-[44px] text-center font-semibold" placeholder="0" />
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">(Iron/Dry clean)</span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                  <input type="radio" checked={packaging === 'fold'} onChange={() => setPackaging('fold')} className="h-6 w-6 text-pink-500 rounded border-gray-300 focus:ring-pink-500 accent-pink-500" />
                  <span className="text-lg font-bold text-gray-700">Fold</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                  <input type="radio" checked={packaging === 'hanger'} onChange={() => setPackaging('hanger')} className="h-6 w-6 text-blue-500 rounded border-gray-300 focus:ring-blue-500 accent-blue-500" />
                  <span className="text-lg font-bold text-gray-700">Hanger</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-lg font-bold text-gray-700">Hanger Given Qty</label>
                <input type="number" disabled={packaging !== 'hanger'} value={hangerQty} onChange={e => setHangerQty(e.target.value)} className="block w-24 rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-2 ring-inset ring-orange-400 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-lg sm:leading-6 min-h-[44px] text-center font-bold bg-orange-100 disabled:opacity-50" placeholder="0" />
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-[35%] bg-gray-50 flex flex-col p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-gray-200 pb-2">Billing Summary</h2>
        
        <div className="space-y-4 text-lg mb-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Wash Amount</span>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">Rs.</span>
              <input type="number" step="0.01" value={washAmount} onChange={e => setWashAmount(e.target.value)} className="w-24 bg-transparent border-b border-gray-300 text-right font-semibold focus:border-blue-500 focus:ring-0 p-0 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Dry Amount</span>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">Rs.</span>
              <input type="number" step="0.01" value={dryAmount} onChange={e => setDryAmount(e.target.value)} className="w-24 bg-transparent border-b border-gray-300 text-right font-semibold focus:border-blue-500 focus:ring-0 p-0 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Iron Amount</span>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">Rs.</span>
              <input type="number" step="0.01" value={ironAmount} onChange={e => setIronAmount(e.target.value)} className="w-24 bg-transparent border-b border-gray-300 text-right font-semibold focus:border-blue-500 focus:ring-0 p-0 outline-none" placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center text-xl">
            <span className="font-bold text-gray-800">TTL Amount</span>
            <div className="flex items-center font-bold text-gray-800">
              <span className="mr-1">Rs.</span>
              <span>{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-medium">Advance</span>
            <div className="flex items-center">
              <span className="text-gray-400 mr-1">Rs.</span>
              <input type="number" step="0.01" value={advance} onChange={e => setAdvance(e.target.value)} className="w-24 bg-gray-100 border border-gray-300 rounded px-2 py-1 text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 p-0 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center text-xl border-t border-gray-200 pt-3">
            <span className="font-bold text-green-700">Balance</span>
            <div className="flex items-center font-bold text-green-700">
              <span className="mr-1">Rs.</span>
              <span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <button disabled={isLoading} type="submit" className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg text-xl tracking-wide transition-colors min-h-[44px] disabled:opacity-70 flex justify-center items-center">
          {isLoading ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </form>
  );
}
`;

fs.writeFileSync('src/components/SupervisorIntake.tsx', code);
