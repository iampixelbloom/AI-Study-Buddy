export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface SavedSet {
  id: string;
  title: string;
  type: "flashcards" | "quiz";
  items: Flashcard[] | QuizQuestion[];
  dateCreated: string;
}

export interface StudyStats {
  sessionsCount: number;
  questionsAnswered: number;
  correctAnswersCount: number;
  streak: number;
  lastStudyDate?: string;
  unlockedBadges: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlockedAt?: string;
}

export interface SummaryData {
  title: string;
  overview: string;
  keyConcepts: {
    conceptName: string;
    description: string;
    bullets: string[];
  }[];
  aiInsight: string;
}
