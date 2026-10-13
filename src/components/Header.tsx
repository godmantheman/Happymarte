import React from 'react';
import { StoreConfig, Student } from '../types';
import { ShoppingBag, ShieldCheck, Volume2, VolumeX, Store, Clock, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  loggedInUser: Student | null;
  onLogout: () => void;
  config: StoreConfig;
  cartCount: number;
  onOpenCart: () => void;
  pendingOrdersCount: number;
  onOpenOrderHistory: () => void;
  onOpenLoginModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminMode,
  onToggleAdminMode,
  loggedInUser,
  onLogout,
  onOpenLoginModal,
  config,
  cartCount,
  onOpenCart,
  pendingOrdersCount,
  onOpenOrderHistory,
  soundEnabled,
  onToggleSound,
}) => {
  const isTeacher = loggedInUser?.name === '방소정' || loggedInUser?.role === 'TEACHER';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-300 flex items-center justify-center text-2xl shadow-md transform hover:rotate-6 transition-transform">
              🏪
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-slate-800">
                  행복마트
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300/60">
                  중2 특수학급
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                우리 반 전용 {config.currencyUnit}로 즐거운 물품 구매!
              </p>
            </div>
          </div>

          {/* Center Info Banner on Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {config.isOpen ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                마트 정상 운영 중 🟢
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Clock className="w-3.5 h-3.5 mr-1" />
                지금은 준비 중입니다 🟡
              </span>
            )}

            {/* Current Active User Pill */}
            {loggedInUser ? (
              <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-2xs">
                <span className="text-xl">{loggedInUser.avatar || (isTeacher ? '👩‍🏫' : '🧒')}</span>
                <div className="text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-black text-slate-900">{loggedInUser.name}</span>
                    {isTeacher ? (
                      <span className="text-2xs font-black px-1.5 py-0.2 rounded-md bg-purple-600 text-white">
                        선생님 권한
                      </span>
                    ) : (
                      <span className="text-2xs font-semibold text-slate-400">학생</span>
                    )}
                  </div>
                  {!isTeacher && (
                    <span className="text-2xs font-black text-amber-700">
                      💰 {loggedInUser.balance.toLocaleString()} {config.currencyUnit}
                    </span>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  title="다른 이름으로 로그인"
                  className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold transition-all"
              >
                <span>👤 게스트 모드</span>
                <span className="text-purple-700 underline font-black ml-1">[이름 로그인]</span>
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={onToggleSound}
              title={soundEnabled ? '효과음 켜짐' : '효과음 음소거'}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            {/* Student Mode Specific Buttons */}
            {!isAdminMode && (
              <>
                {/* Order History Button */}
                <button
                  onClick={onOpenOrderHistory}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors text-sm font-medium"
                >
                  <span>📜 내 주문</span>
                  {pendingOrdersCount > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.2 rounded-full">
                      {pendingOrdersCount}
                    </span>
                  )}
                </button>

                {/* Shopping Cart Button */}
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="hidden sm:inline">장바구니</span>
                  {cartCount > 0 && (
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-orange-600 text-xs font-black">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Mode Toggle Button (Student vs Teacher Admin) */}
            <button
              onClick={onToggleAdminMode}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                isAdminMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                  : isTeacher
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/25 ring-2 ring-purple-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {isAdminMode ? (
                <>
                  <Store className="w-4 h-4" />
                  <span>마트 화면으로</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white sm:text-inherit" />
                  <span>선생님 패널 {isTeacher && '👑'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Subheader Bar */}
        <div className="flex md:hidden items-center justify-between pb-3 pt-1 border-t border-slate-100 text-xs">
          {loggedInUser ? (
            <div className="flex items-center space-x-1.5 font-bold text-slate-800">
              <span>{loggedInUser.avatar}</span>
              <span>{loggedInUser.name}</span>
              {isTeacher ? (
                <span className="text-2xs bg-purple-600 text-white px-1.5 py-0.2 rounded-md">선생님</span>
              ) : (
                <span className="text-amber-700">({loggedInUser.balance.toLocaleString()} {config.currencyUnit})</span>
              )}
              <button
                onClick={onLogout}
                className="ml-1 text-slate-400 hover:text-rose-600 text-2xs underline"
              >
                변경
              </button>
            </div>
          ) : (
            <span className="text-slate-500">로그인이 필요합니다</span>
          )}
          <span className={config.isOpen ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
            {config.isOpen ? '🟢 마트 영업중' : '🟡 준비중'}
          </span>
        </div>
      </div>
    </header>
  );
};
