import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import backgroundImage from "./tirupati-bg.jpg"; // importing from same folder 'pages'

export default function Signup() {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState(""); // new
  const [gender, setGender] = useState(""); // new
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateName = (str) => /^[a-zA-Z\s]+$/.test(str);
  const validateRoll = (str) => /^[a-zA-Z0-9]+$/.test(str);
  const validatePassword = (str) => /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/.test(str);
  const validatePhone = (str) => /^[0-9]{10}$/.test(str); // new

  const handleSignup = (e) => {
    e.preventDefault();
    let errs = {};
    let valid = true;

    if (!name || !validateName(name)) {
      errs.name = "Please enter a valid name (letters only).";
      valid = false;
    }
    if (!roll || !validateRoll(roll)) {
      errs.roll = "Roll Number must be alphanumeric.";
      valid = false;
    }
    if (!password || !validatePassword(password)) {
      errs.password = "Password must contain letters & numbers, min 6 chars.";
      valid = false;
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
      valid = false;
    }
    if (!phone || !validatePhone(phone)) { // new
      errs.phone = "Please enter a valid 10-digit phone number.";
      valid = false;
    }
    if (!gender) { // new
      errs.gender = "Please select your gender.";
      valid = false;
    }

    setErrors(errs);

    if (valid) {
      alert("Signup successful! Please login.");
      navigate("/login");
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
          className="text-white text-5xl font-extrabold tracking-widest mt-10 mb-8 drop-shadow-2xl text-center select-none"
          style={{ letterSpacing: "0.18em", textShadow: "0 6px 32px #0008" }}
        >
          MBU CONNECTS
        </h1>
        <form
          onSubmit={handleSignup}
          className="w-full max-w-md mx-auto bg-white bg-opacity-90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl flex flex-col gap-4 border border-blue-100"
          style={{ boxShadow: "0 8px 36px 0 #00184433" }}
        >
          <h2 className="text-3xl text-center font-bold mb-4 text-blue-900 select-none">
            📝 Student Signup
          </h2>
          <input
            type="text"
            placeholder="Student Name 🧑‍🎓"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          />
          {errors.name && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.name}</p>
          )}

          <input
            type="text"
            placeholder="Student Roll Number 🎓"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          />
          {errors.roll && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.roll}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          />
          {errors.password && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.password}</p>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.confirmPassword}</p>
          )}

          {/* New Phone Number Field */}
          <input
            type="text"
            placeholder="Phone Number 📞"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          />
          {errors.phone && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.phone}</p>
          )}

          {/* New Gender Field */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pink-400 transition placeholder-gray-400 shadow"
          >
            <option value="">Select Gender 🚻</option>
            <option value="male">Male ♂️</option>
            <option value="female">Female ♀️</option>
            <option value="other">Other ⚧</option>
          </select>
          {errors.gender && (
            <p className="text-red-600 text-sm -mt-2 mb-1">{errors.gender}</p>
          )}

          <button
            type="submit"
            className="mt-3 w-full bg-gradient-to-r from-pink-600 to-pink-400 hover:from-pink-700 hover:to-pink-600 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-97"
          >
            Signup 🎉
          </button>

          <p className="mt-6 text-center text-blue-900 text-sm select-none">
            Already registered?{" "}
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition"
            >
              Login 🔐
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
