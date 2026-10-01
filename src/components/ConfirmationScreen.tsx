import React, { useEffect, useState } from 'react';
import { Check, Calendar, Clock, MapPin, UserCheck, Eye, Database, RefreshCw, WifiOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord } from '../types/attendance';
import { syncPendingSQLiteRecords } from '../utils/sqliteStorage';

interface ConfirmationScreenProps {
  record: AttendanceRecord & { isOfflineStored?: boolean; syncStatus?: string };
  onDone: () => void;
  onViewReports?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  record,
  onDone,
  onViewReports,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(!record.isOfflineStored);

  // Fire celebration confetti when checked in
  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#185FA5', '#3B6D11', '#60A5FA', '#34D399'],
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncPendingSQLiteRecords();
      setIsSynced(true);
    } catch (err: any) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 animate-fade-in">
      {/* Top Success Badge - Screen 6 (5) */}
      <div className="text-center mt-2 mb-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#EAF3DE] text-[#3B6D11] flex items-center justify-center shadow-md animate-scale-in">
          <Check className="w-9 h-9 stroke-[3]" />
        </div>
        <h2 className="text-lg font-bold text-white mt-2.5 mb-0.5 tracking-tight">
          Checked in
        </h2>
        <p className="text-xs text-neutral-400">Attendance recorded</p>

        {/* Offline SQLite Notice Badge */}
        {!isSynced ? (
          <div className="mt-2 mx-auto max-w-[260px] bg-amber-950/60 border border-amber-800 rounded-xl p-2 text-left flex items-start gap-2">
            <Database className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px]">
              <span className="font-semibold text-amber-300 block">
                Saved to Local SQLite
              </span>
              <span className="text-neutral-300">
                Offline mode active. Record will sync automatically when online.
              </span>
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={syncing}
                className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-700 hover:bg-amber-600 text-white font-medium text-[10px] transition"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync to Server Now'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${
                record.status === 'Present'
                  ? 'bg-green-950 text-green-300 border border-green-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              Status: {record.status}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1">
              <Database className="w-3 h-3" /> SQLite Stored
            </span>
          </div>
        )}
      </div>

      {/* Confirmation Detail Cards matching Document 1 Screen 6 */}
      <div className="space-y-2.5 my-auto">
        {/* Date Card */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">Date</p>
            <p className="text-sm font-semibold text-white">
              Thursday, 1 Oct 2026
            </p>
          </div>
          <Calendar className="w-4 h-4 text-neutral-500" />
        </div>

        {/* Check-in Time Card */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">
              Check-in time
            </p>
            <p className="text-sm font-semibold text-white">
              {record.checkInTime || '09:42 AM'}
            </p>
          </div>
          <Clock className="w-4 h-4 text-neutral-500" />
        </div>

        {/* Location Card */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">
              Location
            </p>
            <p className="text-sm font-semibold text-white">
              {record.office || 'Head office'}, {record.distanceMeters || 32} m
            </p>
          </div>
          <MapPin className="w-4 h-4 text-green-500" />
        </div>

        {/* Selfie Snapshot Thumbnail */}
        {record.selfieUrl && (
          <div className="bg-neutral-800/40 border border-neutral-800 rounded-xl p-2.5 flex items-center gap-3">
            <img
              src={record.selfieUrl}
              alt="Selfie"
              className="w-10 h-10 rounded-lg object-cover border border-neutral-700 shadow-sm"
            />
            <div className="text-left text-xs">
              <p className="text-neutral-300 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                Biometric Selfie Verified
              </p>
              <p className="text-[10px] text-neutral-400">
                Face geometry matched with ID
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Done & Report Actions */}
      <div className="space-y-2 mt-4">
        <button
          type="button"
          onClick={onDone}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-semibold py-3 rounded-xl text-sm transition active:scale-[0.98]"
        >
          Done
        </button>

        {onViewReports && (
          <button
            type="button"
            onClick={onViewReports}
            className="w-full text-xs text-blue-400 hover:text-blue-300 py-1.5 flex items-center justify-center gap-1 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            View Attendance Report (Document 2)
          </button>
        )}
      </div>
    </div>
  );
};
