import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { getQuestionAttempts, calculateQuestionScore, QuestionAttempt } from "@/utils/questionScoring";
import { Question } from "@/types/StudyTypes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface DeckInsightsProps {
  questions: Question[];
}

interface InsightsData {
  averageScore: number;
  accuracyPercent: number;
  completionPercent: number;
  masteryPercent: number;
}

export const DeckInsights = ({ questions }: DeckInsightsProps) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadInsights = async () => {
    if (questions.length === 0) {
      setInsights({
        averageScore: 0,
        accuracyPercent: 0,
        completionPercent: 0,
        masteryPercent: 0,
      });
      return;
    }

    setIsLoading(true);

    const questionIds = questions.map((q) => q.id);
    const attemptsByQuestion = await getQuestionAttempts(questionIds);

    let totalScore = 0;
    let totalCorrect = 0;
    let totalAttempts = 0;
    let totalCompletion = 0;
    let masteryCount = 0;

    for (const question of questions) {
      const attempts = attemptsByQuestion.get(question.id) || [];
      const score = calculateQuestionScore(attempts);
      
      totalScore += score;
      
      // Count correct and total attempts
      const correctAttempts = attempts.filter((a) => a.is_correct).length;
      totalCorrect += correctAttempts;
      totalAttempts += attempts.length;
      
      // Completion: each question needs 3 attempts to be 100% complete
      const questionCompletion = Math.min(attempts.length / 3, 1) * 100;
      totalCompletion += questionCompletion;
      
      // Mastery: score of 1 (all last 3 attempts correct)
      if (score === 1) {
        masteryCount++;
      }
    }

    const averageScore = totalScore / questions.length;
    const accuracyPercent = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const completionPercent = totalCompletion / questions.length;
    const masteryPercent = (masteryCount / questions.length) * 100;

    setInsights({
      averageScore,
      accuracyPercent,
      completionPercent,
      masteryPercent,
    });
    setIsLoading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadInsights}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Insights
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deck Insights</DialogTitle>
          <DialogDescription>
            Track your progress and identify areas for improvement
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading insights...
          </div>
        ) : insights ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <CardDescription>Overall performance across all questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {(insights.averageScore * 100).toFixed(1)}%
                </div>
                <Progress value={insights.averageScore * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <CardDescription>Percentage of questions answered correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {insights.accuracyPercent.toFixed(1)}%
                </div>
                <Progress value={insights.accuracyPercent} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completion</CardTitle>
                <CardDescription>Progress toward answering all questions 3 times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {insights.completionPercent.toFixed(1)}%
                </div>
                <Progress value={insights.completionPercent} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Mastery</CardTitle>
                <CardDescription>Questions with perfect scores (last 3 correct)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {insights.masteryPercent.toFixed(1)}%
                </div>
                <Progress value={insights.masteryPercent} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Click to load insights
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
