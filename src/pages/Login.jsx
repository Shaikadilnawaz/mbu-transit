import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import backgroundImage from "./tirupati-bg.jpg"; // importing from same folder 'pages'

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username && password) {
      navigate("/dashboard");
    } else {
      alert("Please enter username and password");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: `url(${backgroundImage}) center center / cover no-repeat`,
        position: "relative",
      }}
    >
      <div className="absolute inset-0 bg-blue-900 bg-opacity-60"></div>

      <div className="relative z-10 w-full flex flex-col items-center px-4">
        <h1
          className="text-white text-5xl font-extrabold tracking-widest mt-12 mb-8 drop-shadow-2xl text-center select-none"
          style={{ letterSpacing: "0.18em", textShadow: "0 6px 32px #0008" }}
        >
          MBU CONNECTS
        </h1>

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md mx-auto bg-white bg-opacity-90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl flex flex-col gap-4 border border-blue-100"
          style={{ boxShadow: "0 8px 36px 0 #00184433" }}
        >
          <h2 className="text-3xl text-center font-bold mb-4 text-blue-900 select-none">
            🔐 Welcome Back
          </h2>

          <label
            htmlFor="username"
            className="block text-blue-900 font-semibold"
          >
            Username <span role="img" aria-label="user">👤</span>
          </label>
          <input
            id="username"
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-400 shadow"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label
            htmlFor="password"
            className="block text-blue-900 font-semibold"
          >
            Password <span role="img" aria-label="lock">🔒</span>
          </label>
          <input
            id="password"
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition placeholder-gray-400 shadow"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="mt-5 w-full bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-700 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-97 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Login 🚀
          </button>

          <p className="mt-6 text-center text-blue-800 text-sm shadow-none select-none">
            New user?{" "}
            <Link
              to="/signup"
              className="text-pink-600 font-semibold hover:underline hover:text-pink-800 transition"
            >
              Sign up here 📝
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
