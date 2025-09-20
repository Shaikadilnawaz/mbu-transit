import React, { useRef, useState } from "react";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const bounds = {
  north: 13.7100, // North of Tirupati
  south: 13.6000, // South of MBU
  east: 79.5000,
  west: 79.3500,
};

export default function LocationSelector() {
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const pickupRef = useRef(null);
  const dropRef = useRef(null);

  const handlePlaceSelected = (type) => {
    if (type === "pickup" && pickupRef.current) {
      const place = pickupRef.current.getPlace();
      setPickup(place?.formatted_address || "");
    } else if (type === "drop" && dropRef.current) {
      const place = dropRef.current.getPlace();
      setDrop(place?.formatted_address || "");
    }
  };

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyDm5gQf-MRqjA8bd5PL-i3mrRWk1aGJ9qk" // <<-- REPLACE with your actual Google Maps API key
      libraries={["places"]}
    >
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 flex flex-col sm:flex-row items-center gap-8 mt-10 mb-8">
        <div className="flex-1 w-full">
          <label className="block font-semibold text-gray-700 mb-2 text-lg">Pickup Location</label>
          <Autocomplete
            onLoad={(ref) => (pickupRef.current = ref)}
            onPlaceChanged={() => handlePlaceSelected("pickup")}
            options={{
              bounds: {
                east: bounds.east,
                west: bounds.west,
                north: bounds.north,
                south: bounds.south
              },
              strictBounds: true,
              componentRestrictions: { country: "in" },
            }}
          >
            <input
              type="text"
              placeholder="Start typing address near MBU or Tirupati..."
              className="w-full p-3 border-2 border-blue-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition hover:ring-2 hover:ring-blue-300"
              value={pickup}
              onChange={e => setPickup(e.target.value)}
              autoComplete="off"
            />
          </Autocomplete>
        </div>
        <div className="flex-1 w-full">
          <label className="block font-semibold text-gray-700 mb-2 text-lg">Drop Location</label>
          <Autocomplete
            onLoad={(ref) => (dropRef.current = ref)}
            onPlaceChanged={() => handlePlaceSelected("drop")}
            options={{
              bounds: {
                east: bounds.east,
                west: bounds.west,
                north: bounds.north,
                south: bounds.south
              },
              strictBounds: true,
              componentRestrictions: { country: "in" },
            }}
          >
            <input
              type="text"
              placeholder="Start typing drop address in Tirupati..."
              className="w-full p-3 border-2 border-blue-100 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition hover:ring-2 hover:ring-blue-300"
              value={drop}
              onChange={e => setDrop(e.target.value)}
              autoComplete="off"
            />
          </Autocomplete>
        </div>
      </div>
      {(pickup || drop) && (
        <div className="max-w-2xl mx-auto text-center bg-blue-50 p-4 mb-8 rounded-lg font-semibold text-blue-900">
          {pickup && `Pickup: ${pickup}`}
          {pickup && drop && <span>&nbsp;→&nbsp;</span>}
          {drop && `Drop: ${drop}`}
        </div>
      )}
    </LoadScript>
  );
}
