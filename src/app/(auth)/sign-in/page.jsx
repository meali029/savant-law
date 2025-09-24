'use client';

import React, { useState } from "react";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "../../../services/authApi";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";

export default function Page() {
  const { locale, setLocale, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (error) {
      setError(error.message || t.signIn.errorMessage);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br flex flex-col">
        {/* Language toggle */}
        <div className="p-4 text-right">
          <button
              onClick={() => setLocale(locale === "en" ? "zh" : "en")}
              className="px-2 py-1 border rounded"
          >
            {locale === "en" ? "中文" : "EN"}
          </button>
        </div>

        {/* Header with Logo */}
        <div className="p-6">
          <img
              src="/SavantLogo.png"
              alt={t.logoAlt}
              className="w-36 rounded-full"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            {/* Sign In Card */}
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Savant
                </h1>
                <p className="text-gray-600">Choose your portal to access your account</p>
              </div>

              {/* Portal Info */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Access Your Account
                </h2>
                <p className="text-sm text-gray-600">
                  Sign in to your lawyer or client portal
                </p>
              </div>

              {/* Error Message */}
              {error && (
                  <div className="mb-4 text-red-600 text-center">{error}</div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot your password?
                  </button>
                </div>

                {/* Sign In Button */}
                <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Access Portal
                </button>
              </form>

              {/* Create Account Link */}
              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Need to create an account?{" "}
                  <button
                      onClick={() => router.push("/sign-up")}
                      className="text-gray-900 hover:text-blue-600 font-medium inline-flex items-center group transition-colors duration-200"
                  >
                    Create account
                    <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-pink-100 rounded-full opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-indigo-100 rounded-full opacity-40" />
        </div>
      </div>
  );
}
