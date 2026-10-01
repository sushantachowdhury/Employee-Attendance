import React, { useState } from 'react';
import {
  HelpCircle,
  Smartphone,
  MapPin,
  Database,
  CheckCircle,
  Copy,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const AdviceGuideModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'geofence' | 'apk' | 'database'>('geofence');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Architecture & Implementation Advice
              </h2>
              <p className="text-xs text-neutral-400">
                50m Geofencing, APK Distribution & Supabase/MongoDB Database Setup
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

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/80 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('geofence')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'geofence'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            1. 50m Office Range Setup
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'apk'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            2. Phone APK & PWA Guide
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database className="w-4 h-4" />
            3. Supabase vs MongoDB
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-neutral-300 leading-relaxed">
          {/* TAB 1: 50m GEOFENCING */}
          {activeTab === 'geofence' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-900/60 text-blue-200">
                <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  How the 50-Meter Office Range Works on Employees' Phones
                </h3>
                <p>
                  To ensure employees can only clock in when physically present at the office (within 50 meters), we combine <strong>Client-Side High Accuracy GPS</strong> with <strong>Server-Side Cryptographic Validation</strong>:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
                  <h4 className="font-semibold text-white mb-1 text-xs">A. Mobile GPS Fetching</h4>
                  <p className="text-neutral-400 mb-2">
                    The phone uses the W3C Geolocation API with <code className="text-blue-300">enableHighAccuracy: true</code>. This powers the phone's internal GNSS/GPS chip rather than cell-tower approximations.
                  </p>
                  <pre className="p-2 bg-neutral-950 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`navigator.geolocation.watchPosition(
  (pos) => checkDistance(pos.coords),
  (err) => handleError(err),
  { enableHighAccuracy: true, timeout: 10000 }
);`}
                  </pre>
                </div>

                <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
                  <h4 className="font-semibold text-white mb-1 text-xs">B. Haversine Distance Formula</h4>
                  <p className="text-neutral-400 mb-2">
                    Calculates exact geodesic spherical distance in meters between employee lat/lng and the Kolkata Head Office (22.5726°N, 88.3639°E).
                  </p>
                  <pre className="p-2 bg-neutral-950 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`const R = 6371000; // Earth radius (m)
const a = sin(dLat/2)**2 + cos(lat1)*cos(lat2)*sin(dLon/2)**2;
const distanceMeters = R * 2 * atan2(sqrt(a), sqrt(1-a));`}
                  </pre>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-850 border border-neutral-800">
                <h4 className="font-semibold text-white mb-1 text-xs">
                  C. Anti-Spoofing & Geofence Protection
                </h4>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li>
                    <strong>GPS Accuracy Filter:</strong> If <code className="text-blue-300">pos.coords.accuracy &gt; 30m</code>, the app prompts the user to step into open air to prevent false check-ins.
                  </li>
                  <li>
                    <strong>Server-Side Check:</strong> The client sends coordinates with the selfie; the Express/Supabase backend computes distance independently and throws <code className="text-red-400">403 Forbidden: Outside 50m range</code> if manipulated.
                  </li>
                  <li>
                    <strong>Live Webcam Lock:</strong> The selfie camera and shutter button stay disabled until distance is ≤ 50m.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: APK & PWA DISTRIBUTION */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800">
                <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  Distributing the App to Employees: PWA vs Standalone APK
                </h3>
                <p className="text-neutral-400">
                  You have two great choices to distribute this attendance app to your employees:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: PWA */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Option 1: Progressive Web App (PWA)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-950 text-green-300 border border-green-800">
                      Recommended ⚡️
                    </span>
                  </div>
                  <p className="text-neutral-400 mb-2">
                    <strong>Zero installation friction:</strong> Send employees your link via WhatsApp or email.
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300">
                    <li>Employee opens the link in Chrome (Android) or Safari (iOS).</li>
                    <li>Taps <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
                    <li>An app icon appears on their phone launcher! It opens full-screen without URL bar and runs smoothly.</li>
                  </ol>
                </div>

                {/* Method 2: Capacitor APK */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">Option 2: Standalone .APK File</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                      Capacitor / Android
                    </span>
                  </div>
                  <p className="text-neutral-400 mb-2">
                    Generate an <code className="text-blue-300">attendance.apk</code> file you can directly install on any Android phone.
                  </p>
                  <p className="text-neutral-300">
                    Wrap this React app with Capacitor. It compiles directly to native Android Studio project.
                  </p>
                </div>
              </div>

              {/* Copyable Capacitor Commands */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    How to generate .APK file with Capacitor (3 commands):
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/camera @capacitor/geolocation\nnpx cap init "Staff Attendance" "com.company.attendance"\nnpm run build\nnpx cap add android\nnpx cap open android',
                        'cap'
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedCode === 'cap' ? 'Copied!' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="p-2.5 bg-neutral-900 rounded-lg text-[11px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
{`# 1. Install Capacitor dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. Build the web app assets
npm run build

# 3. Add Android platform & build APK
npx cap add android
npx cap open android # Opens Android Studio: Build -> Generate Signed APK`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SUPABASE VS MONGODB */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-850 border border-neutral-800">
                <h3 className="font-semibold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-blue-400" />
                  Backend Database Suggestion: Supabase vs MongoDB
                </h3>
                <p className="text-neutral-400">
                  You asked for advice between <strong>Supabase</strong> and <strong>MongoDB</strong>. Here is the architectural recommendation:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supabase */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Supabase (PostgreSQL)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-green-950 text-green-300 border border-green-800 font-bold">
                      BEST CHOICE ⭐️
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      ✅ <strong>PostGIS Geofencing:</strong> Native geospatial function <code className="text-blue-300">ST_DWithin(user_location, office_geom, 50)</code> computes millimeter accuracy.
                    </li>
                    <li>
                      ✅ <strong>Built-in Storage Bucket:</strong> Stores employee selfie photos with private signed URLs.
                    </li>
                    <li>
                      ✅ <strong>Row-Level Security (RLS):</strong> Prevents employees from snooping on each other's attendance.
                    </li>
                    <li>
                      ✅ <strong>Automatic Auth:</strong> Employee logins handled securely.
                    </li>
                  </ul>
                </div>

                {/* MongoDB */}
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">MongoDB Atlas</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300">
                      Good for NoSQL
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-neutral-300">
                    <li>
                      ✅ <strong>2dsphere Index:</strong> Supports <code className="text-blue-300">$nearSphere</code> with <code className="text-blue-300">$maxDistance: 50</code>.
                    </li>
                    <li>
                      ⚠️ <strong>Selfie Storage:</strong> Requires separate AWS S3 or Cloudinary storage for selfie images.
                    </li>
                    <li>
                      ⚠️ <strong>Auth & RLS:</strong> Must write custom JWT middleware and access control in Node/Express.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Ready-to-paste Supabase SQL Schema */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-green-400" />
                    Recommended Supabase SQL Schema (Copy & Paste):
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `-- 1. Enable PostGIS for geospatial geofencing
create extension if not exists postgis;

-- 2. Offices Table
create table offices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters int default 50,
  late_threshold time default '09:30:00'
);

-- 3. Attendance Logs Table
create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  employee_name text not null,
  department text not null,
  office_id uuid references offices(id),
  date date not null default current_date,
  check_in_time time not null default current_time,
  distance_meters int not null,
  selfie_url text not null,
  status text check (status in ('Present', 'Late', 'Absent')),
  location geography(POINT, 4326),
  created_at timestamptz default now()
);

-- 4. Spatial index for instant 50m geofence queries
create index attendance_geo_idx on attendance_logs using gist(location);`,
                        'sql'
                      )
                    }
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px]"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedCode === 'sql' ? 'Copied!' : 'Copy SQL Schema'}
                  </button>
                </div>
                <pre className="p-2.5 bg-neutral-900 rounded-lg text-[10px] font-mono text-neutral-300 overflow-x-auto leading-relaxed">
{`-- Enable PostGIS for geospatial geofencing
create extension if not exists postgis;

-- Attendance Logs Table
create table attendance_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  employee_name text not null,
  department text not null,
  date date not null default current_date,
  check_in_time time not null default current_time,
  distance_meters int not null,
  selfie_url text not null,
  status text check (status in ('Present', 'Late', 'Absent')),
  location geography(POINT, 4326),
  created_at timestamptz default now()
);`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-xs">
          <span className="text-neutral-400">
            Current Server: Full-Stack Express running on port 3000
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
