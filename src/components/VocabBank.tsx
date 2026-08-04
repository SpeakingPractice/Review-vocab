import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookMarked, 
  Search, 
  Volume2, 
  Gamepad2, 
  MessageSquare, 
  Filter, 
  Sparkles,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { LessonSet, SituationPair } from '../types';
import { sound } from '../utils/sound';

interface VocabBankProps {
  lessons: LessonSet[];
  onSelectLesson: (lesson: LessonSet, mode: 'matching' | 'dialogue') => void;
}

interface VocabItem extends SituationPair {
  lessonId: string;
  lessonTitle: string;
  category: string;
  lesson: LessonSet;
}

export const VocabBank: React.FC<VocabBankProps> = ({
  lessons,
  onSelectLesson
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Collect all vocabulary items across all lessons
  const allVocabItems: VocabItem[] = [];
  const categoriesSet = new Set<string>();

  lessons.forEach(lesson => {
    if (lesson.category) categoriesSet.add(lesson.category);
    (lesson.situationPairs || []).forEach(pair => {
      allVocabItems.push({
        ...pair,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        category: lesson.category,
        lesson
      });
    });
  });

  const categories = Array.from(categoriesSet);

  // Filter items based on search and category
  const filteredItems = allVocabItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      item.targetPhrase.toLowerCase().includes(q) ||
      item.situation.toLowerCase().includes(q) ||
      item.explanation.toLowerCase().includes(q) ||
      item.lessonTitle.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleSpeak = (text: string) => {
    sound.speakEnglish(text);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <BookMarked className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Kho Từ Vựng & Cụm Từ Mẫu
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Kho Từ Vựng Toàn Bộ Bài Học
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
              Tra cứu, lắng nghe phát âm và ôn tập tổng hợp tất cả các cụm từ tiếng Anh giao tiếp đã học.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 text-center">
              <span className="block text-2xl font-black text-indigo-700">{allVocabItems.length}</span>
              <span className="text-[11px] font-semibold text-indigo-600 uppercase">Cụm Từ Dùng Được</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm cụm từ tiếng Anh, tình huống hoặc nghĩa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm font-medium transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-full w-5 h-5 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm font-semibold text-slate-700 appearance-none cursor-pointer transition-all"
            >
              <option value="all">Tất cả chủ đề ({allVocabItems.length})</option>
              {categories.map(cat => {
                const count = allVocabItems.filter(i => i.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Vocabulary Cards List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy cụm từ nào</h3>
          <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc lọc theo chủ đề khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.03, 0.3) }}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Badge Info */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 truncate max-w-[180px]">
                    {item.lessonTitle}
                  </span>
                </div>

                {/* Target Phrase & Speaker Audio */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-indigo-900 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">
                    {item.targetPhrase}
                  </h3>
                  <button
                    onClick={() => handleSpeak(item.targetPhrase)}
                    title="Phát âm tiếng Anh"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white transition-all shrink-0"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Situation / Context */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    Tình Huống Sử Dụng:
                  </span>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                    {item.situation}
                  </p>
                </div>

                {/* Explanation */}
                {item.explanation && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-4 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item.explanation}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons to Practice */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Luyện tập trong bài:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectLesson(item.lesson, 'matching')}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" /> Nối Cột
                  </button>
                  <button
                    onClick={() => onSelectLesson(item.lesson, 'dialogue')}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Dialogue
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
