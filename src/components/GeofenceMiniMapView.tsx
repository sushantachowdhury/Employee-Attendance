import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Navigation,
  Building2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Layers,
  Compass,
} from 'lucide-react';
import { OfficeConfig } from '../types/attendance';

interface GeofenceMiniMapViewProps {
  userCoords:
    | { lat: number; lng: number }
    | { latitude: number; longitude: number }
    | null;
  office: OfficeConfig;
  currentDistance: number | null;
  isWithinRange: boolean;
  heading?: number | null;
}

export const GeofenceMiniMapView: React.FC<GeofenceMiniMapViewProps> = ({
  userCoords,
  office,
  currentDistance,
  isWithinRange,
  heading,
}) => {
  // Zoom level: 1 = standard (shows ~120m radius), 1.5 = close, 0.7 = wide (shows ~250m)
  const [zoom, setZoom] = useState<number>(1);
  const [centerTarget, setCenterTarget] = useState<'mid' | 'user' | 'office'>('mid');

  const normalizedUser = useMemo(() => {
    if (!userCoords) return null;
    return {
      lat: 'lat' in userCoords ? userCoords.lat : userCoords.latitude,
      lng: 'lng' in userCoords ? userCoords.lng : userCoords.longitude,
    };
  }, [userCoords]);

  // SVG canvas dimensions
  const width = 340;
  const height = 210;
  const cx = width / 2;
  const cy = height / 2;

  // 1 meter in pixels at zoom = 1 (approx 1.4px per meter so 50m circle has radius 70px)
  const scale = 1.35 * zoom;
  const geofenceRadiusPx = office.radiusMeters * scale;

  // Calculate relative user offset from office in meters
  // If userCoords are available, convert lat/lng delta to meters; otherwise use currentDistance along an angle (e.g., 40deg)
  const userOffsetMeters = useMemo(() => {
    if (!currentDistance) {
      return { x: 30, y: -20 };
    }

    if (
      normalizedUser &&
      (normalizedUser.lat !== office.latitude ||
        normalizedUser.lng !== office.longitude)
    ) {
      // 1 deg lat ~ 111,000m
      const latDiffM = (normalizedUser.lat - office.latitude) * 111000;
      // 1 deg lng ~ 111,000m * cos(lat)
      const lngDiffM =
        (normalizedUser.lng - office.longitude) *
        111000 *
        Math.cos((office.latitude * Math.PI) / 180);

      // Clamp max distance for visual drawing within canvas view
      return { x: lngDiffM, y: -latDiffM };
    }

    // Default angle: 35 degrees northeast
    const angleRad = (38 * Math.PI) / 180;
    return {
      x: currentDistance * Math.cos(angleRad),
      y: -currentDistance * Math.sin(angleRad),
    };
  }, [normalizedUser, office, currentDistance]);

  // Determine center translation based on target
  const offset = useMemo(() => {
    if (centerTarget === 'user') {
      return {
        officeX: cx - userOffsetMeters.x * scale,
        officeY: cy - userOffsetMeters.y * scale,
        userX: cx,
        userY: cy,
      };
    } else if (centerTarget === 'office') {
      return {
        officeX: cx,
        officeY: cy,
        userX: cx + userOffsetMeters.x * scale,
        userY: cy + userOffsetMeters.y * scale,
      };
    } else {
      // Midpoint center
      const midX = (userOffsetMeters.x * scale) / 2;
      const midY = (userOffsetMeters.y * scale) / 2;
      return {
        officeX: cx - midX,
        officeY: cy - midY,
        userX: cx + midX,
        userY: cy + midY,
      };
    }
  }, [centerTarget, cx, cy, userOffsetMeters, scale]);

  const distanceVal = currentDistance !== null ? Math.round(currentDistance) : 32;

  // Google Maps link for actual office coordinates
  const mapsUrl = `https://www.google.com/maps?q=${office.latitude},${office.longitude}`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#0d1117] border border-neutral-700/80 shadow-inner group">
      {/* Top Map HUD: Geofence status & distance pill */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md backdrop-blur-md border ${
            isWithinRange
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/80'
              : 'bg-red-950/85 text-red-300 border-red-500/80'
          }`}
        >
          {isWithinRange ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>WITHIN 50m GEOFENCE</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>OUTSIDE 50m BOUNDARY</span>
            </>
          )}
        </div>

        {/* Distance Badge */}
        <div className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-neutral-900/90 text-white border border-neutral-700 backdrop-blur-md shadow-md">
          <span className={isWithinRange ? 'text-emerald-400' : 'text-amber-400'}>
            {distanceVal}m
          </span>{' '}
          / {office.radiusMeters}m
        </div>
      </div>

      {/* SVG Vector Map Rendering */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[190px] block cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Street grid pattern */}
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#1b222d"
              strokeWidth="1.2"
            />
          </pattern>

          {/* Radial gradient for Geofence safe zone */}
          <radialGradient id="geofenceGradient" cx="50%" cy="50%" r="50%">
            <stop
              offset="0%"
              stopColor={isWithinRange ? '#10b981' : '#ef4444'}
              stopOpacity="0.28"
            />
            <stop
              offset="70%"
              stopColor={isWithinRange ? '#10b981' : '#ef4444'}
              stopOpacity="0.14"
            />
            <stop
              offset="100%"
              stopColor={isWithinRange ? '#10b981' : '#ef4444'}
              stopOpacity="0.04"
            />
          </radialGradient>

          {/* User pulse glow */}
          <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base map background with subtle street blocks */}
        <rect width={width} height={height} fill="#0d1117" />
        <rect width={width} height={height} fill="url(#roadGrid)" />

        {/* Ambient road accents (mimicking surrounding city blocks) */}
        <path
          d={`M 0,${offset.officeY + 55} L ${width},${offset.officeY + 55}`}
          stroke="#1e293b"
          strokeWidth="6"
          strokeDasharray="8 6"
        />
        <path
          d={`M ${offset.officeX - 60},0 L ${offset.officeX - 60},${height}`}
          stroke="#1e293b"
          strokeWidth="6"
        />
        <path
          d={`M ${offset.officeX + 75},0 L ${offset.officeX + 75},${height}`}
          stroke="#192333"
          strokeWidth="4"
        />

        {/* 100m outer buffer ring */}
        <circle
          cx={offset.officeX}
          cy={offset.officeY}
          r={100 * scale}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.4"
        />
        <text
          x={offset.officeX + 100 * scale - 12}
          y={offset.officeY - 4}
          fill="#64748b"
          fontSize="7"
          fontFamily="monospace"
        >
          100m
        </text>

        {/* 25m inner guide ring */}
        <circle
          cx={offset.officeX}
          cy={offset.officeY}
          r={25 * scale}
          fill="none"
          stroke="#334155"
          strokeWidth="0.8"
          strokeDasharray="2 3"
          opacity="0.5"
        />

        {/* 50-METER GEOFENCE CIRCULAR BOUNDARY (The core requirement) */}
        <circle
          cx={offset.officeX}
          cy={offset.officeY}
          r={geofenceRadiusPx}
          fill="url(#geofenceGradient)"
          stroke={isWithinRange ? '#10b981' : '#ef4444'}
          strokeWidth={isWithinRange ? '2.5' : '2'}
          strokeDasharray={isWithinRange ? 'none' : '4 3'}
        />

        {/* Animated Geofence Radar Pulse Wave */}
        <circle
          cx={offset.officeX}
          cy={offset.officeY}
          r={geofenceRadiusPx}
          fill="none"
          stroke={isWithinRange ? '#10b981' : '#ef4444'}
          strokeWidth="1"
          opacity="0.5"
          className="animate-ping"
          style={{ transformOrigin: `${offset.officeX}px ${offset.officeY}px` }}
        />

        {/* Radius label badge on perimeter */}
        <g transform={`translate(${offset.officeX}, ${offset.officeY - geofenceRadiusPx})`}>
          <rect
            x="-16"
            y="-14"
            width="32"
            height="11"
            rx="4"
            fill={isWithinRange ? '#064e3b' : '#7f1d1d'}
            stroke={isWithinRange ? '#059669' : '#b91c1c'}
            strokeWidth="0.8"
          />
          <text
            x="0"
            y="-6"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="7"
            fontWeight="bold"
            fontFamily="monospace"
          >
            50m
          </text>
        </g>

        {/* Dynamic Distance Vector Line (User <---> Office) */}
        <line
          x1={offset.officeX}
          y1={offset.officeY}
          x2={offset.userX}
          y2={offset.userY}
          stroke={isWithinRange ? '#10b981' : '#f59e0b'}
          strokeWidth="1.8"
          strokeDasharray={isWithinRange ? '3 2' : '4 3'}
        />

        {/* Mid-point Distance Pill Label */}
        <g
          transform={`translate(${
            (offset.officeX + offset.userX) / 2
          }, ${(offset.officeY + offset.userY) / 2})`}
        >
          <rect
            x="-18"
            y="-8"
            width="36"
            height="14"
            rx="5"
            fill="#111827"
            stroke={isWithinRange ? '#10b981' : '#f59e0b'}
            strokeWidth="1"
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
          />
          <text
            x="0"
            y="2"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {distanceVal}m
          </text>
        </g>

        {/* OFFICE LOCATION MARKER (Center Pin) */}
        <g transform={`translate(${offset.officeX}, ${offset.officeY})`}>
          {/* Base shadow */}
          <ellipse cx="0" cy="8" rx="8" ry="3" fill="#000000" opacity="0.4" />
          {/* Office Icon Badge */}
          <circle cx="0" cy="0" r="10" fill="#a82323" stroke="#ffffff" strokeWidth="1.5" />
          <path
            d="M -4 -4 L 4 -4 L 4 4 L -4 4 Z M -1 -1 L 1 -1 L 1 4 L -1 4 Z"
            fill="#ffffff"
          />
          {/* Office Label */}
          <text
            x="0"
            y="17"
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize="8"
            fontWeight="600"
            className="select-none"
          >
            Office
          </text>
        </g>

        {/* USER LIVE GPS LOCATION MARKER */}
        <g transform={`translate(${offset.userX}, ${offset.userY})`}>
          {/* Large accuracy glow halo */}
          <circle cx="0" cy="0" r="18" fill="url(#userGlow)" />
          {/* Pulsing ring */}
          <circle
            cx="0"
            cy="0"
            r="12"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            opacity="0.7"
            className="animate-ping"
            style={{ transformOrigin: '0px 0px' }}
          />
          {/* Inner blue GPS dot */}
          <circle cx="0" cy="0" r="6" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
          {/* Center pinpoint */}
          <circle cx="0" cy="0" r="2" fill="#ffffff" />
          {/* User Label */}
          <text
            x="0"
            y="17"
            textAnchor="middle"
            fill="#93c5fd"
            fontSize="8"
            fontWeight="bold"
            className="select-none"
          >
            You ({distanceVal}m)
          </text>
        </g>
      </svg>

      {/* Interactive Map Overlay Controls */}
      <div className="absolute bottom-2 right-2 z-20 flex flex-col gap-1 shadow-lg">
        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2, +(z + 0.25).toFixed(2)))}
          className="w-6 h-6 rounded-md bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 flex items-center justify-center text-xs transition active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)))}
          className="w-6 h-6 rounded-md bg-neutral-900/90 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 flex items-center justify-center text-xs transition active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Left Quick Center Buttons */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 text-[9px]">
        <button
          type="button"
          onClick={() => setCenterTarget('user')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border backdrop-blur-md transition ${
            centerTarget === 'user'
              ? 'bg-blue-600/90 text-white border-blue-500'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
          title="Center on Your Location"
        >
          <Navigation className="w-2.5 h-2.5" />
          You
        </button>
        <button
          type="button"
          onClick={() => setCenterTarget('office')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium border backdrop-blur-md transition ${
            centerTarget === 'office'
              ? 'bg-red-700/90 text-white border-red-500'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
          title="Center on Office Pin"
        >
          <Building2 className="w-2.5 h-2.5" />
          Office
        </button>
        <button
          type="button"
          onClick={() => setCenterTarget('mid')}
          className={`px-1.5 py-0.5 rounded-md font-medium border backdrop-blur-md transition ${
            centerTarget === 'mid'
              ? 'bg-neutral-800 text-white border-neutral-600'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
          title="Fit Both in View"
        >
          Fit
        </button>

        {/* Real coordinates external link */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-blue-300 border border-neutral-700 transition"
          title="View Office on Google Maps"
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};
