"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/firebase/config";
import { motion } from "framer-motion";
import { FaLock, FaEnvelope, FaUser, FaGoogle } from "react-icons/fa";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      router.push("/chat");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("Email is already in use");
      } else {
        setError("Failed to create account. Please try again.");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      router.push("/chat");
    } catch (error) {
      setError("Failed to sign up with Google. Please try again.");
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

      {/* Left Side Text (Inspired by Reference Image) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:block lg:w-1/2 p-10"
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Fast, Efficient, and Productive</h1>
        <p className="text-gray-600 text-lg">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed.
        </p>
      </motion.div>

      {/* Signup Form Container */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl lg:w-1/3"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600">Sign Up</h1>
          <p className="mt-2 text-gray-500">Create your account to start chatting</p>
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
              <span className="label-text font-medium text-gray-700">Full Name</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaUser />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

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

          <div className="form-control mb-5">
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
            <p className="text-xs text-gray-500 mt-1">
              Use 8 or more characters with a mix of letters, numbers & symbols.
            </p>
          </div>

          <div className="form-control mb-6">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Confirm Password</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                <FaLock />
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn bg-indigo-600 text-white w-full rounded-lg hover:bg-indigo-700 transition-all"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner"></span> : "Sign Up"}
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

        {/* Sign Up with Google Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGoogleSignup}
          className="btn bg-white text-gray-700 w-full rounded-lg border border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          disabled={loading}
        >
          <FaGoogle className="text-red-500" />
          Sign Up with Google
        </motion.button>

        <div className="mt-6 text-center text-sm">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;