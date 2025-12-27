'use client';

import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  seconds: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick?: (remaining: number) => void;
  resetKey?: number; // Change this to reset the timer (new game)
}

export function Timer({ seconds, isRunning, onTimeUp, onTick, resetKey = 0 }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const hasStartedRef = useRef(false);

  // Reset ONLY when resetKey changes (new game) or seconds changes
  useEffect(() => {
    setRemaining(seconds);
    hasStartedRef.current = false;
  }, [seconds, resetKey]);

  // Countdown logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          // Defer callback to avoid state update during render
          setTimeout(() => onTimeUp(), 0);
          return 0;
        }
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp, onTick]);

  // Color based on time remaining
  const getColor = () => {
    if (remaining <= 5) return 'text-red-500';
    if (remaining <= 10) return 'text-yellow-500';
    return 'text-white';
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return mins > 0 ? `${mins}:${s.toString().padStart(2, '0')}` : `${s}`;
  };

  return (
    <div className={`text-4xl font-mono font-bold ${getColor()} transition-colors`}>
      {formatTime(remaining)}
    </div>
  );
}
