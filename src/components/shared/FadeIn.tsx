"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
}

function getOffset(direction: Direction) {
  switch (direction) {
    case "up":
      return { x: 0, y: 20 };
    case "down":
      return { x: 0, y: -20 };
    case "left":
      return { x: 20, y: 0 };
    case "right":
      return { x: -20, y: 0 };
  }
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
}: FadeInProps) {
  const offset = getOffset(direction);

  const variants: Variants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
