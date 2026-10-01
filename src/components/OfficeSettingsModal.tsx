import React, { useState } from 'react';
import { Settings, MapPin, Clock, Calendar, RefreshCcw, Check } from 'lucide-react';
import { OfficeConfig } from '../types/attendance';

interface OfficeSettingsModalProps {
  isOpen: boolean;
  office: OfficeConfig;
  onClose: () => void;
  onSave: (updated: OfficeConfig) => void;
  onResetData: () => void;
}

export const OfficeSettingsModal: React.FC<OfficeSettingsModalProps> = ({
  isOpen,
  office,
  onClose,
  onSave,
  onResetData,
}) => {
  const [name, setName] = useState(office.name);
  const [lat, setLat] = useState(String(office.latitude));
  const [lng, setLng] = useState(String(office.longitude));
  const [radius, setRadius] = useState(String(office.radiusMeters));
  const [threshold, setThreshold] = useState(office.lateThreshold);
  const [workDays, setWorkDays] = useState(String(office.workDaysPerMonth));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = {
        ...office,
        name,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        radiusMeters: parseInt(radius, 10) || 50,
        lateThreshold: threshold,
        workDaysPerMonth: parseInt(workDays, 10) || 26,
      };

      const res = await fetch('/api/office', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        onSave(updated);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to update office', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Office & Geofence Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-neutral-400 font-medium mb-1">
              Office Branch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-neutral-400 font-medium">
                Geofence Radius (Meters)
              </label>
              <span className="font-mono font-bold text-blue-400">
                {radius} meters
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="200"
              step="5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Default is 50 meters as requested. Staff beyond this range cannot clock in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                Late Mark After
              </label>
              <input
                type="time"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 font-medium mb-1">
                Working Days / Month
              </label>
              <input
                type="number"
                value={workDays}
                onChange={(e) => setWorkDays(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onResetData}
              className="px-3 py-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs flex items-center gap-1 transition"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1 shadow-md transition disabled:opacity-60"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-300" /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
