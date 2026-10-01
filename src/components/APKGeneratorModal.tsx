import React, { useState } from 'react';
import {
  Smartphone,
  Terminal,
  Copy,
  Check,
  Download,
  Shield,
  Layers,
  FileCode,
  Sparkles,
  ExternalLink,
  Cpu,
  Share2,
  Send,
  MessageSquare,
  QrCode,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface APKGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const APKGeneratorModal: React.FC<APKGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'distribute' | 'capacitor' | 'bubblewrap' | 'manifest'>('distribute');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const capacitorConfig = `{
  "appId": "com.attendance.geoface",
  "appName": "Staff Attendance",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "Geolocation": {
      "requestAlways": true
    },
    "Camera": {
      "presentationStyle": "fullscreen"
    }
  }
}`;

  const androidPermissions = `<!-- Put inside android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Camera Permission for Biometric Selfie -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />

    <!-- High Accuracy GPS Permissions for 50m Geofencing -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="true" />
</manifest>`;

  const capacitorCommands = `# 1. Install Capacitor in your project directory
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/geolocation

# 2. Build the React production assets
npm run build

# 3. Initialize and add the Android native project
npx cap init "Staff Attendance" "com.attendance.geoface" --web-dir dist
npx cap add android

# 4. Open in Android Studio to generate the APK file
npx cap open android
# Inside Android Studio: Click 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'
# Your APK will be created at: android/app/build/outputs/apk/debug/app-debug.apk`;

  const bubblewrapCommands = `# Generate APK directly from command line using Google Bubblewrap:
npm install -g @bubblewrap/cli

# Initialize APK project directly from your live app URL
bubblewrap init --manifest https://ais-pre-zuz7ehpvtwa43a46f23fy3-303613047197.asia-east1.run.app/manifest.json

# Build the signed standalone APK
bubblewrap build`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-600/20 text-green-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                How to Create an APK File for Android Phones
              </h2>
              <p className="text-xs text-neutral-400">
                Turn this React attendance app into a signed <span className="font-mono text-green-300">.apk</span> file for distribution
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

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/80 px-4 pt-2 gap-2 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('distribute')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'distribute'
                ? 'border-green-500 text-green-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Share2 className="w-4 h-4 text-green-400" />
            📤 How to Send APK to Employees
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'capacitor'
                ? 'border-green-500 text-green-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Build Native APK (Capacitor)
          </button>
          <button
            onClick={() => setActiveTab('bubblewrap')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'bubblewrap'
                ? 'border-green-500 text-green-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Google Bubblewrap CLI
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition ${
              activeTab === 'manifest'
                ? 'border-green-500 text-green-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Android Permissions & Config
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-neutral-300 leading-relaxed">
          {/* TAB 1: HOW TO SEND APK TO EMPLOYEES */}
          {activeTab === 'distribute' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-green-950/40 border border-green-800/80">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-1">
                  <Share2 className="w-4 h-4 text-green-400" />
                  Quick Ways to Send the APK File to Your Staff
                </h3>
                <p className="text-neutral-300 text-xs">
                  Once you build your <code className="text-green-300 font-mono">StaffAttendance.apk</code> file, you do not need Google Play Store to install it. You can send it directly to your employees using any of the 4 methods below:
                </p>
              </div>

              {/* 4 Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Method 1: WhatsApp / Telegram */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    Method A: WhatsApp or Telegram (Most Popular)
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    1. Open WhatsApp or Telegram on your PC or phone.<br />
                    2. In the company or staff group chat, tap <strong>Attach (📎)</strong> $\rightarrow$ <strong>Document</strong>.<br />
                    3. Select the <strong>StaffAttendance.apk</strong> file and click Send.<br />
                    4. Staff can tap the file right inside WhatsApp to install!
                  </p>
                </div>

                {/* Method 2: Google Drive / Cloud Link */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    Method B: Google Drive Download Link
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    1. Upload <strong>StaffAttendance.apk</strong> to Google Drive or Dropbox.<br />
                    2. Right click the file $\rightarrow$ <strong>Share</strong> $\rightarrow$ change access to <em>"Anyone with the link can view/download"</em>.<br />
                    3. Copy link and SMS/WhatsApp it to employees. When they open it, it downloads immediately.
                  </p>
                </div>

                {/* Method 3: Company Email */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                    Method C: Email Attachment
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    1. Draft a welcome email to your employees.<br />
                    2. Attach <strong>StaffAttendance.apk</strong> (most APKs are 5MB to 15MB, well below email limits).<br />
                    3. Employees open the email on their Android phone and tap the attachment to install.
                  </p>
                </div>

                {/* Method 4: No APK Needed (PWA Web App) */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <div className="w-7 h-7 rounded-lg bg-purple-950 text-purple-400 flex items-center justify-center">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    Method D: Zero APK (Instant Web Install)
                  </div>
                  <p className="text-neutral-400 text-[11px] leading-relaxed">
                    Employees don't even need an APK file!<br />
                    1. Share your web URL or show the <strong>Phone QR Code</strong>.<br />
                    2. Employee scans QR on Android Chrome.<br />
                    3. Tap <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.<br />
                    4. Adds the exact native app icon with live Camera & 50m GPS!
                  </p>
                </div>
              </div>

              {/* Instructions for Employees to Install */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  What Employees Must Do on Their Phone (Android Sideloading):
                </h4>
                <div className="space-y-2 text-[11px] text-neutral-300">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">1</span>
                    <p>Employee taps the downloaded <strong>.apk</strong> file in their notification bar or Files app.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">2</span>
                    <p>Android security prompt will say: <em>"For security, your phone cannot install unknown apps from this source"</em>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">3</span>
                    <p>Employee taps <strong>Settings</strong> $\rightarrow$ toggles <strong>"Allow from this source"</strong> (one-time approval).</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">4</span>
                    <p>Tap <strong>Install</strong> $\rightarrow$ then tap <strong>Open</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">5</span>
                    <p>When the app opens, tap <strong>"Allow"</strong> for Camera (for selfie verification) and <strong>"While using app"</strong> for GPS location (for 50m geofence).</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* METHOD 1: CAPACITOR */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-xs mb-1">
                    Capacitor Native Android Build
                  </h3>
                  <p className="text-neutral-400 text-[11px]">
                    Capacitor converts this exact React codebase into an Android Studio project. You can compile it directly into a standard <code className="text-green-300 font-mono">.apk</code> file to distribute via WhatsApp, Google Drive, or MDM!
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-green-400" />
                      Build Commands (Run in your terminal):
                    </span>
                    <button
                      onClick={() => copyCode(capacitorCommands, 'cap-cmd')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition"
                    >
                      {copiedKey === 'cap-cmd' ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy Commands
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 bg-neutral-900 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                    {capacitorCommands}
                  </pre>
                </div>

                <div className="bg-neutral-850 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                  <h4 className="font-bold text-white text-xs">
                    Where is the generated .apk file saved?
                  </h4>
                  <p className="text-neutral-400 text-[11px]">
                    Once you click <strong>Build APK</strong> in Android Studio, your installable Android package will be generated at:
                  </p>
                  <code className="block p-2 bg-neutral-900 rounded text-green-300 font-mono text-[11px]">
                    android/app/build/outputs/apk/debug/app-debug.apk
                  </code>
                  <p className="text-neutral-400 text-[11px]">
                    You can rename this file to <strong className="text-white">AttendanceApp.apk</strong> and send it directly to any employee's Android phone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* METHOD 2: BUBBLEWRAP */}
          {activeTab === 'bubblewrap' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800">
                <h3 className="font-bold text-white text-xs mb-1">
                  Google Bubblewrap CLI (Automated APK from PWA)
                </h3>
                <p className="text-neutral-400 text-[11px]">
                  Google's official command-line tool that takes your web app's <code className="text-blue-300">manifest.json</code> and automatically compiles a standalone Android APK (Trusted Web Activity) with zero manual Android Studio coding.
                </p>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    Bubblewrap Commands:
                  </span>
                  <button
                    onClick={() => copyCode(bubblewrapCommands, 'bw-cmd')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition"
                  >
                    {copiedKey === 'bw-cmd' ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Commands
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-neutral-900 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                  {bubblewrapCommands}
                </pre>
              </div>
            </div>
          )}

          {/* METHOD 3: PERMISSIONS & CONFIG */}
          {activeTab === 'manifest' && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-green-400" />
                    1. AndroidManifest.xml (GPS & Camera Permissions):
                  </span>
                  <button
                    onClick={() => copyCode(androidPermissions, 'perm')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition"
                  >
                    {copiedKey === 'perm' ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy XML
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-neutral-900 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                  {androidPermissions}
                </pre>
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                    2. capacitor.config.json:
                  </span>
                  <button
                    onClick={() => copyCode(capacitorConfig, 'cap-json')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium transition"
                  >
                    {copiedKey === 'cap-json' ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Config
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-neutral-900 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed border border-neutral-800">
                  {capacitorConfig}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-xs">
          <span className="text-neutral-400">
            Pre-configured for 50m GPS & front-camera biometric verification
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
