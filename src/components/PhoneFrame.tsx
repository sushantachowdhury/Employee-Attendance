import React from 'react';
import { Wifi, BatteryMedium, MapPin } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  time?: string;
  hasGps?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  time = '9:41',
  hasGps = false,
}) => {
  return (
    <div className="relative mx-auto w-full max-w-[360px] sm:max-w-[380px] h-[720px] bg-neutral-900 border-[8px] border-neutral-800 rounded-[44px] shadow-2xl overflow-hidden flex flex-col transition-all ring-1 ring-neutral-700/50">
      {/* Top Speaker & Camera Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-neutral-950 rounded-full z-40 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-neutral-900 border border-neutral-800 mr-2" />
        <div className="w-12 h-1 bg-neutral-800 rounded-full" />
      </div>

      {/* Android/iOS Status Bar */}
      <div className="pt-4 px-6 pb-1 flex items-center justify-between text-xs text-neutral-400 font-medium select-none z-30">
        <span className="font-semibold tracking-tight text-neutral-200">{time}</span>
        <div className="flex items-center gap-1.5 text-neutral-300">
          {hasGps && <MapPin className="w-3 h-3 text-blue-400 animate-pulse" />}
          <Wifi className="w-3.5 h-3.5" />
          <BatteryMedium className="w-4 h-4" />
        </div>
      </div>

      {/* Screen Content Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col p-4 bg-neutral-900 text-neutral-100">
        {children}
      </div>

      {/* Home Indicator Bar */}
      <div className="py-2 flex justify-center bg-neutral-900 z-30">
        <div className="w-32 h-1 bg-neutral-600 rounded-full opacity-60" />
      </div>
    </div>
  );
};
