import React, { useState } from 'react';
import { Student, StoreConfig } from '../types';
import { X, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { playCartSound } from '../utils/audio';

interface StudentSelectorProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  onClose: () => void;
  config: StoreConfig;
  onAddCustomStudent?: (name: string) => void;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudent,
  onSelectStudent,
  onClose,
  config,
  onAddCustomStudent,
}) => {
  const [customName, setCustomName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSelect = (s: Student) => {
    playCartSound();
    onSelectStudent(s);
    onClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    if (onAddCustomStudent) {
      onAddCustomStudent(customName.trim());
      setCustomName('');
      setIsAddingNew(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">🎒</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight">누가 물품을 구매하나요?</h2>
              <p className="text-amber-100 text-sm font-medium">
                자신의 이름을 꾹 눌러서 선택해주세요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Students Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {students.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <button
                  key={student.id}
                  onClick={() => handleSelect(student)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all transform hover:-translate-y-1 active:scale-95 text-center ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400'
                      : 'border-slate-200 bg-slate-50/70 hover:border-amber-300 hover:bg-white shadow-xs'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 text-amber-600">
                      <CheckCircle2 className="w-5 h-5 fill-amber-500 text-white" />
                    </div>
                  )}
                  <span className="text-4xl mb-2 drop-shadow-xs">{student.avatar || '🧒'}</span>
                  <span className="text-lg font-black text-slate-800">{student.name}</span>
                  <div className="mt-2 px-2.5 py-1 rounded-xl bg-amber-200/70 text-amber-950 font-bold text-xs flex items-center space-x-1">
                    <span>💰</span>
                    <span>{student.balance.toLocaleString()} {config.currencyUnit}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Direct Name Entry / Register student */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 text-amber-800 font-bold text-sm transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                <span>목록에 이름이 없나요? 새로 등록하기</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNew} className="flex gap-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="학생 이름을 입력하세요 (예: 홍길동)"
                  className="flex-1 px-4 py-3 rounded-2xl border-2 border-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-400 font-bold text-sm"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!customName.trim()}
                  className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-black text-sm flex items-center space-x-1"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>등록 & 선택</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  취소
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>💡 선택한 학생의 전용머니 잔액으로 구매가 진행됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
