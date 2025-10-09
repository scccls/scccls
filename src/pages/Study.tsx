import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import StudyCard from "@/components/StudyCard";
import StudyProgress from "@/components/StudyProgress";
import StudyResults from "@/components/StudyResults";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { recordQuestionAttempt } from "@/utils/questionScoring";
import { Question } from "@/types/StudyTypes";

const StudyPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { 
    state, 
    getDeckById, 
    startStudySession, 
    answerQuestion, 
    endStudySession,
    getStudyStats
  } = useStudy();
  
  const [showResults, setShowResults] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const deck = deckId ? getDeckById(deckId) : null;
  const session = state.currentSession;
  
  useEffect(() => {
    if (deckId) {
      startStudySession(deckId);
    }
    return () => {
      endStudySession();
    };
  }, [deckId]);
  
  useEffect(() => {
    if (session) {
      setCurrentQuestionIndex(session.currentQuestionIndex);
      
      if (session.currentQuestionIndex >= session.questions.length) {
        setShowResults(true);
      }
    }
  }, [session?.currentQuestionIndex]);
  
  if (!deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
        <p className="text-muted-foreground mb-6">
          The deck you're trying to study doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link to="/">Back to All Decks</Link>
        </Button>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Loading study session...</h2>
      </div>
    );
  }
  
  const handleAnswer = (questionId: string, selectedOptionId: string) => {
    answerQuestion(questionId, selectedOptionId);
    
    // Record the attempt for scoring
    const question = session.questions.find(q => q.id === questionId);
    if (question) {
      const isCorrect = question.correctOptionId === selectedOptionId;
      recordQuestionAttempt(questionId, isCorrect);
    }
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= session.questions.length) {
      setShowResults(true);
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  };
  
  const handleRestartSession = () => {
    if (deckId) {
      endStudySession();
      startStudySession(deckId);
      setShowResults(false);
      setCurrentQuestionIndex(0);
    }
  };
  
  const handleQuit = () => {
    setShowQuitConfirm(true);
  };
  
  const confirmQuit = () => {
    setShowResults(true);
    setShowQuitConfirm(false);
  };
  
  const { total, correct, incorrect } = getStudyStats();
  
  const currentQuestion = !showResults && currentQuestionIndex < session.questions.length
    ? session.questions[currentQuestionIndex]
    : null;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={handleQuit}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit
        </Button>
        <h1 className="text-xl font-bold">{deck.title}</h1>
        <div className="w-24"></div> {/* Spacer for balance */}
      </div>
      
      {!showResults ? (
        <>
          <StudyProgress 
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={session.questions.length}
            incorrectCount={incorrect}
          />
          
          {currentQuestion && (
            <StudyCard 
              key={currentQuestion.id}
              question={currentQuestion} 
              onAnswer={handleAnswer}
              onNext={handleNextQuestion}
            />
          )}
        </>
      ) : (
        <StudyResults
          total={total}
          correct={correct}
          incorrect={incorrect}
          deckId={deckId}
          onRestart={handleRestartSession}
        />
      )}
      
      <AlertDialog open={showQuitConfirm} onOpenChange={setShowQuitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quit Study Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress in this session will be saved and you'll see your current results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Studying</AlertDialogCancel>
            <AlertDialogAction onClick={confirmQuit}>
              Review Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudyPage;
