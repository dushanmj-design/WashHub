const fs = require('fs');

let content = fs.readFileSync('src/components/SupervisorIntake.tsx', 'utf8');

// 1. Add orders to props
content = content.replace(
  'activeRole?: string;\n}',
  'activeRole?: string;\n  orders?: any[];\n}'
);

content = content.replace(
  'export default function SupervisorIntake({ onSubmit, isLoading, activeTenantId, activeRole }: SupervisorIntakeProps)',
  'export default function SupervisorIntake({ onSubmit, isLoading, activeTenantId, activeRole, orders = [] }: SupervisorIntakeProps)'
);
content = content.replace(
  'export default function SupervisorIntake({ onSubmit, isLoading }: SupervisorIntakeProps)',
  'export default function SupervisorIntake({ onSubmit, isLoading, orders = [] }: SupervisorIntakeProps)'
);

// 2. Change category to array
content = content.replace(
  "const [category, setCategory] = useState('Cloths');",
  "const [category, setCategory] = useState<string[]>(['Cloths']);\n\n  const toggleCategory = (cat: string) => {\n    setCategory(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);\n  };"
);

// 3. Update payload to use category array. (It's already `item_category: category`, which is now an array, that's fine).

// 4. Update the handleMobileChange logic
content = content.replace(
  "const [mobile, setMobile] = useState('');",
  "const [mobile, setMobile] = useState('');\n  const handleMobileChange = (val: string) => {\n    setMobile(val);\n    if (orders && val.length >= 9) {\n      const existing = orders.find(o => o.customer_mobile === val || (o.supervisor_data && o.supervisor_data.order_details && o.supervisor_data.order_details.customer && o.supervisor_data.order_details.customer.telephone === val));\n      if (existing) {\n        const foundName = existing.customer_name || (existing.supervisor_data && existing.supervisor_data.order_details && existing.supervisor_data.order_details.customer.name);\n        if (foundName) setName(foundName);\n      }\n    }\n  };"
);

// 5. Swap Phone and Name inputs, and change background to black
let headerReplacement = `
        {/* Header */}
        <header className="bg-slate-900 text-slate-100 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-wide text-white">Wash hub (Pvt) LTD.</h1>
            <div className="text-xs sm:text-sm font-semibold opacity-90 text-right">
              <div>TEL: 011-1234567</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
`;

content = content.replace(/\{\/\* Header \*\/\}[\s\S]*?<\/header>/, headerReplacement.trim());

// 6. Update Categories
let categoriesReplacement = `
          {/* Categories */}
          <section>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Item Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button type="button" onClick={() => toggleCategory('Cloths')} className={\`py-3 rounded border font-semibold transition-all \${category.includes('Cloths') ? 'bg-blue-100 border-blue-400 text-blue-800 shadow-sm ring-2 ring-blue-300 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-600'}\`}>Cloths</button>
              <button type="button" onClick={() => toggleCategory('Curtain')} className={\`py-3 rounded border font-semibold transition-all \${category.includes('Curtain') ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-sm ring-2 ring-slate-300 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-600'}\`}>Curtain</button>
              <button type="button" onClick={() => toggleCategory('Bed Sheets')} className={\`py-3 rounded border font-semibold transition-all \${category.includes('Bed Sheets') ? 'bg-purple-100 border-purple-400 text-purple-800 shadow-sm ring-2 ring-purple-300 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-600'}\`}>Bed Sheets</button>
              <button type="button" onClick={() => toggleCategory('Others')} className={\`py-3 rounded border font-semibold transition-all \${category.includes('Others') ? 'bg-slate-800 border-slate-900 text-white shadow-sm ring-2 ring-slate-600 ring-offset-1' : 'bg-slate-50 border-slate-200 text-slate-600'}\`}>Others</button>
            </div>
          </section>
`;

content = content.replace(/\{\/\* Categories \*\/\}[\s\S]*?<\/section>/, categoriesReplacement.trim());

fs.writeFileSync('src/components/SupervisorIntake.tsx', content);
