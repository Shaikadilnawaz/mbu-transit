import React, { useState, useEffect } from "react";
import busBg from "../pages/bus-bg.png"; // background image

const routes = {
  "tirupati-pileru": [
    ["TP15/2", "07:15", "08:00", "09:00", "11092025_TP15_2_PILER"],
    ["PLT8/2", "07:30", "08:15", "09:15", "11092025_PLT8_2_PILER"],
    ["TP13/2", "07:45", "08:30", "09:30", "11092025_TP13_2_PILER"],
    ["PLT9/2", "08:00", "08:45", "09:45", "11092025_PLT9_2_PILER"],
    ["TP17/2", "08:15", "09:00", "10:00", "11092025_TP17_2_PILER"],
  ],
  "pileru-tirupati": [
    ["PLR11/1", "06:30", "07:15", "08:15", "11092025_PLR11_1_TPTY"],
    ["PLR12/1", "07:00", "07:45", "08:45", "11092025_PLR12_1_TPTY"],
    ["PLR13/1", "07:30", "08:15", "09:15", "11092025_PLR13_1_TPTY"],
    ["PLR14/1", "08:00", "08:45", "09:45", "11092025_PLR14_1_TPTY"],
    ["PLR15/1", "08:30", "09:15", "10:15", "11092025_PLR15_1_TPTY"],
  ],
};

const locations = ["Tirupati", "Pileru", "Chittoor", "Madanapalle", "Kadapa"];

function formatAMPM(timeStr) {
  let [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function parseTimeToToday(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
}

export default function BusSchedule() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filteredFromSuggestions, setFilteredFromSuggestions] = useState([]);
  const [filteredToSuggestions, setFilteredToSuggestions] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [waitText, setWaitText] = useState("");

  useEffect(() => {
    if (from) {
      const matches = locations.filter((loc) =>
        loc.toLowerCase().startsWith(from.toLowerCase())
      );
      setFilteredFromSuggestions(matches);
    } else setFilteredFromSuggestions([]);
  }, [from]);

  useEffect(() => {
    if (to) {
      const matches = locations.filter((loc) =>
        loc.toLowerCase().startsWith(to.toLowerCase())
      );
      setFilteredToSuggestions(matches);
    } else setFilteredToSuggestions([]);
  }, [to]);

  const searchRoute = () => {
    const key = `${from.trim().toLowerCase()}-${to.trim().toLowerCase()}`;
    if (routes[key]) {
      setSelectedRoute({ key, data: routes[key] });
    } else {
      setSelectedRoute({ key: null, data: [] });
    }
  };

  useEffect(() => {
    if (!selectedRoute || !selectedRoute.data.length) {
      setWaitText("");
      return;
    }
    const intervalId = setInterval(() => {
      const now = new Date();
      let nextBusInfo = null;
      for (const bus of selectedRoute.data) {
        const depDate = parseTimeToToday(bus[1]);
        if (depDate > now) {
          nextBusInfo = bus;
          break;
        }
      }
      if (nextBusInfo) {
        const depDate = parseTimeToToday(nextBusInfo[1]);
        const diffMs = depDate - now;
        const diffMin = Math.floor(diffMs / 60000);
        const diffSec = Math.floor((diffMs % 60000) / 1000);
        setWaitText(
          `🚌 Next bus (${nextBusInfo[0]}) departs in ${diffMin} min ${diffSec} sec`
        );
      } else {
        setWaitText("");
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [selectedRoute]);

  const selectSuggestion = (value, setter, setSuggestions) => {
    setter(value);
    setSuggestions([]);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${busBg})` }}
    >
      <div className="bg-black bg-opacity-50 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-5xl w-full bg-white bg-opacity-90 rounded-2xl shadow-2xl p-6 font-[Poppins]">
          <h1 className="text-3xl font-bold text-center mb-6 text-green-600">
            APSRTC Bus Transportation 🚍
          </h1>

          {/* Search inputs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="From"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-4 py-2 border rounded-lg w-48 focus:ring-2 focus:ring-green-400"
              />
              {filteredFromSuggestions.length > 0 && (
                <div className="absolute bg-white border rounded-lg shadow-lg mt-1 w-48 z-10">
                  {filteredFromSuggestions.map((loc) => (
                    <div
                      key={loc}
                      className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                      onClick={() =>
                        selectSuggestion(loc, setFrom, setFilteredFromSuggestions)
                      }
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-4 py-2 border rounded-lg w-48 focus:ring-2 focus:ring-green-400"
              />
              {filteredToSuggestions.length > 0 && (
                <div className="absolute bg-white border rounded-lg shadow-lg mt-1 w-48 z-10">
                  {filteredToSuggestions.map((loc) => (
                    <div
                      key={loc}
                      className="px-3 py-2 hover:bg-green-100 cursor-pointer"
                      onClick={() =>
                        selectSuggestion(loc, setTo, setFilteredToSuggestions)
                      }
                    >
                      {loc}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={searchRoute}
              className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow transition"
            >
              Search
            </button>
          </div>

          {/* Results */}
          {selectedRoute && selectedRoute.data.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-5">
              <h2 className="text-xl font-semibold text-green-600 mb-3">
                {`${from} → ${to}`} Bus Timings
              </h2>

              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-green-500 text-white">
                    <th className="p-3 text-center">Service No.</th>
                    <th className="p-3 text-center">Departure ({from})</th>
                    <th className="p-3 text-center">College Arrival</th>
                    <th className="p-3 text-center">Arrival ({to})</th>
                    <th className="p-3 text-center">Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRoute.data.map((bus, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-green-50 border-b last:border-none"
                    >
                      <td className="p-3 text-center font-medium">{bus[0]}</td>
                      <td className="p-3 text-center">{formatAMPM(bus[1])}</td>
                      <td className="p-3 text-center">{formatAMPM(bus[2])}</td>
                      <td className="p-3 text-center">{formatAMPM(bus[3])}</td>
                      <td className="p-3 text-center">
                        <a
                          href={`https://apsrtclivetrack.com/#/from_to_search_tabs_screen`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                            Track
                          </button>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {waitText && (
                <div className="mt-4 text-lg font-semibold text-center text-green-600 animate-pulse">
                  {waitText}
                </div>
              )}

              {/* Safety Note */}
              <div className="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg shadow">
                ⚠️ <span className="font-semibold">Note:</span> Please do not
                travel in buses with more passengers than their capacity. Your
                safety is our priority.
              </div>
            </div>
          )}

          {selectedRoute && selectedRoute.data.length === 0 && (
            <div className="text-center text-gray-700 mt-5 font-medium">
              ❌ No buses found for this route.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
