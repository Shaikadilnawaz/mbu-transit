'use client';

// Shared live-tracking map used by the student, driver and admin. It draws the
// route (pickup -> drop) and an auto 🛺 that sits at `progress` (0 = at pickup,
// 1 = at drop) along that line. The same `progress` is computed from the
// booking's shared start time on every panel, so everyone sees it move together.

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRoute, pointAlongRoute } from '@/lib/geo';
import type { LatLng } from '@/lib/types';

function pinIcon(color: string) {
  return L.divIcon({
    className: 'mbu-pin',
    html: `<div style="
      background:${color};width:18px;height:18px;
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.5);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
  });
}

const pickupIcon = pinIcon('#16a34a');
const dropIcon = pinIcon('#dc2626');

// The moving auto — just an emoji in a little white bubble.
const autoIcon = L.divIcon({
  className: 'mbu-auto',
  html: `<div style="
    font-size:22px;line-height:1;background:white;border-radius:50%;
    width:34px;height:34px;display:flex;align-items:center;justify-content:center;
    border:2px solid #2563eb;box-shadow:0 1px 6px rgba(0,0,0,.4);
  ">🛺</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Fit the map to show the whole route when it changes.
function FitBounds({ route }: { route: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length < 2) return;
    const bounds = L.latLngBounds(route.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, route]);
  return null;
}

export interface RideTrackingMapProps {
  pickup: LatLng;
  drop: LatLng;
  progress: number; // 0..1
  className?: string;
}

export default function RideTrackingMap({ pickup, drop, progress }: RideTrackingMapProps) {
  // The road path pickup -> drop. Starts as a straight line, then upgrades to
  // the real driving route once OSRM responds.
  const [route, setRoute] = useState<LatLng[]>([pickup, drop]);

  useEffect(() => {
    let active = true;
    getRoute(pickup, drop).then((r) => {
      if (active) setRoute(r);
    });
    return () => {
      active = false;
    };
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng]);

  // Position the auto along the actual road, measured by distance travelled.
  const autoPos = pointAlongRoute(route, progress);

  return (
    <MapContainer
      center={[pickup.lat, pickup.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* The route drawn along the roads */}
      <Polyline
        positions={route.map((p) => [p.lat, p.lng] as [number, number])}
        pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.75 }}
      />
      <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
      <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />
      <Marker position={[autoPos.lat, autoPos.lng]} icon={autoIcon} />
      <FitBounds route={route} />
    </MapContainer>
  );
}
