import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, AlertTriangle, Send, RefreshCw, X, Shield, Smartphone } from 'lucide-react';
import { apiFetch } from '../lib/offlineSync';

interface SmsGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmsGatewayModal({ isOpen, onClose }: SmsGatewayModalProps) {
  const [loading, setLoading] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [testPhone, setTestPhone] = useState('94770000000');
  const [testMessage, setTestMessage] = useState('Wash Hub: Hello! Your laundry order is READY FOR PICKUP.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/sms/status');
      const data = await res.json();
      setGatewayStatus(data);
    } catch (err: any) {
      setGatewayStatus({ online: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await apiFetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage
        })
      });
      const data = await res.json();
      setTestResult(data);
      // Refresh status after test
      fetchStatus();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-500/20 text-cyan-400 p-2 rounded-xl">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">SMSGo Gateway (Sri Lanka)</h3>
              <p className="text-xs text-slate-400">
                {gatewayStatus?.isSandbox ? 'Sandbox API Integration' : 'Live Production Gateway'} Status & Diagnostics
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Overview Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gateway Status</span>
              <button 
                onClick={fetchStatus} 
                disabled={loading}
                className="text-xs text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Connection</span>
                <span className="font-bold text-sm text-emerald-600 flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {gatewayStatus?.online ? 'Connected (Online)' : 'Checking...'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Account Balance</span>
                <span className="font-bold text-sm text-slate-800 font-mono mt-0.5 block">
                  {gatewayStatus?.balance !== null && gatewayStatus?.balance !== undefined 
                    ? `Rs. ${gatewayStatus.balance.toLocaleString()} ${gatewayStatus.currency || 'LKR'}`
                    : 'Loading...'}
                </span>
              </div>
            </div>

            {/* Key and Environment Details */}
            <div className="text-xs space-y-1.5 pt-1 border-t border-slate-200">
              <div className="flex justify-between items-center text-slate-600">
                <span>Active Environment:</span>
                <span className={`font-bold px-2 py-0.5 rounded border text-[11px] ${
                  gatewayStatus?.isSandbox 
                    ? 'text-amber-700 bg-amber-50 border-amber-200' 
                    : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                }`}>
                  {gatewayStatus?.isSandbox ? 'Sandbox (Testing)' : 'Live Production'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Active API Key:</span>
                <span className="font-mono text-[11px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {gatewayStatus?.apiKeyPreview || (gatewayStatus?.isSandbox ? 'sg_test_fe28...659d7d' : 'sg_live_...')}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Approved Sender Masks:</span>
                <span className="font-semibold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {gatewayStatus?.masks && gatewayStatus.masks.length > 0 
                    ? gatewayStatus.masks.join(', ') 
                    : 'None yet registered'}
                </span>
              </div>
            </div>

            {/* Regulatory Sender Mask Notice */}
            {(!gatewayStatus?.masks || gatewayStatus.masks.length === 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Sender Mask Required by SMSGo:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Per Sri Lankan telecommunication regulations (TRCSL), SMSGo requires an approved <strong>Sender Mask</strong> (e.g. <code className="bg-amber-100 px-1 rounded">WashHub</code> or <code className="bg-amber-100 px-1 rounded">Cycleon</code>) registered in your <strong>smsgo.lk dashboard</strong> under <em>Settings &gt; Sender Masks</em>.
                </p>
                <p className="text-[10px] text-amber-700 italic">
                  Once your mask is submitted and approved by SMSGo, SMS notifications trigger seamlessly to customer handsets on every QR scan!
                </p>
              </div>
            )}
          </div>

          {/* Test SMS Dispatcher */}
          <form onSubmit={handleSendTest} className="space-y-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-cyan-600" />
              <span>Test SMS Dispatch</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Recipient Mobile (Sri Lanka format or Sandbox Number)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 94770000000 or 0771234567"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-cyan-500 outline-none"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: <code className="font-mono bg-slate-100 px-1 rounded">94770000000</code> is the official SMSGo Sandbox test number.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Test Message Text
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Dispatching through api.smsgo.lk...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test SMS via SMSGo</span>
                </>
              )}
            </button>

            {/* Test Result Display */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs animate-fade-in ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>SMS Successfully Sent via SMSGo!</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>SMSGo Gateway Response</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed">
                  {testResult.success 
                    ? `Message dispatched to ${testResult.phone}. Gateway confirmation received.`
                    : (testResult.error || 'Failed to dispatch test message')}
                </p>
                {testResult.response && (
                  <pre className="mt-2 p-2 bg-black/5 rounded text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(testResult.response, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </form>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
