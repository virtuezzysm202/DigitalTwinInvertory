import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  
  // 1. State untuk input, loading, dan error
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 2. SIMPAN TOKEN & DATA USER ke localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Berhasil! Langsung ke Dashboard
        navigate("/");
      } else {
        setError(data.message || "Email atau password salah");
      }
    } catch (err) {
      setError("Server tidak merespon. Pastikan backend aktif.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-green-600 p-2 rounded-xl">
            <Box className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TwinStock</h1>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="text-green-600 hover:underline">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-green-600 font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}