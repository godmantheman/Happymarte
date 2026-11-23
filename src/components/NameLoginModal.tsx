import React, { useState } from 'react';
import { Student } from '../types';
import { User, ArrowRight, Loader2, ShoppingBag, X } from 'lucide-react';
import { AvatarBadgeIcon, Coin3DIcon, Store3DLogo } from './Icons3D';

interface NameLoginModalProps {
  isOpen: boolean;
  isChristmas: boolean;
  currencyUnit: string;
  onLogin: (name: string) => Promise<void>;
  onGuestMode: () => void;
  registeredStudents: Student[];
  allowClose?: boolean;
  onClose?: () => void;
}

export const NameLoginModal: React.FC<NameLoginModalProps> = ({
  isOpen,
  isChristmas,
  currencyUnit,
  onLogin,
  onGuestMode,
  registeredStudents,
  allowClose = true,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg('이름을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await onLogin(nameInput.trim());
    } catch (err) {
      console.error(err);
      setErrorMsg('로그인 중 오류가 발생했습니다.');
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
      setErrorMsg('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65">
      <div
        className={`bg-[#FFFDF9] rounded-[32px] max-w-md w-full shadow-2xl border-4 border-b-[10px] overflow-hidden relative ${
          isChristmas ? 'border-amber-400 border-b-red-950' : 'border-amber-400'
        }`}
      >
        {allowClose && (
          <button
            onClick={onClose || onGuestMode}
            className={`absolute top-4 right-4 z-10 p-2 rounded-2xl bg-white hover:bg-amber-50 border-2 border-b-4 active:translate-y-0.5 transition-all cursor-pointer ${
              isChristmas
                ? 'text-red-950 border-red-950'
                : 'text-amber-950 border-amber-700'
            }`}
            title="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 3D Tactile Header */}
        <div
          className={`p-6 flex items-center gap-3.5 border-b-[6px] ${
            isChristmas
              ? 'bg-gradient-to-b from-red-600 via-red-700 to-rose-800 text-white border-red-950 shadow-[inset_0_3px_0_rgba(255,255,255,0.35)]'
              : 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-amber-950 border-amber-700 shadow-[inset_0_3px_0_rgba(255,255,255,0.75)]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl bg-white border-2 border-b-4 flex items-center justify-center shrink-0 ${
              isChristmas ? 'border-red-950' : 'border-amber-700'
            }`}
          >
            <Store3DLogo className="w-8 h-8" isChristmas={isChristmas} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">이름 로그인</h2>
            <p
              className={`font-bold text-xs mt-0.5 ${
                isChristmas ? 'text-amber-100' : 'text-amber-900/80'
              }`}
            >
              방소정 입력 시 선생님 관리자 모드
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="이름 입력 (예: 방소정, 김도윤)"
                  autoFocus
                  disabled={loading}
                  className={`w-full px-4 py-3.5 pl-10 rounded-2xl border-2 focus:outline-hidden text-sm font-black text-stone-900 bg-white placeholder:text-stone-400 ${
                    isChristmas
                      ? 'border-amber-300 focus:border-red-600'
                      : 'border-amber-300 focus:border-amber-500'
                  }`}
                />
                <User
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                    isChristmas ? 'text-red-700' : 'text-amber-600'
                  }`}
                />
              </div>
              {errorMsg && (
                <p className="text-xs font-black text-rose-600 mt-1.5">{errorMsg}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <button
                type="submit"
                disabled={loading || !nameInput.trim()}
                className={`w-full py-3.5 rounded-2xl disabled:opacity-50 border-2 border-b-[5px] text-white font-black text-sm flex items-center justify-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-0.5 transition-all cursor-pointer ${
                  isChristmas
                    ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 border-red-950'
                    : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-orange-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>확인 중...</span>
                  </>
                ) : (
                  <>
                    <span>로그인</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onGuestMode}
                disabled={loading}
                className={`w-full py-3 rounded-2xl bg-white border-2 border-b-4 font-black text-xs flex items-center justify-center gap-2 active:translate-y-0.5 transition-all cursor-pointer ${
                  isChristmas
                    ? 'hover:bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'hover:bg-sky-50 border-sky-300 text-sky-900'
                }`}
              >
                <ShoppingBag
                  className={`w-4 h-4 ${isChristmas ? 'text-emerald-700' : 'text-sky-600'}`}
                />
                <span>로그인 없이 둘러보기</span>
              </button>
            </div>
          </form>

          {/* Quick Select Registered Students */}
          {registeredStudents.length > 0 && (
            <div className="pt-4 border-t-2 border-amber-200/70">
              <p className="text-xs font-black text-stone-500 mb-2.5">빠른 선택</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {registeredStudents.map((st) => {
                  const isTeacher = st.name === '방소정' || st.role === 'TEACHER';
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickSelect(st.name)}
                      className={`p-2.5 rounded-2xl border-2 border-b-4 text-left flex items-center gap-2 transition-all active:translate-y-0.5 cursor-pointer ${
                        isTeacher
                          ? isChristmas
                            ? 'border-red-400 bg-red-50 hover:bg-red-100'
                            : 'border-purple-400 bg-purple-50 hover:bg-purple-100'
                          : 'border-amber-200 bg-white hover:border-amber-400'
                      }`}
                    >
                      <AvatarBadgeIcon
                        avatar={st.avatar}
                        isTeacher={isTeacher}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="font-black text-xs text-stone-900 truncate">
                          {st.name}
                        </div>
                        <div
                          className={`text-2xs font-bold font-mono tabular-nums flex items-center gap-0.5 ${
                            isChristmas ? 'text-red-800' : 'text-amber-700'
                          }`}
                        >
                          {isTeacher ? (
                            <span
                              className={isChristmas ? 'text-red-700' : 'text-purple-700'}
                            >
                              선생님
                            </span>
                          ) : (
                            <>
                              <Coin3DIcon className="w-3 h-3" isChristmas={isChristmas} />
                              <span>
                                {st.balance.toLocaleString()} {currencyUnit}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
