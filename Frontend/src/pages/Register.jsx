import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post("https://stock-price-prediction-46mf.onrender.com/register", {
        name,
        email,
        password,
      });

      alert("Registered Successfully");
      navigate("/login");
    } catch (err) {

  alert(
    err.response?.data?.detail || "Register Failed"
  );
}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#09090b] to-[#121217] text-white">

      <div className="w-[400px] p-8 rounded-3xl bg-[#121217] border border-gray-800 shadow-2xl">

        <h2 className="text-3xl font-bold text-center mb-6">
          Register
        </h2>

        <input
          type="text"
          placeholder="Name"
          className="w-full mb-4 p-3 rounded-xl bg-[#1a1a1f] border border-gray-700 outline-none"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl bg-[#1a1a1f] border border-gray-700 outline-none"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-xl bg-[#1a1a1f] border border-gray-700 outline-none"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-bold"
        >
          Register
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Register;