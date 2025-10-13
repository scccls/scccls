import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { StudyCard } from "@/components";
import PracticeTestProgress from "@/components/PracticeTestProgress";
import PracticeTestTimer from "@/components/PracticeTestTimer";
import StudyResults from "@/components/StudyResults";
import { CheckCircle2, XCircle } from "lucide-react";
import { recordQuestionAttempt } from "@/utils/questionScoring";

const PracticeTestSession = () => {
  const navigate = useNavigate();
  const { state, getAllQuestionsForDeck, dispatch } = useStudy();
  
  // Get URL params from search params instead of path params
  const searchParams = new URLSearchParams(window.location.search);
  const deckId = searchParams.get('deckId');
  const questionCount = searchParams.get('count');
  const timed = searchParams.get('timed');
  const isPastPaper = searchParams.get('pastPaper') === 'true';
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [incorrectIds, setIncorrectIds] = useState<string[]>([]);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [unansweredIds, setUnansweredIds] = useState<string[]>([]);
  const [hasTimedEnded, setHasTimedEnded] = useState(false);
  
  // Check if this is a timed test
  const isTimedTest = timed === 'timed';
  // Calculate time allocation: 1 minute per question
  const totalTimeInSeconds = parseInt(questionCount || "0") * 60;

  useEffect(() => {
    if (!deckId || !questionCount) {
      navigate("/practice-test");
      return;
    }

    const allQuestions = getAllQuestionsForDeck(deckId);
    
    if (allQuestions.length < parseInt(questionCount)) {
      toast({
        title: "Not enough questions",
        description: `The selected deck doesn't have enough questions for this test.`,
        variant: "destructive",
      });
      navigate("/practice-test");
      return;
    }

    // Only initialize questions if they haven't been set yet
    // This prevents reshuffling when component re-renders
    setQuestions(prev => {
      if (prev.length > 0) return prev;
      
      // For past papers, maintain original order. For practice tests, shuffle.
      let selected;
      if (isPastPaper) {
        selected = allQuestions.slice(0, parseInt(questionCount));
      } else {
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        selected = shuffled.slice(0, parseInt(questionCount));
      }
      return selected;
    });
  }, [deckId, questionCount, getAllQuestionsForDeck, navigate]);

  const handleAnswer = (questionId: string, selectedOptionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOptionId
    }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishTest();
    }
  };

  const handleTimerEnd = () => {
    setHasTimedEnded(true);
    toast({
      title: "Time's up!",
      description: "Your practice test has ended because the time limit was reached.",
      variant: "destructive",
    });
    finishTest();
  };

  const finishTest = () => {
    const incorrect: string[] = [];
    const correct: string[] = [];
    const unanswered: string[] = [];

    // Evaluate all answers and record attempts
    questions.forEach(question => {
      const selectedOption = answers[question.id];
      if (!selectedOption) {
        // Unanswered - count towards score but don't track or add to bank
        unanswered.push(question.id);
        // NO recordQuestionAttempt() call here
      } else if (selectedOption !== question.correctOptionId) {
        // Incorrectly answered - track and add to bank
        incorrect.push(question.id);
        recordQuestionAttempt(question.id, false);
      } else {
        // Correctly answered - track
        correct.push(question.id);
        recordQuestionAttempt(question.id, true);
      }
    });

    setIncorrectIds(incorrect);
    setCorrectIds(correct);
    setUnansweredIds(unanswered);

    // Add only incorrect (not unanswered) questions to question bank
    incorrect.forEach(questionId => {
      const question = questions.find(q => q.id === questionId);
      if (question && !state.questionBank.some(q => q.id === questionId)) {
        dispatch({ type: "ADD_TO_QUESTION_BANK", payload: question });
      }
    });

    setShowResults(true);
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setIncorrectIds([]);
    setCorrectIds([]);
    setUnansweredIds([]);
    setHasTimedEnded(false);
    
    // Re-shuffle questions
    const allQuestions = getAllQuestionsForDeck(deckId!);
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, parseInt(questionCount!));
    setQuestions(selected);
  };

  const handleBackToPracticeTest = () => {
    navigate("/practice-test");
  };

  if (questions.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading questions...</div>;
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Practice Test Results</h1>
        
        {isTimedTest && hasTimedEnded && (
          <div className="bg-muted p-4 rounded-md mb-4">
            <p className="font-medium">Time's up! The test was automatically completed.</p>
            <p className="text-muted-foreground">
              You answered {Object.keys(answers).length} out of {questions.length} questions.
            </p>
          </div>
        )}
        
        <StudyResults
          total={questions.length}
          correct={correctIds.length}
          incorrect={incorrectIds.length + unansweredIds.length}
          deckId={deckId!}
          onRestart={handleRestart}
          hideBackButton={true}
        />
        
        <div className="flex justify-center mt-6">
          <Button onClick={handleBackToPracticeTest}>
            Return to Practice Test
          </Button>
        </div>

        {unansweredIds.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-medium flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-amber-500" />
              Unanswered Questions
            </h2>
            <div className="space-y-4">
              {unansweredIds.map(id => {
                const question = questions.find(q => q.id === id);
                if (!question) return null;
                
                return (
                  <div key={id} className="border rounded-md p-4 bg-amber-50">
                    <p className="font-medium">{question.text}</p>
                    <div className="mt-2 space-y-2">
                      {question.options.map(option => (
                        <div 
                          key={option.id} 
                          className={`p-2 rounded-md ${
                            option.id === question.correctOptionId
                              ? "bg-green-100 border-green-300 border"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          {option.text}
                          {option.id === question.correctOptionId && (
                            <span className="ml-2 text-green-500 text-sm">(Correct Answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {incorrectIds.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-medium flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-red-500" />
              Incorrect Answers
            </h2>
            <div className="space-y-4">
              {incorrectIds.map(id => {
                const question = questions.find(q => q.id === id);
                if (!question) return null;
                
                return (
                  <div key={id} className="border rounded-md p-4 bg-red-50">
                    <p className="font-medium">{question.text}</p>
                    <div className="mt-2 space-y-2">
                      {question.options.map(option => (
                        <div 
                          key={option.id} 
                          className={`p-2 rounded-md ${
                            option.id === question.correctOptionId
                              ? "bg-green-100 border-green-300 border"
                              : option.id === answers[id]
                                ? "bg-red-100 border-red-300 border"
                                : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          {option.text}
                          {option.id === question.correctOptionId && (
                            <span className="ml-2 text-green-500 text-sm">(Correct)</span>
                          )}
                          {option.id === answers[id] && option.id !== question.correctOptionId && (
                            <span className="ml-2 text-red-500 text-sm">(Your answer)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {correctIds.length > 0 && (
          <div className="space-y-4 mt-8">
            <h2 className="text-xl font-medium flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              Correct Answers
            </h2>
            <div className="space-y-4">
              {correctIds.map(id => {
                const question = questions.find(q => q.id === id);
                if (!question) return null;
                
                return (
                  <div key={id} className="border rounded-md p-4 bg-green-50">
                    <p className="font-medium">{question.text}</p>
                    <div className="mt-2">
                      {question.options.find(o => o.id === question.correctOptionId)?.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Practice Test</h1>
      
      {isTimedTest && (
        <PracticeTestTimer 
          totalSeconds={totalTimeInSeconds} 
          onTimeUp={handleTimerEnd} 
        />
      )}
      
      <PracticeTestProgress 
        currentQuestionIndex={currentIndex} 
        totalQuestions={questions.length} 
      />
      
      <StudyCard
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
        onNext={handleNext}
        hideCorrectAnswer={true}
        buttonText="Submit Answer"
      />
    </div>
  );
};

export default PracticeTestSession;
