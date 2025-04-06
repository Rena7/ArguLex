import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaMicrophone } from "react-icons/fa";

const ChatInput = ({ onSendMessage, isLoading, isNewChat }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className={`px-6 py-4 bg-transparent ${isNewChat ? "w-full max-w-2xl mx-auto" : ""}`}
    >
      <div className={`flex items-center justify-center ${isNewChat ? "flex-col" : ""}`}>
        {isNewChat && (
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mb-4"
          >
            How can I help you today?
          </motion.h2>
        )}
        
        <div className={`flex items-center w-full ${isNewChat ? "max-w-2xl" : "max-w-3xl"} rounded-xl border border-gray-700 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500 transition-all`}>
          {/* Textarea Field */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-grow px-6 py-4 bg-transparent placeholder-gray-500 focus:outline-none resize-none max-h-48 overflow-y-auto"
            disabled={isLoading}
            rows={1}
            style={{
              minHeight: "60px",
              lineHeight: "1.5",
            }}
          />

          {/* Voice Input Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            className="text-gray-400 hover:text-indigo-400 transition-colors p-4"
            title="Voice input"
          >
            <FaMicrophone className="w-5 h-5" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-4 text-gray-400 transition-colors ${
              isLoading || !message.trim()
                ? "cursor-not-allowed"
                : "hover:text-indigo-400"
            }`}
            type="submit"
            disabled={isLoading || !message.trim()}
          >
            {isLoading ? (
              <span className="loading loading-spinner w-5 h-5 text-gray-400"></span>
            ) : (
              <FaPaperPlane className="w-5 h-5" />
            )}
          </motion.button>
        </div>
        
        {isNewChat && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-gray-500 dark:text-gray-400 mt-2"
          >
            Ask anything, from creative ideas to technical explanations.
          </motion.p>
        )}
      </div>
    </motion.form>
  );
};

export default ChatInput;