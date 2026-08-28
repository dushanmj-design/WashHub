const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace Final Bill Modal
code = code.replace(
  '{/* Final Bill Modal */}\n        {finalBillPayload && (',
  '{/* Final Bill Modal */}\n        {finalBillPayload && activeTab !== "operations" && ('
);

// Replace StickerView area
code = code.replace(
  '              {/* Spool / Print Sticker Preview & Barcode Scanner */}\n              <div className="space-y-6">\n                <StickerView payload={stickerPayload} onClose={() => setStickerPayload(null)} />\n                \n              </div>',
  `              {/* Spool / Print Sticker Preview & Barcode Scanner OR Final Bill */}\n              <div className="space-y-6 flex flex-col">\n                {finalBillPayload ? (\n                  <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 relative">\n                    <div className="w-full h-full">\n                      {finalBillPayload.isSupervisor ? (\n                        <SupervisorReceipt payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />\n                      ) : (\n                        <FinalBillView payload={finalBillPayload} onClose={() => setFinalBillPayload(null)} inline />\n                      )}\n                    </div>\n                  </div>\n                ) : (\n                  <StickerView payload={stickerPayload} onClose={() => setStickerPayload(null)} />\n                )}\n              </div>`
);

fs.writeFileSync('src/App.tsx', code);
