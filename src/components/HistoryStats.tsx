import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  RotateCcw,
  BookOpen,
  Calendar,
  Gamepad2,
  Award
} from 'lucide-react';
import { GameHistoryRecord, UserStats } from '../types';
import { computeUserStats, getStoredHistory } from '../utils/storage';
import { sound } from '../utils/sound';

interface HistoryStatsProps {
  onPlayLessonAgain: (lessonId: string, gameType: 'matching' | 'dialogue') => void;
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({ onPlayLessonAgain }) => {
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalGamesPlayed: 0,
    matchingGamesPlayed: 0,
    dialogueGamesPlayed: 0,
    averageScore: 0,
    currentStreakDays: 0,
    lastPlayedDate: null,
    totalTimeSpentSeconds: 0
  });

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = getStoredHistory();
    setHistory(list);
    setStats(computeUserStats(list));
  };

  const handleClearHistory = () => {
    sound.playClick();
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử học tập?')) {
      localStorage.removeItem('vocab_review_history_v1');
      loadData();
    }
  };

  const formatMinutes = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} phút`;
    const hours = (mins / 60).toFixed(1);
    return `${hours} giờ`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Top Banner & Stats summary */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-900/60 border border-indigo-700/50 px-3 py-1 rounded-full uppercase tracking-wider">
              Theo Dõi Tiến Độ
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              Lịch Sử Học Tập & Bảng Thành Tích
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Ghi nhận từng lần ôn tập từ vựng, điểm số và chi tiết các câu trả lời của bạn.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition-colors text-xs font-semibold shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
            </button>
          )}
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Gamepad2 className="w-4 h-4 text-indigo-400" /> Đã Luyện Tập
            </div>
            <div className="text-3xl font-black text-white">{stats.totalGamesPlayed}</div>
            <div className="text-xs text-slate-400 mt-1">lần hoàn thành</div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Trophy className="w-4 h-4 text-amber-400" /> Điểm Trung Bình
            </div>
            <div className="text-3xl font-black text-amber-300">{stats.averageScore}%</div>
            <div className="text-xs text-slate-400 mt-1">độ chính xác</div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-orange-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 text-orange-400" /> Chuỗi Học Tập
            </div>
            <div className="text-3xl font-black text-orange-400">{stats.currentStreakDays}</div>
            <div className="text-xs text-slate-400 mt-1">ngày liên tiếp</div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 text-emerald-400" /> Tổng Thời Gian
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">
              {formatMinutes(stats.totalTimeSpentSeconds)}
            </div>
            <div className="text-xs text-slate-400 mt-1">ôn tập tích lũy</div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Nhật Ký Các Lần Ôn Tập
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base mb-1">Chưa có lịch sử học tập</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hãy chọn một bài học và hoàn thành game Nối Cột hoặc Dialogue để ghi lại tiến độ học tập cá nhân của bạn tại đây!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(record => {
              const isExpanded = expandedRecordId === record.id;
              const isMatching = record.gameType === 'matching';

              return (
                <div
                  key={record.id}
                  className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Item Header */}
                  <div
                    onClick={() => {
                      sound.playClick();
                      setExpandedRecordId(isExpanded ? null : record.id);
                    }}
                    className="p-4 sm:p-5 bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        isMatching ? 'bg-indigo-600' : 'bg-emerald-600'
                      }`}>
                        {isMatching ? '🧩' : '💬'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isMatching ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isMatching ? 'Game Nối Cột' : 'Game Dialogue'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDate(record.completedAt)}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-base mt-0.5">
                          {record.lessonTitle}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <span className={`text-xl font-black ${
                          record.score >= 80 ? 'text-emerald-600' : record.score >= 50 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {record.score}%
                        </span>
                        <span className="text-xs text-slate-500 block">
                          {record.correctCount}/{record.totalItems} câu đúng
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playClick();
                          onPlayLessonAgain(record.lessonId, record.gameType);
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition-colors"
                        title="Chơi lại bài này"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-200 bg-white p-4 sm:p-6 space-y-3"
                      >
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Chi Tiết Kết Quả Đã Trả Lời:
                        </h4>

                        {record.details.map((detail, dIdx) => (
                          <div
                            key={dIdx}
                            className={`p-3 rounded-xl border text-xs sm:text-sm ${
                              detail.isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between font-semibold mb-1">
                              <span className="text-slate-800">{detail.item}</span>
                              <span className={detail.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                {detail.isCorrect ? 'Đúng' : 'Sai'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                              <div>Đã chọn: <span className="font-bold">{detail.userAnswer}</span></div>
                              <div>Đáp án đúng: <span className="font-bold text-indigo-700">{detail.correctAnswer}</span></div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
