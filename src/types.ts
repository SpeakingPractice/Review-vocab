export interface SituationPair {
  id: string;
  situation: string; // Tình huống / Ví dụ
  targetPhrase: string; // Từ/Cụm từ mục tiêu
  explanation?: string; // Giải thích ý nghĩa
}

export interface DialogueBlank {
  id: string;
  correctAnswer: string;
  options: string[]; // Các lựa chọn
  explanation?: string; // Giải thích ngữ cảnh
}

export interface DialogueItem {
  speaker: string;
  textWithBlanks: string; // e.g. "Hi, I would like to [blank_1] for tonight."
  blankIds: string[];
}

export interface LessonSet {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  isPreMade?: boolean;
  
  // Game 1 inputs
  situationPairs: SituationPair[];
  
  // Game 2 inputs
  rawDialogue: string; // User input dialogue
  rawAnswers: string[]; // User input target answers
  dialogueItems: DialogueItem[];
  dialogueBlanks: Record<string, DialogueBlank>;
}

export interface GameHistoryRecord {
  id: string;
  lessonId: string;
  lessonTitle: string;
  gameType: 'matching' | 'dialogue';
  score: number; // 0 - 100
  totalItems: number;
  correctCount: number;
  timeSpentSeconds: number;
  completedAt: string;
  details: {
    item: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}

export interface UserStats {
  totalGamesPlayed: number;
  matchingGamesPlayed: number;
  dialogueGamesPlayed: number;
  averageScore: number;
  currentStreakDays: number;
  lastPlayedDate: string | null;
  totalTimeSpentSeconds: number;
}
