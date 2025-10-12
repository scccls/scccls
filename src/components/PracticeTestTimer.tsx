
import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PracticeTestTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

const PracticeTestTimer: React.FC<PracticeTestTimerProps> = ({ totalSeconds, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>();
  const onTimeUpRef = useRef(onTimeUp);
  const hasEndedRef = useRef(false);
  
  // Keep onTimeUp reference current
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const progress = (secondsLeft / totalSeconds) * 100;
  
  useEffect(() => {
    // Reset start time when totalSeconds changes
    startTimeRef.current = Date.now();
    hasEndedRef.current = false;
    setSecondsLeft(totalSeconds);

    const updateTimer = () => {
      if (hasEndedRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      
      setSecondsLeft(remaining);

      if (remaining <= 0 && !hasEndedRef.current) {
        hasEndedRef.current = true;
        onTimeUpRef.current();
      } else if (remaining > 0) {
        animationFrameRef.current = requestAnimationFrame(updateTimer);
      }
    };

    // Handle visibility change to prevent timer issues when tab is inactive
    const handleVisibilityChange = () => {
      if (!document.hidden && !hasEndedRef.current) {
        // Recalculate when tab becomes visible again
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setSecondsLeft(remaining);
        
        if (remaining <= 0 && !hasEndedRef.current) {
          hasEndedRef.current = true;
          onTimeUpRef.current();
        } else if (remaining > 0) {
          animationFrameRef.current = requestAnimationFrame(updateTimer);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    animationFrameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [totalSeconds]);

  // Format time as minutes:seconds
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="mb-6 space-y-2">
      <div className="flex justify-between items-center">
        <span className="flex items-center space-x-2 text-sm">
          <Timer className="h-4 w-4" />
          <span>Time Remaining: <span className="font-medium">{formatTime(secondsLeft)}</span></span>
        </span>
        <span className="text-sm font-medium">
          {progress <= 25 ? (
            <span className="text-red-500">{formatTime(secondsLeft)}</span>
          ) : (
            formatTime(secondsLeft)
          )}
        </span>
      </div>
      <Progress 
        value={progress} 
        className={`h-2 ${progress <= 25 ? 'bg-red-200' : ''}`}
        indicatorClassName={progress <= 25 ? 'bg-red-500' : undefined}
      />
    </div>
  );
};

export default PracticeTestTimer;
