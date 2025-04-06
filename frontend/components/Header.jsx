"use client";
import { motion } from "framer-motion";
import { FaBars, FaSignOutAlt, FaUserCircle, FaCog } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SettingsPopup from "@/components/SettingsPopup";

const Header = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-transparent">
        {/* Left Section: Sidebar Toggle and App Name */}
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-600 hover:text-indigo-600 transition-colors md:hidden"
            onClick={onToggleSidebar}
          >
            <FaBars size={20} />
          </motion.button>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold text-indigo-600"
          >
            ArguLex
          </motion.div>
        </div>

        {/* Right Section: User Profile Icon with Dropdown */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="text-gray-500 w-8 h-8" />
            )}
          </motion.div>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-12 right-0 bg-white shadow-lg rounded-lg p-2 w-48 z-10"
            >
              <div
                className="flex items-center gap-2 p-2 text-gray-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsDropdownOpen(false);
                }}
              >
                <FaCog className="w-5 h-5" />
                <span>Settings</span>
              </div>
              <div
                className="flex items-center gap-2 p-2 text-gray-700 hover:bg-indigo-50 rounded-lg cursor-pointer"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="w-5 h-5" />
                <span>Logout</span>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Settings Popup */}
      {isSettingsOpen && (
        <SettingsPopup onClose={() => setIsSettingsOpen(false)} />
      )}
    </>
  );
};

export default Header;
