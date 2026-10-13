import React, { useState } from 'react';
import { Student } from '../types';
import { User, Sparkles, Shield, ArrowRight, Loader2 } from 'lucide-react';

interface NameLoginModalProps {
  isOpen: boolean;
  onLogin: (name: string) => Promise<void>;
  registeredStudents: Student[];
}

export const NameLoginModal: React.FC<NameLoginModalProps> = ({
  isOpen,
  onLogin,
  registeredStudents,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg('이름을 입력해주세요!');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await onLogin(nameInput.trim());
    } catch (err) {
      console.error(err);
      setErrorMsg('로그인 중 문제가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = async (name: string) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await onLogin(name);
    } catch (err) {
      console.error(err);
      setErrorMsg('로그인 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-white text-center relative">
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-xs mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
            🏪
          </div>
          <h2 className="text-2xl font-black tracking-tight">행복마트 입장하기</h2>
          <p className="text-amber-100 text-xs font-semibold mt-1">
            중학교 2학년 특수학급 전용 물품 구매 마트
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                내 이름을 입력해주세요:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="예: 방소정 또는 내 이름"
                  autoFocus
                  disabled={loading}
                  className="w-full px-4 py-3.5 pl-11 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-hidden text-base font-black text-slate-800 placeholder:text-slate-400 transition-all"
                />
                <User className="w-5 h-5 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errorMsg && (
                <p className="text-xs font-bold text-rose-600 mt-1.5">{errorMsg}</p>
              )}
            </div>

            {/* Special Teacher Authority Tip */}
            <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-semibold flex items-start space-x-2.5">
              <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-purple-800">선생님 권한 안내:</span>
                <p className="mt-0.5 text-purple-700">
                  이름에 <strong className="text-purple-950 underline decoration-purple-400 underline-offset-2">&lsquo;방소정&rsquo;</strong>을 입력하면 자동으로 선생님 권한(물품 관리, 주문 승인/거부, 친구들 돈 설정)이 활성화됩니다!
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !nameInput.trim()}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-black text-base flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/25 active:scale-98 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>로그인 확인 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>이름으로 마트 입장하기</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Select Chips */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 block mb-2">
              빠른 선택:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {/* Teacher Bang So-jeong Chip */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickSelect('방소정')}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-black border border-purple-300 flex items-center space-x-1 transition-all active:scale-95"
              >
                <span>👩‍🏫</span>
                <span>방소정 (선생님)</span>
              </button>

              {/* Other students */}
              {registeredStudents
                .filter((s) => s.name !== '방소정')
                .slice(0, 6)
                .map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickSelect(student.name)}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 flex items-center space-x-1 transition-all active:scale-95"
                  >
                    <span>{student.avatar || '🧒'}</span>
                    <span>{student.name}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
