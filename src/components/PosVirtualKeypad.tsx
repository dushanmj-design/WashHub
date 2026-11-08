import React from 'react';
import { Delete, Check, X, ArrowRight, CornerDownLeft } from 'lucide-react';

interface PosVirtualKeypadProps {
  isOpen: boolean;
  mode: 'numeric' | 'text';
  fieldName: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onNext?: () => void;
}

export default function PosVirtualKeypad({
  isOpen,
  mode,
  fieldName,
  value,
  onChange,
  onClose,
  onNext
}: PosVirtualKeypadProps) {
  if (!isOpen) return null;

  const handleKeyClick = (char: string) => {
    onChange((value || '') + char);
  };

  const handleBackspace = () => {
    if (!value || value.length === 0) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange('');
  };

  const qwertyRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[250] bg-slate-900/95 backdrop-blur-md border-t-2 border-cyan-500 shadow-2xl p-2 sm:p-3 animate-slide-up text-white select-none">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        
        {/* Top Preview Bar */}
        <div className="flex items-center justify-between bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider shrink-0">
              {fieldName}:
            </span>
            <span className="font-mono text-base font-bold text-white truncate min-h-[24px]">
              {value || <span className="text-slate-500 italic text-sm">tap keys below...</span>}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
              title="Close Keypad"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* KEYPAD BODY */}
        {mode === 'numeric' ? (
          /* NUMERIC KEYPAD (Optimized for POS Phone/Money/Weight) */
          <div className="grid grid-cols-4 gap-2">
            {/* Left 3 columns: Numbers 1-9, ., 0 */}
            <div className="col-span-3 grid grid-cols-3 gap-2">
              {[
                '1', '2', '3',
                '4', '5', '6',
                '7', '8', '9',
                '.', '0', '00'
              ].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyClick(k)}
                  className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold text-xl sm:text-2xl rounded-xl border border-slate-700 shadow-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
                >
                  {k}
                </button>
              ))}
            </div>

            {/* Right column: Action keys (Backspace, Next, Done) */}
            <div className="col-span-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 sm:h-14 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-6 h-6" />
              </button>

              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="h-12 sm:h-14 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-xl font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer text-sm"
                  title="Next Field"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border border-emerald-400 text-white rounded-xl font-black text-lg flex flex-col items-center justify-center shadow-lg shadow-emerald-950 transition active:scale-95 cursor-pointer"
                title="Done / Enter"
              >
                <Check className="w-7 h-7 stroke-[3]" />
                <span className="text-[11px] uppercase tracking-wider font-extrabold">OK</span>
              </button>
            </div>
          </div>
        ) : (
          /* TEXT KEYPAD (For Customer Name) */
          <div className="flex flex-col gap-1.5">
            {qwertyRows.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-1.5 sm:gap-2">
                {row.map((char) => (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleKeyClick(char)}
                    className="flex-1 max-w-[54px] h-10 sm:h-12 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 text-white font-bold text-base sm:text-lg rounded-lg border border-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                  >
                    {char}
                  </button>
                ))}
              </div>
            ))}

            {/* Bottom Row: Space, Backspace, Done */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleKeyClick(' ')}
                className="flex-1 max-w-sm h-11 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 font-bold text-sm rounded-lg border border-slate-700 flex items-center justify-center uppercase tracking-wider cursor-pointer"
              >
                SPACE
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="w-14 sm:w-16 h-11 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg flex items-center justify-center cursor-pointer"
                title="Backspace"
              >
                <Delete className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 h-11 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-black text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>OK / DONE</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
