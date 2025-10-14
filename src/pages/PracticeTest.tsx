
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookCheck, Play, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/contexts/StudyContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PracticeTestConfig from "@/components/PracticeTestConfig";
import { TextImportDialog } from "@/components/TextImportDialog";

const PracticeTestPage = () => {
  const navigate = useNavigate();
  const { state } = useStudy();
  const [showConfig, setShowConfig] = useState(false);

  const startPracticeTest = () => {
    setShowConfig(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground mt-1">
            Practice tests and past papers to assess your knowledge
          </p>
        </div>
      </div>

      <Tabs defaultValue="practice-tests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="practice-tests">Practice Tests</TabsTrigger>
          <TabsTrigger value="past-papers">Past Papers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="practice-tests" className="space-y-6 mt-6">
          {!showConfig ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookCheck className="h-5 w-5 mr-2" />
                  Practice Test
                </CardTitle>
                <CardDescription>
                  Take a randomized practice test from your existing decks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>
                    Practice tests help you assess your knowledge by testing you on random
                    questions from selected decks. You'll receive a score at the end of the test,
                    and any questions you answer incorrectly will be added to your Question Bank for further review.
                  </p>
                  
                  {state.decks.length === 0 ? (
                    <Alert>
                      <AlertTitle>No decks available</AlertTitle>
                      <AlertDescription>
                        Create at least one deck with questions before attempting a practice test.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Button onClick={startPracticeTest} className="w-full sm:w-auto">
                      <Play className="h-4 w-4 mr-2" />
                      Attempt Practice Test
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <PracticeTestConfig onCancel={() => setShowConfig(false)} />
          )}
        </TabsContent>

        <TabsContent value="past-papers" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Past Papers
              </CardTitle>
              <CardDescription>
                Upload and take past exam papers with consistent question order
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  Past papers are exam-style tests that maintain the same questions in the same order every time.
                  Import past papers using the text import feature - the deck name will become your paper name.
                </p>
                
                <div className="flex gap-2">
                  <TextImportDialog isPastPaper={true} />
                </div>
                
                {state.decks.filter(d => !d.parentId && d.isPastPaper).length === 0 ? (
                  <Alert>
                    <AlertTitle>No past papers available</AlertTitle>
                    <AlertDescription>
                      Import a past paper using the text import feature to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-medium">Available Past Papers</h3>
                    <div className="grid gap-4">
                      {state.decks
                        .filter(d => !d.parentId && d.isPastPaper)
                        .map(paper => {
                          const questionCount = state.questions.filter(q => q.deckId === paper.id).length;
                          return (
                            <Card key={paper.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{paper.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {questionCount} question{questionCount !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => navigate(`/practice-test/session/${paper.id}/${questionCount}/pastPaper`)}
                                  disabled={questionCount === 0}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Paper
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PracticeTestPage;
