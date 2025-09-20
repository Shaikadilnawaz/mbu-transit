import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Autobg from './Autobg.png'; // Import the background image

export default function AutoTracking() {
  const mapRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [infoContent, setInfoContent] = useState("");
  const [etaText, setEtaText] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [fare, setFare] = useState(null); // store fare

  useEffect(() => {
    const bookingStr = localStorage.getItem("rideBooking");
    if (!bookingStr) return setInfoContent("❌ No active ride found.");

    const booking = JSON.parse(bookingStr);
    setFare(booking.fare); // load fare

    setInfoContent(
      <>
        <div><b>Vehicle:</b> 🚖 Auto</div>
        <div><b>Pickup:</b> 🟢 {booking.pickupAddress}</div>
        <div><b>Drop-off:</b> 🔴 {booking.dropoffAddress}</div>
        <div><b>Seat(s):</b> {booking.seat}</div>
        <div><b>Driver:</b> {booking.driver.name}</div>
        <div><b>Vehicle:</b> {booking.driver.vehicle}</div>
        <div><b>Auto ID:</b> {booking.driver.plate}</div>
      </>
    );

    const map = L.map("mapTrack").setView([booking.pickup.lat, booking.pickup.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);

    // Pickup marker
    L.marker([booking.pickup.lat, booking.pickup.lng], {
      icon: L.divIcon({ html: "🟢", className: "emoji-icon", iconSize: [24, 24] }),
    }).addTo(map);

    // Dropoff marker
    L.marker([booking.dropoff.lat, booking.dropoff.lng], {
      icon: L.divIcon({ html: "🔴", className: "emoji-icon", iconSize: [24, 24] }),
    }).addTo(map);

    // Polyline route
    L.polyline([booking.pickup, booking.dropoff], { color: "blue", weight: 4, opacity: 0.7 }).addTo(map);

    // Vehicle icon
    const vehicleIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743007.png",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    let vehiclePosition = { ...booking.pickup };
    const vehicleMarker = L.marker([vehiclePosition.lat, vehiclePosition.lng], { icon: vehicleIcon }).addTo(map);
    vehicleMarkerRef.current = vehicleMarker;

    const interpolate = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

    let progress = 0;
    const speed = 0.003;

    const distanceKm = (a, b) => {
      const R = 6371;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const lat1 = (a.lat * Math.PI) / 180;
      const lat2 = (b.lat * Math.PI) / 180;
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };

    const animate = () => {
      if (progress > 1) {
        setEtaText("✅ Arrived at destination!");
        setShowRating(true); // show rating + fare at the end
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
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
    };
  }, []);

  const handleRatingClick = (value) => setRating(value);

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        backgroundImage: `url(${Autobg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
    >
      {/* Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }}
      />
      
      <div 
        style={{ 
          maxWidth: 900, 
          margin: "0 auto", 
          padding: "40px 20px",
          fontFamily: "'Poppins', sans-serif",
          position: 'relative',
          zIndex: 2
        }}
      >
        <h2 style={{ textAlign: "center", color: "#fff", marginBottom: 20, fontSize: "2.5rem", fontWeight: "bold" }}>
          📍 Live Ride Tracking
        </h2>
        
        <div id="mapTrack" style={{ height: 520, borderRadius: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", border: "3px solid rgba(255,255,255,0.2)" }} />
        
        <div style={{ marginTop: 15, color: "#fff", fontWeight: "600", fontSize: "1.1rem", background: "rgba(0,0,0,0.7)", padding: "15px", borderRadius: "12px" }}>
          {infoContent}
        </div>
        
        <div style={{ marginTop: 10, color: "#38ef7d", fontWeight: "bold", fontSize: "1.2rem", textAlign: "center", background: "rgba(0,0,0,0.7)", padding: "12px", borderRadius: "12px" }}>
          {etaText}
        </div>

        {/* Rating + Fare popup */}
        {showRating && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ background: "rgba(255,255,255,0.95)", padding: "30px 40px", borderRadius: "20px", textAlign: "center", width: "350px" }}>
              <h3 style={{ marginBottom: "15px", color: "#222", fontSize: "1.5rem", fontWeight: "bold" }}>⭐ Rate your Ride</h3>

              {/* Fare */}
              <p style={{ fontSize: "1.3rem", fontWeight: "600", marginBottom: "15px", color: "#28a745" }}>
                💵 Final Fare: ₹{fare}
              </p>

              {/* Stars */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "center", 
                  alignItems: "center", 
                  gap: "5px", 
                  marginBottom: "15px",
                  fontSize: "2rem"
                }}
              >
                {[1, 2, 3, 4, 5].map((val) => (
                  <span 
                    key={val} 
                    onClick={() => handleRatingClick(val)} 
                    style={{ cursor: "pointer", color: val <= rating ? "#FFD700" : "#ccc", transition: "transform 0.2s" }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.3)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  >
                    ⭐
                  </span>
                ))}
              </div>

              <p style={{ fontSize: "1rem", color: "#444", marginBottom: "10px" }}>
                {rating === 0 ? "Tap a star to rate" : `You rated ${rating} star${rating > 1 ? "s" : ""}`}
              </p>
              <div style={{ marginTop: "15px", fontWeight: "600", color: "#111", fontSize: "1.1rem" }}>💵 Cash on Delivery</div>
              <button 
                onClick={() => setShowRating(false)} 
                style={{ marginTop: "20px", padding: "12px 30px", background: "linear-gradient(135deg, #4361ee, #3730a3)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer" }}
              >
                Submit Rating
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
