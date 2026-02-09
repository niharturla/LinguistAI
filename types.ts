
export interface GrammarPoint {
  rule: string;
  explanation: string;
  example: string;
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  usage: string;
}

export interface TranslationResult {
  translatedText: string;
  transliteration?: string;
  grammarPoints: GrammarPoint[];
  nativeTips: string;
  vocabulary: VocabularyItem[];
  culturalNote?: string;
}

export interface QuizQuestion {
  question: string;
  questionTransliteration: string; // Romanized version (English letters)
  options: string[];
  optionsTransliteration: string[]; // Romanized version (English letters)
  correctAnswerIndex: number;
  explanation: string;
}

export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizSet {
  topic: string;
  language: string;
  difficulty: QuizDifficulty;
  questions: QuizQuestion[];
}

export interface SpeechEvaluation {
  score: number;
  accuracyFeedback: string;
  pronunciationTips: string;
  naturalness: string;
}

export interface SpeechChallenge {
  phraseToSpeak: string;
  translation: string;
  targetLanguage: string;
}

export type AppMode = 'translate' | 'quiz' | 'speech';

export interface HistoryItem {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  result: TranslationResult;
}
