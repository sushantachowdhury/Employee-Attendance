/**
 * Calculates the great-circle distance between two points on the Earth's surface in meters
 * using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance);
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Generates synthetic coordinates at an exact distance (in meters) from a base coordinate,
 * useful for simulating distance from the office.
 */
export function getCoordinatesAtDistance(
  baseLat: number,
  baseLon: number,
  distanceMeters: number,
  bearingDeg = 45
): { latitude: number; longitude: number } {
  const R = 6371000;
  const brng = deg2rad(bearingDeg);
  const d = distanceMeters;
  const lat1 = deg2rad(baseLat);
  const lon1 = deg2rad(baseLon);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d / R) +
      Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
      Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
}

/**
 * Format current date as "Thursday, 1 Oct 2026"
 */
export function formatDisplayDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date as "01-10-2026" for reports
 */
export function formatDateForReport(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format time as "09:42 AM"
 */
export function formatDisplayTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
