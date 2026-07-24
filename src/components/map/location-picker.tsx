'use client';

// The interactive map used when booking a ride. It shows campus, draws the
// 30 km boundary, and lets the student tap to place a pickup or drop pin.
// This component only ever runs in the browser (Leaflet needs `window`), so
// the booking page loads it with next/dynamic and `ssr: false`.

import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MBU_CENTER, MAX_RADIUS_KM } from '@/lib/geo';
import type { LatLng } from '@/lib/types';

// Build a small teardrop pin in a given colour. We draw it with HTML instead
// of Leaflet's default image markers, which don't load correctly under
// Next.js bundling.
function pinIcon(color: string) {
  return L.divIcon({
    className: 'mbu-pin',
    html: `<div style="
      background:${color};
      width:20px;height:20px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.5);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
}

const pickupIcon = pinIcon('#16a34a'); // green
const dropIcon = pinIcon('#dc2626'); // red
const campusIcon = L.divIcon({
  className: 'mbu-campus',
  html: `<div style="
    background:#2563eb;color:white;font-size:11px;font-weight:600;
    padding:2px 6px;border-radius:6px;white-space:nowrap;border:2px solid white;
    box-shadow:0 1px 4px rgba(0,0,0,.4);
  ">MBU</div>`,
  iconSize: [40, 20],
  iconAnchor: [20, 10],
});

// Listens for taps on the map and reports where the user tapped.
function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// When the `focus` point changes (e.g. after an address search), smoothly
// move the map to it.
function FlyTo({ focus }: { focus: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lng], 14, { duration: 0.8 });
  }, [focus, map]);
  return null;
}

export interface LocationPickerProps {
  pickup: LatLng | null;
  drop: LatLng | null;
  onPick: (point: LatLng) => void;
  focus?: LatLng | null;
  className?: string;
}

export default function LocationPicker({
  pickup,
  drop,
  onPick,
  focus = null,
  className,
}: LocationPickerProps) {
  return (
    <MapContainer
      center={[MBU_CENTER.lat, MBU_CENTER.lng]}
      zoom={11}
      scrollWheelZoom
      className={className}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* The allowed area: a 30 km circle around campus. */}
      <Circle
        center={[MBU_CENTER.lat, MBU_CENTER.lng]}
        radius={MAX_RADIUS_KM * 1000}
        pathOptions={{ color: '#2563eb', weight: 1.5, fillColor: '#2563eb', fillOpacity: 0.06 }}
      />

      <Marker position={[MBU_CENTER.lat, MBU_CENTER.lng]} icon={campusIcon} />
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
      {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />}

      <ClickHandler onPick={onPick} />
      <FlyTo focus={focus} />
    </MapContainer>
  );
}
