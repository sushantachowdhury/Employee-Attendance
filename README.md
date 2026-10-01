# 📍 Geofence & Biometric Attendance System

A modern, production-grade staff attendance management platform featuring a **50-meter Geofenced Mobile Application**, **Biometric Selfie Verification**, **Local SQLite Offline Storage (`expo-sqlite`)**, and an **Administrative Supervisory Portal** with daily/monthly reporting.

---

## 🌟 Key Features

### 1. 📱 50-Meter Geofenced Mobile App
- **Strict 50m Geofence Validation**: Employs the Haversine formula to compute exact distance between device coordinates and the office location.
- **Dual GPS Modes**:
  - **Live Phone GPS**: Connects directly to hardware GPS on iOS and Android devices.
  - **Test Slider Simulation**: Allows instant simulation of walking in and out of the 50m radius.
- **Visual Distance Radar**: Real-time 2D circular radar and linear progress tracker showing distance to office center.

### 2. 🤳 Biometric Selfie Verification
- **Front-Facing Camera Integration**: Live webcam and native camera stream with camera flipping and simulated flash.
- **Face Framing Target**: Biometric overlay ensuring proper selfie alignment.
- **Biometric Audit Trail**: Stores timestamped photos linked to each attendance punch.

### 3. 💾 Local SQLite Offline Storage (`expo-sqlite`)
- **Offline-First Architecture**: When offline or in low-connectivity areas (e.g., basement garages, remote sites), attendance records are preserved persistently in an on-device SQLite database.
- **Table Schema**:
  ```sql
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
    sync_status TEXT NOT NULL DEFAULT 'PENDING_SYNC', -- 'PENDING_SYNC' | 'SYNCED' | 'FAILED'
    device_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    synced_at INTEGER,
    error_message TEXT
  );
  ```
- **Auto-Sync Worker**: Uses `@react-native-community/netinfo` to automatically detect restored internet access and flush pending records to the backend REST API.
- **Simulation & Inspection Tool**: Interactive SQLite manager in the web app to view stored rows, trigger manual sync, and toggle offline mode.

### 4. 📞 Phone Number & Employee ID Authentication
- **Dual Identifier Login**: Staff can sign in using their **Employee ID** (`EMP001`) or their **Registered Mobile Number** (`+91 98301 23456`).
- **Flexible Check-In API**: The attendance punch endpoint resolves punches submitted by either ID or phone number.
- **SMS Reset Simulation**: One-click password reset flow dispatches temporary credentials to registered phone numbers.

### 5. 👥 Staff Roster & Active/Inactive Status
- **Active vs. Inactive Controls**: Deactivating an employee profile prevents them from logging in or punching attendance.
- **Staff Management Modal**: Create new employees, update departments, and manage registered phone numbers.

### 6. 📊 Reports & Administration
- **Daily Attendance Report**: Live registry categorizing attendance as *Present*, *Late* (after 09:30 AM), or *Absent*.
- **Monthly Summary Table**: Calculates monthly working days (default 26 days) and attendance percentages.
- **Export Options**: 1-click **CSV Download** and formatted **PDF Print**.
- **Office Location Settings**: Configure office coordinates, geofence radius (default 50m), and late cutoff thresholds.

---

## 👥 Demo Credentials

You can log in using either the **Employee ID** or **Mobile Number** with password `password123` (or `admin` for supervisor):

| Employee ID | Name | Phone Number | Department | Role | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `EMP001` | Amit Das | `+91 98301 23456` | IT | Employee | Active |
| `EMP002` | Riya Sen | `+91 98312 34567` | HR | Employee | Active |
| `EMP003` | Sourav Roy | `+91 98323 45678` | Accounts | Employee | Active |
| `EMP004` | Priya Sharma | `+91 98334 56789` | Marketing | Employee | Inactive *(Attendance Blocked)* |
| `ADMIN01` | Admin Supervisor | `+91 98000 11223` | Operations | Admin | Active *(Password: `admin`)* |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Backend**: Express.js, TypeScript (`tsx`), REST API
- **Mobile Services**: React Native / Expo (`attendance-mobile/`), Expo SQLite, `@react-native-community/netinfo`
- **PWA**: Web App Manifest, Service Worker (`sw.js`), Mobile Home-Screen Installation

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Full-Stack Application
Runs the backend Express server with Vite middleware on port 3000:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### 3. Open on Mobile Phone via QR Code
1. Open the application on your computer.
2. Click **"Phone QR"** in the top navigation bar.
3. Scan the QR code with your mobile camera to test with real device GPS and live hardware camera.

---

## 📲 React Native / Expo SQLite Integration

The native mobile app codebase is located under `attendance-mobile/`:

```text
attendance-mobile/
└── src/
    └── services/
        ├── sqlite.ts        # Expo SQLite database connection & CRUD methods
        └── offlineSync.ts   # NetInfo auto-reconnect background sync worker
```

### Setting Up Expo SQLite in your Mobile Project:

```bash
# Install Expo SQLite and NetInfo
npx expo install expo-sqlite @react-native-community/netinfo
```

#### Saving Attendance Offline (`sqlite.ts`):
```typescript
import * as SQLite from 'expo-sqlite';

const db = await SQLite.openDatabaseAsync('employee_attendance.db');

await db.runAsync(
  `INSERT OR REPLACE INTO local_attendance (
    id, emp_id, employee_name, department, office,
    attendance_date, check_in_time, latitude, longitude,
    distance_m, selfie_image_path, status, sync_status,
    device_id, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [id, empId, name, dept, office, date, time, lat, lon, dist, selfieUri, 'Present', 'PENDING_SYNC', deviceId, Date.now()]
);
```

#### Syncing when Connection Resumes (`offlineSync.ts`):
```typescript
import NetInfo from '@react-native-community/netinfo';
import { getPendingSyncRecords, markRecordAsSynced } from './sqlite';

NetInfo.addEventListener(async (state) => {
  if (state.isConnected && state.isInternetReachable) {
    const pending = await getPendingSyncRecords();
    for (const record of pending) {
      const res = await fetch('https://your-api.com/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) await markRecordAsSynced(record.id);
    }
  }
});
```

---

## 📦 Building Standalone Android APK

To generate a standalone `.apk` for Android devices:

### Option A: Expo Application Services (EAS Build - Recommended)
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Configure build
eas build:configure

# 3. Build standalone APK
eas build --platform android --profile preview
```

### Option B: Capacitor Wrap
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "StaffAttendance" "com.company.attendance"
npm run build
npx cap add android
npx cap open android
```
In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.

---

## 📡 Backend REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate via `empId` or `phone` and `password` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Request password reset via registered email or SMS |
| `POST` | `/api/attendance/check-in` | Punch attendance with coordinates, selfie, and geofence check |
| `GET` | `/api/attendance/today` | List all attendance punches recorded today |
| `GET` | `/api/attendance/history/:empId` | Fetch attendance history for a specific employee |
| `GET` | `/api/reports/daily?date=DD-MM-YYYY` | Daily staff attendance summary (Present, Late, Absent) |
| `GET` | `/api/reports/monthly?month=Oct 2026` | Monthly attendance report with working days & percentages |
| `GET` | `/api/employees` | List registered employees with phone numbers and statuses |
| `POST` | `/api/employees` | Register a new staff member |
| `PUT` | `/api/employees/:id` | Update employee profile details |
| `PATCH` | `/api/employees/:empId/status` | Toggle employee active / inactive status |
| `GET` | `/api/office` | Retrieve office location and geofence radius settings |
| `PUT` | `/api/office` | Update office coordinates, radius, or late threshold |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
