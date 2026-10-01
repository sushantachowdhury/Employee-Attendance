import React, { useState, useEffect } from 'react';
import {
  Camera,
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Crosshair,
  Radar,
  Radio,
  Sliders,
  Check,
  Phone,
} from 'lucide-react';
import { AuthUser, OfficeConfig } from '../types/attendance';
import { calculateDistanceMeters, getCoordinatesAtDistance } from '../utils/geo';
import { notifyWithinRange } from '../utils/notifications';
import { GeofenceMiniMapView } from './GeofenceMiniMapView';

interface CheckInScreenProps {
  user: AuthUser;
  office: OfficeConfig;
  onOpenSelfie: (currentDistance: number, lat: number, lng: number) => void;
  onLogout: () => void;
  onUpdateOfficeLocation?: (lat: number, lng: number, name?: string) => void;
}

export const CheckInScreen: React.FC<CheckInScreenProps> = ({
  user,
  office,
  onOpenSelfie,
  onLogout,
  onUpdateOfficeLocation,
}) => {
  // Detect if running on mobile phone
  const isMobile =
    typeof window !== 'undefined' &&
    (/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
      window.innerWidth < 640);

  // GPS state: true when turned on
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [showGpsModal, setShowGpsModal] = useState(false);

  // Simulation mode vs Real phone device GPS (auto-default to device GPS on mobile phones)
  const [isSimulated, setIsSimulated] = useState(!isMobile);
  const [simulatedDistance, setSimulatedDistance] = useState<number>(32); // Default 32m from PDF

  // Real GPS state
  const [realCoords, setRealCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number | null;
  } | null>(null);
  const [realDistance, setRealDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsUpdateTick, setGpsUpdateTick] = useState(0);

  // Visual tracker view mode: 'map' (interactive GPS geofence map), 'track' (Document 1 bar), 'radar' (2D circle)
  const [viewMode, setViewMode] = useState<'map' | 'track' | 'radar'>('map');
  const [calibratingLocation, setCalibratingLocation] = useState(false);
  const [calibratedSuccess, setCalibratedSuccess] = useState(false);

  // Effective distance:
  const currentDistance = !gpsEnabled
    ? null
    : isSimulated
    ? simulatedDistance
    : realDistance;

  const isWithinRange =
    currentDistance !== null && currentDistance <= office.radiusMeters;

  // Real-Time GPS Geolocation Watcher on Phone
  useEffect(() => {
    let watchId: number | null = null;

    if (!isSimulated && gpsEnabled && navigator.geolocation) {
      setGpsError(null);

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = pos.coords.accuracy;
          const heading = pos.coords.heading;

          setRealCoords({ lat, lng, accuracy, heading });
          setGpsUpdateTick((t) => t + 1);

          const dist = calculateDistanceMeters(
            lat,
            lng,
            office.latitude,
            office.longitude
          );
          setRealDistance(dist);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          let msg = 'Could not acquire GPS position.';
          if (err.code === 1) msg = 'Location access denied. Please allow GPS permission in your phone settings.';
          else if (err.code === 2) msg = 'GPS signal unavailable. Please ensure location is enabled on your phone.';
          else if (err.code === 3) msg = 'GPS request timed out. Retrying...';
          setGpsError(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isSimulated, gpsEnabled, office.latitude, office.longitude]);

  // Alert employee when entering within 50m range
  const prevWithinRangeRef = React.useRef(isWithinRange);
  useEffect(() => {
    if (isWithinRange && !prevWithinRangeRef.current && currentDistance !== null) {
      notifyWithinRange(office.name, currentDistance);
    }
    prevWithinRangeRef.current = isWithinRange;
  }, [isWithinRange, currentDistance, office.name]);

  // Handle GPS prompt turn on
  const handleTurnOnGps = () => {
    setGpsEnabled(true);
    setShowGpsModal(false);
  };

  // Set current user location as office (Calibrate for instant testing wherever they are!)
  const handleSetCurrentAsOffice = async () => {
    if (!realCoords) {
      // If we don't have real coords yet, ask browser for single fast fix
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await updateOfficeCoords(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          alert('Please enable GPS permission on your phone so we can set your location.');
        },
        { enableHighAccuracy: true }
      );
      return;
    }

    await updateOfficeCoords(realCoords.lat, realCoords.lng);
  };

  const updateOfficeCoords = async (lat: number, lng: number) => {
    setCalibratingLocation(true);
    try {
      const res = await fetch('/api/office', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          name: `${office.name} (My Current Spot)`,
        }),
      });

      if (res.ok) {
        if (onUpdateOfficeLocation) {
          onUpdateOfficeLocation(lat, lng, `${office.name} (My Current Spot)`);
        }
        // Force distance to 0m immediately
        setRealDistance(0);
        setCalibratedSuccess(true);
        setTimeout(() => setCalibratedSuccess(false), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCalibratingLocation(false);
    }
  };

  // Trigger selfie camera when in range
  const handleCheckInClick = () => {
    if (!gpsEnabled) {
      setShowGpsModal(true);
      return;
    }
    if (!isWithinRange || currentDistance === null) {
      return;
    }

    let lat = office.latitude;
    let lng = office.longitude;
    if (isSimulated) {
      const coords = getCoordinatesAtDistance(
        office.latitude,
        office.longitude,
        currentDistance
      );
      lat = coords.latitude;
      lng = coords.longitude;
    } else if (realCoords) {
      lat = realCoords.lat;
      lng = realCoords.lng;
    }

    onOpenSelfie(currentDistance, lat, lng);
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-1 relative select-none">
      {/* Top Header & User Badge */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Check in</h2>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
              <span>{user.name} ({user.empId}) • {user.department}</span>
              {user.phone && (
                <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-0.5">
                  <Phone className="w-2.5 h-2.5" /> {user.phone}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="text-[10px] text-neutral-400 hover:text-neutral-200 border border-neutral-700 rounded-lg px-2 py-1 transition"
          >
            Sign out
          </button>
        </div>

        {/* Office Card - Screen 2/3/4 */}
        <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3 mb-2 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">Office</p>
            <p className="text-sm font-semibold text-white tracking-wide">
              {office.name}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
            Radius: {office.radiusMeters}m
          </span>
        </div>

        {/* Distance From Office Card */}
        {!gpsEnabled ? (
          /* Screen 2: GPS is OFF */
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3.5 mb-2.5 shadow-sm">
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">
              Distance from office
            </p>
            <p className="text-xl font-bold text-neutral-500">-- m</p>
            <p className="text-[11px] text-neutral-400 mt-1">
              GPS required to calculate distance
            </p>
          </div>
        ) : isWithinRange ? (
          /* Screen 4: Within 50m Range (Soft green card styling) */
          <div className="bg-[#1b381e] border border-green-600/50 rounded-xl p-3.5 mb-2.5 shadow-sm animate-fade-in transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] text-green-300 font-medium mb-0.5">
                  Distance from office
                </p>
                <p className="text-2xl font-extrabold text-green-100 tracking-tight">
                  {currentDistance} m
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
            </div>
            <p className="text-xs font-semibold text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              You're within range
            </p>
          </div>
        ) : (
          /* Screen 3: Out of 50m Range */
          <div className="bg-neutral-800/80 border border-neutral-700/60 rounded-xl p-3.5 mb-2.5 shadow-sm transition-all">
            <p className="text-[11px] text-neutral-400 font-medium mb-0.5">
              Distance from office
            </p>
            <p className="text-2xl font-extrabold text-white tracking-tight">
              {currentDistance !== null ? `${currentDistance} m` : 'Calculating...'}
            </p>
            <p className="text-xs font-medium text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              Move within {office.radiusMeters} m to check in
            </p>
          </div>
        )}

        {/* Visual Map/Distance Tracker (Toggle between Document 1 Bar & 2D Circular Radar) */}
        <div className="rounded-xl bg-neutral-800/70 border border-neutral-700/60 mb-2 p-2.5 relative overflow-hidden">
          {/* View toggle in corner */}
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-neutral-400 font-medium flex items-center gap-1">
              {!isSimulated && (
                <span className="flex items-center gap-1 text-green-400 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live Phone GPS #{gpsUpdateTick}
                </span>
              )}
            </span>

            <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-0.5 border border-neutral-700/60">
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-1.5 py-0.5 text-[9px] rounded font-medium transition ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Interactive GPS Geofence Map"
              >
                Map View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('track')}
                className={`px-1.5 py-0.5 text-[9px] rounded font-medium transition ${
                  viewMode === 'track'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Linear Track (Document 1)"
              >
                Track Bar
              </button>
              <button
                type="button"
                onClick={() => setViewMode('radar')}
                className={`px-1.5 py-0.5 text-[9px] rounded font-medium transition ${
                  viewMode === 'radar'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="2D Circular Geofence Radar"
              >
                2D Radar
              </button>
            </div>
          </div>

          {viewMode === 'map' ? (
            /* INTERACTIVE GPS GEOFENCE MAP VIEW */
            <GeofenceMiniMapView
              userCoords={
                isSimulated
                  ? getCoordinatesAtDistance(
                      office.latitude,
                      office.longitude,
                      currentDistance || 32
                    )
                  : realCoords
              }
              office={office}
              currentDistance={currentDistance}
              isWithinRange={isWithinRange}
              heading={realCoords?.heading}
            />
          ) : viewMode === 'track' ? (
            /* EXACT DOCUMENT 1 TRACK VIEW (Screens 3 & 4) */
            <div className="py-2 px-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <span className="w-3 h-3 rounded-full bg-[#185FA5] inline-block shadow-sm" />
                  you
                </span>
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <span className="w-3 h-3 rounded-full bg-[#A32D2D] inline-block shadow-sm" />
                  office
                </span>
              </div>

              {/* Progress bar track */}
              <div className="relative w-full h-3 flex items-center">
                <div className="w-full h-1 bg-neutral-700 rounded-full" />

                {/* 50m safe zone indicator */}
                <div
                  className="absolute right-0 h-1.5 bg-green-500/30 rounded-r-full"
                  style={{ width: '25%' }}
                />

                {/* Office red dot */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#A32D2D] border-2 border-neutral-900 shadow-md"
                  title="Office Location"
                />

                {/* Employee blue dot (Moves in real-time) */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-neutral-900 shadow-md transition-all duration-300 flex items-center justify-center ${
                    isWithinRange ? 'bg-[#185FA5] ring-4 ring-green-500/40' : 'bg-[#185FA5]'
                  }`}
                  style={{
                    left: !gpsEnabled
                      ? '10%'
                      : `${Math.max(
                          4,
                          Math.min(
                            90,
                            92 - (Math.min(currentDistance || 300, 300) / 300) * 85
                          )
                        )}%`,
                  }}
                  title={`Your Position: ${currentDistance ?? '--'}m`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
                </div>
              </div>
            </div>
          ) : (
            /* 2D CIRCULAR RADAR VIEW */
            <div className="h-28 flex items-center justify-center relative overflow-hidden bg-neutral-950/60 rounded-lg border border-neutral-800">
              {/* Outer boundary circles */}
              <div className="absolute w-24 h-24 rounded-full border border-neutral-700/40 flex items-center justify-center" />
              {/* 50m green geofence circle */}
              <div
                className={`absolute w-16 h-16 rounded-full border-2 border-dashed transition-colors flex items-center justify-center ${
                  isWithinRange
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-green-600/40'
                }`}
              >
                <span className="text-[8px] text-green-500/60 font-mono absolute -top-3">
                  50m Zone
                </span>
              </div>

              {/* Office Center (Red dot) */}
              <div
                className="w-3.5 h-3.5 rounded-full bg-[#A32D2D] border-2 border-white shadow-md z-10 flex items-center justify-center"
                title="Office (Center)"
              >
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>

              {/* User Position (Blue dot moving in 2D) */}
              <div
                className="absolute transition-all duration-500 z-20 flex flex-col items-center"
                style={{
                  transform: `translate(${
                    isWithinRange
                      ? Math.min(22, ((currentDistance || 0) / 50) * 22)
                      : Math.min(48, 22 + ((currentDistance || 200) / 300) * 26)
                  }px, ${
                    isWithinRange ? -4 : -24
                  }px)`,
                }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#185FA5] border-2 border-white shadow-lg relative flex items-center justify-center">
                  <span className="w-1 h-1 rounded-full bg-white" />
                  <span className="absolute -inset-1 rounded-full bg-blue-400/40 animate-ping" />
                </div>
                <span className="text-[9px] font-mono text-blue-300 font-semibold mt-0.5">
                  you ({currentDistance}m)
                </span>
              </div>

              {/* Radar sweep beam */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent pointer-events-none animate-spin origin-center" />
            </div>
          )}
        </div>
      </div>

      {/* Action Check-In Button */}
      <div className="space-y-2 mt-auto">
        {isWithinRange ? (
          /* Active Button with Camera Icon - Screen 4 */
          <button
            onClick={handleCheckInClick}
            className="w-full bg-[#185FA5] hover:bg-[#154f8a] text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-900/40 text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Check in</span>
          </button>
        ) : (
          /* Disabled Button - Screen 2 & 3 */
          <button
            disabled={gpsEnabled}
            onClick={() => setShowGpsModal(true)}
            className="w-full bg-neutral-800 text-neutral-500 font-medium py-3.5 rounded-xl border border-neutral-700/60 text-sm cursor-not-allowed transition"
          >
            Check in
          </button>
        )}

        {/* Real Phone GPS Calibration & Testing Toolbar */}
        <div className="p-2.5 rounded-xl bg-neutral-950/90 border border-neutral-800 text-left space-y-2">
          {/* GPS Mode Selector */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-neutral-300 font-semibold flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Tracking Source:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSimulated(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                  !isSimulated
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                📱 Live Phone GPS
              </button>
              <button
                type="button"
                onClick={() => setIsSimulated(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                  isSimulated
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Slider Test
              </button>
            </div>
          </div>

          {!isSimulated ? (
            /* REAL PHONE GPS INFO & 1-TAP CALIBRATION */
            <div className="space-y-1.5 pt-1 border-t border-neutral-800 text-[10px]">
              {realCoords ? (
                <div className="flex justify-between items-center text-neutral-300 font-mono">
                  <span>
                    Lat: {realCoords.lat.toFixed(4)}, Lng: {realCoords.lng.toFixed(4)}
                  </span>
                  <span className="text-green-400">
                    ±{Math.round(realCoords.accuracy || 5)}m
                  </span>
                </div>
              ) : (
                <p className="text-blue-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                  Acquiring phone satellite lock...
                </p>
              )}

              {/* 1-Tap Calibrate Current Spot as Office */}
              <button
                type="button"
                onClick={handleSetCurrentAsOffice}
                disabled={calibratingLocation}
                className="w-full py-1.5 px-2 rounded-lg bg-blue-950/80 hover:bg-blue-900/80 border border-blue-700/60 text-blue-200 font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 text-[11px]"
              >
                <Crosshair className="w-3.5 h-3.5 text-blue-400" />
                {calibratedSuccess ? (
                  <span className="text-green-300 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Office set to your spot (0m away)!
                  </span>
                ) : calibratingLocation ? (
                  'Calibrating GPS...'
                ) : (
                  'Set My Current Location as Office'
                )}
              </button>
              <p className="text-[9px] text-neutral-500 leading-tight">
                💡 <em>Tip: Tap this button while holding your phone so your current room/desk becomes the office. Then walk 50m away to watch the dot transition live!</em>
              </p>
            </div>
          ) : (
            /* SLIDER SIMULATOR */
            <div className="pt-1 border-t border-neutral-800">
              <div className="flex justify-between items-center text-[10px] text-neutral-400 mb-1">
                <span>Test Distance:</span>
                <span
                  className={`font-mono font-bold ${
                    simulatedDistance <= office.radiusMeters
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {simulatedDistance} meters
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="350"
                step="2"
                value={simulatedDistance}
                onChange={(e) => setSimulatedDistance(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1 mt-1 text-[9px]">
                <button
                  type="button"
                  onClick={() => setSimulatedDistance(15)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-green-300"
                >
                  15m (Inside)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDistance(32)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-green-300"
                >
                  32m (PDF Ex.)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDistance(240)}
                  className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-red-300"
                >
                  240m (Out)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screen 2: Turn on GPS Pop-up Modal */}
      {showGpsModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-[280px] bg-neutral-900 border border-neutral-700 rounded-2xl p-5 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-blue-950 text-blue-400 flex items-center justify-center mx-auto mb-2.5">
              <MapPin className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Turn on GPS</h3>
            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
              Location is needed to check your distance from the office.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGpsModal(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTurnOnGps}
                className="flex-1 py-2 rounded-xl bg-[#185FA5] hover:bg-[#154f8a] text-white text-xs font-semibold shadow-md transition"
              >
                Turn on
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
