import { useState } from "react";

const baseFare = 45;
const perKmFare = 15;

export default function TransportCard({ mode }) {
  const [people, setPeople] = useState(1);
  const [gender, setGender] = useState("Male");
  const [destDistance, setDestDistance] = useState("");
  const [message, setMessage] = useState("");

  const bookTransport = () => {
    if (!destDistance || isNaN(destDistance) || destDistance < 0) {
      setMessage("⚠️ Please enter a valid distance.");
      return;
    }

    let fare = baseFare;
    if (destDistance > 0) {
      fare = perKmFare * destDistance;
    }

    if (mode === "auto" && people > 10) {
      setMessage("⚠️ Autos can have max 10 people.");
      return;
    }

    if (mode === "bike" && people > 1) {
      setMessage("⚠️ Only 1 person allowed per bike.");
      return;
    }

    setMessage(
      `✅ Booking confirmed for ${people} ${
        mode === "bike" ? gender : ""
      } students. Fare: ₹${fare}. Payment: Offline.`
    );
  };

  const renderContent = () => {
    if (mode === "auto") {
      return (
        <>
          <p className="font-semibold mb-2">🚖 Auto Fare</p>
          <p>₹45 fixed from MBU to Tirupati Bus Stand</p>
          <p>₹15 per km for other destinations</p>
          <input
            type="number"
            min="1"
            max="10"
            value={people}
            onChange={(e) => setPeople(Number(e.target.value))}
            className="border p-2 rounded w-24 mt-3"
          />
          <input
            type="number"
            min="0"
            placeholder="Distance (km)"
            value={destDistance}
            onChange={(e) => setDestDistance(e.target.value)}
            className="border p-2 rounded w-28 mt-3 ml-3"
          />
          <button
            onClick={bookTransport}
            className="block mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded font-semibold transition transform hover:scale-105"
          >
            Book Auto
          </button>
        </>
      );
    } else if (mode === "bike") {
      return (
        <>
          <p className="font-semibold mb-2">🏍 Bike Fare</p>
          <p>₹35 MBU → Bus Stand, ₹15 per km otherwise</p>
          <label className="block mt-3">
            Gender:
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="border p-2 rounded ml-2"
            >
              <option>Male 👨</option>
              <option>Female 👩</option>
            </select>
          </label>
          <input
            type="number"
            min="1"
            max="1"
            value={people}
            onChange={(e) => setPeople(Number(e.target.value))}
            className="border p-2 rounded w-24 mt-3"
          />
          <input
            type="number"
            min="0"
            placeholder="Distance (km)"
            value={destDistance}
            onChange={(e) => setDestDistance(e.target.value)}
            className="border p-2 rounded w-28 mt-3 ml-3"
          />
          <button
            onClick={bookTransport}
            className="block mt-4 bg-pink-600 hover:bg-pink-700 text-white py-2 px-5 rounded font-semibold transition transform hover:scale-105"
          >
            Request Bike
          </button>
          <p className="mt-3 text-red-600 font-semibold">
            ⚠️ Travel with bike students on your own risk.
          </p>
        </>
      );
    } else if (mode === "bus") {
      return (
        <>
          <button
            onClick={() => window.open("https://apsrtclivetrack.com/", "_blank")}
            className="block bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded font-semibold transition transform hover:scale-105"
          >
            🚌 Track Bus Live
          </button>
          <p className="mt-3 text-gray-700 font-medium">
            Pickup and drop within Tirupati city only
          </p>
        </>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xl text-center border border-gray-200">
      <h2 className="text-2xl font-bold capitalize mb-6">{mode}</h2>
      {renderContent()}
      {message && (
        <p className="mt-4 text-green-700 font-semibold text-lg">{message}</p>
      )}
    </div>
  );
}
