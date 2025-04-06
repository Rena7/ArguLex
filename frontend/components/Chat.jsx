import { useState, useEffect, useRef } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ThinkingAnimation from "@/components/ThinkingAnimation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const Chat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [conversations, setConversations] = useState([
    { id: "1", title: "New Conversation" },
  ]);
  const [activeChat, setActiveChat] = useState("1");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkTheme ? "dark" : "light"
    );
  }, [isDarkTheme]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  const handleSendMessage = async (message) => {
    setMessages((prev) => [...prev, { text: message, isBot: false }]);
    setIsLoading(true);
  
    try {
      const eventSource = new EventSource(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/streamresponse?prompt=${encodeURIComponent(message)}`
      );
  
      let botMessage = "";
  
      // When a new message chunk is received
      eventSource.onmessage = (event) => {
        if (event.data) {
          botMessage += event.data + " ";
  
          // Update the message with each chunk as it arrives
          setMessages((prev) => [
            ...prev.slice(0, -1), // Remove the previous placeholder message
            { text: botMessage.trim(), isBot: true },
          ]);
        }
      };
  
      // Handle when the stream is closed
      eventSource.onopen = () => {
        console.log("Stream connection opened.");
      };
  
      // Handle error in case the event source fails
      eventSource.onerror = (error) => {
        console.error("Streaming error:", error);
        eventSource.close();
  
        // Final message when streaming ends or fails
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            text:
              botMessage.trim() || "Something went wrong. Please try again.",
            isBot: true,
          },
        ]);
        setIsLoading(false);
      };
  
      // Handle the stream being completed (when all data has been sent)
      eventSource.addEventListener("close", () => {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { text: botMessage.trim() || "Response completed.", isBot: true },
        ]);
        setIsLoading(false);
      });
  
      // Add an initial placeholder bot message while waiting for the stream
      setMessages((prev) => [...prev, { text: "Thinking...", isBot: true }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          isBot: true,
        },
      ]);
      setIsLoading(false);
    }
  };
  

  const handleNewChat = () => {
    const newId = Date.now().toString();
    setConversations([
      ...conversations,
      { id: newId, title: "New conversation" },
    ]);
    setActiveChat(newId);
    setMessages([]);
  };

  const handleToggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-300 rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/4"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-300 rounded-full opacity-20 blur-3xl translate-x-1/4 -translate-y-1/4"></div>

      {/* Sidebar for desktop */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden md:block w-64 bg-white shadow-xl z-10"
      >
        <Sidebar
          conversations={conversations}
          onNewChat={handleNewChat}
          onSelectChat={setActiveChat}
          activeChat={activeChat}
          onToggleTheme={handleToggleTheme}
          isDarkTheme={isDarkTheme}
        />
      </motion.div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-64 bg-white h-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                conversations={conversations}
                onNewChat={handleNewChat}
                onSelectChat={(id) => {
                  setActiveChat(id);
                  setIsSidebarOpen(false);
                }}
                activeChat={activeChat}
                onToggleTheme={handleToggleTheme}
                isDarkTheme={isDarkTheme}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </motion.div>

        {/* Chat Container */}
        <div className="flex-grow overflow-y-auto p-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="h-full flex flex-col items-center justify-center text-center p-4"
            >
              <div className="max-w-md mb-8">
                <h2 className="text-3xl font-bold text-indigo-600 mb-4">
                  Welcome, {currentUser.displayName || "User"}!
                </h2>
                <p className="text-gray-600 mb-6">
                  Start a conversation with your AI assistant. Ask questions,
                  get help with tasks, or just chat about anything you're
                  interested in!
                </p>
              </div>
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                isNewChat={true}
              />
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                                {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ThinkingAnimation />
                </motion.div>
              )}
                  <ChatMessage message={msg.text} isBot={msg.isBot} />
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input (only shown when there are messages) */}
        {messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4 shadow-md"
          >
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              isNewChat={false}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Chat;
