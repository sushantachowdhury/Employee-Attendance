/**
 * Background Offline Sync Worker for React Native Expo Mobile App
 * 
 * Packages:
 * - npx expo install expo-sqlite @react-native-community/netinfo
 * - npx expo install expo-file-system
 */

import NetInfo from '@react-native-community/netinfo';
import {
  getPendingSyncRecords,
  markRecordAsSynced,
  markRecordAsFailed,
  LocalAttendanceEntity,
} from './sqlite';

let isSyncInProgress = false;

export interface SyncResult {
  totalPending: number;
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Flush all pending SQLite records to backend REST API
 */
export async function syncOfflineAttendance(backendApiUrl: string): Promise<SyncResult> {
  if (isSyncInProgress) {
    return { totalPending: 0, synced: 0, failed: 0, errors: ['Sync already in progress'] };
  }

  const netState = await NetInfo.fetch();
  if (!netState.isConnected || !netState.isInternetReachable) {
    return { totalPending: 0, synced: 0, failed: 0, errors: ['No internet connection available'] };
  }

  isSyncInProgress = true;
  const pendingRecords = await getPendingSyncRecords();
  const result: SyncResult = {
    totalPending: pendingRecords.length,
    synced: 0,
    failed: 0,
    errors: [],
  };

  for (const item of pendingRecords) {
    try {
      // Create FormData with image upload
      const formData = new FormData();
      formData.append('employee_id', item.emp_id);
      formData.append('latitude', String(item.latitude));
      formData.append('longitude', String(item.longitude));
      formData.append('device_id', item.device_id);
      
      // If base64 or file URI
      if (item.selfie_image_path.startsWith('file://')) {
        formData.append('selfie', {
          uri: item.selfie_image_path,
          type: 'image/jpeg',
          name: `selfie_${item.emp_id}_${item.created_at}.jpg`,
        } as any);
      } else {
        // Fallback for base64 / URL
        formData.append('selfieUrl', item.selfie_image_path);
      }

      const response = await fetch(`${backendApiUrl}/api/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // Note: Do not set Content-Type header manually when using FormData in React Native
        },
        body: formData,
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || `Server responded with ${response.status}`);
      }

      // Mark SQLite record as synced!
      await markRecordAsSynced(item.id);
      result.synced += 1;
    } catch (err: any) {
      result.failed += 1;
      const msg = err.message || 'Unknown network error';
      result.errors.push(`Record ${item.id}: ${msg}`);
      await markRecordAsFailed(item.id, msg);
    }
  }

  isSyncInProgress = false;
  return result;
}

/**
 * Register automatic background listener when internet reconnects
 */
export function registerAutoSyncListener(backendApiUrl: string): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable) {
      syncOfflineAttendance(backendApiUrl).catch((e) =>
        console.warn('Auto sync attempt failed:', e)
      );
    }
  });

  return unsubscribe;
}
