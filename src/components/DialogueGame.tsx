import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  Award, 
  Volume2, 
  VolumeX, 
  Clock, 
  HelpCircle,
  Wand2,
  ArrowLeft,
  MessageSquare,
  ListFilter,
  X,
  Pencil
} from 'lucide-react';
import { LessonSet, GameHistoryRecord } from '../types';
import { sound } from '../utils/sound';
import { addGameHistory, shuffleArray } from '../utils/storage';

interface DialogueGameProps {
  lesson: LessonSet;
  onBackToLessons: () => void;
  onSwitchToMatching: () => void;
}

export const DialogueGame: React.FC<DialogueGameProps> = ({
  lesson,
  onBackToLessons,
  onSwitchToMatching
}) => {
  // Game state: blankId -> user chosen string
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeBlankModal, setActiveBlankModal] = useState<string | null>(null);
  
  // Available option pool (shuffled)
  const [optionPool, setOptionPool] = useState<string[]>([]);
  
  // Game controls
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Initialize dialogue game data
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
    setUserAnswers({});
    setSelectedOption(null);
    setActiveBlankModal(null);
    setIsSubmitted(false);
    setScore(0);
    setTimeSpent(0);
    setTimerActive(true);
    setShowExplanation(false);

    // Collect options strictly based on user input (rawAnswers or blanks)
    const blanksList = Object.values(lesson.dialogueBlanks) as Array<{ correctAnswer: string }>;
    const allCorrectAnswers = blanksList.map((b) => b.correctAnswer);
    const rawAnswersList = lesson.rawAnswers || [];

    let pool: string[];
    if (rawAnswersList.length > 0) {
      // Use exact list provided in rawAnswers. If any blank answer was omitted from rawAnswers, append it to avoid broken blanks.
      const missingCorrect = allCorrectAnswers.filter(
        ans => !rawAnswersList.some(r => r.trim().toLowerCase() === ans.trim().toLowerCase())
      );
      pool = [...rawAnswersList, ...missingCorrect];
    } else {
      pool = allCorrectAnswers;
    }

    setOptionPool(shuffleArray(pool));
  };

  // Remaining unused options
  const usedOptionValues = Object.values(userAnswers);
  const availableOptions = optionPool.filter(opt => {
    // Allow using an option as many times as its count in the pool if duplicates exist
    const usedCount = usedOptionValues.filter(val => val === opt).length;
    const poolCount = optionPool.filter(val => val === opt).length;
    return usedCount < poolCount;
  });

  // Handle Drag and Drop
  const handleDragStart = (e: React.DragEvent, option: string) => {
    if (isSubmitted) return;
    e.dataTransfer.setData('text/plain', option);
    sound.playClick();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, blankId: string) => {
    e.preventDefault();
    if (isSubmitted) return;
    const option = e.dataTransfer.getData('text/plain');
    if (!option) return;

    setUserAnswers(prev => ({
      ...prev,
      [blankId]: option
    }));
    sound.playSnap();
    setSelectedOption(null);
  };

  // Click-to-Place fallback for touch/mobile
  const handleOptionClick = (option: string) => {
    if (isSubmitted) return;
    sound.playClick();
    if (selectedOption === option) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option);
    }
  };

  const handleBlankSlotClick = (blankId: string) => {
    if (isSubmitted) return;
    sound.playClick();
    if (selectedOption) {
      setUserAnswers(prev => ({
        ...prev,
        [blankId]: selectedOption
      }));
      sound.playSnap();
      setSelectedOption(null);
    } else {
      setActiveBlankModal(blankId);
    }
  };

  // Auto fill blanks for quick review / automatic completion
  const handleAutoFill = () => {
    if (isSubmitted) return;
    sound.playClick();
    const autoFilled: Record<string, string> = {};
    Object.keys(lesson.dialogueBlanks).forEach(blankId => {
      autoFilled[blankId] = lesson.dialogueBlanks[blankId].correctAnswer;
    });
    setUserAnswers(autoFilled);
  };

  // Submit and verify
  const handleSubmit = () => {
    const blankKeys = Object.keys(lesson.dialogueBlanks);
    if (blankKeys.length === 0) return;

    setTimerActive(false);

    let correctCount = 0;
    const details = blankKeys.map(blankId => {
      const blankObj = lesson.dialogueBlanks[blankId];
      const userVal = userAnswers[blankId] || 'Bỏ trống';
      const isCorrect = userVal.toLowerCase().trim() === blankObj.correctAnswer.toLowerCase().trim();

      if (isCorrect) correctCount++;

      return {
        item: `Ô trống (${blankId})`,
        userAnswer: userVal,
        correctAnswer: blankObj.correctAnswer,
        isCorrect,
        explanation: blankObj.explanation
      };
    });

    const calculatedScore = Math.round((correctCount / blankKeys.length) * 100);
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

    // Save game history
    const historyRecord: GameHistoryRecord = {
      id: `history-${Date.now()}`,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      gameType: 'dialogue',
      score: calculatedScore,
      totalItems: blankKeys.length,
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

  const totalBlanks = Object.keys(lesson.dialogueBlanks).length;
  const filledCount = Object.keys(userAnswers).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {lesson.category}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {formatTime(timeSpent)}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              Kéo Thả Dialogue: {lesson.title}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Kéo hoặc chọn các đáp án bên dưới vào ô trống phù hợp trong ngữ cảnh đoạn hội thoại.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-dialogue-mute"
              onClick={toggleSound}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-500" /> : <Volume2 className="w-5 h-5 text-indigo-600" />}
            </button>

            {!isSubmitted && (
              <button
                id="btn-auto-fill-dialogue"
                onClick={handleAutoFill}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors text-xs font-semibold"
                title="Tự động điền hoàn thành đoạn hội thoại"
              >
                <Wand2 className="w-3.5 h-3.5" /> Hoàn thành tự động
              </button>
            )}

            <button
              id="btn-dialogue-reset"
              onClick={resetGame}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Làm lại
            </button>

            <button
              id="btn-switch-matching"
              onClick={onSwitchToMatching}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Game Nối Cột
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            Đã điền: <span className="font-bold text-emerald-600">{filledCount}</span> / {totalBlanks} ô trống
          </div>
          <div className="text-slate-500 font-medium flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
            Mẹo: Bấm trực tiếp vào ô trống để bật Pop-up chọn đáp án đánh số thứ tự
          </div>
        </div>
      </div>

      {/* Main Dialogue Chat Layout */}
      <div className="bg-slate-50/70 rounded-3xl p-4 sm:p-8 border border-slate-200/80 mb-6 space-y-4 shadow-inner">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-800 text-base">Kịch Bản Đoạn Hội Thoại (Dialogue Script)</h2>
        </div>

        {lesson.dialogueItems.map((item, idx) => {
          // Parse textWithBlanks to render interactive blank components
          const parts = item.textWithBlanks.split(/(\[blank_\d+\])/g);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start gap-3"
            >
              <div className="shrink-0 font-bold text-xs uppercase tracking-wider px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 min-w-[100px] text-center">
                {item.speaker}
              </div>

              <div className="text-slate-800 text-base leading-relaxed flex-1 flex-wrap items-center gap-1.5 font-sans">
                {parts.map((part, pIdx) => {
                  const match = part.match(/\[(blank_\d+)\]/);
                  if (!match) {
                    return <span key={pIdx}>{part}</span>;
                  }

                  const blankId = match[1];
                  const blankObj = lesson.dialogueBlanks[blankId];
                  const userVal = userAnswers[blankId];

                  let slotStyles = 'border-dashed border-2 border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:border-indigo-500 hover:bg-indigo-100/50';

                  if (userVal) {
                    slotStyles = 'border-solid border-2 border-indigo-500 bg-indigo-600 text-white font-semibold shadow-sm';
                  }

                  if (isSubmitted) {
                    const isCorrect = userVal?.toLowerCase().trim() === blankObj?.correctAnswer.toLowerCase().trim();
                    if (isCorrect) {
                      slotStyles = 'border-solid border-2 border-emerald-500 bg-emerald-600 text-white font-semibold';
                    } else {
                      slotStyles = 'border-solid border-2 border-rose-500 bg-rose-600 text-white font-semibold';
                    }
                  }

                  return (
                    <span
                      key={pIdx}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, blankId)}
                      onClick={() => handleBlankSlotClick(blankId)}
                      className={`inline-flex items-center justify-center mx-1.5 px-3.5 py-1 rounded-xl text-xs sm:text-sm transition-all duration-150 cursor-pointer min-w-[120px] min-h-[36px] ${slotStyles}`}
                    >
                      {userVal ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                          {userVal}
                          {isSubmitted ? (
                            userVal?.toLowerCase().trim() === blankObj?.correctAnswer.toLowerCase().trim() ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-200 shrink-0" />
                            )
                          ) : (
                            <Pencil className="w-3.5 h-3.5 text-indigo-200 hover:text-white shrink-0 ml-0.5" />
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-indigo-500 font-medium italic flex items-center gap-1">
                          <ListFilter className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Bấm chọn đáp án
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>



      {/* Pop-Up Modal for Selecting Option */}
      <AnimatePresence>
        {activeBlankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                    <ListFilter className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">
                      Chọn Đáp Án Cho Ô Trống
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lướt lên/xuống để xem danh sách đáp án đánh số thứ tự
                    </p>
                  </div>
                </div>
                <button
                  id="btn-close-blank-modal"
                  onClick={() => setActiveBlankModal(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Scrollable list of numbered options */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[380px] custom-scrollbar">
                {optionPool.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6">
                    Không có đáp án nào trong danh sách.
                  </p>
                ) : (
                  optionPool.map((optText, idx) => {
                    const isSelectedInThisBlank = userAnswers[activeBlankModal] === optText;
                    const isUsedInOtherBlank = Object.entries(userAnswers).some(
                      ([bId, val]) => bId !== activeBlankModal && val === optText
                    );

                    return (
                      <button
                        key={`${optText}-${idx}`}
                        id={`btn-modal-opt-${idx + 1}`}
                        onClick={() => {
                          sound.playSnap();
                          setUserAnswers(prev => ({
                            ...prev,
                            [activeBlankModal]: optText
                          }));
                          setActiveBlankModal(null);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isSelectedInThisBlank
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                            : 'border-slate-200/80 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`shrink-0 w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center border ${
                            isSelectedInThisBlank
                              ? 'bg-white/20 text-white border-white/30'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className={`text-xs font-mono font-medium leading-relaxed break-words ${
                            isSelectedInThisBlank ? 'text-white font-semibold' : 'text-slate-800'
                          }`}>
                            {optText}
                          </span>
                        </div>

                        {isSelectedInThisBlank && (
                          <span className="shrink-0 text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-lg">
                            Đã chọn
                          </span>
                        )}
                        {!isSelectedInThisBlank && isUsedInOtherBlank && (
                          <span className="shrink-0 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                            Đã điền ô khác
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-3 shrink-0">
                {userAnswers[activeBlankModal] ? (
                  <button
                    id="btn-modal-clear-answer"
                    onClick={() => {
                      sound.playClick();
                      setUserAnswers(prev => {
                        const copy = { ...prev };
                        delete copy[activeBlankModal];
                        return copy;
                      });
                      setActiveBlankModal(null);
                    }}
                    className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors"
                  >
                    Bỏ chọn ô này
                  </button>
                ) : <div />}

                <button
                  id="btn-modal-cancel"
                  onClick={() => setActiveBlankModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Submit */}
      <div className="flex justify-center mb-8">
        {!isSubmitted ? (
          <button
            id="btn-submit-dialogue"
            onClick={handleSubmit}
            disabled={filledCount === 0}
            className={`px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center gap-2.5 transition-all ${
              filledCount > 0 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-200 hover:scale-[1.02] cursor-pointer' 
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Kiểm Tra Đáp Án ({filledCount}/{totalBlanks})
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              id="btn-toggle-dialogue-exp"
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              {showExplanation ? 'Ẩn Giải Thích' : 'Xem Giải Thích Chi Tiết'}
            </button>

            <button
              id="btn-dialogue-play-again"
              onClick={resetGame}
              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Làm Lại Đoạn Hội Thoại
            </button>
          </div>
        )}
      </div>

      {/* Score & Explanation Screen */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Banner */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-4xl shrink-0">
                  {score >= 80 ? '🎯' : score >= 50 ? '✨' : '📝'}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-teal-200 text-sm font-medium">
                    <Award className="w-4 h-4" /> Hoàn thành bài học Kéo Thả Dialogue
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                    {score >= 80 ? 'Tuyệt Vời! Điền Hội Thoại Chuẩn Xác' : score >= 50 ? 'Kết Quả Tốt! Hãy Xem Giải Thích' : 'Chưa Hoàn Hảo, Thử Lại Nhé!'}
                  </h2>
                  <p className="text-teal-200 text-sm mt-1">
                    Thời gian làm bài: <span className="font-semibold text-white">{formatTime(timeSpent)}</span>
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-8 py-4 text-center">
                <span className="text-xs uppercase tracking-wider text-teal-200 font-semibold block">Điểm số</span>
                <span className="text-4xl sm:text-5xl font-black text-amber-300">{score}</span>
                <span className="text-xs text-teal-200 block mt-1">/ 100 điểm</span>
              </div>
            </div>

            {/* Explanation Breakdown */}
            {showExplanation && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  Giải Thích Chi Tiết Ý Nghĩa & Đáp Án Dialogue
                </h3>

                <div className="space-y-4">
                  {Object.keys(lesson.dialogueBlanks).map((blankId, idx) => {
                    const blankObj = lesson.dialogueBlanks[blankId];
                    const userVal = userAnswers[blankId] || 'Bỏ trống';
                    const isCorrect = userVal.toLowerCase().trim() === blankObj.correctAnswer.toLowerCase().trim();

                    return (
                      <div
                        key={blankId}
                        className={`p-4 rounded-2xl border ${
                          isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="font-bold text-slate-800 text-sm">
                            Vị trí ô trống #{idx + 1} ({blankId})
                          </span>

                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${
                            isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                            <span className="text-xs text-slate-500 font-semibold block mb-0.5">Đáp án chuẩn trong thoại:</span>
                            <span className="font-bold text-teal-900 font-mono text-base">{blankObj.correctAnswer}</span>
                          </div>

                          <div className="bg-white/80 p-3 rounded-xl border border-slate-200/60">
                            <span className="text-xs text-slate-500 font-semibold block mb-0.5">Bạn đã điền:</span>
                            <span className={`font-bold font-mono text-base ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {userVal}
                            </span>
                          </div>
                        </div>

                        {blankObj.explanation && (
                          <div className="mt-3 text-xs text-slate-700 bg-white/60 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <p><strong className="font-semibold text-slate-900">Giải thích ngữ cảnh:</strong> {blankObj.explanation}</p>
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
