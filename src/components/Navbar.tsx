import React from 'react';
import { 
  BookOpen, 
  Gamepad2, 
  PlusCircle, 
  BarChart3, 
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { sound } from '../utils/sound';

export type TabType = 'lessons' | 'matching' | 'dialogue' | 'create' | 'history';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedLessonTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLessonTitle
}) => {
  const handleTabClick = (tab: TabType) => {
    sound.playClick();
    setActiveTab(tab);
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => handleTabClick('lessons')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-800 text-lg tracking-tight">VocabReview</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Pro</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Ôn Tập Từ Vựng Qua Trò Chơi</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          <button
            id="tab-lessons"
            onClick={() => handleTabClick('lessons')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'lessons'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Kho Bài Học</span>
            <span className="sm:hidden">Bài Học</span>
          </button>

          <button
            id="tab-matching"
            onClick={() => handleTabClick('matching')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'matching'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-indigo-600" />
            <span>Game Nối Cột</span>
          </button>

          <button
            id="tab-dialogue"
            onClick={() => handleTabClick('dialogue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dialogue'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Game Dialogue</span>
          </button>

          <button
            id="tab-create"
            onClick={() => handleTabClick('create')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Soạn Bài Mới</span>
          </button>

          <button
            id="tab-history"
            onClick={() => handleTabClick('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">Tiến Độ & Lịch Sử</span>
            <span className="sm:hidden">Tiến Độ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
