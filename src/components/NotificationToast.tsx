import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { InAppToast, subscribeToToasts } from '../utils/notifications';

export const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((toast) => {
      setToasts((prev) => [toast, ...prev].slice(0, 3)); // Keep max 3 at a time

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== toast.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-fade-in ${
            toast.type === 'success'
              ? 'bg-neutral-900/95 border-green-700/80 text-white shadow-green-950/40'
              : toast.type === 'warning'
              ? 'bg-neutral-900/95 border-amber-700/80 text-white shadow-amber-950/40'
              : 'bg-neutral-900/95 border-blue-700/80 text-white shadow-blue-950/40'
          }`}
        >
          {/* Icon */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              toast.type === 'success'
                ? 'bg-green-950 text-green-400'
                : toast.type === 'warning'
                ? 'bg-amber-950 text-amber-400'
                : 'bg-blue-950 text-blue-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : toast.type === 'warning' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5 animate-bounce" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="font-bold text-xs text-white truncate">{toast.title}</h4>
              <span className="text-[10px] text-neutral-400 font-mono ml-2">
                {toast.timestamp}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-snug break-words">
              {toast.body}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="w-6 h-6 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
