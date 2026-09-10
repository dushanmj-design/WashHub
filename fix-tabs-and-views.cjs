const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The file currently has:
//           <button
//             onClick={() => setActiveTab('ledger')}
//             ...
//           >
//             <Coins className="h-4 w-4" />
//             <span>Cash Drawer Book</span>
//           </button>
//
//           
//           {/* REPORTS TAB */}

// We need to restore the Admin Console button, close the tabs-bar div, 
// add the Reports button in the tabs bar BEFORE closing it,
// and then add the operations, scan, and billing views.

// Let's find "<span>Cash Drawer Book</span>\n          </button>"
const searchStr = "<span>Cash Drawer Book</span>\n          </button>";
const restoreHtml = `<span>Cash Drawer Book</span>
          </button>

          {(activeRole === 'admin' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('reports')}
              className={\`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer \${
                activeTab === 'reports'
                  ? 'border-cyan-600 text-cyan-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }\`}
            >
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </button>
          )}

          {(activeRole === 'admin' || activeRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={\`py-2.5 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer \${
                activeTab === 'dashboard'
                  ? 'border-cyan-600 text-cyan-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }\`}
              id="tab-admin"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Admin Console</span>
            </button>
          )}
        </div>

        {/* 1. OPERATIONS TAB */}
        {activeTab === 'operations' && (
          <div className="flex flex-col lg:flex-row gap-6 p-4 animate-fade-in" id="ops-view">
            {/* Left Column - Form */}
            <div className="flex-1">
              {activeRole === 'supervisor' ? (
                <SupervisorIntake 
                  onSubmit={handleSupervisorIntake}
                  isLoading={isActionLoading}
                  activeTenantId={activeTenant?.id}
                  activeRole={activeRole}
                  orders={orders}
                />
              ) : (
                <OrderIntake 
                  onSubmit={handleOrderIntake} 
                  isLoading={isActionLoading} 
                  activeTenantId={activeTenant?.id} 
                />
              )}
            </div>

            {/* Right Column - Auto Sticker / Receipt Panel */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="flex flex-col h-[calc(100vh-12rem)] sticky top-6">
                {finalBillPayload ? (
                  <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">
                    <div className="w-full h-full">
                      {finalBillPayload.isSupervisor ? (
                        <SupervisorReceipt payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />
                      ) : (
                        <FinalBillView payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />
                      )}
                    </div>
                  </div>
                ) : (
                  <StickerView payload={stickerPayload} onClose={() => setStickerPayload(null)} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. SCAN TAB */}
        {activeTab === 'scan' && (
          <div className="animate-fade-in p-4" id="scan-view">
            <BarcodeScanner onScan={handleScanBarcode} isLoading={isActionLoading} orders={orders} />
          </div>
        )}

        {/* BILLING DESK */}
        {activeTab === 'billing' && (
          <div className="animate-fade-in p-4" id="billing-view">
            <BillingCheckout 
              orders={orders} 
              onCloseOrder={handleCloseOrder} 
              isLoading={isActionLoading} 
            />
          </div>
        )}`;

content = content.replace(searchStr, restoreHtml);
fs.writeFileSync('src/App.tsx', content);
