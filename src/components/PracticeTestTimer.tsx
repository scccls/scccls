
import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatDistanceStrict } from 'date-fns';

interface PracticeTestTimerProps {
  totalSeconds: number;
  onTimeUp: () => void;
}

const PracticeTestTimer: React.FC<PracticeTestTimerProps> = ({ totalSeconds, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const progress = (secondsLeft / totalSeconds) * 100;
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [totalSeconds, onTimeUp]);

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
