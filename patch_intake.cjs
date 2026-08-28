const fs = require('fs');
let code = fs.readFileSync('src/components/SupervisorIntake.tsx', 'utf8');

// Change outer layout to split on lg instead of md
code = code.replace(
  'className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full flex flex-col md:flex-row text-slate-800 font-sans"',
  'className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full flex flex-col lg:flex-row text-slate-800 font-sans"'
);

// Fix the right column width
code = code.replace(
  '      {/* Right Column */}\n      <div className="w-full md:w-[40%] lg:w-[35%] bg-[#f8fafc] flex flex-col p-6 sm:p-8 border-l border-slate-200">',
  '      {/* Right Column */}\n      <div className="w-full lg:w-[40%] bg-[#f8fafc] flex flex-col p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-slate-200">'
);

// Fix alignment in Totals section
const totalsOld = `<div className="mt-auto space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-xl">
            <span className="font-bold text-slate-800">TTL Amount</span>
            <div className="flex items-center font-bold text-slate-800">
              <span className="mr-2">Rs.</span>
              <span>{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-slate-600 font-medium">Advance</span>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2">Rs.</span>
              <input type="number" step="0.01" value={advance} onChange={e => setAdvance(e.target.value)} className="w-24 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center text-xl border-t border-slate-200 pt-4">
            <span className="font-bold text-emerald-600">Balance</span>
            <div className="flex items-center font-bold text-emerald-600">
              <span className="mr-2">Rs.</span>
              <span>{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>`;

const totalsNew = `<div className="mt-auto space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
        </div>`;

code = code.replace(totalsOld, totalsNew);

// Fix alignment in wash/dry/iron amounts
const amountsOld = `<div className="space-y-5 text-lg mb-8">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Wash Amount</span>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2 font-medium">Rs.</span>
              <input type="number" step="0.01" value={washAmount} onChange={e => setWashAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Dry Amount</span>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2 font-medium">Rs.</span>
              <input type="number" step="0.01" value={dryAmount} onChange={e => setDryAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-bold">Iron Amount</span>
            <div className="flex items-center">
              <span className="text-slate-400 mr-2 font-medium">Rs.</span>
              <input type="number" step="0.01" value={ironAmount} onChange={e => setIronAmount(e.target.value)} className="w-24 bg-white border border-slate-300 rounded text-right font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 px-2 py-1 outline-none" placeholder="0.00" />
            </div>
          </div>
        </div>`;

const amountsNew = `<div className="space-y-5 text-lg mb-8">
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
        </div>`;

code = code.replace(amountsOld, amountsNew);

fs.writeFileSync('src/components/SupervisorIntake.tsx', code);
