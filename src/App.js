import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AutoRide from "./pages/AutoRide";
import AutoTracking from "./pages/AutoTracking";
import BikeRide from "./pages/BikeRide";
import Track from "./pages/Track";
import BusSchedule from "./pages/BusSchedule";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatBot from "./pages/ChatBot"; // Import ChatBot

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auto-ride" element={<AutoRide />} />
        <Route path="/auto-tracking" element={<AutoTracking />} />
        <Route path="/bike-ride" element={<BikeRide />} />
        <Route path="/track" element={<Track />} />
        <Route path="/bus-schedule" element={<BusSchedule />} />
        <Route path="/chat" element={<ChatBot />} /> {/* optional route */}
      </Routes>

      {/* Floating ChatBot visible on all pages */}
      <ChatBot />
    </Router>
  );
}

export default App;
