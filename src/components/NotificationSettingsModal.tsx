import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Send,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  notifyCheckInSuccess,
  notifyWithinRange,
  notifyCheckInReminder,
  isNotificationSupported,
} from '../utils/notifications';
import { AuthUser, OfficeConfig } from '../types/attendance';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  office: OfficeConfig;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  office,
}) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [reminderTime, setReminderTime] = useState('09:15');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [confirmationEnabled, setConfirmationEnabled] = useState(true);
  const [proximityEnabled, setProximityEnabled] = useState(true);
  const [testSent, setTestSent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleSendReminderTest = () => {
    notifyCheckInReminder(
      user?.name || 'Amit Das',
      office.name,
      office.lateThreshold
    );
    setTestSent('reminder');
    setTimeout(() => setTestSent(null), 3000);
  };

  const handleSendSuccessTest = () => {
    notifyCheckInSuccess(
      user?.name || 'Amit Das',
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      32,
      office.name,
      'Present'
    );
    setTestSent('success');
    setTimeout(() => setTestSent(null), 3000);
  };

  const handleSendProximityTest = () => {
    notifyWithinRange(office.name, 28);
    setTestSent('proximity');
    setTimeout(() => setTestSent(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Browser Push Notifications
              </h2>
              <p className="text-xs text-neutral-400">
                Alert employees when it's time to check in & confirm processed attendance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-neutral-300">
          {/* Permission Status Banner */}
          <div className="p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-white text-xs mb-0.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Browser Permission Status:
              </p>
              <p className="text-[11px] text-neutral-400">
                {permission === 'granted' ? (
                  <span className="text-green-400 font-medium">
                    ✓ Allowed — notifications will pop up on your OS & phone lockscreen.
                  </span>
                ) : permission === 'denied' ? (
                  <span className="text-red-400 font-medium">
                    ✕ Blocked in browser settings (In-app notification banners still active).
                  </span>
                ) : (
                  <span>Permissions not granted yet. Click Enable to receive push alerts.</span>
                )}
              </p>
            </div>

            {permission !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs whitespace-nowrap shadow-sm transition active:scale-95"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* Notification Alert Rules */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs">Automated Notification Rules:</h4>

            {/* Rule 1: Time to Check In Reminder */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-xs">
                      Shift Start & Morning Reminder
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Alerts employee before shift threshold ({office.lateThreshold})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className="text-neutral-400 hover:text-white"
                >
                  {reminderEnabled ? (
                    <ToggleRight className="w-6 h-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-neutral-600" />
                  )}
                </button>
              </div>

              {reminderEnabled && (
                <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px]">
                  <span className="text-neutral-400">Alert employee at:</span>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-neutral-850 border border-neutral-700 rounded-lg px-2 py-1 text-white text-xs outline-none"
                  />
                </div>
              )}
            </div>

            {/* Rule 2: Check-In Confirmation Processed */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-950 text-green-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">
                    Attendance Processed Confirmation
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Immediately notifies employee of verified time, office & distance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmationEnabled(!confirmationEnabled)}
                className="text-neutral-400 hover:text-white"
              >
                {confirmationEnabled ? (
                  <ToggleRight className="w-6 h-6 text-green-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-neutral-600" />
                )}
              </button>
            </div>

            {/* Rule 3: 50m Office Range Proximity */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-white text-xs">
                    Office Geofence Proximity Alert
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Alerts when employee's phone enters the {office.radiusMeters}m perimeter
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProximityEnabled(!proximityEnabled)}
                className="text-neutral-400 hover:text-white"
              >
                {proximityEnabled ? (
                  <ToggleRight className="w-6 h-6 text-amber-400" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-neutral-600" />
                )}
              </button>
            </div>
          </div>

          {/* Test Action Buttons */}
          <div className="p-3.5 bg-neutral-850 border border-neutral-800 rounded-2xl space-y-2.5">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Test Push Notifications Right Now:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendReminderTest}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-white text-xs group-hover:text-blue-300">
                    ⏰ Test "Time to Check In"
                  </p>
                  <p className="text-[10px] text-neutral-400">Shift reminder popup</p>
                </div>
                <Send className="w-3.5 h-3.5 text-neutral-400 group-hover:text-blue-300" />
              </button>

              <button
                type="button"
                onClick={handleSendSuccessTest}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-left transition flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-white text-xs group-hover:text-green-300">
                    ✅ Test "Check-In Confirmed"
                  </p>
                  <p className="text-[10px] text-neutral-400">Success receipt popup</p>
                </div>
                <Send className="w-3.5 h-3.5 text-neutral-400 group-hover:text-green-300" />
              </button>
            </div>
            {testSent && (
              <p className="text-center text-[11px] text-green-400 font-semibold animate-fade-in">
                Notification dispatched to browser & banner!
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-xs">
          <span className="text-neutral-400">
            Works across Android phones, laptops, and desktop browsers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
