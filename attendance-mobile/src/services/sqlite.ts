/**
 * Expo SQLite Local Storage Implementation for React Native
 * 
 * Package: expo-sqlite (~14.0.0 or higher / modern next-gen API)
 * Install: npx expo install expo-sqlite
 * 
 * Stores employee attendance records locally on iOS/Android device
 * when connectivity is weak or offline before syncing with backend.
 */

import * as SQLite from 'expo-sqlite';

export interface LocalAttendanceEntity {
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
  selfie_image_path: string; // Local file URI (file:///data/user/...)
  status: 'Present' | 'Late';
  sync_status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  device_id: string;
  created_at: number;
  synced_at?: number | null;
  error_message?: string | null;
}

const DATABASE_NAME = 'employee_attendance.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Open or initialize local SQLite database connection
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  
  // Expo SQLite modern async connection
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  
  // Initialize table & indexes
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    CREATE TABLE IF NOT EXISTS local_attendance (
      id TEXT PRIMARY KEY NOT NULL,
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
  `);

  dbInstance = db;
  return db;
}

/**
 * Insert or replace attendance punch into local device SQLite
 */
export async function insertLocalAttendance(
  record: Omit<LocalAttendanceEntity, 'created_at' | 'sync_status'> & {
    sync_status?: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  }
): Promise<LocalAttendanceEntity> {
  const db = await getDatabase();
  const createdAt = Date.now();
  const syncStatus = record.sync_status || 'PENDING_SYNC';

  await db.runAsync(
    `INSERT OR REPLACE INTO local_attendance (
      id, emp_id, employee_name, department, office,
      attendance_date, check_in_time, latitude, longitude,
      distance_m, selfie_image_path, status, sync_status,
      device_id, created_at, synced_at, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.emp_id,
      record.employee_name,
      record.department,
      record.office,
      record.attendance_date,
      record.check_in_time,
      record.latitude,
      record.longitude,
      record.distance_m,
      record.selfie_image_path,
      record.status,
      syncStatus,
      record.device_id,
      createdAt,
      record.synced_at || null,
      record.error_message || null,
    ]
  );

  return {
    ...record,
    sync_status: syncStatus,
    created_at: createdAt,
  };
}

/**
 * Get all unsynced records awaiting transmission to server
 */
export async function getPendingSyncRecords(): Promise<LocalAttendanceEntity[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LocalAttendanceEntity>(
    `SELECT * FROM local_attendance WHERE sync_status = 'PENDING_SYNC' ORDER BY created_at ASC`
  );
  return rows;
}

/**
 * Mark record as successfully synced after API returns 200 OK
 */
export async function markRecordAsSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_attendance SET sync_status = 'SYNCED', synced_at = ?, error_message = NULL WHERE id = ?`,
    [Date.now(), id]
  );
}

/**
 * Mark record as failed with server error message
 */
export async function markRecordAsFailed(id: string, errorMessage: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE local_attendance SET sync_status = 'FAILED', error_message = ? WHERE id = ?`,
    [errorMessage, id]
  );
}

/**
 * Query all attendance records stored on this device
 */
export async function getAllLocalRecords(): Promise<LocalAttendanceEntity[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LocalAttendanceEntity>(
    `SELECT * FROM local_attendance ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Clear or prune synced records older than 30 days
 */
export async function pruneOldSyncedRecords(daysToKeep = 30): Promise<number> {
  const db = await getDatabase();
  const thresholdMs = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  const result = await db.runAsync(
    `DELETE FROM local_attendance WHERE sync_status = 'SYNCED' AND created_at < ?`,
    [thresholdMs]
  );
  return result.changes;
}
