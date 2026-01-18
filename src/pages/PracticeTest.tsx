import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookCheck, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/contexts/StudyContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PracticeTestConfig from "@/components/PracticeTestConfig";
const PracticeTestPage = () => {
  const navigate = useNavigate();
  const {
    state
  } = useStudy();
  const [showConfig, setShowConfig] = useState(false);
  const startPracticeTest = () => {
    setShowConfig(true);
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Practice Test</h1>
          
        </div>
      </div>

      {!showConfig ? <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookCheck className="h-5 w-5 mr-2" />
              Practice Test
            </CardTitle>
            
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Practice tests help you assess your knowledge by testing you on random
                questions from selected decks. You'll receive a score at the end of the test,
                and any questions you answer incorrectly will be added to your Question Bank for further review.
              </p>
              
              {state.decks.length === 0 ? <Alert>
                  <AlertTitle>No decks available</AlertTitle>
                  <AlertDescription>
                    Create at least one deck with questions before attempting a practice test.
                  </AlertDescription>
                </Alert> : <Button onClick={startPracticeTest} className="w-full sm:w-auto">
                  <Play className="h-4 w-4 mr-2" />
                  Attempt Practice Test
                </Button>}
            </div>
          </CardContent>
        </Card> : <PracticeTestConfig onCancel={() => setShowConfig(false)} />}
    </div>;
};
export default PracticeTestPage;