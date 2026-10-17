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
} from 'lucide-react';

export type ProductIconKey =
  | 'choco'
  | 'jelly'
  | 'pencil'
  | 'star'
  | 'ticket'
  | 'music'
  | 'toy'
  | 'gift';

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
          className={`${dims} bg-gradient-to-b from-orange-400 to-rose-500 border-rose-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] flex items-center justify-center shrink-0`}
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
          className={`${dims} bg-gradient-to-b from-violet-500 to-purple-700 border-purple-900 text-amber-300 shadow-[inset_0_2px_0_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0`}
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
 * 3D Golden Coin SVG Icon
 */
export const Coin3DIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
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

/**
 * 3D Isometric Storefront Logo SVG Icon (Bright Toy Store Style)
 */
export const Store3DLogo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
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
    {/* 3D Base Shadow */}
    <rect x="6" y="20" width="32" height="20" rx="6" fill="#D97706" />
    {/* Store Body */}
    <rect x="6" y="17" width="32" height="20" rx="6" fill="url(#storeWall)" stroke="#F59E0B" strokeWidth="2" />
    {/* 3D Awning */}
    <path d="M4 16C4 11 8 7 13 7H31C36 7 40 11 40 16V19H4V16Z" fill="url(#storeRoof)" />
    {/* Awning Stripes */}
    <rect x="11" y="7" width="5" height="12" fill="#FFF1F2" rx="1" />
    <rect x="21" y="7" width="5" height="12" fill="#FFF1F2" rx="1" />
    <rect x="31" y="7" width="4" height="12" fill="#FFF1F2" rx="1" />
    {/* Door & Window */}
    <rect x="17" y="24" width="10" height="13" rx="3" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
    <circle cx="24" cy="30.5" r="1.2" fill="#FFFBEB" />
  </svg>
);

export { Clock, ShieldCheck };
