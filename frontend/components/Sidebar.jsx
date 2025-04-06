import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPlus, 
  FaTrash, 
  FaMoon, 
  FaSun, 
  FaChevronLeft, 
  FaChevronRight,
  FaSearch,
  FaHistory,
  FaComments
} from "react-icons/fa";

const Sidebar = ({ 
  conversations, 
  onNewChat, 
  onSelectChat, 
  activeChat, 
  onToggleTheme, 
  isDarkTheme,
  onDeleteChat 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredChat, setHoveredChat] = useState(null);

  const filteredConversations = conversations.filter(conv => 
    (conv.title || "New conversation").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find active conversation to display its title
  const activeConversation = conversations.find(conv => conv.id === activeChat);
  
  return (
    <div className="relative h-full">
      {/* Collapse Toggle Button */}
      <button
        className={`absolute -right-3.5 top-5 bg-base-200 text-base-content border border-base-300 rounded-full p-1.5 shadow-md z-10 hover:bg-base-300`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <FaChevronRight className="w-3 h-3" /> : <FaChevronLeft className="w-3 h-3" />}
      </button>

      <motion.div
        initial={{ width: "280px" }}
        animate={{ 
          width: isCollapsed ? "72px" : "280px"
        }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30 
        }}
        className="h-full bg-base-100 border-r border-base-300 flex flex-col"
      >
        {/* Header with New Chat Button */}
        <div className={`p-3 ${isCollapsed ? 'items-center' : ''} flex flex-col`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary w-1/2  shadow-sm rounded-3xl"
            onClick={onNewChat}
            aria-label="New Chat"
          >
            <FaPlus className="w-4 h-4" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-medium"
                >
                  New Chat
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Search Input - Visible only when not collapsed */}
          {!isCollapsed && (
            <div className="form-control w-full mt-3">
              <div className="input-group">
                {/* <span className="btn btn-square btn-sm btn-ghost">
                  <FaSearch className="w-4 h-4 opacity-70" />
                </span> */}
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full"
                />
              </div>
            </div>
          )}

          {/* Collapsed Search Button */}
          {isCollapsed && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="btn btn-circle btn-ghost btn-sm mt-3"
              aria-label="Search conversations"
            >
              <FaSearch className="w-4 h-4" />
            </motion.button>
          )}

          {/* Divider */}
          <div className="divider my-2"></div>
        </div>

        {/* Title display when collapsed */}
        {/* {isCollapsed && activeConversation && (
          <div className="absolute left-20 top-5 text-base-content font-medium truncate max-w-[180px]">
            {activeConversation.title || "New conversation"}
          </div>
        )} */}

        {/* Conversations List */}
        <div className="flex-grow overflow-y-auto px-3 pb-3 scrollbar">
          {filteredConversations.length > 0 ? (
            <div className="space-y-1">
              {filteredConversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ scale: 1.01 }}
                  className={`rounded-md cursor-pointer transition-all flex items-center ${
                    activeChat === conv.id
                      ? "bg-base-200 border-l-4 border-primary"
                      : "hover:bg-base-200"
                  } ${isCollapsed ? 'justify-center p-2' : 'px-3 py-2'}`}
                  onClick={() => onSelectChat(conv.id)}
                  onMouseEnter={() => setHoveredChat(conv.id)}
                  onMouseLeave={() => setHoveredChat(null)}
                  aria-label={conv.title || "New conversation"}
                >
                  {isCollapsed ? (
                    <div className="avatar placeholder">
                      <div className="bg-primary  flex items-center justify-center content-center flex-nowrap flex-row text-primary-content rounded-full w-8" style={{ display: "flex", alignContent: "center", justifyContent: "center", alignItems: "center" }}>
                        <span>{(conv.title || "C")[0].toUpperCase()}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="avatar placeholder mr-3 flex-shrink-0">
                        <div className="bg-primary text-primary-content rounded-full w-8" style={{ display: "flex", alignContent: "center", justifyContent: "center", alignItems: "center" }}>
                          <span>{(conv.title || "C")[0].toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex-grow truncate">
                        <div className="truncate text-sm text-base-content">
                          {conv.title || "New conversation"}
                        </div>
                        {conv.lastMessage && (
                          <div className="text-xs opacity-70 truncate mt-0.5">
                            {conv.lastMessage.substring(0, 30)}...
                          </div>
                        )}
                      </div>
                      {(hoveredChat === conv.id || activeChat === conv.id) && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="btn btn-ghost btn-circle btn-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat && onDeleteChat(conv.id);
                          }}
                          aria-label="Delete conversation"
                        >
                          <FaTrash className="w-3.5 h-3.5 text-error" />
                        </motion.button>
                      )}
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-6 opacity-70 ${isCollapsed ? 'hidden' : 'block'}`}>
              <FaComments className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>

        {/* Footer with Theme Toggle */}
        <div className="p-3 border-t border-base-300">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-outline btn-sm w-full gap-2"
            onClick={onToggleTheme}
            aria-label={isDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDarkTheme ? (
              <FaSun className="w-4 h-4" />
            ) : (
              <FaMoon className="w-4 h-4" />
            )}
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isDarkTheme ? "Light Mode" : "Dark Mode"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;