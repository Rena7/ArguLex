"use client";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaSignOutAlt,
  FaTrash,
  FaSun,
  FaMoon,
  FaUser,
  FaLock,
  FaCamera,
  FaCog,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth, storage } from "@/firebase/config";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const SettingsPopup = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", isDarkTheme ? "dark" : "light");
  }, [isDarkTheme]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      onClose();
    } catch (error) {
      setError("Failed to log out. Please try again.");
      console.error("Failed to log out", error);
    }
  };

  const handleDeleteChats = async () => {
    if (confirm("Are you sure you want to delete all chats? This action cannot be undone.")) {
      try {
        // Placeholder for deleting chats (requires backend implementation)
        // For example, if chats are stored in Firestore:
        // await deleteDocs(collection(db, `users/${currentUser.uid}/chats`));
        setSuccess("All chats have been deleted.");
      } catch (error) {
        setError("Failed to delete chats. Please try again.");
        console.error("Failed to delete chats", error);
      }
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Update display name
      if (displayName && displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName });
      }

      // Update profile picture
      if (profilePicture) {
        const storageRef = ref(storage, `profilePictures/${currentUser.uid}`);
        await uploadBytes(storageRef, profilePicture);
        const photoURL = await getDownloadURL(storageRef);
        await updateProfile(currentUser, { photoURL });
      }

      setSuccess("Profile updated successfully.");
    } catch (error) {
      setError("Failed to update profile. Please try again.");
      console.error("Failed to update profile", error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);
      setSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect.");
      } else {
        setError("Failed to update password. Please try again.");
      }
      console.error("Failed to update password", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
    }
  };

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      ></motion.div>

      {/* Popup Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-2xl flex h-3/4 relative"
        >
          {/* Sidebar (Tabs) */}
          <div className="w-1/4 bg-indigo-50 rounded-l-3xl p-6 flex flex-col gap-2">
            <h2 className="text-xl font-bold text-indigo-600 mb-6">Settings</h2>
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left ${
                activeTab === "general"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-indigo-100"
              }`}
            >
              <FaCog className="w-4 h-4" />
              General
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-left ${
                activeTab === "profile"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-indigo-100"
              }`}
            >
              <FaUser className="w-4 h-4" />
              Profile
            </button>
          </div>

          {/* Main Content */}
          <div className="w-3/4 p-15 relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>

            {/* Tab Content */}
            {activeTab === "general" && (
              <div className="space-y-6">
                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkTheme ? (
                      <FaMoon className="w-5 h-5 text-gray-700" />
                    ) : (
                      <FaSun className="w-5 h-5 text-gray-700" />
                    )}
                    <span className="text-gray-700">Theme</span>
                  </div>
                  <select
                    value={isDarkTheme ? "dark" : "light"}
                    onChange={(e) => setIsDarkTheme(e.target.value === "dark")}
                    className="select select-bordered rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                {/* Delete All Chats */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Delete all chats</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDeleteChats}
                    className="btn bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition-all"
                  >
                    Delete all
                  </motion.button>
                </div>

                {/* Logout */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Log out on this device</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="btn bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all"
                  >
                    Log out
                  </motion.button>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="space-y-6 overflow-y-hidden">
                {/* Success/Error Messages */}
                {error && (
                  <div className="text-red-500 text-sm flex items-center gap-2">
                    <FaTimes className="w-4 h-4" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-500 text-sm flex items-center gap-2">
                    <FaUser className="w-4 h-4" />
                    {success}
                  </div>
                )}

                {/* Profile Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Display Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Name</span>
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="input input-bordered w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Profile Picture */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Profile Picture</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        {currentUser.photoURL ? (
                          <img
                            src={currentUser.photoURL}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <FaUser className="text-gray-600 w-6 h-6" />
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="btn bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-indigo-700 transition-all"
                      >
                        <FaCamera className="w-4 h-4" />
                        Update
                      </motion.button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all"
                  >
                    Save Profile
                  </motion.button>
                </form>

                {/* Change Password Form */}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">Current Password</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <FaLock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-gray-700">New Password</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <FaLock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input input-bordered w-full pl-10 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="btn bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 transition-all"
                  >
                    Change Password
                  </motion.button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SettingsPopup;