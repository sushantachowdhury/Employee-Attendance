// Notification manager supporting native Web Notifications, Service Worker notifications, and in-app toasts

export interface InAppToast {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'info' | 'warning';
  timestamp: string;
}

export type ToastListener = (toast: InAppToast) => void;
const listeners: Set<ToastListener> = new Set();

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitInAppToast(title: string, body: string, type: 'success' | 'info' | 'warning' = 'info') {
  const toast: InAppToast = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    body,
    type,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  listeners.forEach((listener) => listener(toast));
}

// Check notification support
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// Get current permission state
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

// Request permission from user
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return Notification.permission;
  }
}

// Send system notification
export async function sendPushNotification({
  title,
  body,
  tag,
  icon = '/icon.svg',
  type = 'info',
}: {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  type?: 'success' | 'info' | 'warning';
}) {
  // Always trigger in-app toast for immediate visibility in all environments
  emitInAppToast(title, body, type);

  // Attempt vibration if hardware supports it
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([150, 75, 150]);
    } catch (e) {}
  }

  if (!isNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      // 1. Prefer Service Worker registration (native background notification)
      if (
        'serviceWorker' in navigator &&
        navigator.serviceWorker.controller
      ) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: {
            body,
            icon,
            badge: icon,
            tag: tag || 'attendance-notification',
          },
        });
        return;
      }

      // 2. Direct Notification fallback
      new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: tag || 'attendance-notification',
      });
    } catch (e) {
      console.warn('Failed to display native system notification:', e);
    }
  }
}

// Helper: Check-in Processed Notification
export function notifyCheckInSuccess(
  employeeName: string,
  checkInTime: string,
  distanceMeters: number,
  officeName: string,
  status: 'Present' | 'Late' | 'Absent'
) {
  const statusEmoji = status === 'Late' ? '⚠️' : '✅';
  sendPushNotification({
    title: `${statusEmoji} Check-In Confirmed: ${employeeName}`,
    body: `Attendance recorded at ${checkInTime} (${distanceMeters}m from ${officeName}). Status: ${status}`,
    tag: 'checkin-success',
    type: status === 'Late' ? 'warning' : 'success',
  });
}

// Helper: Approaching Office (Within 50m Range)
export function notifyWithinRange(officeName: string, distanceMeters: number) {
  sendPushNotification({
    title: `📍 Reached Office Range (${distanceMeters}m)`,
    body: `You are within the 50m boundary of ${officeName}. Tap 'Check in' to complete your selfie biometric verification!`,
    tag: 'office-proximity',
    type: 'success',
  });
}

// Helper: Morning Time-to-Check-In Reminder
export function notifyCheckInReminder(
  employeeName: string,
  officeName: string,
  lateThreshold: string
) {
  sendPushNotification({
    title: `⏰ Time to Check In!`,
    body: `Good morning ${employeeName}! Please clock your attendance at ${officeName} before ${lateThreshold} to avoid being marked late.`,
    tag: 'shift-reminder',
    type: 'info',
  });
}
