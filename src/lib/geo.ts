// Location helpers for the booking map: where the campus is, how far a point
// is from it, and turning a typed address into map coordinates.

import type { LatLng, Offer } from './types';

// Mohan Babu University, Sree Sainath Nagar, Tirupati. This is the center of
// the allowed area. If you ever need it more precise, right-click the exact
// spot in Google Maps — it shows the lat,lng — and paste the numbers here.
export const MBU_CENTER: LatLng = { lat: 13.6357, lng: 79.3521 };

// Rides are only allowed when BOTH pickup and drop are within this many
// kilometres of campus.
export const MAX_RADIUS_KM = 30;

// How long the simulated ride takes to travel pickup -> drop, in milliseconds.
// The ride auto-starts on confirmation and auto-ends after this long.
export const RIDE_SIM_DURATION_MS = 10000;

// A point `t` of the way (0..1) along the straight line from `a` to `b`.
export function lerpLatLng(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };
}

// Fetch the actual driving route (following roads) between two points from the
// free OSRM service. Returns the list of points that make up the road path.
// Falls back to a straight line if the service can't be reached.
export async function getRoute(a: LatLng, b: LatLng): Promise<LatLng[]> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('route request failed');
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined;
    if (!coords || coords.length < 2) throw new Error('no route geometry');
    // OSRM returns [lng, lat]; convert to our {lat, lng}.
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return [a, b];
  }
}

// The point `t` (0..1) of the way ALONG a multi-point route, measured by real
// distance so the vehicle moves at a steady speed even when segments differ.
export function pointAlongRoute(route: LatLng[], t: number): LatLng {
  if (route.length === 0) return { lat: 0, lng: 0 };
  if (route.length === 1) return route[0];
  const clamped = Math.min(Math.max(t, 0), 1);

  const segLen: number[] = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = distanceKm(route[i], route[i + 1]);
    segLen.push(d);
    total += d;
  }
  if (total === 0) return route[0];

  let target = clamped * total;
  for (let i = 0; i < segLen.length; i++) {
    if (target <= segLen[i]) {
      const f = segLen[i] === 0 ? 0 : target / segLen[i];
      return lerpLatLng(route[i], route[i + 1], f);
    }
    target -= segLen[i];
  }
  return route[route.length - 1];
}

// Distance in kilometres between two lat/lng points, using the haversine
// formula (accounts for the curve of the earth). You don't need to memorise
// this maths — it's a standard, well-known formula.
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// True if the point is inside the 30 km circle around campus.
export function isWithinCampusRadius(point: LatLng): boolean {
  return distanceKm(MBU_CENTER, point) <= MAX_RADIUS_KM;
}

// How far a point is from campus, rounded for showing to the user.
export function kmFromCampus(point: LatLng): number {
  return Math.round(distanceKm(MBU_CENTER, point) * 10) / 10;
}

// Works out the best discount for a fare, combining the automatic ride-count
// offers (first ride free / 10% off first 5 rides) with an optional coupon.
// Returns the fare the student actually pays, plus how much was saved.
export function computeDiscount(
  baseFare: number,
  completedRides: number,
  offer: Offer | null
): { finalFare: number; discount: number; label: string } {
  let autoDiscount = 0;
  let autoLabel = '';
  if (completedRides === 0) {
    autoDiscount = baseFare; // first ride free
    autoLabel = 'First ride free';
  } else if (completedRides < 5) {
    autoDiscount = Math.round(baseFare * 0.1); // 10% off first 5 rides
    autoLabel = '10% off (first 5 rides)';
  }

  let couponDiscount = 0;
  let couponLabel = '';
  if (offer) {
    couponDiscount =
      offer.discountType === 'percent'
        ? Math.round((baseFare * offer.value) / 100)
        : Math.min(offer.value, baseFare);
    couponLabel = `Coupon ${offer.code}`;
  }

  // Apply whichever saves more (never more than the fare itself).
  const discount = Math.min(Math.max(autoDiscount, couponDiscount), baseFare);
  const label = discount === 0 ? '' : autoDiscount >= couponDiscount ? autoLabel : couponLabel;
  return { finalFare: Math.max(baseFare - discount, 0), discount, label };
}

// Fare (per seat) for a trip of the given length, in rupees:
//   up to 4 km   → ₹20
//   up to 7 km   → ₹30
//   up to 15 km  → ₹40
//   beyond 15 km → ₹40 + ₹5 for every extra km
export function fareForDistance(km: number): number {
  if (km <= 4) return 20;
  if (km <= 7) return 30;
  if (km <= 15) return 40;
  // Charge ₹5 for each whole kilometre past the 15 km mark.
  return 40 + Math.ceil(km - 15) * 5;
}

/* ------------------------------------------------------------------ */
/*  Address search / reverse lookup (OpenStreetMap Nominatim, free)   */
/* ------------------------------------------------------------------ */

export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

// Turns what the user types ("tirupati bus stand") into a list of real places
// with coordinates. We bias the search towards the area around campus and
// limit it to India so the suggestions are relevant.
export async function searchPlaces(queryText: string): Promise<PlaceResult[]> {
  const q = queryText.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'in',
    // Prefer results near campus (a rough box around MBU).
    viewbox: `${MBU_CENTER.lng - 0.6},${MBU_CENTER.lat + 0.6},${MBU_CENTER.lng + 0.6},${MBU_CENTER.lat - 0.6}`,
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}

// The opposite direction: given a point the user tapped on the map, find a
// human-readable address for it (so the form can show something meaningful).
export async function reverseGeocode(point: LatLng): Promise<string> {
  const params = new URLSearchParams({
    lat: String(point.lat),
    lon: String(point.lng),
    format: 'json',
  });
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error('reverse failed');
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  } catch {
    // If the lookup fails we still return the raw coordinates so the booking
    // can proceed — it's a label, not something the ride depends on.
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }
}
