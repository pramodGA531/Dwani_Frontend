import { motion, useSpring, useMotionValue } from 'framer-motion';

/**
 * Minimalist border vibration component.
 * Props:
 *   - isListening: boolean indicating if mic is active
 *   - amplitude: number (0-20) representing normalized voice intensity
 *   - children: content inside the card
 */
export default function BorderVibration({ isListening, amplitude, children }) {
  // Smooth the raw amplitude for gentle animation
  const smoothAmplitude = useSpring(amplitude, { stiffness: 200, damping: 30 });

  const borderColor = isListening
    ? `rgba(37, 99, 235, ${0.3 + smoothAmplitude.get() / 30})`
    : 'rgba(229, 231, 235, 1)';

  const boxShadow = isListening
    ? `0 0 ${smoothAmplitude.get() * 2}px #3b82f6`
    : 'none';

  return (
    <motion.div
      className="relative rounded-2xl border-[3px]"
      animate={{ borderColor, boxShadow }}
      transition={{ duration: 0.05 }}
    >
      {children}
    </motion.div>
  );
}
