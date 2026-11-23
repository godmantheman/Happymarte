import React from 'react';
import {
  Sparkles,
  Cookie,
  PenTool,
  Ticket,
  Gamepad2,
  Gift,
  Music,
  Star,
  Clock,
  ShieldCheck,
  User,
  Crown,
  Heart,
  Zap,
  Smile,
  Award,
  TreePine,
  Snowflake,
  Bell,
  CandyCane,
} from 'lucide-react';
import { isChristmasSeason } from '../utils/seasonTheme';

export type ProductIconKey =
  | 'tree'
  | 'snowman'
  | 'santa'
  | 'candycane'
  | 'wreath'
  | 'bell'
  | 'gingerbread'
  | 'gift'
  | 'choco'
  | 'jelly'
  | 'pencil'
  | 'star'
  | 'ticket'
  | 'music'
  | 'toy';

export const CHRISTMAS_PRODUCT_ICON_OPTIONS: { key: ProductIconKey; label: string }[] = [
  { key: 'tree', label: '크리스마스 트리' },
  { key: 'gift', label: '선물 상자' },
  { key: 'snowman', label: '눈사람' },
  { key: 'santa', label: '산타 모자' },
  { key: 'candycane', label: '지팡이 사탕' },
  { key: 'wreath', label: '리스' },
  { key: 'bell', label: '황금 종' },
  { key: 'gingerbread', label: '진저브레드' },
  { key: 'choco', label: '초코/쿠키' },
  { key: 'jelly', label: '젤리/캔디' },
  { key: 'pencil', label: '학용품/문구' },
  { key: 'star', label: '스타/스티커' },
  { key: 'ticket', label: '시간/할인 쿠폰' },
  { key: 'music', label: '음악/헤드셋' },
  { key: 'toy', label: '장난감/블록' },
];

export const PRODUCT_ICON_OPTIONS: { key: ProductIconKey; label: string }[] = [
  { key: 'choco', label: '초코/쿠키' },
  { key: 'jelly', label: '젤리/캔디' },
  { key: 'pencil', label: '학용품/문구' },
  { key: 'star', label: '스타/스티커' },
  { key: 'ticket', label: '시간/할인 쿠폰' },
  { key: 'music', label: '음악/헤드셋' },
  { key: 'toy', label: '장난감/블록' },
  { key: 'gift', label: '선물 상자' },
];

export function getProductIconOptions(christmas: boolean) {
  return christmas ? CHRISTMAS_PRODUCT_ICON_OPTIONS : PRODUCT_ICON_OPTIONS;
}

export type AvatarKey =
  | 'teacher'
  | 'lion'
  | 'rabbit'
  | 'panda'
  | 'cat'
  | 'star'
  | 'bolt'
  | 'heart';

export const AVATAR_OPTIONS: { key: AvatarKey; label: string }[] = [
  { key: 'lion', label: '골드 엠블럼' },
  { key: 'rabbit', label: '로즈 엠블럼' },
  { key: 'panda', label: '민트 엠블럼' },
  { key: 'cat', label: '스카이 엠블럼' },
  { key: 'star', label: '스타 엠블럼' },
  { key: 'bolt', label: '썬더 엠블럼' },
  { key: 'heart', label: '하트 엠블럼' },
];

export function resolveProductIconKey(
  rawIcon?: string,
  name?: string,
  category?: string
): ProductIconKey {
  const s = `${rawIcon || ''} ${name || ''}`.toLowerCase();
  if (rawIcon === 'tree' || s.includes('트리') || s.includes('🎄')) return 'tree';
  if (rawIcon === 'snowman' || s.includes('눈사람') || s.includes('⛄')) return 'snowman';
  if (rawIcon === 'santa' || s.includes('산타') || s.includes('🎅')) return 'santa';
  if (rawIcon === 'candycane' || s.includes('지팡이') || s.includes('캔디케인')) return 'candycane';
  if (rawIcon === 'wreath' || s.includes('리스')) return 'wreath';
  if (rawIcon === 'bell' || s.includes('종') || s.includes('벨') || s.includes('🔔')) return 'bell';
  if (rawIcon === 'gingerbread' || s.includes('진저') || s.includes('생강')) return 'gingerbread';
  if (rawIcon === 'gift' || s.includes('선물') || s.includes('🎁')) return 'gift';
  if (rawIcon === 'choco' || s.includes('초코') || s.includes('쿠키') || s.includes('🍫')) {
    return 'choco';
  }
  if (rawIcon === 'jelly' || s.includes('젤리') || s.includes('사탕') || s.includes('🍬')) {
    return 'jelly';
  }
  if (rawIcon === 'pencil' || s.includes('지우개') || s.includes('연필') || s.includes('✏️')) {
    return 'pencil';
  }
  if (rawIcon === 'star' || s.includes('스티커') || s.includes('⭐')) {
    return 'star';
  }
  if (rawIcon === 'music' || s.includes('음악') || s.includes('노래') || s.includes('🎵')) {
    return 'music';
  }
  if (rawIcon === 'ticket' || s.includes('쿠폰') || s.includes('시간') || s.includes('⏱️') || s.includes('🎟️')) {
    return 'ticket';
  }
  if (rawIcon === 'toy' || category === '장난감' || s.includes('블록') || s.includes('🧩')) {
    return 'toy';
  }
  if (category === '간식') return 'choco';
  if (category === '문구류') return 'pencil';
  if (category === '특별쿠폰') return 'ticket';
  return 'gift';
}

export function resolveAvatarKey(rawAvatar?: string, isTeacher?: boolean): AvatarKey {
  if (isTeacher || rawAvatar === 'teacher' || rawAvatar === '👩‍🏫') return 'teacher';
  if (rawAvatar === 'lion' || rawAvatar === '🦁') return 'lion';
  if (rawAvatar === 'rabbit' || rawAvatar === '🐰') return 'rabbit';
  if (rawAvatar === 'panda' || rawAvatar === '🐼') return 'panda';
  if (rawAvatar === 'cat' || rawAvatar === '🐱') return 'cat';
  if (rawAvatar === 'bolt' || rawAvatar === '🐶') return 'bolt';
  if (rawAvatar === 'heart' || rawAvatar === '🐥') return 'heart';
  return 'star';
}

/**
 * 3D-shaded Badge for Products (supports custom uploaded imageUrl or 3D icon key)
 */
export const ProductBadgeIcon: React.FC<{
  icon?: string;
  name?: string;
  category?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ icon, name, category, imageUrl, size = 'md' }) => {
  const dims =
    size === 'sm'
      ? 'w-9 h-9 rounded-xl border-b-2'
      : size === 'lg'
      ? 'w-14 h-14 rounded-2xl border-b-4'
      : 'w-11 h-11 rounded-xl border-b-[3px]';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  if (imageUrl) {
    return (
      <div
        className={`${dims} bg-white border-2 border-amber-300 overflow-hidden shrink-0 shadow-sm flex items-center justify-center`}
      >
        <img
          src={imageUrl}
          alt={name || '물품 이미지'}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const key = resolveProductIconKey(icon, name, category);

  switch (key) {
    case 'tree':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-emerald-500 to-green-700 border-green-900 text-amber-200 shadow-[inset_0_2px_0_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0`}
        >
          <TreePine className={iconSize} />
        </div>
      );
    case 'snowman':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-sky-300 to-sky-500 border-sky-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.55)] flex items-center justify-center shrink-0`}
        >
          <Snowflake className={iconSize} />
        </div>
      );
    case 'santa':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-red-500 to-red-700 border-red-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Crown className={iconSize} />
        </div>
      );
    case 'candycane':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-rose-400 to-red-600 border-red-900 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <CandyCane className={iconSize} />
        </div>
      );
    case 'wreath':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-emerald-400 to-emerald-700 border-emerald-950 text-rose-200 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Sparkles className={iconSize} />
        </div>
      );
    case 'bell':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-amber-300 to-amber-500 border-amber-800 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.6)] flex items-center justify-center shrink-0`}
        >
          <Bell className={iconSize} />
        </div>
      );
    case 'gingerbread':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-amber-600 to-amber-800 border-amber-950 text-amber-100 shadow-[inset_0_2px_0_rgba(255,255,255,0.35)] flex items-center justify-center shrink-0`}
        >
          <Cookie className={iconSize} />
        </div>
      );
    case 'choco':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-amber-400 to-amber-600 border-amber-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Cookie className={iconSize} />
        </div>
      );
    case 'jelly':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-pink-400 to-rose-500 border-rose-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Heart className={iconSize} />
        </div>
      );
    case 'pencil':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-sky-400 to-blue-500 border-blue-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <PenTool className={iconSize} />
        </div>
      );
    case 'star':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-yellow-300 to-amber-500 border-amber-600 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] flex items-center justify-center shrink-0`}
        >
          <Star className={`${iconSize} fill-current`} />
        </div>
      );
    case 'ticket':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-violet-400 to-purple-600 border-purple-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Ticket className={iconSize} />
        </div>
      );
    case 'music':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-indigo-400 to-blue-600 border-indigo-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Music className={iconSize} />
        </div>
      );
    case 'toy':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-emerald-400 to-teal-500 border-teal-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Gamepad2 className={iconSize} />
        </div>
      );
    default:
      return (
        <div
          className={`${dims} bg-gradient-to-b from-red-500 to-rose-600 border-red-900 text-amber-200 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
        >
          <Gift className={iconSize} />
        </div>
      );
  }
};

/**
 * 3D-shaded Tactile Avatar Badge for Students and Teacher
 */
export const AvatarBadgeIcon: React.FC<{
  avatar?: string;
  isTeacher?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ avatar, isTeacher, size = 'md' }) => {
  const key = resolveAvatarKey(avatar, isTeacher);
  const christmas = isChristmasSeason();
  const dims =
    size === 'sm'
      ? 'w-8 h-8 rounded-xl border-b-2'
      : size === 'lg'
      ? 'w-12 h-12 rounded-2xl border-b-4'
      : 'w-10 h-10 rounded-xl border-b-[3px]';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  switch (key) {
    case 'teacher':
      return (
        <div
          className={`${dims} ${
            christmas
              ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-950 text-amber-300'
              : 'bg-gradient-to-b from-violet-500 to-purple-700 border-purple-900 text-amber-300'
          } shadow-[inset_0_2px_0_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0`}
        >
          <Crown className={iconSize} />
        </div>
      );
    case 'lion':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-amber-400 to-orange-500 border-orange-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <Award className={iconSize} />
        </div>
      );
    case 'rabbit':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-pink-400 to-rose-500 border-rose-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <Sparkles className={iconSize} />
        </div>
      );
    case 'panda':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-emerald-400 to-teal-500 border-teal-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <Smile className={iconSize} />
        </div>
      );
    case 'cat':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-sky-400 to-blue-500 border-blue-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <Star className={iconSize} />
        </div>
      );
    case 'bolt':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-yellow-300 to-amber-500 border-amber-700 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.6)] flex items-center justify-center shrink-0`}
        >
          <Zap className={iconSize} />
        </div>
      );
    case 'heart':
      return (
        <div
          className={`${dims} bg-gradient-to-b from-rose-400 to-red-500 border-red-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <Heart className={iconSize} />
        </div>
      );
    default:
      return (
        <div
          className={`${dims} bg-gradient-to-b from-sky-400 to-indigo-500 border-indigo-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)] flex items-center justify-center shrink-0`}
        >
          <User className={iconSize} />
        </div>
      );
  }
};

/**
 * 3D Coin SVG Icon:
 * - Christmas Season: Gleaming Gold & Crimson Christmas Money (CM) Snowflake Coin
 * - Regular Season: Golden Star Coin
 */
export const Coin3DIcon: React.FC<{ className?: string; isChristmas?: boolean }> = ({
  className = 'w-5 h-5',
  isChristmas = isChristmasSeason(),
}) => {
  if (isChristmas) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className}>
        <defs>
          <radialGradient id="cmCoinGrad" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#B45309" />
          </radialGradient>
        </defs>
        {/* 3D Extruded Edge */}
        <circle cx="16" cy="17.8" r="13.5" fill="#7F1D1D" />
        {/* Main Gold Face with Crimson Trim */}
        <circle cx="16" cy="15.4" r="13.5" fill="url(#cmCoinGrad)" stroke="#DC2626" strokeWidth="1.9" />
        <circle cx="16" cy="15.4" r="10.4" stroke="#FEF3C7" strokeWidth="1.1" strokeDasharray="2.5 1.8" />
        {/* Embossed CM Text */}
        <text
          x="16"
          y="19"
          textAnchor="middle"
          fill="#7F1D1D"
          fontSize="10.2"
          fontWeight="900"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          CM
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <radialGradient id="coinGrad3D" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="17.5" r="13.5" fill="#92400E" />
      <circle cx="16" cy="15.5" r="13.5" fill="url(#coinGrad3D)" stroke="#FEF3C7" strokeWidth="1.8" />
      <circle cx="16" cy="15.5" r="10" stroke="#B45309" strokeWidth="1.2" strokeDasharray="2.5 2" />
      <path
        d="M16 9.2L17.9 13.1L22.2 13.7L19.1 16.7L19.8 21L16 19L12.2 21L12.9 16.7L9.8 13.7L14.1 13.1L16 9.2Z"
        fill="#FFFBEB"
      />
    </svg>
  );
};

/**
 * 3D Isometric Storefront Logo SVG Icon:
 * - Christmas Season: Snow-Roofed Alpine Christmas Market Chalet with Wreath & Glowing Window
 * - Regular Season: Bright Happy Mart Storefront
 */
export const Store3DLogo: React.FC<{ className?: string; isChristmas?: boolean }> = ({
  className = 'w-9 h-9',
  isChristmas = isChristmasSeason(),
}) => {
  if (isChristmas) {
    return (
      <svg viewBox="0 0 44 44" fill="none" className={className}>
        <defs>
          <linearGradient id="xmasWall" x1="0" y1="18" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#5C2808" />
          </linearGradient>
          <linearGradient id="xmasRoof" x1="0" y1="5" x2="0" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id="xmasGlow" x1="0" y1="22" x2="0" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        {/* 3D Base Shadow */}
        <rect x="6" y="21" width="32" height="19" rx="5" fill="#451A03" />
        {/* Timber Chalet Wall */}
        <rect x="6" y="18" width="32" height="19" rx="5" fill="url(#xmasWall)" stroke="#D97706" strokeWidth="1.5" />
        {/* Warm Glowing Market Counter Window */}
        <rect x="12" y="23" width="20" height="10.5" rx="3" fill="url(#xmasGlow)" stroke="#FEF3C7" strokeWidth="1.4" />
        <line x1="22" y1="23" x2="22" y2="33.5" stroke="#92400E" strokeWidth="1.4" />
        {/* Red-White Festive Pitched Awning */}
        <path d="M3.5 18.5L22 5.5L40.5 18.5H3.5Z" fill="url(#xmasRoof)" stroke="#7F1D1D" strokeWidth="1.4" />
        {/* Snow Drift Cap along Roof */}
        <path
          d="M3 18.5C7 14 14 8.5 22 5.2C30 8.5 37 14 41 18.5C38.5 20.4 35.5 19.6 33.5 18.2C31.5 19.8 28.5 19.8 26.5 18.2C24.5 19.8 20.5 19.8 18.5 18.2C16.5 19.8 13.5 19.8 11.5 18.2C9.5 19.8 6 20.4 3 18.5Z"
          fill="#FFFFFF"
        />
        {/* Mini Evergreen Wreath with Red Ribbon */}
        <circle cx="22" cy="13.5" r="3.4" fill="#15803D" stroke="#FEF08A" strokeWidth="1.2" />
        <circle cx="22" cy="13.5" r="1.4" fill="#B91C1C" />
        <circle cx="22" cy="10.5" r="1.1" fill="#EF4444" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 44 44" fill="none" className={className}>
      <defs>
        <linearGradient id="storeWall" x1="0" y1="16" x2="0" y2="39" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FDE68A" />
        </linearGradient>
        <linearGradient id="storeRoof" x1="0" y1="6" x2="0" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      <rect x="6" y="20" width="32" height="20" rx="6" fill="#D97706" />
      <rect x="6" y="17" width="32" height="20" rx="6" fill="url(#storeWall)" stroke="#F59E0B" strokeWidth="2" />
      <path d="M4 16C4 11 8 7 13 7H31C36 7 40 11 40 16V19H4V16Z" fill="url(#storeRoof)" />
      <rect x="11" y="7" width="5" height="12" fill="#FFF1F2" rx="1" />
      <rect x="21" y="7" width="5" height="12" fill="#FFF1F2" rx="1" />
      <rect x="31" y="7" width="4" height="12" fill="#FFF1F2" rx="1" />
      <rect x="17" y="24" width="10" height="13" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      <circle cx="24" cy="30.5" r="1.2" fill="#FFFBEB" />
    </svg>
  );
};

/**
 * Festive Static String Lights Garland SVG for Christmas Header Edge
 */
export const ChristmasLightsGarland: React.FC<{ className?: string }> = ({
  className = 'w-full h-4',
}) => (
  <svg
    viewBox="0 0 1200 22"
    fill="none"
    preserveAspectRatio="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M0 3 Q 75 14 150 3 T 300 3 T 450 3 T 600 3 T 750 3 T 900 3 T 1050 3 T 1200 3"
      stroke="#14532D"
      strokeWidth="2.5"
      fill="none"
    />
    {[
      { x: 50, y: 11, c: '#FDE047' },
      { x: 110, y: 10, c: '#FB7185' },
      { x: 185, y: 10, c: '#4ADE80' },
      { x: 255, y: 11, c: '#FDE047' },
      { x: 340, y: 11, c: '#7DD3FC' },
      { x: 415, y: 10, c: '#FB7185' },
      { x: 495, y: 11, c: '#FDE047' },
      { x: 565, y: 10, c: '#4ADE80' },
      { x: 645, y: 11, c: '#FB7185' },
      { x: 720, y: 10, c: '#FDE047' },
      { x: 795, y: 11, c: '#7DD3FC' },
      { x: 870, y: 10, c: '#4ADE80' },
      { x: 945, y: 11, c: '#FDE047' },
      { x: 1020, y: 10, c: '#FB7185' },
      { x: 1095, y: 11, c: '#4ADE80' },
      { x: 1160, y: 10, c: '#FDE047' },
    ].map((bulb, i) => (
      <g key={i}>
        <rect x={bulb.x - 2} y={bulb.y - 4} width="4" height="3.5" rx="1" fill="#166534" />
        <ellipse cx={bulb.x} cy={bulb.y + 2.5} rx="4" ry="5.5" fill={bulb.c} />
        <ellipse cx={bulb.x - 1} cy={bulb.y + 1} rx="1.2" ry="1.8" fill="#FFFFFF" opacity="0.7" />
      </g>
    ))}
  </svg>
);

export { Clock, ShieldCheck };
