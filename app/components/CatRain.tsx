"use client";

import { useEffect, useRef, useState } from "react";

interface Cat {
  id: number;
  left: number; // percentage
  size: number; // px
  duration: number; // seconds
  drift: number; // percentage horizontal drift
}

export default function CatRain({ active }: { active: boolean }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const timeouts = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (!active) {
      // clear any existing cats and timers when inactive
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
      // Clearing the cat rain immediately keeps the UI responsive even if the component toggles rapidly.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCats([]);
      return;
    }

    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const cat: Cat = {
        id,
        left: Math.random() * 100,
        size: 24 + Math.random() * 32,
        duration: 8 + Math.random() * 6,
        drift: Math.random() * 100 - 50,
      };
      setCats((prev) => [...prev, cat]);

      const timeout = setTimeout(() => {
        setCats((prev) => prev.filter((c) => c.id !== id));
      }, cat.duration * 1000);
      timeouts.current.push(timeout);
    }, 500);

    return () => {
      clearInterval(interval);
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {cats.map((cat) => (
        <span
          key={cat.id}
          className="absolute cat-fall"
          style={{
            left: `${cat.left}%`,
            fontSize: `${cat.size}px`,
            animationDuration: `${cat.duration}s`,
            // @ts-ignore -- custom property for horizontal drift
            "--drift": `${cat.drift}%`,
          }}
        >
          🐱
        </span>
      ))}
    </div>
  );
}

