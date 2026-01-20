import { supabase } from "@/integrations/supabase/client";

export type QuestionAttempt = {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  created_at: string;
  response_time_ms: number | null;
};

/**
 * Calculate question score based on last 3 attempts
 * - Correct answer: 1/3 (0.333...)
 * - Incorrect answer: 0
 * - Not attempted: 1/10 (0.1) per unattempted slot
 */
export function calculateQuestionScore(attempts: QuestionAttempt[]): number {
  // Get last 3 attempts, sorted by most recent first
  const last3Attempts = attempts.slice(0, 3);
  
  let score = 0;
  
  // Calculate score from actual attempts
  for (const attempt of last3Attempts) {
    if (attempt.is_correct) {
      score += 1/3;
    }
    // Incorrect attempts add 0, so we don't need to do anything
  }
  
  // Add score for unattempted slots
  const unattemptedSlots = 3 - last3Attempts.length;
  score += unattemptedSlots * (1/10);
  
  return score;
}

/**
 * Update daily activity for streak tracking using atomic database function
 */
async function updateDailyActivity(userId: string, isCorrect: boolean): Promise<void> {
  const { error } = await supabase.rpc('increment_daily_activity', {
    p_user_id: userId,
    p_is_correct: isCorrect,
  });

  if (error) {
    console.error("Error updating daily activity:", error);
  }
}

/**
 * Record a question attempt in the database
 */
export async function recordQuestionAttempt(
  questionId: string,
  isCorrect: boolean,
  responseTimeMs?: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No user found when recording attempt");
    return;
  }

  const { error } = await supabase
    .from("question_attempts")
    .insert({
      user_id: user.id,
      question_id: questionId,
      is_correct: isCorrect,
      response_time_ms: responseTimeMs ?? null,
    });

  if (error) {
    console.error("Error recording question attempt:", error);
  }

  // Update daily activity for streak tracking
  await updateDailyActivity(user.id, isCorrect);
}

/**
 * Record a completed test session
 */
export async function recordTestSession(
  deckId: string,
  totalQuestions: number,
  correctAnswers: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error("No user found when recording test session");
    return;
  }

  const { error } = await supabase
    .from("test_sessions")
    .insert({
      user_id: user.id,
      deck_id: deckId,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
    });

  if (error) {
    console.error("Error recording test session:", error);
  }
}

/**
 * Get attempts for multiple questions
 */
export async function getQuestionAttempts(
  questionIds: string[]
): Promise<Map<string, QuestionAttempt[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || questionIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("question_attempts")
    .select("*")
    .eq("user_id", user.id)
    .in("question_id", questionIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching question attempts:", error);
    return new Map();
  }

  // Group attempts by question_id
  const attemptsByQuestion = new Map<string, QuestionAttempt[]>();
  
  for (const attempt of data || []) {
    const questionAttempts = attemptsByQuestion.get(attempt.question_id) || [];
    questionAttempts.push(attempt);
    attemptsByQuestion.set(attempt.question_id, questionAttempts);
  }

  return attemptsByQuestion;
}

/**
 * Sort questions by score (lowest first) for spaced repetition
 */
export function sortQuestionsByScore(
  questions: any[],
  attemptsByQuestion: Map<string, QuestionAttempt[]>
): any[] {
  return [...questions].sort((a, b) => {
    const attemptsA = attemptsByQuestion.get(a.id) || [];
    const attemptsB = attemptsByQuestion.get(b.id) || [];
    
    const scoreA = calculateQuestionScore(attemptsA);
    const scoreB = calculateQuestionScore(attemptsB);
    
    // Sort by lowest score first (questions you need most practice with)
    if (scoreA !== scoreB) {
      return scoreA - scoreB;
    }
    
    // If scores are equal, randomize order
    return Math.random() - 0.5;
  });
}
