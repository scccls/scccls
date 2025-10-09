
import React from "react";
import { Progress } from "@/components/ui/progress";

interface PracticeTestProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

const PracticeTestProgress: React.FC<PracticeTestProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
}) => {
  const progress = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span>
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default PracticeTestProgress;
