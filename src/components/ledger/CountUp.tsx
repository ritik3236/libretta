"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";
import { formatMoney } from "@/lib/money";

/** Animated currency value (minor units → formatted), counts up on mount/update. */
export function CountUp({
  minor,
  currency,
  className,
}: {
  minor: number;
  currency: string;
  className?: string;
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

  return <span className={className}>{formatMoney(display, currency)}</span>;
}
