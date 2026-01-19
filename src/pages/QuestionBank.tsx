import React, { useState, useEffect } from "react";
import { useStudy } from "@/contexts/StudyContext";
import { Question } from "@/types/StudyTypes";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileQuestion, XCircle, RefreshCw } from "lucide-react";
import StudyCard from "@/components/StudyCard";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import StudyResults from "@/components/StudyResults";
import { recordQuestionAttempt } from "@/utils/questionScoring";
const QuestionBankPage = () => {
  const {
    state,
    getDeckById,
    answerQuestion,
    dispatch
  } = useStudy();
  const {
    removeFromQuestionBank
  } = useSupabaseSync(dispatch);
  const {
    questionBank
  } = state;
  const navigate = useNavigate();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [initialQuestionCount, setInitialQuestionCount] = useState(0);
  useEffect(() => {
    if (practiceMode && practiceQuestions.length === 0 && !showResults) {
      setPracticeQuestions([...questionBank]);
      setInitialQuestionCount(questionBank.length);
    }
  }, [practiceMode, questionBank]);
  const showEmptyQuestionBank = questionBank.length === 0 && !showResults;
  if (showEmptyQuestionBank) {
    return <div className="py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Question Bank</h1>
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>No Questions Yet</CardTitle>
            
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Start studying your decks and any questions you answer incorrectly will automatically
              be added to your question bank for further practice.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to My Decks
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  const questionsByDeck: Record<string, Question[]> = {};
  questionBank.forEach(question => {
    if (!questionsByDeck[question.deckId]) {
      questionsByDeck[question.deckId] = [];
    }
    questionsByDeck[question.deckId].push(question);
  });
  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
  };
  const handleAnswer = (questionId: string, selectedOptionId: string, responseTimeMs: number) => {
    answerQuestion(questionId, selectedOptionId);

    // Record the attempt for scoring with response time
    const question = questionBank.find(q => q.id === questionId);
    if (question) {
      const isCorrect = question.correctOptionId === selectedOptionId;
      recordQuestionAttempt(questionId, isCorrect, responseTimeMs);
    }
  };
  const handleCorrectAnswer = async (questionId: string) => {
    setCorrectAnswers(prev => [...prev, questionId]);
    dispatch({
      type: "REMOVE_FROM_QUESTION_BANK",
      payload: questionId
    });
    await removeFromQuestionBank(questionId);
  };
  const handleNext = () => {
    if (practiceMode) {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex >= practiceQuestions.length) {
        setShowResults(true);
      } else {
        setCurrentQuestionIndex(nextIndex);
      }
    } else {
      setSelectedQuestion(null);
    }
  };
  const startPracticeMode = () => {
    setPracticeQuestions([...questionBank]);
    setInitialQuestionCount(questionBank.length);
    setPracticeMode(true);
    setCurrentQuestionIndex(0);
    setCorrectAnswers([]);
    setShowResults(false);
  };
  const resetPractice = () => {
    if (questionBank.length === 0) {
      // If all questions were answered correctly and removed from bank
      setPracticeMode(false);
      setShowResults(false);
    } else {
      startPracticeMode();
    }
  };
  if (showResults && practiceMode) {
    const totalQuestions = initialQuestionCount;
    const mastered = correctAnswers.length;
    return <div className="py-12">
        <h1 className="text-3xl font-bold mb-4 text-center">Question Bank</h1>
        <StudyResults total={totalQuestions} correct={mastered} incorrect={totalQuestions - mastered} deckId="" onRestart={resetPractice} hideBackButton={true} />
      </div>;
  }
  const currentPracticeQuestion = practiceMode && practiceQuestions.length > currentQuestionIndex ? practiceQuestions[currentQuestionIndex] : null;
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Question Bank</h1>
        <p className="text-muted-foreground">
          {questionBank.length} {questionBank.length === 1 ? "question" : "questions"} in your bank
        </p>
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <Table>
              <TableCaption>Questions you have answered incorrectly</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Deck</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionBank.length > 0 ? questionBank.map(question => {
                const deck = getDeckById(question.deckId);
                return <TableRow key={question.id}>
                        <TableCell className="font-medium">{question.text}</TableCell>
                        <TableCell>{deck?.title || "Unknown Deck"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewQuestion(question)}>
                            Practice
                          </Button>
                        </TableCell>
                      </TableRow>;
              }) : <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      You've mastered all questions! Good job.
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="practice" className="mt-6">
          {practiceMode && currentPracticeQuestion ? <div className="max-w-3xl mx-auto">
              <StudyCard question={currentPracticeQuestion} onAnswer={handleAnswer} onNext={handleNext} onCorrectAnswer={handleCorrectAnswer} />
              <div className="text-center mt-4 text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {practiceQuestions.length}
              </div>
            </div> : questionBank.length === 0 && !showResults ? <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-2">All Questions Mastered!</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You've successfully mastered all questions in your bank. Great job!
              </p>
              <Button onClick={() => navigate('/')}>
                Return Home
              </Button>
            </div> : <div className="text-center py-12">
              <div className="inline-flex items-center justify-center bg-muted rounded-full p-4 mb-4">
                <FileQuestion className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Practice Your Question Bank</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Select any question from your bank to practice, or click the button below to start practicing all questions.
              </p>
              <Button onClick={startPracticeMode}>
                Start Practicing
              </Button>
            </div>}
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={!!selectedQuestion} onOpenChange={open => !open && setSelectedQuestion(null)}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Practice Question</AlertDialogTitle>
            <AlertDialogDescription>
              This question is from the deck: {selectedQuestion ? getDeckById(selectedQuestion.deckId)?.title : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedQuestion && <div className="py-4">
              <StudyCard question={selectedQuestion} onAnswer={handleAnswer} onNext={handleNext} onCorrectAnswer={handleCorrectAnswer} />
            </div>}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};
export default QuestionBankPage;