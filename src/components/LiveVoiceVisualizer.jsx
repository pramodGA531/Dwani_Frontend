import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * Pure visualizer component – receives listening state, normalized amplitude (0‑20),
 * and start/stop handlers from the parent.
 */
export default function LiveVoiceVisualizer({ isListening, amplitude, startListening, stopListening }) {
  // Motion values for visual scaling based on amplitude.
  const lineScaleY = useMotionValue(1);
  const smoothLineScale = useSpring(lineScaleY, { stiffness: 350, damping: 20 });

  const lineBlur = useMotionValue(4);
  const smoothBlur = useSpring(lineBlur, { stiffness: 300, damping: 25 });

  // Update motion values whenever amplitude changes.
  useEffect(() => {
    const scale = 1 + amplitude / 20; // map 0‑20 to 1‑2 scale
    const blur = 4 + amplitude; // map 0‑20 to 4‑24 blur
    lineScaleY.set(scale);
    lineBlur.set(blur);
  }, [amplitude]);

  return (
    <div className="flex flex-col items-center gap-6 justify-center w-full max-w-xl mx-auto select-none px-4">
      {/* Container holding the single blue neon voice bar */}
      <div className="relative w-full h-12 flex items-center justify-center overflow-visible">
        {/* Core Electric Blue Wave Bar */}
        <motion.div
          style={{
            scaleY: smoothLineScale,
            boxShadow: isListening ? "0 0 30px #2563EB, 0 0 10px #3b82f6" : "none",
          }}
          className={`w-full rounded-full bg-blue-600 transition-all duration-300 ${
            isListening ? "h-[5px] opacity-100" : "h-[3px] opacity-30"
          }`}
        />
        {/* Soft secondary glow aura */}
        <motion.div
          style={{
            scaleY: smoothLineScale,
            filter: `blur(${smoothBlur.get()}px)`,
          }}
          className={`absolute w-full h-[6px] rounded-full bg-blue-500/40 pointer-events-none transition-opacity duration-300 ${
            isListening ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      {/* Mic toggle button */}
      <button
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 active:scale-95 border cursor-pointer z-10 ${
          isListening
            ? "bg-zinc-950/90 border-zinc-800 shadow-inner"
            : "bg-blue-600 border-blue-500 hover:bg-blue-500 shadow-blue-500/10"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      </button>
    </div>
  );
}
