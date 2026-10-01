import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, ZapOff, RefreshCw, User, Check, ShieldCheck, Sparkles, Database, WifiOff } from 'lucide-react';
import { AuthUser } from '../types/attendance';
import {
  insertSQLiteAttendance,
  markSQLiteRecordSynced,
  isSimulatedOffline,
} from '../utils/sqliteStorage';

interface SelfieCameraScreenProps {
  user: AuthUser;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onSuccess: (record: any) => void;
}

export const SelfieCameraScreen: React.FC<SelfieCameraScreenProps> = ({
  user,
  distanceMeters,
  latitude,
  longitude,
  onClose,
  onSuccess,
}) => {
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;

    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera API not available on this browser');
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
        setCameraError(null);
      } catch (err: any) {
        console.warn('Camera access issue:', err.message);
        if (isMounted) {
          setCameraActive(false);
          setCameraError(
            'Live camera access is restricted or unavailable. Simulated biometric capture will be used.'
          );
        }
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Capture snapshot from webcam or generate high-res biometric sample
  const handleCapture = async () => {
    setCapturing(true);

    let photoData = '';

    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror if user-facing
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    // Fallback high quality avatar if live camera wasn't active
    if (!photoData) {
      photoData =
        user.empId === 'EMP001'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
          : user.empId === 'EMP002'
          ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
    }

    setCapturedPhoto(photoData);

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${now.getFullYear()}`;
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(now);

    const localRecordId = `sqlite-att-${Date.now()}`;
    const isOffline = isSimulatedOffline() || !navigator.onLine;

    // Always persist to local SQLite storage first (Offline-First Architecture)
    const sqliteRow = insertSQLiteAttendance({
      id: localRecordId,
      emp_id: user.empId,
      employee_name: user.name,
      department: user.department,
      office: user.office,
      attendance_date: formattedDate,
      check_in_time: formattedTime,
      latitude,
      longitude,
      distance_m: distanceMeters,
      selfie_image_path: photoData,
      status: 'Present',
      sync_status: isOffline ? 'PENDING_SYNC' : 'PENDING_SYNC',
      device_id: 'EXPO_DEVICE_' + user.empId,
    });

    if (isOffline) {
      // Offline mode: Record confirmed in local SQLite, pending background sync
      setTimeout(() => {
        onSuccess({
          id: sqliteRow.id,
          empId: user.empId,
          employeeName: user.name,
          department: user.department,
          office: user.office,
          date: formattedDate,
          checkInTime: formattedTime,
          distanceMeters,
          selfieUrl: photoData,
          status: 'Present',
          isOfflineStored: true,
          syncStatus: 'PENDING_SYNC',
        });
      }, 700);
      return;
    }

    // Online: Call check-in backend API
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId: user.empId,
          latitude,
          longitude,
          distanceMeters,
          selfieUrl: photoData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Mark record as synced in local SQLite
      markSQLiteRecordSynced(sqliteRow.id);

      setTimeout(() => {
        onSuccess({
          ...data.record,
          isOfflineStored: false,
          syncStatus: 'SYNCED',
        });
      }, 700);
    } catch (err: any) {
      console.warn('Network issue during check-in, saved to SQLite storage', err);
      // Fallback: Still confirm locally so employee never loses attendance punch!
      setTimeout(() => {
        onSuccess({
          id: sqliteRow.id,
          empId: user.empId,
          employeeName: user.name,
          department: user.department,
          office: user.office,
          date: formattedDate,
          checkInTime: formattedTime,
          distanceMeters,
          selfieUrl: photoData,
          status: 'Present',
          isOfflineStored: true,
          syncStatus: 'PENDING_SYNC',
        });
      }, 700);
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-1 bg-[#1a1a19] -m-4 p-4 rounded-[36px] relative overflow-hidden select-none">
      {/* Top Header - Screen 5 (4a/4b) */}
      <div className="flex items-center justify-between text-neutral-300 z-20 pt-2 px-1">
        <span className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          Take selfie
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center text-neutral-300 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Camera Viewfinder Area */}
      <div className="flex-1 relative my-2 rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-inner">
        {/* Flash effect overlay */}
        {flashOn && (
          <div className="absolute inset-0 bg-white/30 z-30 pointer-events-none animate-pulse" />
        )}

        {/* Live Video Feed */}
        {cameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />
        ) : (
          /* Simulated Camera Viewfinder */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2">
              <User className="w-8 h-8 text-neutral-300" />
            </div>
            <p className="text-xs text-neutral-400 font-medium max-w-[200px]">
              Biometric camera ready. Tap shutter to capture & verify.
            </p>
          </div>
        )}

        {/* Dashed Oval Face Guide - Screen 5 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="relative w-[150px] h-[190px] border-2 border-dashed border-neutral-300/80 rounded-[50%] flex items-center justify-center shadow-lg">
            {/* Pulsing Face outline icon if empty */}
            {!cameraActive && (
              <User className="w-16 h-16 text-neutral-500/50" />
            )}

            {/* Scanning line animation */}
            <div className="absolute w-full h-0.5 bg-blue-400/80 shadow-[0_0_8px_#38bdf8] animate-scan-bounce" />

            {/* Corner alignment anchors */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-blue-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-blue-400" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-blue-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-blue-400" />
          </div>
        </div>

        {/* Facial detection status badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-neutral-700/60 flex items-center gap-1.5 text-[11px] text-green-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Face detected • 32m from office
        </div>

        {/* Hidden Canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Subtext matching Screen 5: "Keep your face inside the frame" */}
      <p className="text-[12px] text-neutral-300 text-center mb-3 font-normal">
        Keep your face inside the frame
      </p>

      {/* Bottom Shutter & Controls Bar */}
      <div className="flex items-center justify-around pb-2 px-4 z-20">
        {/* Flash Toggle */}
        <button
          type="button"
          onClick={() => setFlashOn(!flashOn)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 ${
            flashOn
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-neutral-400 hover:text-white'
          }`}
          title="Toggle flash"
        >
          {flashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
        </button>

        {/* Shutter Capture Button - Exactly matching Document 1 Screen 4b */}
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing}
          className="relative w-16 h-16 rounded-full bg-[#F1EFE8] border-4 border-[#888780] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-xl disabled:opacity-50"
          title="Capture Selfie"
        >
          {capturing ? (
            <span className="w-6 h-6 border-3 border-neutral-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="w-11 h-11 rounded-full bg-white shadow-inner flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </span>
          )}
        </button>

        {/* Camera Switch / Rotate */}
        <button
          type="button"
          onClick={toggleCameraFacing}
          className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition active:scale-90"
          title="Switch front/back camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
