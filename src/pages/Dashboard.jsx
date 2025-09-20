import React, { useState } from "react";
import {
  FaShieldAlt,
  FaClock,
  FaDollarSign,
  FaHeartbeat,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaRegClock,
} from "react-icons/fa";
import { MdOutlineSupport } from "react-icons/md";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");
  const [complaint, setComplaint] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      setFeedbackSubmitted(true);
      setTimeout(() => setFeedbackSubmitted(false), 3000);
      setFeedback("");
    }
  };

  const handleComplaintSubmit = () => {
    if (complaint.trim()) {
      setComplaintSubmitted(true);
      setTimeout(() => setComplaintSubmitted(false), 3000);
      setComplaint("");
    }
  };

  return (
    <div className="bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="p-8 max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-12 animate-fadeIn">
          <div className="text-center sm:text-left z-10 relative">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              Student Transportation <br />
              <span className="text-blue-600">Made Simple</span>
            </h1>
            <p className="text-gray-700 max-w-lg animate-fadeIn delay-200">
              Safe, reliable & affordable transit between Mohan Babu University and Tirupati.
            </p>
          </div>
          <div className="flex space-x-4 mt-8 sm:mt-0 z-10 relative">
            <span className="text-5xl animate-bounce">🚖</span>
            <span className="text-5xl animate-bounce delay-200">🏍️</span>
            <span className="text-5xl animate-bounce delay-400">🚌</span>
          </div>
        </div>
        {/* Floating particle effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-blue-300 rounded-full opacity-50 animate-pulse`}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Transportation Options */}
      <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
        {/* Auto Rickshaw */}
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center cursor-pointer transform transition hover:scale-105 hover:shadow-2xl hover:border-yellow-400 hover:border-2 animate-slideUp"
          onClick={() => navigate("/auto-ride")}
        >
          <div className="text-5xl bg-yellow-300 rounded-full p-3 mb-4 select-none animate-bounce">🚖</div>
          <h3 className="text-xl font-semibold mb-1">Auto Rickshaw</h3>
          <p className="text-gray-500 mb-2 text-center">Quick & Economical</p>
          <ul className="text-gray-700 text-sm mb-4 list-disc list-inside">
            <li>₹45 fixed fare</li>
            <li>~35 mins ride</li>
          </ul>
          <button className="bg-yellow-400 px-4 py-2 rounded text-white font-semibold hover:bg-yellow-500 transition">
            Book Now
          </button>
        </div>

        {/* For Students by Students */}
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center cursor-pointer transform transition hover:scale-105 hover:shadow-2xl hover:border-blue-500 hover:border-2 animate-slideUp delay-100"
          onClick={() => navigate("/bike-ride")}
        >
          <div className="text-5xl bg-blue-500 rounded-full p-3 mb-4 text-white select-none animate-bounce">🏍️</div>
          <h3 className="text-xl font-semibold mb-1">For Students by Students</h3>
          <p className="text-gray-500 mb-2 text-center">Students Helping Students</p>
          <ul className="text-gray-700 text-sm mb-4 list-disc list-inside">
            <li>~25 mins ride</li>
          </ul>
          <button className="bg-blue-500 px-4 py-2 rounded text-white font-semibold hover:bg-blue-600 transition">
            Book Now
          </button>
        </div>

        {/* APSRTC Bus */}
        <div
          className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center cursor-pointer transform transition hover:scale-105 hover:shadow-2xl hover:border-green-400 hover:border-2 animate-slideUp delay-200"
          onClick={() => navigate("/bus-schedule")}
        >
          <div className="text-5xl bg-green-400 rounded-full p-3 mb-4 text-white select-none animate-bounce">🚌</div>
          <h3 className="text-xl font-semibold mb-1">APSRTC Bus</h3>
          <p className="text-gray-500 mb-2 text-center">Government Service</p>
          <ul className="text-gray-700 text-sm mb-4 list-disc list-inside">
            <li>APSRTC rates</li>
            <li>Live tracking</li>
            <li>~40 mins journey</li>
          </ul>
          <button className="bg-green-400 px-4 py-2 rounded text-white font-semibold hover:bg-green-500 transition">
            View Schedule
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto my-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Why Choose MBU Transport?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 text-center">
          {/* Emergency SOS */}
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center relative cursor-pointer hover:shadow-2xl animate-pulse">
            <div className="text-red-600 mb-3 animate-ping">
              <FaHeartbeat size={40} />
            </div>
            <h4 className="font-semibold mb-1">Emergency SOS</h4>
            <p className="text-gray-600">Instant assistance in emergencies.</p>
          </div>

          {/* Safety First */}
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-default flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl">
            <div className="text-blue-600 mb-3">
              <FaShieldAlt size={40} />
            </div>
            <h4 className="font-semibold mb-1">Safety First</h4>
            <p className="text-gray-600">
              Verified student drivers<br />
              Strict safety guidelines
            </p>
          </div>

          {/* Timely Service */}
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-default flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl">
            <div className="text-blue-600 mb-3">
              <FaRegClock size={40} />
            </div>
            <h4 className="font-semibold mb-1">Timely Service</h4>
            <p className="text-gray-600">Available during peak hours & weekends</p>
          </div>

          {/* Affordable Rates */}
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-default flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl">
            <div className="text-blue-600 mb-3">
              <FaMoneyBillWave size={40} />
            </div>
            <h4 className="font-semibold mb-1">Affordable Rates</h4>
            <p className="text-gray-600">Student-friendly pricing, no hidden charges</p>
          </div>

          {/* 24/7 Support */}
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-default flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl">
            <div className="text-blue-600 mb-3">
              <MdOutlineSupport size={40} />
            </div>
            <h4 className="font-semibold mb-1">24/7 Support</h4>
            <p className="text-gray-600">Responsive support team available round the clock.</p>
          </div>

          {/* Live Tracking */}
          <div className="bg-white rounded-xl shadow-lg p-6 cursor-default flex flex-col items-center transform transition hover:scale-105 hover:shadow-2xl">
            <div className="text-blue-600 mb-3">
              <FaMapMarkedAlt size={40} />
            </div>
            <h4 className="font-semibold mb-1">Live Tracking</h4>
            <p className="text-gray-600">Track your ride in real-time</p>
          </div>
        </div>
      </section>

      {/* Feedback & Complaint Section */}
      <section className="max-w-6xl mx-auto px-4 my-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Feedback */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-center">💬 Feedback</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write your feedback here..."
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 mb-3"
              rows={5}
            />
            <button
              onClick={handleFeedbackSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition w-full"
            >
              Submit Feedback
            </button>
            {feedbackSubmitted && (
              <p className="text-green-600 text-sm mt-2 text-center">✅ Feedback submitted successfully!</p>
            )}
          </div>

          {/* Complaint */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-3 text-center">📝 Complaint</h3>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Write your complaint here..."
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400 mb-3"
              rows={5}
            />
            <button
              onClick={handleComplaintSubmit}
              className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition w-full"
            >
              Submit Complaint
            </button>
            {complaintSubmitted && (
              <p className="text-green-600 text-sm mt-2 text-center">✅ Complaint submitted successfully!</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer Sign Out */}
      <footer className="border-t border-gray-200 py-6 text-center bg-white sticky bottom-0 shadow-lg flex flex-col items-center">
        <button
          className="bg-red-600 text-white px-6 py-2 rounded-lg shadow hover:bg-red-700 transition mb-2"
          onClick={() => navigate("/login")}
        >
          Sign Out
        </button>
        <p className="text-gray-500 text-sm">© 2025 MBU Transport. All rights reserved.</p>
      </footer>
    </div>
  );
}
