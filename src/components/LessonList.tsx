import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Gamepad2, 
  MessageSquare, 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { LessonSet } from '../types';
import { deleteLessonSet } from '../utils/storage';
import { sound } from '../utils/sound';

interface LessonListProps {
  lessons: LessonSet[];
  onSelectLesson: (lesson: LessonSet, mode: 'matching' | 'dialogue') => void;
  onCreateNew: () => void;
  onRefreshLessons: () => void;
}

export const LessonList: React.FC<LessonListProps> = ({
  lessons,
  onSelectLesson,
  onCreateNew,
  onRefreshLessons
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(lessons.map(l => l.category)))];

  const filteredLessons = selectedCategory === 'All'
    ? lessons
    : lessons.filter(l => l.category === selectedCategory);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sound.playClick();
    if (window.confirm('Bạn có chắc chắn muốn xóa bộ bài học cá nhân này?')) {
      deleteLessonSet(id);
      onRefreshLessons();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Phương Pháp Học Tập Từ Vựng Qua Trò Chơi Nối & Kéo Thả
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Ghi Nhớ Từ Vựng & Cụm Từ Tiếng Anh Tự Nhiên
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/90 mt-3 leading-relaxed">
            Nối các tình huống giao tiếp (Situations) với cụm từ chuẩn (Target Phrases), kết hợp hoàn thành kịch bản đoạn hội thoại bằng thao tác kéo thả đáp án thông minh.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="btn-create-lesson-hero"
              onClick={onCreateNew}
              className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-900/50 flex items-center gap-2 text-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" /> Soạn Bộ Bài Học Mới
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 shrink-0 mr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-indigo-600" /> Chủ đề:
        </span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => {
              sound.playClick();
              setSelectedCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'All' ? 'Tất cả bài học' : cat}
          </button>
        ))}
      </div>

      {/* Lesson Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLessons.map((lesson, idx) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {lesson.category}
                </span>

                {!lesson.isPreMade && (
                  <button
                    onClick={(e) => handleDelete(e, lesson.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa bộ bài học này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                {lesson.title}
              </h2>

              <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                {lesson.description || 'Bài học ôn tập từ vựng cá nhân.'}
              </p>

              {/* Meta stats */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {lesson.situationPairs.length} cặp Situations
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {Object.keys(lesson.dialogueBlanks).length} vị trí Dialogue
                </div>
              </div>
            </div>

            {/* Launch Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <button
                id={`btn-play-matching-${lesson.id}`}
                onClick={() => {
                  sound.playClick();
                  onSelectLesson(lesson, 'matching');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white font-semibold text-xs flex items-center justify-between transition-all group/btn"
              >
                <span className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Game 1: Nối Cột Situations
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
              </button>

              <button
                id={`btn-play-dialogue-${lesson.id}`}
                onClick={() => {
                  sound.playClick();
                  onSelectLesson(lesson, 'dialogue');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-600 hover:text-white font-semibold text-xs flex items-center justify-between transition-all group/btn"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Game 2: Kéo Thả Dialogue
                </span>
                <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
