import React from 'react';
import { StoreConfig, Student } from '../types';
import {
  ShoppingBag,
  Volume2,
  VolumeX,
  Monitor,
  FileText,
  ShieldCheck,
  User,
} from 'lucide-react';
import {
  AvatarBadgeIcon,
  Coin3DIcon,
  Store3DLogo,
  ChristmasLightsGarland,
} from './Icons3D';
import { getStoreBrandName } from '../utils/seasonTheme';

interface HeaderProps {
  isChristmas: boolean;
  isAdminMode: boolean;
  onToggleAdminMode: () => void;
  isKioskMode: boolean;
  onToggleKioskMode: () => void;
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
  onScrollToSection?: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isChristmas,
  isAdminMode,
  onToggleAdminMode,
  isKioskMode,
  onToggleKioskMode,
  loggedInUser,
  onOpenLoginModal,
  config,
  cartCount,
  onOpenCart,
  pendingOrdersCount,
  onOpenOrderHistory,
  soundEnabled,
  onToggleSound,
  onScrollToSection,
}) => {
  const isTeacher = loggedInUser?.name === '방소정' || loggedInUser?.role === 'TEACHER';
  const brandName = getStoreBrandName(isChristmas);

  return (
    <header className="sticky top-0 z-40 pt-2.5 px-3 sm:px-6">
      <div className="max-w-[1360px] mx-auto relative">
        {/* 3D Floating Top Bar */}
        <div
          className={`rounded-3xl px-4 sm:px-6 h-20 border-2 border-b-[7px] flex items-center justify-between gap-4 transition-colors ${
            isChristmas
              ? 'bg-gradient-to-b from-red-600 via-red-700 to-rose-800 border-amber-300/80 border-b-red-950 shadow-[0_12px_28px_rgba(0,0,0,0.45),inset_0_3px_0_rgba(255,255,255,0.4)]'
              : 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-amber-200 border-b-amber-700 shadow-[0_10px_24px_rgba(217,119,6,0.22),inset_0_3px_0_rgba(255,255,255,0.75)]'
          }`}
        >
          {/* Zone 1: 3D Brand Logo & Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onScrollToSection?.('top');
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-[#FFFDF9] border-2 border-b-4 flex items-center justify-center shadow-sm group-hover:-translate-y-0.5 transition-transform ${
                isChristmas ? 'border-amber-400 border-b-red-950' : 'border-amber-700'
              }`}
            >
              <Store3DLogo className="w-9 h-9" isChristmas={isChristmas} />
            </div>
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap ${
                isChristmas
                  ? 'text-[#FFFDF7] drop-shadow-[0_2px_0_rgba(127,29,29,0.9)]'
                  : 'text-amber-950 drop-shadow-[0_2px_0_rgba(255,255,255,0.7)]'
              }`}
            >
              {brandName}
            </span>
          </a>

          {/* Zone 2: 3D Tactile Navigation & Kiosk Toggle Buttons */}
          <nav className="hidden md:flex items-center gap-2.5 text-xs sm:text-sm font-black">
            {/* Kiosk GUI Mode Toggle Button */}
            <button
              onClick={onToggleKioskMode}
              className={`px-4 py-2.5 rounded-2xl border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isChristmas
                  ? isKioskMode
                    ? 'bg-gradient-to-b from-amber-300 to-amber-400 border-amber-800 text-red-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)]'
                    : 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 border-emerald-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]'
                  : isKioskMode
                  ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
                  : 'bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-300 hover:to-sky-400 border-sky-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{isKioskMode ? '일반 화면' : '키오스크 GUI'}</span>
            </button>

            {/* Order History 3D Button */}
            <button
              onClick={onOpenOrderHistory}
              className={`px-3.5 py-2.5 rounded-2xl border-2 border-b-4 flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isChristmas
                  ? 'bg-[#FFFDF9] hover:bg-amber-50 text-red-950 border-red-950/80'
                  : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-700/80'
              }`}
            >
              <FileText
                className={`w-4 h-4 ${isChristmas ? 'text-red-700' : 'text-amber-600'}`}
              />
              <span>주문 내역</span>
              {pendingOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-lg bg-rose-600 text-white text-xs font-mono tabular-nums">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            {/* User / Login 3D Button */}
            <button
              onClick={onOpenLoginModal}
              className={`px-3.5 py-2 rounded-2xl border-2 border-b-4 flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isChristmas
                  ? 'bg-[#FFFDF9] hover:bg-amber-50 text-red-950 border-red-950/80'
                  : 'bg-white hover:bg-amber-50 text-amber-950 border-amber-700/80'
              }`}
            >
              {loggedInUser ? (
                <>
                  <AvatarBadgeIcon
                    avatar={loggedInUser.avatar}
                    isTeacher={isTeacher}
                    size="sm"
                  />
                  <span>{loggedInUser.name}</span>
                  {!isTeacher && (
                    <span
                      className={`flex items-center gap-1 font-mono tabular-nums pl-1.5 border-l ${
                        isChristmas
                          ? 'text-red-800 border-amber-300'
                          : 'text-amber-700 border-amber-200'
                      }`}
                    >
                      <Coin3DIcon className="w-4 h-4" isChristmas={isChristmas} />
                      {loggedInUser.balance.toLocaleString()} {config.currencyUnit}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <User
                    className={`w-4 h-4 ${isChristmas ? 'text-red-700' : 'text-amber-600'}`}
                  />
                  <span>이름 로그인</span>
                </>
              )}
            </button>

            {/* Teacher Admin 3D Button */}
            <button
              onClick={onToggleAdminMode}
              className={`px-3.5 py-2.5 rounded-2xl border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isChristmas
                  ? isAdminMode || isTeacher
                    ? 'bg-gradient-to-b from-amber-300 to-amber-500 border-amber-900 text-red-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)]'
                    : 'bg-[#FFFDF9] hover:bg-amber-50 border-red-950/80 text-red-950'
                  : isAdminMode || isTeacher
                  ? 'bg-gradient-to-b from-violet-500 to-purple-600 border-purple-900 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]'
                  : 'bg-white hover:bg-amber-50 border-amber-700/80 text-amber-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdminMode ? '매장 보기' : '관리자'}</span>
            </button>
          </nav>

          {/* Zone 3: Sound & 3D Shopping Cart Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Mobile Kiosk Toggle */}
            <button
              onClick={onToggleKioskMode}
              className={`md:hidden px-3 py-2.5 rounded-2xl border-2 border-b-4 text-white font-black text-xs flex items-center gap-1 active:translate-y-0.5 ${
                isChristmas
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-950'
                  : 'bg-gradient-to-b from-sky-400 to-sky-500 border-sky-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>키오스크</span>
            </button>

            <button
              onClick={onToggleSound}
              title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
              className={`p-2.5 rounded-2xl border-2 border-b-4 active:translate-y-0.5 transition-all cursor-pointer ${
                isChristmas
                  ? 'bg-[#FFFDF9] hover:bg-amber-50 text-red-900 border-red-950/80'
                  : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-700/80'
              }`}
            >
              {soundEnabled ? (
                <Volume2
                  className={`w-4 h-4 ${isChristmas ? 'text-red-700' : 'text-amber-600'}`}
                />
              ) : (
                <VolumeX className="w-4 h-4 text-stone-400" />
              )}
            </button>

            <button
              onClick={onOpenCart}
              className={`px-4 py-2.5 rounded-2xl border-2 border-b-4 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                isChristmas
                  ? 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-red-950 border-amber-900'
                  : 'bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white border-orange-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>장바구니</span>
              <span
                className={`px-2 py-0.5 rounded-xl font-mono tabular-nums font-black text-xs ${
                  isChristmas ? 'bg-red-700 text-white' : 'bg-white text-orange-600'
                }`}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Festive String Lights Garland under Christmas Header Bar */}
        {isChristmas && (
          <div className="px-6 -mt-1.5 pointer-events-none">
            <ChristmasLightsGarland className="w-full h-4 drop-shadow-[0_2px_4px_rgba(253,224,71,0.35)]" />
          </div>
        )}
      </div>
    </header>
  );
};
