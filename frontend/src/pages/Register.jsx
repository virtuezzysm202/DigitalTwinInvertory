import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  // 1. Tambahkan State untuk menyimpan input
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // 2. Fungsi untuk mendeteksi perubahan input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Fungsi untuk kirim data ke Backend
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    // Validasi sederhana: Cek apakah password cocok
    if (formData.password !== formData.confirmPassword) {
      setIsLoading(false);
      return setMessage({ type: "error", text: "Password tidak cocok!" });
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Registrasi Berhasil! Mengalihkan..." });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setMessage({ type: "error", text: data.message || "Gagal mendaftar" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server tidak merespon. Pastikan backend jalan!" });
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

        {/* Heading & Notifikasi */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Create Account</h2>
          {message.text && (
            <div className={`mt-4 p-2 rounded text-sm ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {message.text}
            </div>
          )}
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

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
                placeholder="Create password"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Confirm Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" required />
            I agree to the terms and conditions
          </label>

          {/* Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Registering..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}