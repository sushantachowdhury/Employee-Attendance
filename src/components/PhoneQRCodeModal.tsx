import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, QrCode, Copy, Check, ExternalLink, Compass, ShieldCheck } from 'lucide-react';

interface PhoneQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneQRCodeModal: React.FC<PhoneQRCodeModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#185FA5',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate QR code', err));
    }
  }, [isOpen, currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
        >
          ✕
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          Open on Your Phone in Real-Time
        </h3>
        <p className="text-xs text-neutral-400 mb-4 max-w-xs mx-auto">
          Scan this QR code with your phone camera to test live GPS dot movement and selfie check-in directly in your hands!
        </p>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mb-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Scan QR code to open on phone"
              className="w-56 h-56 mx-auto rounded-lg"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-neutral-400 text-xs">
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-left bg-neutral-850 border border-neutral-800 rounded-xl p-3 mb-4 text-xs text-neutral-300 space-y-1.5">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-blue-400" />
            How to test the Real-Time Dot:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px]">
            <li>Scan QR with your iPhone / Android camera & tap the link.</li>
            <li>Allow location & camera permissions when prompted.</li>
            <li>
              Tap <strong className="text-blue-300">"Set Current GPS as Office"</strong> so your exact spot becomes the office center.
            </li>
            <li>
              Walk 10m–60m: watch the blue dot live-track your movement and unlock/lock at the 50m line!
            </li>
          </ol>
        </div>

        {/* Copy Link Button */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                Copied Link!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                Copy URL Link
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
