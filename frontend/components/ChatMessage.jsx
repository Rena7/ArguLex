import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUser, FaRobot, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

const ChatMessage = ({ message, isBot, timestamp, onReact, reaction }) => {
  const { currentUser } = useAuth();
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  // Typing Animation for AI Responses
  useEffect(() => {
    if (isBot && message !== "") {
      const interval = setInterval(() => {
        if (index < message.length) {
          setDisplayedText((prev) => prev + message[index]);
          setIndex((prev) => prev + 1);
        } else {
          clearInterval(interval);
        }
      }, 30); // Adjust speed of typing (30ms per character)
      return () => clearInterval(interval);
    } else {
      setDisplayedText(message);
    }
  }, [message, isBot, index]);

  // Handle Reaction
  const handleReaction = (type) => {
    if (onReact) {
      onReact(type);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4 w-full`}
    >
      <div
        className={`flex items-start gap-3 w-full max-w-2xl ${
          isBot ? "flex-row" : "flex-row-reverse"
        }`}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          {isBot ? (
            <FaRobot className="text-indigo-600 w-5 h-5" />
          ) : currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <FaUser className="text-gray-600 w-6 h-6" />
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isBot ? "items-start" : "items-end"} w-full`}>
          {/* Header (Sender and Timestamp) */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-sm font-medium ${
                document.documentElement.getAttribute("data-theme") === "dark"
                  ? "text-gray-300"
                  : "text-gray-700"
              }`}
            >
              {isBot ? "Lex Assistant" : "You"}
            </span>
            <time
              className={`text-xs ${
                document.documentElement.getAttribute("data-theme") === "dark"
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              {timestamp
                ? new Date(timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </time>
          </div>

          {/* Message Bubble */}
          <div
            className={`p-4 rounded-2xl shadow-md w-full ${
              isBot
                ? document.documentElement.getAttribute("data-theme") === "dark"
                  ? "bg-gray-700 text-gray-200 rounded-bl-none"
                  : "bg-indigo-50 text-gray-800 rounded-bl-none"
                : document.documentElement.getAttribute("data-theme") === "dark"
                ? "bg-indigo-600 text-white rounded-br-none"
                : "bg-indigo-600 text-white rounded-br-none"
            }`}
          >
            <div className="text-base leading-relaxed">
              {isBot && message === "Thinking..." ? message : displayedText}
            </div>

            {/* Reactions (only for AI messages) */}
            {/* {isBot && message !== "Thinking..." && (
              <div className="flex gap-2 mt-2">
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction("thumbs-up")}
                  className={`text-sm ${
                    reaction === "thumbs-up"
                      ? "text-indigo-500"
                      : document.documentElement.getAttribute("data-theme") === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  } hover:text-indigo-500 transition-colors`}
                  aria-label="Thumbs up"
                >
                  <FaThumbsUp className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleReaction("thumbs-down")}
                  className={`text-sm ${
                    reaction === "thumbs-down"
                      ? "text-red-500"
                      : document.documentElement.getAttribute("data-theme") === "dark"
                      ? "text-gray-400"
                      : "text-gray-500"
                  } hover:text-red-500 transition-colors`}
                  aria-label="Thumbs down"
                >
                  <FaThumbsDown className="w-4 h-4" />
                </motion.button>
              </div>
            )} */}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;