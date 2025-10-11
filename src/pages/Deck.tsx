
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import DeckCard from "@/components/DeckCard";
import QuestionCard from "@/components/QuestionCard";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FolderPlus, FileQuestion, ArrowLeft, FileUp, Play, TestTube } from "lucide-react";
import { Deck, Question } from "@/types/StudyTypes";
import { Separator } from "@/components/ui/separator";
import { getQuestionAttempts, calculateQuestionScore } from "@/utils/questionScoring";
import { DeckInsights } from "@/components/DeckInsights";
import { calculateDeckMetrics, DeckMetrics } from "@/utils/deckMetrics";

const DeckPage = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { 
    state, 
    getDeckById, 
    getSubdecks, 
    getQuestionsForDeck,
    getAllQuestionsForDeck,
    dispatch,
    exportDeck,
    getTotalQuestionsCount
  } = useStudy();
  
  const { deleteDeck, deleteQuestion, syncDeck } = useSupabaseSync(dispatch);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [questionAttempts, setQuestionAttempts] = useState<Map<string, any[]>>(new Map());
  const [subdeckSortBy, setSubdeckSortBy] = useState<string>("name");
  const [subdeckMetrics, setSubdeckMetrics] = useState<Map<string, DeckMetrics>>(new Map());
  
  const deck = deckId ? getDeckById(deckId) : null;
  const rawSubdecks = deckId ? getSubdecks(deckId) : [];
  const questions = deckId && deck ? getQuestionsForDeck(deckId) : [];
  const allQuestions = deckId && deck ? getAllQuestionsForDeck(deckId) : [];
  const totalQuestionsCount = deckId && deck ? getTotalQuestionsCount(deckId) : 0;

  // Load question scores
  useEffect(() => {
    if (!deck || questions.length === 0) {
      setQuestionScores({});
      setQuestionAttempts(new Map());
      return;
    }
    
    const loadScores = async () => {
      const ids = questions.map((q) => q.id);
      const attemptsByQuestion = await getQuestionAttempts(ids);
      const next: Record<string, number> = {};
      for (const q of questions) {
        const attempts = attemptsByQuestion.get(q.id) || [];
        next[q.id] = calculateQuestionScore(attempts);
      }
      setQuestionScores(next);
      setQuestionAttempts(attemptsByQuestion);
    };
    loadScores();
  }, [deck, questions]);

  // Calculate metrics for subdecks
  useEffect(() => {
    const calculateMetrics = async () => {
      const metrics = new Map<string, DeckMetrics>();
      
      for (const subdeck of rawSubdecks) {
        const allQuestions = getAllQuestionsForDeck(subdeck.id);
        const questionIds = allQuestions.map(q => q.id);
        const attemptsByQuestion = await getQuestionAttempts(questionIds);
        const deckMetric = calculateDeckMetrics(allQuestions, attemptsByQuestion);
        metrics.set(subdeck.id, deckMetric);
      }
      
      setSubdeckMetrics(metrics);
    };

    if (rawSubdecks.length > 0) {
      calculateMetrics();
    }
  }, [rawSubdecks.length]);

  // Sort subdecks based on selected criteria
  const subdecks = [...rawSubdecks].sort((a, b) => {
    const metricsA = subdeckMetrics.get(a.id);
    const metricsB = subdeckMetrics.get(b.id);

    switch (subdeckSortBy) {
      case "name":
        return a.title.localeCompare(b.title);
      case "score-low":
        return (metricsA?.averageScore || 0) - (metricsB?.averageScore || 0);
      case "accuracy-low":
        return (metricsA?.accuracy || 0) - (metricsB?.accuracy || 0);
      case "completion-low":
        return (metricsA?.completion || 0) - (metricsB?.completion || 0);
      case "mastery-low":
        return (metricsA?.mastery || 0) - (metricsB?.mastery || 0);
      default:
        return 0;
    }
  });
  
  if (!deckId) {
    return <div>Invalid deck ID</div>;
  }
  
  if (!deck) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
        <p className="text-muted-foreground mb-6">The deck you're looking for doesn't exist or has been deleted.</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Decks
          </Link>
        </Button>
      </div>
    );
  }

  const getBreadcrumbChain = (currentDeck: Deck): Deck[] => {
    const chain: Deck[] = [currentDeck];
    let parentId = currentDeck.parentId;
    
    while (parentId) {
      const parent = getDeckById(parentId);
      if (parent) {
        chain.unshift(parent);
        parentId = parent.parentId;
      } else {
        break;
      }
    }
    
    return chain;
  };
  
  const breadcrumbChain = getBreadcrumbChain(deck);

  const handleEditDeck = () => {
    navigate(`/deck/${deckId}/edit`);
  };

  const handleEditSubdeck = (deck: Deck) => {
    navigate(`/deck/${deck.id}/edit`);
  };

  const handleAddSubdeck = () => {
    navigate(`/deck/${deckId}/add-subdeck`);
  };

  const handleAddQuestion = () => {
    navigate(`/deck/${deckId}/add-question`);
  };

  const handleDeleteDeck = (deck: Deck, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setDeckToDelete(deck);
  };

  const confirmDeleteDeck = async () => {
    if (deckToDelete) {
      // Store the parent ID before deleting
      const parentId = deckToDelete.parentId;
      
      dispatch({ type: "DELETE_DECK", payload: deckToDelete.id });
      await deleteDeck(deckToDelete.id);
      
      // Navigate to parent deck or home if this was a top-level deck
      if (deckToDelete.id === deckId) {
        if (parentId) {
          navigate(`/deck/${parentId}`);
        } else {
          navigate("/");
        }
      }
      
      setDeckToDelete(null);
    }
  };

  const handleEditQuestion = (question: Question) => {
    navigate(`/question/${question.id}/edit`);
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
  };

  const confirmDeleteQuestion = async () => {
    if (questionToDelete) {
      dispatch({ type: "DELETE_QUESTION", payload: questionToDelete });
      await deleteQuestion(questionToDelete);
      setQuestionToDelete(null);
    }
  };

  const handleStudyDeck = () => {
    navigate(`/study/${deckId}`);
  };

  const handleExportDeck = () => {
    exportDeck(deckId);
  };

  const handleDeckDrop = async (droppedDeckId: string, targetDeckId: string) => {
    const droppedDeck = getDeckById(droppedDeckId);
    const targetDeck = getDeckById(targetDeckId);
    
    if (!droppedDeck || !targetDeck) return;
    
    // Don't allow a deck to become a subdeck of one of its own subdecks
    const isTargetSubdeckOfDropped = (checkDeckId: string, potentialParentId: string): boolean => {
      const deck = getDeckById(checkDeckId);
      if (!deck || !deck.parentId) return false;
      if (deck.parentId === potentialParentId) return true;
      return isTargetSubdeckOfDropped(deck.parentId, potentialParentId);
    };
    
    if (isTargetSubdeckOfDropped(targetDeckId, droppedDeckId)) {
      return;
    }
    
    const updatedDeck: Deck = {
      ...droppedDeck,
      parentId: targetDeckId,
      isSubdeck: true,
    };
    
    dispatch({ type: "UPDATE_DECK", payload: updatedDeck });
    await syncDeck(updatedDeck);
  };

  const hasQuestions = totalQuestionsCount > 0;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Decks</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {breadcrumbChain.map((d, index) => (
            <React.Fragment key={d.id}>
              {index < breadcrumbChain.length - 1 ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/deck/${d.id}`}>{d.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbItem>
                  <span>{d.title}</span>
                </BreadcrumbItem>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{deck.title}</h1>
          {deck.description && (
            <p className="text-muted-foreground mt-1">{deck.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEditDeck}
          >
            Edit Deck
          </Button>
          <DeckInsights questions={allQuestions} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportDeck}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Export
          </Button>
          {hasQuestions && (
            <Button 
              size="sm" 
              onClick={handleStudyDeck}
            >
              <Play className="mr-2 h-4 w-4" />
              Study
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleAddSubdeck} variant="outline">
          <FolderPlus className="mr-2 h-4 w-4" />
          Add Subdeck
        </Button>
        <Button onClick={handleAddQuestion}>
          <FileQuestion className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="subdecks">Subdecks ({subdecks.length})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {subdecks.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Subdecks</h2>
                <Select value={subdeckSortBy} onValueChange={setSubdeckSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="score-low">Score: Low to High</SelectItem>
                    <SelectItem value="accuracy-low">Accuracy: Low to High</SelectItem>
                    <SelectItem value="completion-low">Completion: Low to High</SelectItem>
                    <SelectItem value="mastery-low">Mastery: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subdecks.map((subdeck) => {
                  const metrics = subdeckMetrics.get(subdeck.id);
                  return (
                    <DeckCard
                      key={subdeck.id}
                      deck={subdeck}
                      onEdit={handleEditSubdeck}
                      onDelete={handleDeleteDeck}
                      onDrop={handleDeckDrop}
                      numQuestions={getQuestionsForDeck(subdeck.id).length}
                      numSubdecks={getSubdecks(subdeck.id).length}
                      averageScore={metrics?.averageScore}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Questions</h2>
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onEdit={handleEditQuestion}
                    onDelete={handleDeleteQuestion}
                    score={questionScores[question.id]}
                    attempts={questionAttempts.get(question.id) || []}
                  />
                ))}
              </div>
            </div>
          )}

          {subdecks.length === 0 && questions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                This deck is empty. Add subdecks or questions to get started.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="subdecks">
          {subdecks.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Select value={subdeckSortBy} onValueChange={setSubdeckSortBy}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="score-low">Score: Low to High</SelectItem>
                    <SelectItem value="accuracy-low">Accuracy: Low to High</SelectItem>
                    <SelectItem value="completion-low">Completion: Low to High</SelectItem>
                    <SelectItem value="mastery-low">Mastery: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {subdecks.map((subdeck) => {
                  const metrics = subdeckMetrics.get(subdeck.id);
                  return (
                    <DeckCard
                      key={subdeck.id}
                      deck={subdeck}
                      onEdit={handleEditSubdeck}
                      onDelete={handleDeleteDeck}
                      onDrop={handleDeckDrop}
                      numQuestions={getQuestionsForDeck(subdeck.id).length}
                      numSubdecks={getSubdecks(subdeck.id).length}
                      averageScore={metrics?.averageScore}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No subdecks yet.</p>
              <Button onClick={handleAddSubdeck} variant="outline" className="mt-4">
                <FolderPlus className="mr-2 h-4 w-4" />
                Add Your First Subdeck
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions">
          {questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                  score={questionScores[question.id]}
                  attempts={questionAttempts.get(question.id) || []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No questions yet.</p>
              <Button onClick={handleAddQuestion} className="mt-4">
                <FileQuestion className="mr-2 h-4 w-4" />
                Add Your First Question
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deckToDelete?.title}</strong>? 
              This will also delete all questions and subdecks within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeck} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeckPage;
