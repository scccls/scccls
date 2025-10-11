import { Question } from "@/types/StudyTypes";
import { QuestionAttempt, calculateQuestionScore } from "./questionScoring";

export interface DeckMetrics {
  averageScore: number;
  accuracy: number;
  completion: number;
  mastery: number;
}

/**
 * Calculate comprehensive metrics for a deck based on question attempts
 */
export function calculateDeckMetrics(
  questions: Question[],
  attemptsByQuestion: Map<string, QuestionAttempt[]>
): DeckMetrics {
  if (questions.length === 0) {
    return {
      averageScore: 0,
      accuracy: 0,
      completion: 0,
      mastery: 0,
    };
  }

  let totalScore = 0;
  let totalAttempts = 0;
  let correctAttempts = 0;
  let totalAttemptsNeeded = questions.length * 3; // 3 attempts per question for 100% completion
  let actualAttempts = 0;
  let masteredQuestions = 0;

  for (const question of questions) {
    const attempts = attemptsByQuestion.get(question.id) || [];
    const score = calculateQuestionScore(attempts);
    totalScore += score;

    // Count actual attempts (up to 3 per question)
    const last3Attempts = attempts.slice(0, 3);
    actualAttempts += last3Attempts.length;

    // Count correct and total attempts for accuracy
    for (const attempt of attempts) {
      totalAttempts++;
      if (attempt.is_correct) {
        correctAttempts++;
      }
    }

    // Check if question is mastered (score = 1, meaning all 3 recent attempts correct)
    if (score === 1) {
      masteredQuestions++;
    }
  }

  const averageScore = totalScore / questions.length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const completion = (actualAttempts / totalAttemptsNeeded) * 100;
  const mastery = (masteredQuestions / questions.length) * 100;

  return {
    averageScore,
    accuracy,
    completion,
    mastery,
  };
}
