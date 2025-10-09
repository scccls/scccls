
import React from "react";
import { Progress } from "@/components/ui/progress";

interface StudyProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  incorrectCount: number;
}

const StudyProgress: React.FC<StudyProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  incorrectCount,
}) => {
  const progress = Math.round((currentQuestionIndex / totalQuestions) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
        {incorrectCount > 0 && (
          <span className="text-red-500">{incorrectCount} incorrect</span>
        )}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default StudyProgress;
