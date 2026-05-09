import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // sementara langsung masuk dashboard
    navigate("/");
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
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Sign in to continue managing your inventory
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? "text" : "password"}
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

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#" className="text-green-600 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Sign In
          </button>
        </form>

        {/* Register */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-green-600 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}