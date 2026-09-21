import React, { useState, useEffect } from 'react';
import { Wifi, X, Check, AlertCircle, RefreshCw, Printer as PrinterIcon } from 'lucide-react';
import { getSavedNetworkPrinter, saveNetworkPrinter, NetworkPrinterConfig } from '../lib/networkPrint';

interface NetworkPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  onPrinterConfigured?: (config: NetworkPrinterConfig) => void;
}

export default function NetworkPrinterModal({ isOpen, onClose, tenantId, onPrinterConfigured }: NetworkPrinterModalProps) {
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [name, setName] = useState('Workshop Network Printer');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedNetworkPrinter();
      if (saved) {
        setIpAddress(saved.ip_address || '');
        setPort(saved.port ? saved.port.toString() : '9100');
        setName(saved.name || 'Workshop Network Printer');
      }
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!ipAddress.trim()) return;
    const config: NetworkPrinterConfig = {
      name: name.trim() || 'Network Thermal Printer',
      ip_address: ipAddress.trim(),
      port: parseInt(port, 10) || 9100
    };
    saveNetworkPrinter(config);
    if (onPrinterConfigured) onPrinterConfigured(config);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!ipAddress.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid printer IP address' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Send a minimal test initialization and cut ESC/POS packet
      // ESC @ (init), text, LF, GS V 65 0 (cut)
      const testText = `[Wash Hub - Network Printer Test Connection]\nIP: ${ipAddress.trim()}:${port}\nStatus: OK\n\n\n\n`;
      const encoder = new TextEncoder();
      const rawBytes = new Uint8Array([
        0x1B, 0x40, // init
        ...Array.from(encoder.encode(testText)),
        0x1D, 0x56, 0x41, 0x10 // full cut
      ]);

      const res = await fetch('/api/printers/network-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: ipAddress.trim(),
          port: parseInt(port, 10) || 9100,
          data_base64: btoa(
            Array.from(rawBytes)
              .map((b) => String.fromCharCode(b))
              .join('')
          )
        })
      });

      const data = await res.json();
      if (res.ok && !data.error) {
        setTestResult({ success: true, message: `Connected! Test slip dispatched to ${ipAddress.trim()}:${port}` });
      } else {
        setTestResult({ success: false, message: data.error || 'Failed to reach printer on this IP.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection error' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="network-printer-modal">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl">
              <Wifi className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Network Thermal Printer</h3>
              <p className="text-xs text-slate-400">Print directly over LAN/Wi-Fi without external apps</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Printer Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Workshop Counter POS-80"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Printer IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                id="printer-ip-input"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Port
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="9100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>
          </div>

          <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-xs text-cyan-950 space-y-1">
            <p className="font-bold flex items-center gap-1 text-cyan-900">
              <PrinterIcon className="h-3.5 w-3.5" /> Direct ESC/POS Socket (Port 9100)
            </p>
            <p className="text-cyan-800 leading-relaxed">
              Thermal printers connected to your router via Ethernet or Wi-Fi will receive native ESC/POS print jobs directly with zero watermarks and perfect full-width margins.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || !ipAddress.trim()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
            id="test-network-printer-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>{isTesting ? 'Testing...' : 'Test Print'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!ipAddress.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition shadow-xs disabled:opacity-50"
              id="save-network-printer-btn"
            >
              Save Printer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
