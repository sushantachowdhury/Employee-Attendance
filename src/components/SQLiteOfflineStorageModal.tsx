import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Code2,
  HardDrive,
  ArrowRight,
  Shield,
  Smartphone,
} from 'lucide-react';
import {
  getAllSQLiteRecords,
  getPendingSyncRecords,
  syncPendingSQLiteRecords,
  clearSQLiteDatabase,
  isSimulatedOffline,
  setSimulatedOffline,
  SQLITE_SCHEMA_DDL,
  SQLiteAttendanceRecord,
} from '../utils/sqliteStorage';

interface SQLiteOfflineStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SQLiteOfflineStorageModal: React.FC<SQLiteOfflineStorageModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [records, setRecords] = useState<SQLiteAttendanceRecord[]>([]);
  const [offlineMode, setOfflineMode] = useState(isSimulatedOffline());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'expo_code'>('records');
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    setRecords(getAllSQLiteRecords());
    setOfflineMode(isSimulatedOffline());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('sqlite-records-updated', handleUpdate);
    window.addEventListener('offline-mode-changed', handleUpdate);
    return () => {
      window.removeEventListener('sqlite-records-updated', handleUpdate);
      window.removeEventListener('offline-mode-changed', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const pendingCount = records.filter((r) => r.sync_status === 'PENDING_SYNC').length;
  const syncedCount = records.filter((r) => r.sync_status === 'SYNCED').length;

  const handleToggleOffline = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    setSimulatedOffline(next);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncPendingSQLiteRecords();
      setSyncResult(
        `Successfully synced ${result.syncedCount} record(s) to backend!` +
          (result.failedCount > 0 ? ` (${result.failedCount} failed)` : '')
      );
      loadData();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all local SQLite attendance records from this device?')) {
      clearSQLiteDatabase();
      loadData();
      setSyncResult('Local SQLite database cleared.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expoQuickSnippet = `// 1. Install Expo SQLite
npx expo install expo-sqlite @react-native-community/netinfo

// 2. Open DB and create local table
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('employee_attendance.db');

await db.execAsync(\`
  CREATE TABLE IF NOT EXISTS local_attendance (
    id TEXT PRIMARY KEY,
    emp_id TEXT NOT NULL,
    attendance_date TEXT NOT NULL,
    check_in_time TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    distance_m REAL NOT NULL,
    selfie_image_path TEXT NOT NULL,
    status TEXT NOT NULL,
    sync_status TEXT DEFAULT 'PENDING_SYNC',
    created_at INTEGER NOT NULL
  );
\`);

// 3. Save offline punch
await db.runAsync(
  'INSERT INTO local_attendance VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [id, empId, date, time, lat, lon, dist, selfieUri, 'Present', 'PENDING_SYNC', Date.now()]
);`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-800/80 text-purple-300 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  Local SQLite Storage & Offline Sync
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                  Expo SQLite
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Persistent on-device SQLite database for offline attendance recording
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Offline Mode Switcher & Stats Bar */}
        <div className="p-4 bg-neutral-950/40 border-b border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Offline Toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
            <div className="flex items-center gap-2">
              {offlineMode ? (
                <WifiOff className="w-4 h-4 text-amber-400" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-400" />
              )}
              <div>
                <div className="font-semibold text-white">
                  {offlineMode ? 'Simulated Offline Mode' : 'Online Mode'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {offlineMode
                    ? 'Check-ins saved to SQLite (Pending sync)'
                    : 'Check-ins sync directly to REST API'}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleOffline}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                offlineMode
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              {offlineMode ? 'Go Online' : 'Go Offline'}
            </button>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-neutral-400">Pending:</span>
              <span className="font-bold text-amber-400">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-neutral-400">Synced:</span>
              <span className="font-bold text-emerald-400">{syncedCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-800 px-4 pt-2 bg-neutral-950/20 text-xs">
          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition ${
              activeTab === 'records'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>SQLite Records ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition ${
              activeTab === 'schema'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQLite Schema (DDL)</span>
          </button>

          <button
            onClick={() => setActiveTab('expo_code')}
            className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium transition ${
              activeTab === 'expo_code'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Expo React Native Code</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {syncResult && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/80 text-purple-200 text-xs flex items-center justify-between">
              <span>{syncResult}</span>
              <button
                onClick={() => setSyncResult(null)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-800 rounded-2xl p-6">
                  <Database className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-300">
                    No Local SQLite Records Yet
                  </p>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                    Toggle <strong>Simulate Offline Mode</strong> above, then punch attendance on the
                    mobile simulator. The check-in will be saved into local device SQLite storage.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        {r.selfie_image_path ? (
                          <img
                            src={r.selfie_image_path}
                            alt={r.employee_name}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-800 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                            <Smartphone className="w-5 h-5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white">{r.employee_name}</span>
                            <span className="font-mono text-[10px] text-neutral-400">
                              ({r.emp_id})
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span>{r.attendance_date}</span>
                            <span>•</span>
                            <span>{r.check_in_time}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-mono">{r.distance_m} m</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {r.sync_status === 'PENDING_SYNC' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Pending Sync
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Synced to API
                          </span>
                        )}
                        <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                          ID: {r.id.substring(0, 10)}...
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>SQLite Table Definition: <code>local_attendance</code></span>
                <button
                  onClick={() => copyToClipboard(SQLITE_SCHEMA_DDL)}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-[11px] font-mono text-purple-300 overflow-x-auto">
                {SQLITE_SCHEMA_DDL}
              </pre>
            </div>
          )}

          {activeTab === 'expo_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Expo SQLite React Native Integration Snippet</span>
                <button
                  onClick={() => copyToClipboard(expoQuickSnippet)}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-[11px] font-mono text-neutral-300 overflow-x-auto">
                {expoQuickSnippet}
              </pre>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 text-xs text-neutral-400 space-y-1">
                <p className="font-semibold text-white">Full Services Provided in Codebase:</p>
                <p>• <code>/attendance-mobile/src/services/sqlite.ts</code> — Full typed CRUD service with openDatabaseAsync & PRAGMA WAL.</p>
                <p>• <code>/attendance-mobile/src/services/offlineSync.ts</code> — Background NetInfo worker auto-syncing upon reconnection.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <button
            onClick={handleClearAll}
            disabled={records.length === 0}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-40 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local SQLite</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition"
            >
              Close
            </button>

            <button
              onClick={handleSyncNow}
              disabled={syncing || pendingCount === 0 || offlineMode}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold disabled:opacity-40 shadow-md transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>
                {syncing
                  ? 'Syncing to Backend...'
                  : offlineMode
                  ? 'Go Online to Sync'
                  : `Sync Now (${pendingCount} Pending)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
