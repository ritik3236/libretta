"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { formatMoney } from "@/lib/money";

/**
 * Animated currency value (minor units → formatted), counts up on mount/update.
 * When `baseSize` is set, the font auto-shrinks for longer numbers so large
 * amounts (e.g. ₹90,34,29,999.00) stay on one line, while short ones stay big.
 */
export function CountUp({
  minor,
  currency,
  className,
  baseSize,
  minSize = 14,
}: {
  minor: number;
  currency: string;
  className?: string;
  /** target font size in px for short amounts; enables responsive sizing */
  baseSize?: number;
  /** floor font size in px */
  minSize?: number;
}) {
  const [display, setDisplay] = useState(minor);

  useEffect(() => {
    const controls = animate(0, minor, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [minor]);

  // Size from the FINAL value's length (not the animating value) to avoid jitter.
  const target = formatMoney(minor, currency);
  const style = baseSize ? { fontSize: fitSize(target.length, baseSize, minSize) } : undefined;

  return (
    <span className={className} style={style}>
      {formatMoney(display, currency)}
    </span>
  );
}

/** Shrinks font once the string passes ~9 chars, down to a floor. */
function fitSize(len: number, base: number, min: number): number {
  if (len <= 9) return base;
  const shrunk = base - (len - 9) * (base * 0.07);
  return Math.max(min, Math.round(shrunk));
}
