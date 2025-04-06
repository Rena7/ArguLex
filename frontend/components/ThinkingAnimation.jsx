import { motion } from "framer-motion";

const ThinkingAnimation = () => {
  return (
    <div className="flex items-center p-4 rounded-lg max-w-xs">
      <div className="thinking-dots">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            className="w-2 h-2 bg-primary rounded-full"
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: [0.3, 1, 0.3],
              y: ["0%", "-30%", "0%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: dot * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="ml-3 text-sm opacity-70">Thinking...</span>
    </div>
  );
};

export default ThinkingAnimation;