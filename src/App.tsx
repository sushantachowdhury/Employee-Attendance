import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  FileSpreadsheet,
  CalendarDays,
  Settings,
  HelpCircle,
  LogOut,
  Fingerprint,
  MapPin,
  Camera,
  Shield,
  CheckCircle,
  ExternalLink,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { PhoneFrame } from './components/PhoneFrame';
import { LoginScreen } from './components/LoginScreen';
import { CheckInScreen } from './components/CheckInScreen';
import { SelfieCameraScreen } from './components/SelfieCameraScreen';
import { ConfirmationScreen } from './components/ConfirmationScreen';
import { DailyReportView } from './components/DailyReportView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { AdviceGuideModal } from './components/AdviceGuideModal';
import { OfficeSettingsModal } from './components/OfficeSettingsModal';
import { PhoneQRCodeModal } from './components/PhoneQRCodeModal';
import { EmployeeManagementModal } from './components/EmployeeManagementModal';
import { APKGeneratorModal } from './components/APKGeneratorModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { NotificationToastContainer } from './components/NotificationToast';
import { notifyCheckInSuccess } from './utils/notifications';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AuthUser, OfficeConfig, AttendanceRecord } from './types/attendance';
import { safeFetchJson } from './utils/api';
import { QrCode, Users, Package, Bell, LayoutDashboard, Database, WifiOff } from 'lucide-react';
import { AdminDashboardView } from './components/AdminDashboardView';
import { SQLiteOfflineStorageModal } from './components/SQLiteOfflineStorageModal';
import { getPendingSyncRecords, isSimulatedOffline } from './utils/sqliteStorage';

type MobileScreenState = 'CHECK_IN' | 'SELFIE_CAMERA' | 'CONFIRMATION';
type AppTab = 'dashboard' | 'mobile' | 'daily_report' | 'monthly_report' | 'advice';

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // Authentication state
  const [user, setUser] = useState<AuthUser | null>({
    empId: 'EMP001',
    name: 'Amit Das',
    department: 'IT',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active',
    token: 'token_emp001',
  });

  // Office configuration
  const [office, setOffice] = useState<OfficeConfig>({
    id: 'off-1',
    name: 'Head office, Kolkata',
    latitude: 22.572645,
    longitude: 88.363892,
    radiusMeters: 50,
    lateThreshold: '09:30',
    workDaysPerMonth: 26,
  });

  // Mobile Screen Flow
  const [mobileScreen, setMobileScreen] = useState<MobileScreenState>('CHECK_IN');
  const [lastRecord, setLastRecord] = useState<AttendanceRecord | null>(null);
  const [selectedDistance, setSelectedDistance] = useState(32);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 22.57285,
    lng: 88.36402,
  });

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSqliteModal, setShowSqliteModal] = useState(false);
  const [pendingSqliteCount, setPendingSqliteCount] = useState(0);
  const [isOfflineActive, setIsOfflineActive] = useState(false);

  // Sync SQLite badge count
  useEffect(() => {
    const updateStats = () => {
      setPendingSqliteCount(getPendingSyncRecords().length);
      setIsOfflineActive(isSimulatedOffline());
    };
    updateStats();
    window.addEventListener('sqlite-records-updated', updateStats);
    window.addEventListener('offline-mode-changed', updateStats);
    return () => {
      window.removeEventListener('sqlite-records-updated', updateStats);
      window.removeEventListener('offline-mode-changed', updateStats);
    };
  }, []);

  // Fetch initial office data
  useEffect(() => {
    safeFetchJson<OfficeConfig>('/api/office')
      .then((res) => {
        if (res.ok && res.data && res.data.name) setOffice(res.data);
      })
      .catch((e) => console.warn('Could not fetch office config', e));
  }, []);

  const handleLoginSuccess = (authenticatedUser: AuthUser) => {
    setUser(authenticatedUser);
    setMobileScreen('CHECK_IN');
  };

  const handleLogout = () => {
    setUser(null);
    setMobileScreen('CHECK_IN');
    setLastRecord(null);
  };

  const handleOpenSelfie = (distance: number, lat: number, lng: number) => {
    setSelectedDistance(distance);
    setSelectedCoords({ lat, lng });
    setMobileScreen('SELFIE_CAMERA');
  };

  const handleAttendanceSuccess = (record: AttendanceRecord) => {
    setLastRecord(record);
    setMobileScreen('CONFIRMATION');
    // Trigger browser push notification & in-app confirmation toast
    notifyCheckInSuccess(
      record.employeeName,
      record.checkInTime,
      record.distanceMeters,
      record.office,
      record.status
    );
  };

  const handleResetData = async () => {
    try {
      await fetch('/api/attendance/reset', { method: 'POST' });
      alert('Demo attendance records reset to match Document 2 & 4 initial state!');
      setShowSettingsModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Real-time Notification Banner Container */}
      <NotificationToastContainer />

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#185FA5] text-white flex items-center justify-center shadow-md">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                Staff Attendance
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                <MapPin className="w-3 h-3" /> 50m Geofence
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              {office.name} • Biometric Face Verification
            </p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 bg-neutral-850 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin Dashboard</span>
            <span className="md:hidden">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Employee Mobile App</span>
            <span className="md:hidden">Mobile App</span>
          </button>

          <button
            onClick={() => setActiveTab('daily_report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'daily_report'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Daily Report</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly_report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'monthly_report'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Report</span>
          </button>

          {/* Active vs Inactive Staff Management */}
          <button
            onClick={() => setShowEmployeeModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            title="Manage Active and Inactive Staff"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Staff Roster</span>
          </button>

          {/* SQLite Offline Storage Button */}
          <button
            onClick={() => setShowSqliteModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              isOfflineActive
                ? 'bg-amber-950/70 border-amber-700 text-amber-300'
                : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-800 text-purple-300'
            }`}
            title="Local SQLite Database & Offline Sync (Expo SQLite)"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SQLite DB</span>
            {pendingSqliteCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold animate-pulse">
                {pendingSqliteCount}
              </span>
            ) : isOfflineActive ? (
              <span className="text-[10px] text-amber-400 font-semibold">Offline</span>
            ) : null}
          </button>

          {/* Create APK Modal Button */}
          <button
            onClick={() => setShowApkModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-950/50 hover:bg-green-900/50 text-green-300 border border-green-800/80 transition"
            title="Step-by-step instructions to create standalone APK file"
          >
            <Package className="w-3.5 h-3.5 text-green-400" />
            <span className="font-semibold">Create APK</span>
          </button>

          <button
            onClick={() => setShowAdviceModal(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
            title="View APK, 50m Range & Database Advice"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden lg:inline text-blue-300 font-semibold">Advice</span>
          </button>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition active:scale-95"
            title="Scan QR to open on your phone with live GPS"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phone QR</span>
          </button>

          <button
            onClick={() => setShowNotificationModal(true)}
            className="w-8 h-8 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition relative"
            title="Push Notifications & Reminders"
          >
            <Bell className="w-4 h-4 text-blue-400" />
            <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5 animate-pulse" />
          </button>

          <PWAInstallButton compact />

          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-8 h-8 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition"
            title="Office & Geofence Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {user && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-neutral-800 text-xs">
              <span className="w-6 h-6 rounded-full bg-blue-900 text-blue-200 font-mono text-[10px] flex items-center justify-center font-bold">
                {user.empId.substring(0, 3)}
              </span>
              <span className="font-medium text-neutral-200">{user.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full flex flex-col justify-center">
        {/* TAB 1: ADMIN DASHBOARD (Section 13) */}
        {activeTab === 'dashboard' && (
          <AdminDashboardView
            onOpenEmployeeModal={() => setShowEmployeeModal(true)}
            onOpenOfficeModal={() => setShowSettingsModal(true)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* TAB 2: MOBILE APP EXPERIENCE (Exact PDF Screenflow) */}
        {activeTab === 'mobile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Explanatory / Control Panel on Desktop */}
            <div className="lg:col-span-4 order-2 lg:order-1 space-y-4 text-xs">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Interactive PDF Screenflow
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-900 text-[10px] font-mono">
                    50m Policy
                  </span>
                </div>
                <p className="text-neutral-400 mb-3 leading-relaxed">
                  This phone simulator renders the <strong>exact user interface flow</strong> from your specification document:
                </p>

                <div className="space-y-1.5 text-neutral-300">
                  <div
                    onClick={() => {
                      if (!user) setUser({ empId: 'EMP001', name: 'Amit Das', department: 'IT', office: office.name, role: 'employee', status: 'active', token: 'token' });
                      setMobileScreen('CHECK_IN');
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      mobileScreen === 'CHECK_IN' && user
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-neutral-800 hover:bg-neutral-850 text-neutral-400'
                    }`}
                  >
                    <span>
                      <strong className="block text-neutral-200">1. Distance & GPS Check</strong>
                      <span className="text-[11px] text-neutral-500">Screens 2, 3 & 4 (50m geofence lock)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>

                  <div
                    onClick={() => {
                      if (!user) setUser({ empId: 'EMP001', name: 'Amit Das', department: 'IT', office: office.name, role: 'employee', status: 'active', token: 'token' });
                      handleOpenSelfie(32, office.latitude, office.longitude);
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      mobileScreen === 'SELFIE_CAMERA'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-neutral-800 hover:bg-neutral-850 text-neutral-400'
                    }`}
                  >
                    <span>
                      <strong className="block text-neutral-200">2. Selfie Biometric Capture</strong>
                      <span className="text-[11px] text-neutral-500">Screen 5 (4a/4b oval dashed face guide)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>

                  <div
                    onClick={() => {
                      if (!user) setUser({ empId: 'EMP001', name: 'Amit Das', department: 'IT', office: office.name, role: 'employee', status: 'active', token: 'token' });
                      setLastRecord({
                        id: 'demo-rec',
                        empId: user?.empId || 'EMP001',
                        employeeName: user?.name || 'Amit Das',
                        department: user?.department || 'IT',
                        office: office.name,
                        date: '01-10-2026',
                        checkInTime: '09:42 AM',
                        distanceMeters: 32,
                        selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                        status: 'Present',
                        latitude: office.latitude,
                        longitude: office.longitude,
                        verifiedAt: new Date().toISOString(),
                      });
                      setMobileScreen('CONFIRMATION');
                    }}
                    className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      mobileScreen === 'CONFIRMATION'
                        ? 'border-blue-500 bg-blue-950/30 text-white'
                        : 'border-neutral-800 hover:bg-neutral-850 text-neutral-400'
                    }`}
                  >
                    <span>
                      <strong className="block text-neutral-200">3. Attendance Confirmation</strong>
                      <span className="text-[11px] text-neutral-500">Screen 6 (Checked in stamp & time)</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
              </div>

              {/* Real Phone GPS Card */}
              <div className="bg-gradient-to-r from-blue-950/70 to-neutral-900 border border-blue-800/60 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    Real-Time Dot on Phone
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-950 text-green-300 border border-green-800 font-mono">
                    Live GPS
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Want the blue dot to follow your real footsteps? Scan this QR code on your phone, then tap <strong>"Set My Current Location as Office"</strong> so your room becomes the center! As you walk 50m away, the dot tracks in real time.
                </p>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan QR Code to Open on Phone</span>
                </button>
              </div>

              {/* Quick test scenarios matching PDF figures */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm space-y-2.5">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  Test Document 1 Figures:
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedDistance(240);
                      setMobileScreen('CHECK_IN');
                    }}
                    className="flex-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-left text-neutral-300 transition"
                  >
                    <span className="block font-mono font-bold text-red-400">240 m</span>
                    <span className="text-[10px] text-neutral-400">Screen 3 (Disabled)</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDistance(32);
                      setMobileScreen('CHECK_IN');
                    }}
                    className="flex-1 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-green-800/60 text-left text-neutral-300 transition"
                  >
                    <span className="block font-mono font-bold text-green-400">32 m</span>
                    <span className="text-[10px] text-neutral-400">Screen 4 (Active)</span>
                  </button>
                </div>
              </div>

              {/* Quick advice banner */}
              <div
                onClick={() => setShowAdviceModal(true)}
                className="bg-blue-950/30 hover:bg-blue-950/50 border border-blue-900/60 rounded-2xl p-3.5 cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-white text-xs">
                    Need APK File for your employees?
                  </p>
                  <p className="text-[11px] text-blue-300">
                    Read the 1-click APK build & Supabase guide →
                  </p>
                </div>
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
              </div>
            </div>

            {/* Center: The Phone Mockup */}
            <div className="lg:col-span-8 order-1 lg:order-2 flex justify-center">
              <PhoneFrame
                time={mobileScreen === 'CONFIRMATION' ? '9:42' : '9:41'}
                hasGps={mobileScreen !== 'CHECK_IN' || user !== null}
              >
                {!user ? (
                  /* Screen 1: Login Screen */
                  <LoginScreen onLoginSuccess={handleLoginSuccess} />
                ) : mobileScreen === 'CHECK_IN' ? (
                  /* Screens 2, 3, 4: Distance Check & GPS Geofence */
                  <CheckInScreen
                    user={user}
                    office={office}
                    onOpenSelfie={handleOpenSelfie}
                    onLogout={handleLogout}
                    onUpdateOfficeLocation={(lat, lng, name) =>
                      setOffice((prev) => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng,
                        name: name || prev.name,
                      }))
                    }
                  />
                ) : mobileScreen === 'SELFIE_CAMERA' ? (
                  /* Screen 5 (4a/4b): Live Selfie Camera with Oval Face Guide */
                  <SelfieCameraScreen
                    user={user}
                    distanceMeters={selectedDistance}
                    latitude={selectedCoords.lat}
                    longitude={selectedCoords.lng}
                    onClose={() => setMobileScreen('CHECK_IN')}
                    onSuccess={handleAttendanceSuccess}
                  />
                ) : (
                  /* Screen 6 (5): Attendance Recorded Confirmation */
                  lastRecord && (
                    <ConfirmationScreen
                      record={lastRecord}
                      onDone={() => setMobileScreen('CHECK_IN')}
                      onViewReports={() => setActiveTab('daily_report')}
                    />
                  )
                )}
              </PhoneFrame>
            </div>
          </div>
        )}

        {/* TAB 2: DAILY REPORT (Document 2) */}
        {activeTab === 'daily_report' && <DailyReportView />}

        {/* TAB 3: MONTHLY REPORT (Document 4) */}
        {activeTab === 'monthly_report' && <MonthlyReportView />}
      </main>

      {/* Modals */}
      <EmployeeManagementModal
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
      />

      <APKGeneratorModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      <PhoneQRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />

      <AdviceGuideModal
        isOpen={showAdviceModal}
        onClose={() => setShowAdviceModal(false)}
      />

      <OfficeSettingsModal
        isOpen={showSettingsModal}
        office={office}
        onClose={() => setShowSettingsModal(false)}
        onSave={(updated) => setOffice(updated)}
        onResetData={handleResetData}
      />

      <NotificationSettingsModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        user={user}
        office={office}
      />

      <SQLiteOfflineStorageModal
        isOpen={showSqliteModal}
        onClose={() => setShowSqliteModal(false)}
      />
    </div>
  );
}
