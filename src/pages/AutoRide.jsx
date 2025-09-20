import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaRupeeSign } from "react-icons/fa"; // fare icon

import Autobg from './Autobg.png'; // background image

export default function AutoRide() {
  const navigate = useNavigate();

  const MAX_AUTOS = 12;
  const SEATS_PER_AUTO = 8;

  const DRIVER_POOL = [
    { name: "Ramesh", age: 35, rating: 4.8, totalRides: 320, vehicle: "PIAGGIO", plate: "AP01AB1234" },
    { name: "Suresh", age: 30, rating: 4.5, totalRides: 280, vehicle: "PIAGGIO", plate: "AP01AB5678" },
    { name: "Mahesh", age: 28, rating: 4.7, totalRides: 340, vehicle: "ALTO", plate: "AP01AB9101" },
    { name: "Naresh", age: 40, rating: 4.9, totalRides: 400, vehicle: "Alto", plate: "AP01AB1122" },
    { name: "Rajesh", age: 32, rating: 4.6, totalRides: 290, vehicle: "TATA", plate: "AP01AB3344" },
    { name: "Ravi", age: 29, rating: 4.4, totalRides: 260, vehicle: "TATA", plate: "AP01AB5566" },
  ];

  const CUSTOM_LOCATIONS = [
    {
      name: "Mohan Babu University",
      keywords: ["mohan babu", "mbu", "mohan babu university"],
      coords: { lat: 13.6203, lng: 79.2903 },
    },
    {
      name: "Tirupati RTC Bus Stand",
      keywords: ["rtc bus", "tirupati rtc", "rtc bus stand", "tirupati rtc busstand"],
      coords: { lat: 13.6298, lng: 79.4268 },
    },
  ];

  const [seatsAvailable, setSeatsAvailable] = useState(SEATS_PER_AUTO);
  const [totalAutos, setTotalAutos] = useState(6);
  const [seatsWanted, setSeatsWanted] = useState("");
  const [currentDriver, setCurrentDriver] = useState(DRIVER_POOL[0]);
  const [pickupInput, setPickupInput] = useState("");
  const [dropoffInput, setDropoffInput] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [fare, setFare] = useState(null);
  const [showFare, setShowFare] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);

  const tirupati = { lat: 13.6288, lng: 79.4192 };

  const distanceKm = (a, b) => {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const assignDriver = () => {
    const randomIndex = Math.floor(Math.random() * DRIVER_POOL.length);
    setCurrentDriver(DRIVER_POOL[randomIndex]);
  };

  useEffect(() => {
    assignDriver();
  }, [totalAutos]);

  useEffect(() => {
    const seatTimer = setInterval(() => {
      setSeatsAvailable((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          return SEATS_PER_AUTO;
        }
      });
    }, 4000);
    return () => clearInterval(seatTimer);
  }, []);

  useEffect(() => {
    const autoTimer = setInterval(() => {
      setTotalAutos((prev) => (prev < MAX_AUTOS ? prev + 1 : prev));
    }, 24000);
    return () => clearInterval(autoTimer);
  }, []);

  const geocodeAddress = async (address, type) => {
    if (!address) return;

    const customMatch = CUSTOM_LOCATIONS.find((loc) =>
      loc.keywords.some((k) =>
        address.toLowerCase().includes(k.toLowerCase())
      )
    );
    if (customMatch) {
      if (type === "pickup") {
        setPickupCoords(customMatch.coords);
        setPickupInput(customMatch.name);
      } else {
        setDropoffCoords(customMatch.coords);
        setDropoffInput(customMatch.name);
      }
      return;
    }

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
        if (dist > 40)
          return alert(`${type} location must be within 40 km of Tirupati`);
        if (type === "pickup") setPickupCoords(latlng);
        else setDropoffCoords(latlng);
      } else alert("Location not found");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickupChange = (val) => {
    setPickupInput(val);
    if (!val) return setPickupSuggestions([]);
    const suggestions = CUSTOM_LOCATIONS.filter((loc) =>
      loc.keywords.some((k) => k.toLowerCase().includes(val.toLowerCase()))
    );
    setPickupSuggestions(suggestions);
  };

  const handleDropoffChange = (val) => {
    setDropoffInput(val);
    if (!val) return setDropoffSuggestions([]);
    const suggestions = CUSTOM_LOCATIONS.filter((loc) =>
      loc.keywords.some((k) => k.toLowerCase().includes(val.toLowerCase()))
    );
    setDropoffSuggestions(suggestions);
  };

  const selectPickup = (loc) => {
    setPickupInput(loc.name);
    setPickupCoords(loc.coords);
    setPickupSuggestions([]);
  };

  const selectDropoff = (loc) => {
    setDropoffInput(loc.name);
    setDropoffCoords(loc.coords);
    setDropoffSuggestions([]);
  };

  const handleBook = () => {
    const seats = parseInt(seatsWanted) || 0;
    if (seats <= 0) return alert("Enter valid seats");
    if (seats > 4) return alert("Max 4 seats per booking");
    if (!pickupCoords || !dropoffCoords)
      return alert("Select pickup and dropoff locations");

    const dist = distanceKm(pickupCoords, dropoffCoords);
    let farePerSeat = 45;
    if (dist > 16) {
      farePerSeat += Math.ceil(dist - 16) * 15;
    }
    const calculatedFare = farePerSeat * seats; // multiply by number of seats

    setFare(calculatedFare);
    setShowFare(true);

    localStorage.setItem(
      "rideBooking",
      JSON.stringify({
        vehicle: "auto",
        seat: seats,
        pickup: pickupCoords,
        dropoff: dropoffCoords,
        pickupAddress: pickupInput,
        dropoffAddress: dropoffInput,
        driver: currentDriver,
        fare: calculatedFare,
      })
    );

    setSeatsAvailable((prev) => {
      if (seats <= prev) {
        return prev - seats;
      } else {
        if (totalAutos > 1) {
          setTotalAutos((prevAutos) => prevAutos - 1);
          assignDriver();
          return SEATS_PER_AUTO - seats;
        } else {
          alert("No autos available");
          return prev;
        }
      }
    });

    setSeatsWanted("");

    setTimeout(() => {
      setShowFare(false);
      navigate("/auto-tracking");
    }, 4000);
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-8 space-y-6 relative"
      style={{
        backgroundImage: `url(${Autobg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-40" style={{ zIndex: 1 }} />

      <div className="relative z-10 flex flex-col justify-between min-h-screen p-8 space-y-6">
        {!showFare ? (
          <>
            <div className="flex flex-col items-center space-y-4 w-full max-w-lg mx-auto">
              <h2 className="text-3xl font-bold text-center text-white mb-4 drop-shadow-lg">
                🚖 Book Auto Ride
              </h2>

              {/* Pickup */}
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Pickup location"
                  value={pickupInput}
                  onChange={(e) => handlePickupChange(e.target.value)}
                  onBlur={() => geocodeAddress(pickupInput, "pickup")}
                  className="border-2 border-gray-300 p-3 w-full rounded-lg shadow-lg bg-white/90 focus:border-yellow-400 focus:outline-none"
                />
                {pickupSuggestions.length > 0 && (
                  <ul className="absolute bg-white border rounded-md shadow-md w-full z-20">
                    {pickupSuggestions.map((loc, i) => (
                      <li
                        key={i}
                        onMouseDown={() => selectPickup(loc)}
                        className="p-2 cursor-pointer hover:bg-gray-200"
                      >
                        {loc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Dropoff */}
              <div className="w-full relative">
                <input
                  type="text"
                  placeholder="Dropoff location"
                  value={dropoffInput}
                  onChange={(e) => handleDropoffChange(e.target.value)}
                  onBlur={() => geocodeAddress(dropoffInput, "dropoff")}
                  className="border-2 border-gray-300 p-3 w-full rounded-lg shadow-lg bg-white/90 focus:border-yellow-400 focus:outline-none"
                />
                {dropoffSuggestions.length > 0 && (
                  <ul className="absolute bg-white border rounded-md shadow-md w-full z-20">
                    {dropoffSuggestions.map((loc, i) => (
                      <li
                        key={i}
                        onMouseDown={() => selectDropoff(loc)}
                        className="p-2 cursor-pointer hover:bg-gray-200"
                      >
                        {loc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Seats */}
              <input
                type="number"
                placeholder="Seats wanted"
                value={seatsWanted}
                onChange={(e) => setSeatsWanted(e.target.value)}
                max="4"
                className="border-2 border-gray-300 p-3 w-full rounded-lg text-center shadow-lg bg-white/90 focus:border-yellow-400 focus:outline-none"
              />

              <button
                onClick={handleBook}
                className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-lg text-black font-bold shadow-xl w-full text-lg"
              >
                Book Auto Ride
              </button>

              <div className="bg-white/90 shadow-xl rounded-2xl p-6 text-center w-full border border-white/20">
                <p className="text-lg mb-2">
                  Seats Available:{" "}
                  <span
                    className={
                      seatsAvailable > 0
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {seatsAvailable}/{SEATS_PER_AUTO}
                  </span>
                </p>
                <p className="text-lg">
                  Total Autos:{" "}
                  <span className="text-blue-600 font-bold">{totalAutos}</span>
                </p>
              </div>
            </div>

            {/* Driver Info */}
            {currentDriver && (
              <div className="bg-gradient-to-r from-yellow-400/95 to-yellow-300/95 shadow-2xl rounded-3xl p-6 max-w-lg w-full mx-auto text-left text-gray-800">
                <h3 className="text-2xl font-bold mb-4 border-b border-gray-300 pb-2">
                  🚖 Auto & Driver Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-lg">
                  <p><strong>Driver Name:</strong> {currentDriver.name}</p>
                  <p><strong>Driver Age:</strong> {currentDriver.age}</p>
                  <p><strong>Driver Rating:</strong> {currentDriver.rating} ⭐</p>
                  <p><strong>Total Rides:</strong> {currentDriver.totalRides}</p>
                  <p><strong>Auto Type:</strong> {currentDriver.vehicle}</p>
                  <p><strong>Plate Number:</strong> {currentDriver.plate}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-center items-center min-h-screen">
            <div className="bg-white/95 shadow-2xl rounded-3xl p-8 text-center max-w-md">
              <FaRupeeSign className="text-yellow-500 text-6xl mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Total Fare
              </h2>
              <p className="text-4xl font-extrabold text-green-700">₹{fare}</p>
              <p className="text-gray-600 mt-2">Seats Booked: {seatsWanted || 1}</p>
              <p className="text-sm text-gray-500 mt-4">
                Redirecting to tracking...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
