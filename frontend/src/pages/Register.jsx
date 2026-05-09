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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleRegister = (e) => {
    e.preventDefault();

    // sementara langsung login setelah register
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="bg-green-600 p-2 rounded-xl">
            <Box className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            TwinStock
          </h1>
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Register to start managing your inventory
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">

          {/* Full Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

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
                placeholder="Create password"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Confirm Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={
                  showConfirmPassword ? "text" : "password"
                }
                placeholder="Confirm password"
                className="w-full border border-gray-300 rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
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
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Create Account
          </button>
        </form>

        {/* Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-green-600 font-medium hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}