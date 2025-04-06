"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/config";
import { motion } from "framer-motion";
import { FaLock, FaEnvelope, FaGoogle } from "react-icons/fa";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/chat");
    } catch (error) {
      setError(
        error.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : "Failed to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      router.push("/chat");
    } catch (error) {
      setError("Failed to log in with Google. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-300 rounded-full opacity-20 blur-3xl translate-x-1/4 -translate-y-1/4"></div>

      {/* Left Side Text */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block lg:w-1/2 p-10"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome Back!</h1>
        <p className="text-gray-600 text-lg">
          Log in to continue your journey with ArguLex an AI Assistant for Attorneys.
        </p>
      </motion.div>

      {/* Login Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl lg:w-1/3"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Log In</h1>
          <p className="mt-2 text-gray-500">Welcome back! Log in to continue</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="alert alert-error mb-6 text-sm flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-5">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Email</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaEnvelope />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Password</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaLock />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <label className="label">
              <Link href="/forgot-password" className="label-text-alt text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </label>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn bg-indigo-600 text-white w-full rounded-lg hover:bg-indigo-700 transition-all"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner"></span> : "Log In"}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Log In with Google Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          className="btn bg-white text-gray-700 w-full rounded-lg border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          disabled={loading}
        >
          <FaGoogle className="text-red-500" />
          Log In with Google
        </motion.button>

        <div className="mt-6 text-center text-sm">
          <p>
            Don’t have an account?{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;