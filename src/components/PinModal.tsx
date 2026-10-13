import React, { useState } from 'react';
import { Lock, X, KeyRound, Sparkles } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expectedPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin || pin === '1234') {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleQuickEnter = () => {
    setError(false);
    setPin('');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-4 border-purple-400 space-y-5">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
            <Lock className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900">선생님 관리자 인증</h3>
          <p className="text-xs text-slate-500 mt-1">
            물품 관리 및 주문 승인을 위해 비밀번호를 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="비밀번호 (기본: 1234)"
              autoFocus
              className="w-full text-center tracking-widest text-2xl font-black py-3 px-4 rounded-2xl border-2 border-slate-300 focus:border-purple-500 focus:outline-hidden"
            />
            {error && (
              <p className="text-xs font-bold text-rose-600 mt-1.5 text-center">
                비밀번호가 올바르지 않습니다. 다시 입력해주세요.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm shadow-md shadow-purple-600/20 active:scale-98 transition-all"
            >
              선생님 패널 입장하기
            </button>

            <button
              type="button"
              onClick={handleQuickEnter}
              className="w-full py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors border border-purple-200"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>기본 비밀번호(1234)로 바로 입장</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
