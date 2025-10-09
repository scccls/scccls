
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useStudy } from "@/contexts/StudyContext";
import { Library, ArrowLeft, Play, Timer } from "lucide-react";

const QUESTION_COUNT_OPTIONS = [10, 20, 30, 40, 50];
const DEFAULT_QUESTION_COUNT = 40;

interface PracticeTestConfigProps {
  onCancel: () => void;
}

const PracticeTestConfig: React.FC<PracticeTestConfigProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const { state, getAllQuestionsForDeck, startStudySession } = useStudy();
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [timedTest, setTimedTest] = useState<boolean>(false);

  const handleStartTest = () => {
    if (!selectedDeckId) {
      toast({
        title: "Select a deck",
        description: "Please select a deck for your practice test.",
        variant: "destructive",
      });
      return;
    }

    const availableQuestions = getAllQuestionsForDeck(selectedDeckId);
    
    if (availableQuestions.length < questionCount) {
      toast({
        title: "Not enough questions",
        description: `The selected deck only has ${availableQuestions.length} questions. Please select a different deck or reduce the number of questions.`,
        variant: "destructive",
      });
      return;
    }

    // Navigate to the practice test session with a more consistent URL structure
    navigate(`/practice-test/session/${selectedDeckId}/${questionCount}${timedTest ? '/timed' : ''}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Library className="h-5 w-5 mr-2" />
          Configure Practice Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deck-select">Select a Deck</Label>
          <Select
            value={selectedDeckId}
            onValueChange={setSelectedDeckId}
          >
            <SelectTrigger id="deck-select">
              <SelectValue placeholder="Select a deck" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {state.decks
                .filter(deck => deck.availableForPracticeTest)
                .filter((deck, index, self) => 
                  index === self.findIndex(d => d.id === deck.id)
                )
                .map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-count">Number of Questions</Label>
          <Select
            value={questionCount.toString()}
            onValueChange={(value) => setQuestionCount(parseInt(value))}
          >
            <SelectTrigger id="question-count">
              <SelectValue placeholder="Select number of questions" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_COUNT_OPTIONS.map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count} questions
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="timed-test">Timed Test</Label>
            <p className="text-sm text-muted-foreground">
              {timedTest ? "1 minute per question" : "No time limit"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="timed-test"
              checked={timedTest}
              onCheckedChange={setTimedTest}
            />
            <Timer className={`h-4 w-4 ${timedTest ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleStartTest}>
          <Play className="h-4 w-4 mr-2" />
          Start Practice Test
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PracticeTestConfig;
