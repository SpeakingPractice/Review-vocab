import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  PlusCircle, 
  FileText, 
  Sparkles, 
  Check, 
  ArrowRight, 
  HelpCircle,
  ListPlus,
  MessageSquare,
  Wand2
} from 'lucide-react';
import { LessonSet } from '../types';
import { parseRawInputsToLesson, saveLessonSet } from '../utils/storage';
import { sound } from '../utils/sound';

interface LessonEditorProps {
  initialLesson?: LessonSet | null;
  onSaveSuccess: (lesson: LessonSet) => void;
  onCancel: () => void;
}

const DEFAULT_SITUATIONS = `Yêu cầu giúp đỡ khi bị lạc đường
Xin lỗi vì không thể tham gia buổi tiệc
Hỏi thông tin về giá phòng khách sạn
Đề xuất thay đổi lịch hẹn sang ngày khác`;

const DEFAULT_PHRASES = `ask for directions
decline an invitation
inquire about room rates
reschedule an appointment`;

const DEFAULT_DIALOGUE = `Customer: Good morning! I would like to [inquire about room rates] for next weekend.
Receptionist: Sure! Our standard room is $80/night. Would you like to make a reservation?
Customer: Thank you, but I need to [reschedule an appointment] first with my client before confirming.
Receptionist: No problem! Feel free to call us whenever you are ready.`;

const DEFAULT_ANSWERS = `inquire about room rates, reschedule an appointment, ask for directions, decline an invitation, order food, pay by card`;

function getInitialDialogueText(lesson: LessonSet): string {
  let text = lesson.rawDialogue || '';
  if (text && lesson.dialogueBlanks) {
    Object.entries(lesson.dialogueBlanks).forEach(([blankKey, blankObj]) => {
      if (blankObj?.correctAnswer) {
        text = text.replace(new RegExp(`\\[${blankKey}\\]`, 'g'), `[${blankObj.correctAnswer}]`);
      }
    });
    return text;
  }

  if (lesson.dialogueItems && lesson.dialogueItems.length > 0) {
    return lesson.dialogueItems.map(item => {
      let lineText = item.textWithBlanks;
      if (lesson.dialogueBlanks) {
        item.blankIds.forEach(blankKey => {
          const blankObj = lesson.dialogueBlanks[blankKey];
          if (blankObj?.correctAnswer) {
            lineText = lineText.replace(`[${blankKey}]`, `[${blankObj.correctAnswer}]`);
          }
        });
      }
      return `${item.speaker}: ${lineText}`;
    }).join('\n');
  }

  return '';
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  initialLesson,
  onSaveSuccess,
  onCancel
}) => {
  const isEditing = Boolean(initialLesson);

  const [title, setTitle] = useState(initialLesson?.title || '');
  const [category, setCategory] = useState(initialLesson?.category || 'Từ Vựng Mới');
  const [description, setDescription] = useState(initialLesson?.description || '');

  // 1. Ô nhập Situations
  const [situationsText, setSituationsText] = useState(() => {
    if (initialLesson?.situationPairs && initialLesson.situationPairs.length > 0) {
      return initialLesson.situationPairs.map(s => s.situation).join('\n');
    }
    return DEFAULT_SITUATIONS;
  });

  // 2. Ô nhập Target Phrases
  const [phrasesText, setPhrasesText] = useState(() => {
    if (initialLesson?.situationPairs && initialLesson.situationPairs.length > 0) {
      return initialLesson.situationPairs.map(s => s.targetPhrase).join('\n');
    }
    return DEFAULT_PHRASES;
  });

  // 3. Ô nhập Dialogue
  const [dialogueText, setDialogueText] = useState(() => {
    if (initialLesson) {
      return getInitialDialogueText(initialLesson);
    }
    return DEFAULT_DIALOGUE;
  });

  // 4. Ô nhập các Đáp án ngẫu nhiên / Đáp án bổ sung
  const [answersText, setAnswersText] = useState(() => {
    if (initialLesson?.rawAnswers && initialLesson.rawAnswers.length > 0) {
      return initialLesson.rawAnswers.join(', ');
    }
    return DEFAULT_ANSWERS;
  });

  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề cho bài học.');
      return;
    }

    if (!situationsText.trim() || !phrasesText.trim()) {
      setErrorMsg('Vui lòng nhập ít nhất 1 tình huống và 1 cụm từ mục tiêu.');
      return;
    }

    if (!dialogueText.trim()) {
      setErrorMsg('Vui lòng nhập nội dung đoạn hội thoại.');
      return;
    }

    try {
      const savedLesson = parseRawInputsToLesson(
        title.trim(),
        category.trim(),
        description.trim(),
        situationsText,
        phrasesText,
        dialogueText,
        answersText
      );

      if (initialLesson) {
        savedLesson.id = initialLesson.id;
        savedLesson.createdAt = initialLesson.createdAt;
        savedLesson.isPreMade = initialLesson.isPreMade;
      }

      saveLessonSet(savedLesson);
      sound.playCorrect();
      onSaveSuccess(savedLesson);
    } catch {
      setErrorMsg('Đã xảy ra lỗi khi lưu bài học. Vui lòng kiểm tra lại định dạng dữ liệu.');
    }
  };

  const handleFillSampleTemplate = () => {
    sound.playClick();
    setTitle('Tự Học IELTS Speaking - Thức Ăn & Ẩm Thực');
    setCategory('IELTS Speaking');
    setDescription('Cụm từ ghi điểm cao khi mô tả món ăn yêu thích và phong cách ăn uống.');
    
    setSituationsText(
`Khi muốn nói bạn thích ăn đồ ăn tự nấu ở nhà hơn ăn ngoài
Diễn tả món ăn có hương vị đậm đà, thơm ngon nức mũi
Nói về thói quen ăn uống lành mạnh, nhiều rau xanh
Miêu tả bầu không khí ấm cúng tại nhà hàng`
    );

    setPhrasesText(
`home-cooked meals
mouth-watering flavor
balanced diet
cozy ambience`
    );

    setDialogueText(
`Examiner: Do you prefer eating out or eating at home?
Candidate: I definitely prefer [home-cooked meals] because they are healthier and cheaper.
Examiner: What is your favorite dish?
Candidate: My mother makes pasta with a [mouth-watering flavor] that I can never resist.
Examiner: How important is a good restaurant atmosphere to you?
Candidate: It matters a lot. I always look for a place with a [cozy ambience] when dining with friends.`
    );

    setAnswersText(
`home-cooked meals, mouth-watering flavor, cozy ambience, balanced diet, fast food, street food`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-6"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-6">
          <div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {isEditing ? 'Chỉnh Sửa Bài Học' : 'Soạn Bài Học Cá Nhân'}
            </span>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              {isEditing ? `Chỉnh Sửa: ${initialLesson.title}` : 'Tạo Ôn Tập Bài Học Mới'}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {isEditing 
                ? 'Cập nhật lại thông tin, Situations, Target Phrases và Dialogue cho bài học này.' 
                : 'Nhập Situations, Target Phrases và Dialogue để tự động tạo 2 trò chơi tương tác.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleFillSampleTemplate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors text-xs font-semibold shrink-0"
          >
            <Wand2 className="w-4 h-4 text-amber-600" /> Tự động điền mẫu thử
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* General info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tên bài học / Tiêu đề *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="VD: Từ vựng Phỏng vấn xin việc"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Chủ đề / Danh mục
              </label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="VD: Tiếng Anh Thương Mại"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mô tả ngắn
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú thêm về nội dung cần ôn tập..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Section 1: Matching Game Inputs (Situations & Target Phrases) */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Phần 1: Dữ Liệu Cho Game Nối Cột (Situations vs Target Phrases)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ô 1: Nhập các Situations (Mỗi dòng 1 tình huống)
                </label>
                <textarea
                  rows={5}
                  value={situationsText}
                  onChange={e => setSituationsText(e.target.value)}
                  placeholder="Dòng 1: Yêu cầu giúp đỡ khi bị lạc...&#10;Dòng 2: Xin lỗi trễ hạn..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ô 2: Nhập các Target Phrases tương ứng (Mỗi dòng 1 cụm từ)
                </label>
                <textarea
                  rows={5}
                  value={phrasesText}
                  onChange={e => setPhrasesText(e.target.value)}
                  placeholder="Dòng 1: ask for directions&#10;Dòng 2: fall behind schedule"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono leading-relaxed"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 italic">
              * Dòng 1 ở ô Situations sẽ tự động nối đúng với Dòng 1 ở ô Target Phrases. Khi vào game, vị trí sẽ được xáo trộn ngẫu nhiên.
            </p>
          </div>

          {/* Section 2: Dialogue Game Inputs */}
          <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                Phần 2: Dữ Liệu Cho Game Kéo Thả Dialogue
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ô 3: Nhập Kịch Bản Dialogue (Đặt từ cần điền vào trong ngoặc vuông `[từ_cần_điền]`)
              </label>
              <textarea
                rows={5}
                value={dialogueText}
                onChange={e => setDialogueText(e.target.value)}
                placeholder="Speaker A: Hello, I want to [check in].&#10;Speaker B: Welcome, do you have a reservation?"
                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ô 4: Nhập Danh Sách Đáp Án / Các Đáp Án Ngẫu Nhiên (Cách nhau bởi dấu phẩy hoặc xuống dòng)
              </label>
              <textarea
                rows={3}
                value={answersText}
                onChange={e => setAnswersText(e.target.value)}
                placeholder="check in, check out, room upgrade, late checkout"
                className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="px-7 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" /> Lưu & Chơi Ngay
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
