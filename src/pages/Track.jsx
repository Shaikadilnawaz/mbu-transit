import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Track() {
  const mapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [infoContent, setInfoContent] = useState("");
  const [etaText, setEtaText] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [fare, setFare] = useState(0);

  useEffect(() => {
    const bookingStr = localStorage.getItem("rideBooking");
    if (!bookingStr) {
      setInfoContent("❌ No active ride found. Please book a ride.");
      return;
    }
    const booking = JSON.parse(bookingStr);
    if (!booking.pickup || !booking.dropoff) {
      setInfoContent("❌ Incomplete booking data. Please book again.");
      return;
    }

    setFare(booking.fare || 0);

    setInfoContent(
      <>
        <div><b>Vehicle:</b> {booking.vehicle === "car" ? "🚗 Car" : "🏍️ Bike"}</div>
        <div><b>Pickup:</b> 🟢 {booking.pickupAddress}</div>
        <div><b>Drop-off:</b> 🔴 {booking.dropoffAddress}</div>
        <div><b>Seat:</b> {booking.seat}</div>
        <div><b>Fare:</b> ₹ {booking.fare}</div>
        <div><b>Gender:</b> {booking.gender}</div>
      </>
    );

    const map = L.map("mapTrack").setView([booking.pickup.lat, booking.pickup.lng], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    L.marker([booking.pickup.lat, booking.pickup.lng], {
      icon: L.divIcon({ html: "🟢", className: "emoji-icon", iconSize: [24, 24] }),
    }).addTo(map).bindPopup(`Pickup: ${booking.pickupAddress}`);

    L.marker([booking.dropoff.lat, booking.dropoff.lng], {
      icon: L.divIcon({ html: "🔴", className: "emoji-icon", iconSize: [24, 24] }),
    }).addTo(map).bindPopup(`Drop-off: ${booking.dropoffAddress}`);

    L.polyline([booking.pickup, booking.dropoff], {
      color: "blue",
      weight: 4,
      opacity: 0.7,
    }).addTo(map);

    const vehicleIcon = L.icon({
      iconUrl:
        booking.vehicle === "car"
          ? "https://cdn-icons-png.flaticon.com/512/743/743007.png"
          : "https://cdn-icons-png.flaticon.com/512/3468/3468377.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    let vehiclePosition = { ...booking.pickup };
    const vehicleMarker = L.marker([vehiclePosition.lat, vehiclePosition.lng], {
      icon: vehicleIcon,
    }).addTo(map);
    vehicleMarkerRef.current = vehicleMarker;

    function distanceKm(a, b) {
      const R = 6371;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const lat1 = (a.lat * Math.PI) / 180;
      const lat2 = (b.lat * Math.PI) / 180;
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }

    function interpolate(a, b, t) {
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }

    let progress = 0;
    const speed = 0.003;

    function animate() {
      if (progress > 1) {
        setEtaText("✅ Arrived at destination!");
        setShowRating(true);
        return;
      }

      const pos = interpolate(booking.pickup, booking.dropoff, progress);
      vehicleMarker.setLatLng([pos.lat, pos.lng]);
      vehiclePosition = pos;

      const remaining = distanceKm(pos, booking.dropoff);
      const etaMins = Math.max(Math.ceil((remaining / 0.5) * 60), 1);
      setEtaText(`⏱️ ETA: ${etaMins} min | 📏 Distance left: ${remaining.toFixed(2)} km`);

      progress += speed;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
    };
  }, []);

  const handleRatingClick = (value) => setRating(value);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "'Poppins', sans-serif" }}>
      <h2 style={{ textAlign: "center", color: "#4361ee", marginBottom: 20 }}>
        📍 Live Ride Tracking
      </h2>
      <div id="mapTrack" style={{ height: 520, borderRadius: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />
      <div style={{ marginTop: 15, color: "#333", fontWeight: "500" }}>{infoContent}</div>
      <div style={{ marginTop: 10, color: "#38ef7d", fontWeight: "bold", fontSize: "1.1rem", textAlign: "center" }}>
        {etaText}
      </div>

      {showRating && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 9999
        }}>
          <div style={{
            background: "#fff", padding: "20px 30px", borderRadius: "12px",
            textAlign: "center", width: "320px", boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
          }}>
            <h3 style={{ marginBottom: "10px", color: "#222" }}>⭐ Rate your Ride</h3>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>
              {[1,2,3,4,5].map((val) => (
                <span key={val} onClick={() => handleRatingClick(val)}
                      style={{ cursor: "pointer", margin: "0 5px", color: val <= rating ? "#FFD700" : "#ccc" }}>⭐</span>
              ))}
            </div>
            <p style={{ fontSize: "0.9rem", color: "#444" }}>
              {rating === 0 ? "Tap a star to rate" : `You rated ${rating} star${rating>1?'s':''}`}
            </p>
            <div style={{ marginTop: "12px", fontWeight: "600", color: "#111" }}>
              💵 Fare to be Paid: ₹ {fare}
            </div>
            <button onClick={() => setShowRating(false)}
                    style={{ marginTop: "15px", padding: "8px 20px",
                      background: "#4361ee", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
