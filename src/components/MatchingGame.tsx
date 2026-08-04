import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  HelpCircle, 
  Sparkles, 
  Trophy, 
  Volume2, 
  VolumeX, 
  ArrowRight,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';
import { LessonSet, SituationPair, GameHistoryRecord } from '../types';
import { sound } from '../utils/sound';
import { addGameHistory, shuffleArray } from '../utils/storage';

interface MatchingGameProps {
  lesson: LessonSet;
  onBackToLessons: () => void;
  onSwitchToDialogue: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Connection {
  situationId: string;
  phraseId: string;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  lesson,
  onBackToLessons,
  onSwitchToDialogue,
}) => {
  // State for shuffled situations and phrases
  const [situations, setSituations] = useState<SituationPair[]>([]);
  const [phrases, setPhrases] = useState<SituationPair[]>([]);
  
  // Selection & connection states
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // Game states
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // References for coordinate calculations
  const containerRef = useRef<HTMLDivElement>(null);
  const situationRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const phraseRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lineCoords, setLineCoords] = useState<Array<{
    situationId: string;
    phraseId: string;
    start: Point;
    end: Point;
    isCorrect?: boolean;
  }>>([]);

  // Initialize game deck
  useEffect(() => {
    resetGame();
  }, [lesson]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && !isSubmitted) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, isSubmitted]);

  const resetGame = () => {
    const sList = shuffleArray(lesson.situationPairs);
    const pList = shuffleArray(lesson.situationPairs);
    setSituations(sList);
    setPhrases(pList);
    setConnections([]);
    setSelectedSituationId(null);
    setIsSubmitted(false);
    setScore(0);
    setTimeSpent(0);
    setTimerActive(true);
    setShowExplanation(false);
  };

  // Recalculate line coordinates whenever connections change or on window resize
  const updateLineCoordinates = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const newCoords = connections.map(conn => {
      const sitEl = situationRefs.current[conn.situationId];
      const phrEl = phraseRefs.current[conn.phraseId];

      if (!sitEl || !phrEl) return null;

      const sitRect = sitEl.getBoundingClientRect();
      const phrRect = phrEl.getBoundingClientRect();

      // Right middle of situation card
      const start: Point = {
        x: sitRect.right - containerRect.left,
        y: sitRect.top + sitRect.height / 2 - containerRect.top
      };

      // Left middle of phrase card
      const end: Point = {
        x: phrRect.left - containerRect.left,
        y: phrRect.top + phrRect.height / 2 - containerRect.top
      };

      let isCorrect: boolean | undefined = undefined;
      if (isSubmitted) {
        // Check if situation targetPhrase matches phrase targetPhrase
        const sitObj = lesson.situationPairs.find(s => s.id === conn.situationId);
        const phrObj = lesson.situationPairs.find(p => p.id === conn.phraseId);
        isCorrect = sitObj?.targetPhrase === phrObj?.targetPhrase;
      }

      return {
        situationId: conn.situationId,
        phraseId: conn.phraseId,
        start,
        end,
        isCorrect
      };
    }).filter(Boolean) as typeof lineCoords;

    setLineCoords(newCoords);
  };

  useLayoutEffect(() => {
    updateLineCoordinates();
  }, [connections, situations, phrases, isSubmitted]);

  useEffect(() => {
    const handleResize = () => updateLineCoordinates();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [connections, isSubmitted]);

  // Click handling
  const handleSituationClick = (id: string) => {
    if (isSubmitted) return;
    sound.playClick();

    // If already connected, remove connection first
    setConnections(prev => prev.filter(c => c.situationId !== id));

    if (selectedSituationId === id) {
      setSelectedSituationId(null);
    } else {
      setSelectedSituationId(id);
    }
  };

  const handlePhraseClick = (phraseId: string) => {
    if (isSubmitted) return;
    sound.playClick();

    // If phrase is already connected to another situation, clear its connection
    setConnections(prev => prev.filter(c => c.phraseId !== phraseId));

    if (selectedSituationId) {
      // Create new connection
      setConnections(prev => [
        ...prev.filter(c => c.situationId !== selectedSituationId),
        { situationId: selectedSituationId, phraseId }
      ]);
      sound.playSnap();
      setSelectedSituationId(null);
    }
  };

  const handleDisconnect = (situationId: string) => {
    if (isSubmitted) return;
    sound.playClick();
    setConnections(prev => prev.filter(c => c.situationId !== situationId));
  };

  // Submit and verify score
  const handleSubmit = () => {
    if (connections.length === 0) return;
    setTimerActive(false);

    let correctCount = 0;
    const details = lesson.situationPairs.map(sp => {
      const conn = connections.find(c => c.situationId === sp.id);
      const chosenPhraseObj = lesson.situationPairs.find(p => p.id === conn?.phraseId);
      const isCorrect = chosenPhraseObj?.targetPhrase === sp.targetPhrase;

      if (isCorrect) correctCount++;

      return {
        item: sp.situation,
        userAnswer: chosenPhraseObj?.targetPhrase || 'Chưa nối',
        correctAnswer: sp.targetPhrase,
        isCorrect,
        explanation: sp.explanation
      };
    });

    const calculatedScore = Math.round((correctCount / lesson.situationPairs.length) * 100);
    setScore(calculatedScore);
    setIsSubmitted(true);
    setShowExplanation(true);

    if (calculatedScore >= 80) {
      sound.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (correctCount > 0) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    // Save to localStorage history
    const historyRecord: GameHistoryRecord = {
      id: `history-${Date.now()}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      gameType: 'matching',
      score: calculatedScore,
      totalItems: lesson.situationPairs.length,
      correctCount,
      timeSpentSeconds: timeSpent,
      completedAt: new Date().toISOString(),
      details
    };

    addGameHistory(historyRecord);
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {lesson.category}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatTime(timeSpent)}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Trò Chơi Nối Cột: {lesson.title}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Nối từng tình huống (Situations) bên trái với cụm từ mục tiêu (Target Phrases) thích hợp bên phải.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-toggle-sound"
              onClick={toggleSound}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-indigo-600" />}
            </button>

            <button
              id="btn-reset-game"
              onClick={resetGame}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>

            <button
              id="btn-switch-dialogue"
              onClick={onSwitchToDialogue}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors text-sm font-medium"
            >
              Chuyển sang Game Dialogue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Đã nối: <span className="font-bold text-indigo-600">{connections.length}</span> / {lesson.situationPairs.length} cặp
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-indigo-500"></span> Đang nối
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 ml-2"></span> Đã kiểm tra đúng
          </div>
        </div>
      </div>

      {/* Main Interactive Matching Playground */}
      <div 
        ref={containerRef}
        className="relative bg-slate-50/50 rounded-3xl p-4 sm:p-6 border border-slate-200/80 min-h-[480px]"
      >
        {/* SVG Overlay for Connecting Arrows */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
            <marker
              id="arrow-correct"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-wrong"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
          </defs>

          {lineCoords.map(line => {
            const dx = line.end.x - line.start.x;
            const controlPointX1 = line.start.x + dx * 0.4;
            const controlPointX2 = line.end.x - dx * 0.4;
            const pathD = `M ${line.start.x} ${line.start.y} C ${controlPointX1} ${line.start.y}, ${controlPointX2} ${line.end.y}, ${line.end.x} ${line.end.y}`;

            let strokeColor = '#6366f1'; // Indigo default
            let markerId = 'arrow-default';

            if (line.isCorrect === true) {
              strokeColor = '#10b981'; // Emerald green
              markerId = 'arrow-correct';
            } else if (line.isCorrect === false) {
              strokeColor = '#f43f5e'; // Rose red
              markerId = 'arrow-wrong';
            }

            return (
              <g key={`${line.situationId}-${line.phraseId}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  markerEnd={`url(#${markerId})`}
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </svg>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative z-20">
          {/* Left Column: Situations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">A</span>
                Tình huống (Situations)
              </h3>
              <span className="text-xs text-slate-500">Chọn 1 ô bên trái</span>
            </div>

            {situations.map((item, index) => {
              const isSelected = selectedSituationId === item.id;
              const conn = connections.find(c => c.situationId === item.id);
              const isConnected = !!conn;

              let statusBorder = 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm';
              if (isSelected) {
                statusBorder = 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/40 shadow-md';
              } else if (isConnected) {
                statusBorder = 'border-indigo-400 bg-indigo-50/20';
              }

              if (isSubmitted && conn) {
                const phrObj = lesson.situationPairs.find(p => p.id === conn.phraseId);
                const isCorrect = phrObj?.targetPhrase === item.targetPhrase;
                if (isCorrect) {
                  statusBorder = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-sm';
                } else {
                  statusBorder = 'border-rose-400 bg-rose-50/50 text-rose-950';
                }
              }

              return (
                <div key={item.id} className="relative group">
                  <button
                    ref={el => { situationRefs.current[item.id] = el; }}
                    onClick={() => handleSituationClick(item.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${statusBorder}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-800 leading-snug">
                        {item.situation}
                      </p>
                    </div>

                    {/* Status badge */}
                    {isConnected && !isSubmitted && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisconnect(item.id);
                        }}
                        className="text-xs text-indigo-600 hover:text-rose-600 font-semibold px-2 py-0.5 rounded bg-indigo-100/60 transition-colors shrink-0"
                        title="Bấm để hủy nối"
                      >
                        Hủy
                      </span>
                    )}

                    {isSubmitted && conn && (
                      <div className="shrink-0">
                        {lesson.situationPairs.find(p => p.id === conn.phraseId)?.targetPhrase === item.targetPhrase ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right Column: Target Phrases */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">B</span>
                Cụm từ mục tiêu (Target Phrases)
              </h3>
              <span className="text-xs text-slate-500">Nối sang ô bên phải</span>
            </div>

            {phrases.map((item, index) => {
              const conn = connections.find(c => c.phraseId === item.id);
              const isConnected = !!conn;

              let statusBorder = 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm';
              if (selectedSituationId) {
                statusBorder += ' border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/20';
              }

              if (isConnected) {
                statusBorder = 'border-indigo-400 bg-indigo-50/20';
              }

              if (isSubmitted && conn) {
                const sitObj = lesson.situationPairs.find(s => s.id === conn.situationId);
                const isCorrect = sitObj?.targetPhrase === item.targetPhrase;
                if (isCorrect) {
                  statusBorder = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 shadow-sm';
                } else {
                  statusBorder = 'border-rose-400 bg-rose-50/50 text-rose-950';
                }
              }

              return (
                <div key={item.id} className="relative">
                  <button
                    ref={el => { phraseRefs.current[item.id] = el; }}
                    onClick={() => handlePhraseClick(item.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${statusBorder}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-sm font-bold text-slate-800 leading-snug">
                        {item.targetPhrase}
                      </span>
                    </div>

                    {isSubmitted && conn && (
                      <div className="shrink-0">
                        {lesson.situationPairs.find(s => s.id === conn.situationId)?.targetPhrase === item.targetPhrase ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-500" />
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-center">
          {!isSubmitted ? (
            <button
              id="btn-submit-matching"
              onClick={handleSubmit}
              disabled={connections.length === 0}
              className={`px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center gap-2.5 transition-all ${
                connections.length > 0 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 hover:scale-[1.02] cursor-pointer' 
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Kiểm Tra Kết Quả ({connections.length}/{lesson.situationPairs.length})
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                id="btn-view-explanation"
                onClick={() => setShowExplanation(!showExplanation)}
                className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                {showExplanation ? 'Ẩn Giải Thích' : 'Xem Giải Thích Chi Tiết'}
              </button>

              <button
                id="btn-play-again"
                onClick={resetGame}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Chơi Lại Bài Này
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Score Summary & Explanation Popup / Section */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-6"
          >
            {/* Score Card Banner */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-4xl shrink-0">
                  {score >= 80 ? '🏆' : score >= 50 ? '🌟' : '💪'}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium">
                    <Award className="w-4 h-4" /> Hoàn thành bài học Nối Cột
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                    {score >= 80 ? 'Xuất Sắc! Bạn Đã Nhớ Rất Tốt' : score >= 50 ? 'Khá Tốt! Hãy Ôn Lại Lỗi Sai' : 'Hãy Cố Gắng Thêm Lần Nữa!'}
                  </h2>
                  <p className="text-indigo-200 text-sm mt-1">
                    Thời gian làm bài: <span className="font-semibold text-white">{formatTime(timeSpent)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-8 py-4 text-center">
                <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold block">Điểm số</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-300">{score}</span>
                <span className="text-xs text-indigo-200 block mt-1">/ 100 điểm</span>
              </div>
            </div>

            {/* Detailed Explanations Section */}
            {showExplanation && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Giải Thích Chi Tiết Ý Nghĩa & Đáp Án Nối Cột
                </h3>

                <div className="space-y-4">
                  {lesson.situationPairs.map((pair, idx) => {
                    const conn = connections.find(c => c.situationId === pair.id);
                    const chosenPhraseObj = lesson.situationPairs.find(p => p.id === conn?.phraseId);
                    const isCorrect = chosenPhraseObj?.targetPhrase === pair.targetPhrase;

                    return (
                      <div
                        key={pair.id}
                        className={`p-4 rounded-2xl border ${
                          isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 text-sm">
                              {pair.situation}
                            </span>
                          </div>

                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs sm:text-sm">
                          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                            <span className="text-xs text-slate-500 font-semibold block mb-0.5">Cụm từ chuẩn xác:</span>
                            <span className="font-bold text-indigo-900 font-mono text-base">{pair.targetPhrase}</span>
                          </div>

                          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                            <span className="text-xs text-slate-500 font-semibold block mb-0.5">Đáp án của bạn:</span>
                            <span className={`font-bold font-mono text-base ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {chosenPhraseObj?.targetPhrase || 'Chưa chọn'}
                            </span>
                          </div>
                        </div>

                        {pair.explanation && (
                          <div className="mt-3 text-xs text-slate-700 bg-white/60 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <p><strong className="font-semibold text-indigo-950">Giải thích:</strong> {pair.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
