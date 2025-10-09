
import React, { useState, useEffect } from "react";
import { Question } from "@/types/StudyTypes";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyCardProps {
  question: Question;
  onAnswer: (questionId: string, selectedOptionId: string) => void;
  onNext?: () => void; // Optional callback for moving to next question
  onCorrectAnswer?: (questionId: string) => void; // Optional callback for handling correct answers
  hideCorrectAnswer?: boolean; // New prop to hide correct answer indication
  buttonText?: string; // Custom button text
}

const StudyCard: React.FC<StudyCardProps> = ({ 
  question, 
  onAnswer, 
  onNext, 
  onCorrectAnswer,
  hideCorrectAnswer = false,
  buttonText = "Check Answer",
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState(question.options);

  // Reset state when question changes and shuffle options
  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setIsCorrect(false);
    // Shuffle options randomly
    setShuffledOptions([...question.options].sort(() => Math.random() - 0.5));
  }, [question.id]);

  const handleOptionSelect = (optionId: string) => {
    if (hasAnswered) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOption || hasAnswered) return;
    onAnswer(question.id, selectedOption); // Submit the answer to context
    setHasAnswered(true);
    
    // Store whether the answer is correct
    const correct = selectedOption === question.correctOptionId;
    setIsCorrect(correct);
  };

  const handleNext = () => {
    // If answer was correct and we have a callback for correct answers
    // Call it right before moving to the next question
    if (isCorrect && onCorrectAnswer) {
      onCorrectAnswer(question.id);
    }
    
    if (onNext) {
      onNext();
    }
  };

  return (
    <Card className="question-card max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-medium">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shuffledOptions.map((option) => (
            <button
              key={option.id}
              className={cn(
                "w-full text-left px-4 py-3 rounded-md border transition-colors",
                "hover:bg-muted/50 flex justify-between items-center",
                selectedOption === option.id && !hasAnswered && "border-primary bg-primary/10",
                hasAnswered && !hideCorrectAnswer && option.id === question.correctOptionId && "border-green-500 bg-green-50 dark:bg-green-950/20",
                hasAnswered && !hideCorrectAnswer && selectedOption === option.id && option.id !== question.correctOptionId && "border-red-500 bg-red-50 dark:bg-red-950/20"
              )}
              onClick={() => handleOptionSelect(option.id)}
              disabled={hasAnswered}
            >
              <span className="flex-1">{option.text}</span>
              {hasAnswered && !hideCorrectAnswer && option.id === question.correctOptionId && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {hasAnswered && !hideCorrectAnswer && selectedOption === option.id && !isCorrect && (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {hasAnswered ? (
          <div className="w-full flex justify-between items-center">
            <div className="flex-1">
              {!hideCorrectAnswer && (
                isCorrect ? (
                  <p className="text-green-500 flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Correct!
                  </p>
                ) : (
                  <p className="text-red-500 flex items-center">
                    <XCircle className="mr-2 h-5 w-5" />
                    Incorrect. The correct answer has been highlighted.
                  </p>
                )
              )}
            </div>
            <Button onClick={handleNext} className="ml-4">
              Next Question <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedOption}
          >
            {buttonText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StudyCard;
