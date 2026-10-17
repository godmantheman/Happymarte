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
import { AvatarBadgeIcon, Coin3DIcon, Store3DLogo } from './Icons3D';

interface HeaderProps {
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

  return (
    <header className="sticky top-0 z-40 pt-2.5 px-3 sm:px-6">
      {/* 3D Floating Top Bar */}
      <div className="max-w-[1360px] mx-auto bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 rounded-3xl px-4 sm:px-6 h-20 border-2 border-amber-200 border-b-[7px] border-b-amber-700 shadow-[0_10px_24px_rgba(217,119,6,0.22),inset_0_3px_0_rgba(255,255,255,0.75)] flex items-center justify-between gap-4">
        {/* Zone 1: 3D Brand Logo & Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onScrollToSection?.('top');
          }}
          className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white border-2 border-b-4 border-amber-700 flex items-center justify-center shadow-sm group-hover:-translate-y-0.5 transition-transform">
            <Store3DLogo className="w-9 h-9" />
          </div>
          <span className="text-2xl font-black tracking-tight text-amber-950 drop-shadow-[0_2px_0_rgba(255,255,255,0.7)]">
            행복마트
          </span>
        </a>

        {/* Zone 2: 3D Tactile Navigation & Kiosk Toggle Buttons */}
        <nav className="hidden md:flex items-center gap-2.5 text-xs sm:text-sm font-black">
          {/* Kiosk GUI Mode Toggle Button */}
          <button
            onClick={onToggleKioskMode}
            className={`px-4 py-2.5 rounded-2xl border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer ${
              isKioskMode
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
            className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border-2 border-b-4 border-amber-700/80 flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>주문 내역</span>
            {pendingOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-lg bg-rose-500 text-white text-xs font-mono tabular-nums">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {/* User / Login 3D Button */}
          <button
            onClick={onOpenLoginModal}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border-2 border-b-4 border-amber-700/80 flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
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
                  <span className="flex items-center gap-1 text-amber-700 font-mono tabular-nums pl-1.5 border-l border-amber-200">
                    <Coin3DIcon className="w-4 h-4" />
                    {loggedInUser.balance.toLocaleString()}
                    {config.currencyUnit}
                  </span>
                )}
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-amber-600" />
                <span>이름 로그인</span>
              </>
            )}
          </button>

          {/* Teacher Admin 3D Button */}
          <button
            onClick={onToggleAdminMode}
            className={`px-3.5 py-2.5 rounded-2xl border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer ${
              isAdminMode || isTeacher
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
            className="md:hidden px-3 py-2.5 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-500 border-2 border-b-4 border-sky-700 text-white font-black text-xs flex items-center gap-1 active:translate-y-0.5"
          >
            <Monitor className="w-4 h-4" />
            <span>키오스크</span>
          </button>

          <button
            onClick={onToggleSound}
            title={soundEnabled ? '효과음 켜짐' : '효과음 꺼짐'}
            className="p-2.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-b-4 border-amber-700/80 active:translate-y-0.5 transition-all"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            onClick={onOpenCart}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white border-2 border-b-4 border-orange-800 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>장바구니</span>
            <span className="px-2 py-0.5 rounded-xl bg-white text-orange-600 font-mono tabular-nums font-black text-xs">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
