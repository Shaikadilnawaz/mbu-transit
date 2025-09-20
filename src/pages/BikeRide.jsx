import React, { useState, useRef, useEffect } from "react";
import L from "leaflet";
import { FaRupeeSign, FaMapMarkerAlt } from "react-icons/fa";

export default function BikeRide() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [vehicle, setVehicle] = useState("");
  const [seat, setSeat] = useState(null);
  const [gender, setGender] = useState(""); // ✅ Gender selection
  const [pickupInput, setPickupInput] = useState("");
  const [dropoffInput, setDropoffInput] = useState("");
  const [fare, setFare] = useState(0);
  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);

  const tirupati = { lat: 13.6288, lng: 79.4192 };

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

  useEffect(() => {
    if (pickup && dropoff) {
      const dist = distanceKm(pickup, dropoff);
      if (dist <= 16) setFare(35);
      else setFare(35 + Math.ceil(dist - 16) * 2);
    }
  }, [pickup, dropoff]);

  function addMarker(latlng, type) {
    const map = mapRef.current;
    if (!map) return;

    const icon = L.divIcon({
      html: type === "pickup" ? "🟢" : "🔴",
      className: "emoji-icon",
      iconSize: [24, 24],
    });

    if (type === "pickup") {
      if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = L.marker(latlng, { icon })
        .addTo(map)
        .bindPopup("Pickup")
        .openPopup();
      setPickup(latlng);
      setPickupInput(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    } else {
      if (dropoffMarkerRef.current) map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = L.marker(latlng, { icon })
        .addTo(map)
        .bindPopup("Dropoff")
        .openPopup();
      setDropoff(latlng);
      setDropoffInput(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
    }
  }

  async function geocodeAddress(address, type) {
    if (!address) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      const data = await res.json();
      if (data.length > 0) {
        const latlng = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
        const dist = distanceKm(tirupati, latlng);
        if (dist > 40) {
          alert(
            type === "pickup"
              ? "Invalid pickup location (must be within 40 km of Tirupati)"
              : "Invalid dropoff location (must be within 40 km of Tirupati)"
          );
          return;
        }
        addMarker(latlng, type);
        mapRef.current.setView(latlng, 13);
      } else alert("Location not found");
    } catch (err) {
      console.error("Geocode error:", err);
    }
  }

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map("map").setView([tirupati.lat, tirupati.lng], 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      map.on("click", (e) => {
        if (!pickup) addMarker(e.latlng, "pickup");
        else if (!dropoff) addMarker(e.latlng, "dropoff");
      });
    }
  }, [pickup, dropoff]);

  const seatCount = vehicle === "car" ? 4 : vehicle === "motorcycle" ? 1 : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pickup || !dropoff) return alert("Please select both pickup and dropoff!");
    if (!vehicle) return alert("Please select a vehicle!");
    if (!seat) return alert("Please select a seat!");
    if (!gender) return alert("Please select gender!");
    if (pickup.lat === dropoff.lat && pickup.lng === dropoff.lng)
      return alert("Pickup and dropoff cannot be the same location!");

    const booking = {
      pickup,
      dropoff,
      pickupAddress: pickupInput, // ✅ Save address
      dropoffAddress: dropoffInput, // ✅ Save address
      vehicle,
      seat,
      fare,
      gender, // ✅ Save gender
    };
    localStorage.setItem("rideBooking", JSON.stringify(booking));
    window.location.href = "/track";
  };

  return (
    <div className="booking-page p-4">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Book a Bike Ride
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-green-600" />
          <input
            type="text"
            placeholder="Pickup location"
            value={pickupInput}
            onChange={(e) => setPickupInput(e.target.value)}
            onBlur={() => geocodeAddress(pickupInput, "pickup")}
            className="border p-2 w-full rounded"
          />
          <div className="flex items-center text-blue-600 font-semibold">
            <FaRupeeSign className="mr-1" /> {fare}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-red-600" />
          <input
            type="text"
            placeholder="Dropoff location"
            value={dropoffInput}
            onChange={(e) => setDropoffInput(e.target.value)}
            onBlur={() => geocodeAddress(dropoffInput, "dropoff")}
            className="border p-2 w-full rounded"
          />
        </div>

        <div>
          <label className="font-semibold">Vehicle: </label>
          <select
            value={vehicle}
            onChange={(e) => {
              setVehicle(e.target.value);
              setSeat(null);
            }}
            className="border p-2 w-full rounded"
          >
            <option value="">Select vehicle</option>
            <option value="motorcycle">Bike</option>
            <option value="car">Car</option>
          </select>
        </div>

        {seatCount > 0 && (
          <div>
            <label className="font-semibold">Select Seat:</label>
            <div className="flex gap-3 mt-2 flex-wrap">
              {Array.from({ length: seatCount }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSeat(num)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold ${
                    seat === num
                      ? "bg-blue-600 text-white border-blue-800"
                      : "bg-gray-100 text-gray-700 border-gray-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ✅ Gender selection */}
        <div>
          <label className="font-semibold">Select Gender:</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="Male"
                checked={gender === "Male"}
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Male
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                value="Female"
                checked={gender === "Female"}
                onChange={(e) => setGender(e.target.value)}
              />{" "}
              Female
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full font-bold"
        >
          Book Ride
        </button>
      </form>
      <div id="map" className="h-96 mt-4 rounded-lg shadow"></div>
      <p className="text-sm text-gray-600 mt-2 text-center">
        📍 Note: Pickup and dropoff must be within 40 km of Tirupati. Travel at your own risk.
      </p>
    </div>
  );
}
