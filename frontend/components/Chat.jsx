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

  // Update DaisyUI theme when theme changes
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkTheme ? "dark" : "light"
    );
  }, [isDarkTheme]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Update conversation title based on first message
  useEffect(() => {
    if (messages.length > 0 && messages[0].isBot === false) {
      // Find the active conversation
      const updatedConversations = conversations.map(conv => {
        if (conv.id === activeChat) {
          // Use first user message as title, trimmed to reasonable length
          const title = messages[0].text.length > 30 
            ? messages[0].text.substring(0, 30) + "..." 
            : messages[0].text;
          
          // Also store the last message for preview
          const lastMessage = messages[messages.length - 1].text;
          
          return { ...conv, title, lastMessage };
        }
        return conv;
      });
      
      setConversations(updatedConversations);
    }
  }, [messages, activeChat]);

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
          // const data = JSON.parse(event.data);
          botMessage += event.data + " ";
  
          // Update the message with each chunk as it arrives
          setMessages((prev) => [
            ...prev.slice(0, -1), // Remove the previous placeholder message
            { text: botMessage.trim(), isBot: true },
          ]);
        }
      };
  
      // Handle when the stream is opened
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
  
      // Handle the stream being completed
      eventSource.addEventListener("close", () => {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { text: botMessage.trim() || "Response completed.", isBot: true },
        ]);
        setIsLoading(false);
      });
  
      // Add an initial placeholder bot message while waiting for the stream
      setMessages((prev) => [...prev, { text: "", isBot: true }]);
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

  const handleDeleteChat = (chatId) => {
    // Don't delete if it's the last conversation
    if (conversations.length <= 1) return;

    const updatedConversations = conversations.filter(conv => conv.id !== chatId);
    setConversations(updatedConversations);
    
    // If deleting active chat, select another one
    if (chatId === activeChat) {
      setActiveChat(updatedConversations[0].id);
      // Also reset messages to match the newly selected chat
      // Here you would typically load messages for the selected chat
      setMessages([]);
    }
  };

  return (
    <div className="flex h-screen bg-base-100 relative overflow-hidden">
      {/* Sidebar for desktop */}
      <div className="hidden md:block h-full z-10">
        <Sidebar
          conversations={conversations}
          onNewChat={handleNewChat}
          onSelectChat={setActiveChat}
          activeChat={activeChat}
          onToggleTheme={handleToggleTheme}
          isDarkTheme={isDarkTheme}
          onDeleteChat={handleDeleteChat}
        />
      </div>

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
              className="h-full"
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
                onDeleteChat={handleDeleteChat}
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
          <Header 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            title={conversations.find(conv => conv.id === activeChat)?.title || "New conversation"}
          />
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
                <h2 className="text-3xl font-bold text-primary mb-4">
                  Welcome, {currentUser?.displayName || "User"}!
                </h2>
                <p className="text-base-content/80 mb-6">
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
                  <ChatMessage message={msg.text} isBot={msg.isBot} />
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ThinkingAnimation />
                </motion.div>
              )}
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
            className="p-4 bg-base-200"
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