import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanned = useRef(false);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode('reader');
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      (decodedText) => {
        if (!isScanned.current) {
          isScanned.current = true;
          onScan(decodedText);
        }
      },
      (errorMessage) => {
        // ignore scan errors
      }
    ).catch((err) => {
      console.error("Error starting scanner", err);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error).then(() => {
          scannerRef.current?.clear();
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Scan QR Code</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 font-bold p-1">Close</button>
        </div>
        <div className="p-4 bg-black">
          <div id="reader" className="w-full text-white overflow-hidden rounded-xl bg-black min-h-[300px]"></div>
        </div>
        <div className="p-4 text-center text-xs text-slate-500">
          Point the back camera at a printed QR label to automatically scan.
        </div>
      </div>
    </div>
  );
}
