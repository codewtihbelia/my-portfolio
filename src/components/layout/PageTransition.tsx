import React from "react";
import { motion, useReducedMotion } from "motion/react";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Gentle upward drift with subtle fade
  // If user prefers reduced motion, replace spatial displacement with an instant opacity transition
  const variants = {
    initial: shouldReduceMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.12 : 0.26,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: shouldReduceMotion
      ? { opacity: 0, y: 0 }
      : {
          opacity: 0,
          y: -8,
          transition: {
            duration: 0.18,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className={`w-full flex-1 flex flex-col ${className}`}
    >
      {children}
    </motion.div>
  );
};
