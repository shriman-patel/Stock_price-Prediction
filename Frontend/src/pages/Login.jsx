import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:8000/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user_id", res.data.user_id);

      setIsAuthenticated(true);
      navigate("/");
    } catch (err) {
      alert("Invalid login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#09090b] to-[#121217] text-white">

      <div className="w-[400px] p-8 rounded-3xl bg-[#121217] border border-gray-800 shadow-2xl">

        <h2 className="text-3xl font-bold text-center mb-6">
          Login
        </h2>

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
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-bold"
        >
          Login
        </button>

        <p className="text-sm text-center mt-4 text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;