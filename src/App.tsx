import React, { useState, useEffect } from 'react';
import { LessonSet } from './types';
import { getStoredLessons } from './utils/storage';
import { Navbar, TabType } from './components/Navbar';
import { LessonList } from './components/LessonList';
import { MatchingGame } from './components/MatchingGame';
import { DialogueGame } from './components/DialogueGame';
import { LessonEditor } from './components/LessonEditor';
import { HistoryStats } from './components/HistoryStats';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('lessons');
  const [lessons, setLessons] = useState<LessonSet[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonSet | null>(null);

  // Load stored lessons on mount
  useEffect(() => {
    refreshLessons();
  }, []);

  const refreshLessons = () => {
    const list = getStoredLessons();
    setLessons(list);
    if (!selectedLesson && list.length > 0) {
      setSelectedLesson(list[0]);
    }
  };

  const handleSelectLesson = (lesson: LessonSet, mode: 'matching' | 'dialogue') => {
    setSelectedLesson(lesson);
    setActiveTab(mode);
  };

  const handleLessonSaved = (newLesson: LessonSet) => {
    refreshLessons();
    setSelectedLesson(newLesson);
    setActiveTab('matching');
  };

  const handlePlayAgainFromHistory = (lessonId: string, gameType: 'matching' | 'dialogue') => {
    const found = lessons.find(l => l.id === lessonId);
    if (found) {
      setSelectedLesson(found);
      setActiveTab(gameType);
    } else if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
      setActiveTab(gameType);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLessonTitle={selectedLesson?.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'lessons' && (
          <LessonList
            lessons={lessons}
            onSelectLesson={handleSelectLesson}
            onCreateNew={() => setActiveTab('create')}
            onRefreshLessons={refreshLessons}
          />
        )}

        {activeTab === 'matching' && selectedLesson && (
          <MatchingGame
            lesson={selectedLesson}
            onBackToLessons={() => setActiveTab('lessons')}
            onSwitchToDialogue={() => setActiveTab('dialogue')}
          />
        )}

        {activeTab === 'dialogue' && selectedLesson && (
          <DialogueGame
            lesson={selectedLesson}
            onBackToLessons={() => setActiveTab('lessons')}
            onSwitchToMatching={() => setActiveTab('matching')}
          />
        )}

        {activeTab === 'create' && (
          <LessonEditor
            onSaveSuccess={handleLessonSaved}
            onCancel={() => setActiveTab('lessons')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryStats
            onPlayLessonAgain={handlePlayAgainFromHistory}
          />
        )}
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500">
        <p>© VocabReview - Ứng dụng ôn tập từ vựng & giao tiếp tiếng Anh qua trò chơi tương tác.</p>
      </footer>
    </div>
  );
}
