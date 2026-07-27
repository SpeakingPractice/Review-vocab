import { GameHistoryRecord, LessonSet, UserStats, DialogueBlank } from '../types';
import { SAMPLE_LESSONS } from '../data/sampleLessons';
import { saveLessonToCloud, deleteLessonFromCloud, subscribeToLessons, mergeLessonsWithSamples } from './firebase';

const LESSONS_KEY = 'vocab_review_lessons_v1';
const HISTORY_KEY = 'vocab_review_history_v1';

// Load lessons (custom + default sample sets)
export function getStoredLessons(): LessonSet[] {
  try {
    const data = localStorage.getItem(LESSONS_KEY);
    if (!data) {
      localStorage.setItem(LESSONS_KEY, JSON.stringify(SAMPLE_LESSONS));
      return SAMPLE_LESSONS;
    }
    const parsed: LessonSet[] = JSON.parse(data);
    return mergeLessonsWithSamples(parsed);
  } catch {
    return SAMPLE_LESSONS;
  }
}

export function saveLessonSet(lesson: LessonSet): void {
  saveLessonToCloud(lesson);
}

export function deleteLessonSet(id: string): void {
  deleteLessonFromCloud(id);
}

export { subscribeToLessons };


// History Records
export function getStoredHistory(): GameHistoryRecord[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addGameHistory(record: GameHistoryRecord): UserStats {
  const history = getStoredHistory();
  history.unshift(record);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return computeUserStats(history);
}

export function computeUserStats(historyList?: GameHistoryRecord[]): UserStats {
  const history = historyList || getStoredHistory();
  if (history.length === 0) {
    return {
      totalGamesPlayed: 0,
      matchingGamesPlayed: 0,
      dialogueGamesPlayed: 0,
      averageScore: 0,
      currentStreakDays: 0,
      lastPlayedDate: null,
      totalTimeSpentSeconds: 0
    };
  }

  const matchingCount = history.filter(h => h.gameType === 'matching').length;
  const dialogueCount = history.filter(h => h.gameType === 'dialogue').length;
  const totalScore = history.reduce((sum, h) => sum + h.score, 0);
  const avgScore = Math.round(totalScore / history.length);
  const totalTime = history.reduce((sum, h) => sum + h.timeSpentSeconds, 0);

  // Calculate streak based on unique days
  const playedDates = Array.from(new Set(
    history.map(h => new Date(h.completedAt).toISOString().split('T')[0])
  )).sort().reverse();

  let streak = 0;
  if (playedDates.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (playedDates[0] === today || playedDates[0] === yesterday) {
      streak = 1;
      let curr = new Date(playedDates[0]);
      for (let i = 1; i < playedDates.length; i++) {
        const prev = new Date(playedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          streak++;
          curr = prev;
        } else {
          break;
        }
      }
    }
  }

  return {
    totalGamesPlayed: history.length,
    matchingGamesPlayed: matchingCount,
    dialogueGamesPlayed: dialogueCount,
    averageScore: avgScore,
    currentStreakDays: streak,
    lastPlayedDate: history[0]?.completedAt || null,
    totalTimeSpentSeconds: totalTime
  };
}

// Parsing Utilities for inputs
export function parseRawInputsToLesson(
  title: string,
  category: string,
  description: string,
  situationsText: string,
  phrasesText: string,
  dialogueText: string,
  answersText: string
): LessonSet {
  // Parse situations and phrases line by line
  const sitLines = situationsText.split('\n').map(l => l.trim()).filter(Boolean);
  const phraseLines = phrasesText.split('\n').map(l => l.trim()).filter(Boolean);

  const situationPairs = sitLines.map((sit, idx) => {
    const phrase = phraseLines[idx] || `Target Phrase ${idx + 1}`;
    return {
      id: `sp-${Date.now()}-${idx}`,
      situation: sit,
      targetPhrase: phrase,
      explanation: `Tình huống: "${sit}" tương ứng với cụm từ mục tiêu "${phrase}".`
    };
  });

  // Parse raw answers strictly by line (newline separated) and deduplicate answers
  const seenAnswers = new Set<string>();
  const rawAnswers: string[] = [];
  answersText
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !seenAnswers.has(trimmed.toLowerCase())) {
        seenAnswers.add(trimmed.toLowerCase());
        rawAnswers.push(trimmed);
      }
    });

  // Parse dialogue lines and extract [blank] placeholders
  const dialogueRawLines = dialogueText.split('\n').filter(l => l.trim().length > 0);
  
  const dialogueItems = [];
  const dialogueBlanks: Record<string, DialogueBlank> = {};
  let blankCounter = 1;

  for (const line of dialogueRawLines) {
    let speaker = 'Character';
    let content = line;
    if (line.includes(':')) {
      const parts = line.split(':');
      speaker = parts[0].trim();
      content = parts.slice(1).join(':').trim();
    }

    // Auto convert bracketed answers like [word] or ___ to [blank_N]
    // If the content explicitly contains brackets with words e.g. "I want to [check in]", we extract "check in" as correct answer!
    const blankIdsInLine: string[] = [];
    const regex = /\[(.*?)\]/g;
    let match;
    let processedContent = content;

    while ((match = regex.exec(content)) !== null) {
      const matchedText = match[1].trim(); // answer inside brackets or e.g. "blank_1"
      const blankKey = `blank_${blankCounter}`;
      blankCounter++;

      // If matchedText is a target word or phrase
      let correctAnswer = matchedText;
      if (matchedText.startsWith('blank_') || matchedText === '' || matchedText === '___') {
        correctAnswer = rawAnswers[blankCounter - 2] || 'answer';
      }

      // Build options purely from user input (rawAnswers or correctAnswer) without adding dummy options or duplicates
      const optionsSeen = new Set<string>();
      const blankOptions: string[] = [];
      [correctAnswer, ...rawAnswers].forEach(opt => {
        const trimmed = opt.trim();
        if (trimmed && !optionsSeen.has(trimmed.toLowerCase())) {
          optionsSeen.add(trimmed.toLowerCase());
          blankOptions.push(trimmed);
        }
      });

      dialogueBlanks[blankKey] = {
        id: blankKey,
        correctAnswer: correctAnswer,
        options: shuffleArray(blankOptions),
        explanation: `Từ/Cụm từ đúng trong ngữ cảnh này là "${correctAnswer}".`
      };

      processedContent = processedContent.replace(match[0], `[${blankKey}]`);
      blankIdsInLine.push(blankKey);
    }

    dialogueItems.push({
      speaker,
      textWithBlanks: processedContent,
      blankIds: blankIdsInLine
    });
  }

  return {
    id: `custom-${Date.now()}`,
    title: title || 'Bộ bài học mới',
    category: category || 'Tự soạn',
    description: description || 'Bộ từ vựng và đoạn hội thoại tự nhập.',
    createdAt: new Date().toISOString(),
    isPreMade: false,
    situationPairs,
    rawDialogue: dialogueText,
    rawAnswers,
    dialogueItems,
    dialogueBlanks
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
