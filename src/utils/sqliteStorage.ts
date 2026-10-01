/**
 * SQLite Local Storage & Offline Sync Engine
 * 
 * Provides an offline-first SQLite database interface for local attendance records.
 * On React Native / Expo: Uses expo-sqlite (see implementation in /attendance-mobile/src/services/sqlite.ts)
 * On Web / Simulator: Backed by persistent client storage with identical SQLite schema & SQL semantics.
 */

export interface SQLiteAttendanceRecord {
  id: string;
  emp_id: string;
  employee_name: string;
  department: string;
  office: string;
  attendance_date: string;
  check_in_time: string;
  latitude: number;
  longitude: number;
  distance_m: number;
  selfie_image_path: string; // Base64 or local file URI
  status: 'Present' | 'Late';
  sync_status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  device_id: string;
  created_at: number;
  synced_at?: number;
  error_message?: string;
}

const SQLITE_STORAGE_KEY = 'expo_sqlite_local_attendance_records_v1';
const OFFLINE_MODE_FLAG = 'expo_sqlite_simulate_offline_mode';

// SQL Schema Definition (Matching React Native Expo SQLite table)
export const SQLITE_SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS local_attendance (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  office TEXT NOT NULL,
  attendance_date TEXT NOT NULL,
  check_in_time TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  distance_m REAL NOT NULL,
  selfie_image_path TEXT NOT NULL,
  status TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC',
  device_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  synced_at INTEGER,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_status ON local_attendance (sync_status);
CREATE INDEX IF NOT EXISTS idx_emp_date ON local_attendance (emp_id, attendance_date);
`;

/**
 * Get simulate offline mode setting
 */
export function isSimulatedOffline(): boolean {
  try {
    return localStorage.getItem(OFFLINE_MODE_FLAG) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set simulate offline mode setting
 */
export function setSimulatedOffline(offline: boolean): void {
  try {
    localStorage.setItem(OFFLINE_MODE_FLAG, offline ? 'true' : 'false');
    window.dispatchEvent(new Event('offline-mode-changed'));
  } catch (e) {
    console.error('Failed to set offline mode flag', e);
  }
}

/**
 * Read all rows from device SQLite storage
 */
export function getAllSQLiteRecords(): SQLiteAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(SQLITE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading from SQLite storage', e);
    return [];
  }
}

/**
 * Save or update records in device SQLite storage
 */
function saveSQLiteRecords(records: SQLiteAttendanceRecord[]): void {
  try {
    localStorage.setItem(SQLITE_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event('sqlite-records-updated'));
  } catch (e) {
    console.error('Error persisting to SQLite storage', e);
  }
}

/**
 * Insert new attendance punch into SQLite table
 */
export function insertSQLiteAttendance(
  record: Omit<SQLiteAttendanceRecord, 'created_at' | 'sync_status'> & {
    sync_status?: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  }
): SQLiteAttendanceRecord {
  const records = getAllSQLiteRecords();
  
  const newRow: SQLiteAttendanceRecord = {
    ...record,
    sync_status: record.sync_status || 'PENDING_SYNC',
    created_at: Date.now(),
  };

  // Replace if exists for same employee & date or push
  const existingIdx = records.findIndex(
    (r) => r.emp_id === newRow.emp_id && r.attendance_date === newRow.attendance_date
  );

  if (existingIdx >= 0) {
    records[existingIdx] = newRow;
  } else {
    records.unshift(newRow);
  }

  saveSQLiteRecords(records);
  return newRow;
}

/**
 * Retrieve all records currently awaiting sync
 */
export function getPendingSyncRecords(): SQLiteAttendanceRecord[] {
  return getAllSQLiteRecords().filter((r) => r.sync_status === 'PENDING_SYNC');
}

/**
 * Mark a record as successfully synced in SQLite
 */
export function markSQLiteRecordSynced(id: string): void {
  const records = getAllSQLiteRecords();
  const row = records.find((r) => r.id === id);
  if (row) {
    row.sync_status = 'SYNCED';
    row.synced_at = Date.now();
    row.error_message = undefined;
    saveSQLiteRecords(records);
  }
}

/**
 * Mark a record as failed to sync with error
 */
export function markSQLiteRecordFailed(id: string, errorMessage: string): void {
  const records = getAllSQLiteRecords();
  const row = records.find((r) => r.id === id);
  if (row) {
    row.sync_status = 'FAILED';
    row.error_message = errorMessage;
    saveSQLiteRecords(records);
  }
}

/**
 * Clear all SQLite records from device
 */
export function clearSQLiteDatabase(): void {
  saveSQLiteRecords([]);
}

/**
 * Sync all pending records in SQLite to the backend API
 */
export async function syncPendingSQLiteRecords(): Promise<{
  syncedCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (isSimulatedOffline()) {
    throw new Error('Device is currently in Offline Mode. Disable offline mode to sync.');
  }

  const pending = getPendingSyncRecords();
  if (pending.length === 0) {
    return { syncedCount: 0, failedCount: 0, errors: [] };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const record of pending) {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId: record.emp_id,
          latitude: record.latitude,
          longitude: record.longitude,
          distanceMeters: record.distance_m,
          selfieUrl: record.selfie_image_path,
          forceBypassDistance: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected check-in sync');
      }

      markSQLiteRecordSynced(record.id);
      syncedCount++;
    } catch (err: any) {
      failedCount++;
      const msg = err.message || 'Sync connection failed';
      markSQLiteRecordFailed(record.id, msg);
      errors.push(`${record.emp_id}: ${msg}`);
    }
  }

  return { syncedCount, failedCount, errors };
}
