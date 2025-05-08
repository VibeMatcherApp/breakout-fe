import { useState } from "react";
import { motion } from "framer-motion";
import { X, Heart } from "lucide-react";

interface SwipeControlsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeControls: React.FC<SwipeControlsProps> = ({ onSwipeLeft, onSwipeRight }) => {
  const [disableControls, setDisableControls] = useState(false);

  const handleSwipeLeft = () => {
    if (disableControls) return;

    setDisableControls(true);
    onSwipeLeft();

    // Re-enable controls after a short delay
    setTimeout(() => {
      setDisableControls(false);
    }, 500);
  };

  const handleSwipeRight = () => {
    if (disableControls) return;

    setDisableControls(true);
    onSwipeRight();

    // Re-enable controls after a short delay
    setTimeout(() => {
      setDisableControls(false);
    }, 500);
  };

  return (
    <div className="flex justify-center gap-8 mt-4 mb-20 md:mb-4 z-[60] relative">
      <motion.button
        onClick={handleSwipeLeft}
        className="w-16 h-16 flex items-center justify-center bg-red-500 text-white rounded-full shadow-xl"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1, boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.5)" }}
        disabled={disableControls}
        style={{
          transition: "all 0.2s ease"
        }}
      >
        <X size={28} strokeWidth={2.5} />
      </motion.button>

      <motion.button
        onClick={handleSwipeRight}
        className="w-16 h-16 flex items-center justify-center bg-emerald-500 text-white rounded-full shadow-xl"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)" }}
        disabled={disableControls}
        style={{
          transition: "all 0.2s ease"
        }}
      >
        <Heart size={28} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
};

export default SwipeControls;

