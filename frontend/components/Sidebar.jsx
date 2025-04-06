import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaMoon, FaSun } from "react-icons/fa";

const Sidebar = ({ conversations, onNewChat, onSelectChat, activeChat, onToggleTheme, isDarkTheme }) => {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="w-64 bg-indigo-50 h-screen p-4 flex flex-col shadow-lg"
    >
      {/* New Chat Button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="btn bg-indigo-600 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all mb-6"
        onClick={onNewChat}
      >
        <FaPlus className="w-4 h-4" />
        New Chat
      </motion.button>

      {/* Conversations List */}
      <div className="flex-grow overflow-y-auto mb-4">
        {conversations.map((conv) => (
          <motion.div
            key={conv.id}
            whileHover={{ scale: 1.02 }}
            className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors flex justify-between items-center ${
              activeChat === conv.id
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700 hover:bg-indigo-100"
            }`}
            onClick={() => onSelectChat(conv.id)}
          >
            <span className="truncate flex-grow">{conv.title || "New conversation"}</span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`text-gray-400 hover:text-red-500 transition-colors ${
                activeChat === conv.id ? "text-gray-200 hover:text-red-400" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent selecting the chat when clicking delete
                // Add delete functionality here
              }}
            >
              <FaTrash className="w-4 h-4" />
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="btn bg-white text-gray-700 rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
        onClick={onToggleTheme}
      >
        {isDarkTheme ? (
          <FaSun className="w-4 h-4 text-yellow-500" />
        ) : (
          <FaMoon className="w-4 h-4 text-gray-500" />
        )}
        {isDarkTheme ? "Light Theme" : "Dark Theme"}
      </motion.button>
    </motion.div>
  );
};

export default Sidebar;