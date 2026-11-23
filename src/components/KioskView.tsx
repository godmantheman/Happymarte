import React, { useState } from 'react';
import { Product, CartItem, Student, StoreConfig } from '../types';
import { Product3DCanvas } from './Product3DCanvas';
import { AvatarBadgeIcon, Coin3DIcon, ProductBadgeIcon, Store3DLogo } from './Icons3D';
import {
  Plus,
  Minus,
  Trash2,
  Volume2,
  CheckCircle2,
  Monitor,
  User,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import { playCartSound, playPurchaseSuccessSound, speakText } from '../utils/audio';
import {
  CHRISTMAS_CONFETTI_COLORS,
  getKioskBrandName,
  getSpokenCurrencyUnit,
} from '../utils/seasonTheme';
import confetti from 'canvas-confetti';

interface KioskViewProps {
  isChristmas: boolean;
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  loggedInUser: Student | null;
  onOpenLoginModal: () => void;
  config: StoreConfig;
  onSubmitOrder: (student: Student, memo: string) => Promise<void>;
  onExitKiosk: () => void;
}

export const KioskView: React.FC<KioskViewProps> = ({
  isChristmas,
  products,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  loggedInUser,
  onOpenLoginModal,
  config,
  onSubmitOrder,
  onExitKiosk,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleteName, setOrderCompleteName] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === '전체') return true;
    return p.category === selectedCategory;
  });

  const totalCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const isGuestMode = !loggedInUser;
  const studentBalance = loggedInUser?.balance || 0;
  const isBalanceEnough = isGuestMode ? true : studentBalance >= totalAmount;

  const handleTapProduct = (prod: Product) => {
    if (prod.stock <= 0 || !prod.isAvailable || !config.isOpen) return;
    playCartSound();
    onAddToCart(prod);
  };

  const handleOpenKioskCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckoutModalOpen(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const buyerName = loggedInUser ? loggedInUser.name : guestName.trim();
    if (!buyerName || !isBalanceEnough) return;

    const studentToSubmit: Student = loggedInUser || {
      id: 'guest',
      name: buyerName,
      role: 'STUDENT',
      grade: '게스트',
      classroom: '특수학급',
      balance: 0,
      avatar: 'star',
    };

    try {
      setIsSubmitting(true);
      await onSubmitOrder(studentToSubmit, memo);
      playPurchaseSuccessSound();
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        ...(isChristmas ? { colors: CHRISTMAS_CONFETTI_COLORS } : {}),
      });
      setOrderCompleteName(buyerName);
      setGuestName('');
      setMemo('');
      onClearCart();
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-92px)] p-2 sm:p-5 flex flex-col items-center justify-center select-none ${
        isChristmas
          ? 'bg-transparent'
          : 'bg-gradient-to-b from-sky-200 via-sky-100 to-amber-100'
      }`}
    >
      {/* 3D Physical Kiosk Machine Outer Bezel */}
      <div
        className={`w-full max-w-[1280px] min-h-[86vh] rounded-[36px] p-3 sm:p-4 border-4 border-b-[12px] flex flex-col ${
          isChristmas
            ? 'bg-gradient-to-b from-red-600 via-red-700 to-rose-800 border-amber-300/90 border-b-red-950 shadow-[0_28px_60px_rgba(0,0,0,0.55),inset_0_4px_0_rgba(255,255,255,0.4)]'
            : 'bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 border-amber-200 border-b-amber-700 shadow-[0_24px_50px_rgba(180,83,9,0.28),inset_0_4px_0_rgba(255,255,255,0.75)]'
        }`}
      >
        {/* Inner Kiosk Screen */}
        <div
          className={`flex-1 bg-[#FFFDF9] rounded-[28px] border-4 overflow-hidden flex flex-col justify-between shadow-inner ${
            isChristmas ? 'border-red-950/35' : 'border-amber-600/30'
          }`}
        >
          {/* 1. Kiosk Top 3D Header */}
          <div
            className={`border-b-[6px] px-5 py-3.5 text-white flex flex-wrap items-center justify-between gap-3 shadow-[inset_0_3px_0_rgba(255,255,255,0.4)] ${
              isChristmas
                ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-950'
                : 'bg-gradient-to-b from-sky-400 to-sky-500 border-sky-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl bg-white border-2 border-b-4 flex items-center justify-center shadow-sm ${
                  isChristmas ? 'border-emerald-950' : 'border-sky-700'
                }`}
              >
                <Store3DLogo className="w-8 h-8" isChristmas={isChristmas} />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs">
                {getKioskBrandName(isChristmas)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Current User / Balance Button */}
              <button
                onClick={onOpenLoginModal}
                className={`px-3.5 py-2 rounded-2xl bg-white hover:bg-amber-50 border-2 border-b-4 font-black text-xs sm:text-sm flex items-center gap-2 active:translate-y-0.5 transition-all cursor-pointer ${
                  isChristmas
                    ? 'text-red-950 border-emerald-950'
                    : 'text-sky-950 border-sky-700'
                }`}
              >
                {loggedInUser ? (
                  <>
                    <AvatarBadgeIcon
                      avatar={loggedInUser.avatar}
                      isTeacher={loggedInUser.role === 'TEACHER'}
                      size="sm"
                    />
                    <span>{loggedInUser.name}</span>
                    {loggedInUser.role !== 'TEACHER' && (
                      <span
                        className={`flex items-center gap-1 font-mono tabular-nums pl-1.5 border-l ${
                          isChristmas
                            ? 'text-red-700 border-amber-200'
                            : 'text-amber-600 border-sky-200'
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
                      className={`w-4 h-4 ${isChristmas ? 'text-red-700' : 'text-sky-600'}`}
                    />
                    <span>이름 로그인</span>
                  </>
                )}
              </button>

              {/* Toggle Back to Standard Store GUI */}
              <button
                onClick={onExitKiosk}
                className={`px-4 py-2 rounded-2xl border-2 border-b-4 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.65)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isChristmas
                    ? 'bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-red-950 border-amber-900'
                    : 'bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 border-amber-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>키오스크 끄기</span>
              </button>
            </div>
          </div>

          {/* 2. Kiosk 3D Category Touch Bar */}
          <div
            className={`border-b-4 px-5 py-3 flex items-center gap-2.5 overflow-x-auto ${
              isChristmas
                ? 'bg-red-50/90 border-amber-200'
                : 'bg-amber-100/80 border-amber-200'
            }`}
          >
            {(['전체', '간식', '문구류', '특별쿠폰', '장난감', '기타'] as const).map(
              (cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl font-black text-sm sm:text-base whitespace-nowrap shrink-0 border-2 border-b-[5px] transition-all active:translate-y-0.5 cursor-pointer ${
                      active
                        ? isChristmas
                          ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]'
                          : 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
                        : isChristmas
                        ? 'bg-white hover:bg-amber-50 border-amber-300 text-red-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]'
                        : 'bg-white hover:bg-amber-50 border-amber-300 text-amber-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              }
            )}
          </div>

          {/* 3. Kiosk Main Touch Product Grid */}
          <div className="flex-1 p-5 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center space-y-2.5">
                <div
                  className={`w-16 h-16 rounded-3xl border-2 border-b-4 flex items-center justify-center ${
                    isChristmas
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-amber-100 border-amber-300 text-amber-600'
                  }`}
                >
                  <Package className="w-8 h-8" />
                </div>
                <p className="text-base font-black text-stone-700">등록된 물품이 없습니다</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock <= 0 || !prod.isAvailable;
                  const cartItem = cart.find((c) => c.product.id === prod.id);
                  const qty = cartItem?.quantity || 0;
                  const hasCustomImage = Boolean(prod.imageUrl);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleTapProduct(prod)}
                      className={`relative rounded-3xl p-4 border-2 border-b-[7px] transition-all flex flex-col justify-between cursor-pointer active:translate-y-1 ${
                        isOutOfStock
                          ? 'bg-stone-100 border-stone-300 opacity-60 cursor-not-allowed'
                          : qty > 0
                          ? isChristmas
                            ? 'bg-amber-50 border-emerald-600 shadow-lg'
                            : 'bg-amber-50 border-orange-500 shadow-lg'
                          : isChristmas
                          ? 'bg-white hover:bg-red-50/40 border-amber-200 hover:border-red-400 shadow-md'
                          : 'bg-white hover:bg-sky-50/40 border-sky-200 hover:border-sky-400 shadow-md'
                      }`}
                    >
                      {qty > 0 && (
                        <div className="absolute -top-2.5 -right-2.5 z-20 px-3 py-1 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 border-2 border-b-4 border-emerald-950 text-white font-black text-xs font-mono tabular-nums shadow-md">
                          {qty}개 선택됨
                        </div>
                      )}

                      {/* 3D Product Canvas */}
                      <div
                        className={`relative w-full h-36 sm:h-40 rounded-2xl border-2 mb-3 overflow-hidden ${
                          isChristmas
                            ? hasCustomImage
                              ? 'bg-[#FFFDF9] border-amber-200'
                              : 'bg-gradient-to-b from-[#0E2439] via-[#15354E] to-[#1D4B43] border-amber-300/60'
                            : 'bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 border-sky-200/80'
                        }`}
                      >
                        <Product3DCanvas
                          iconKey={prod.emoji}
                          name={prod.name}
                          category={prod.category}
                          imageUrl={prod.imageUrl}
                          isChristmas={isChristmas}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const spokenUnit = getSpokenCurrencyUnit(config.currencyUnit);
                            speakText(`${prod.name}. ${prod.price} ${spokenUnit}.`);
                          }}
                          className={`absolute top-2 right-2 z-20 p-1.5 rounded-xl bg-white hover:bg-amber-50 border shadow-xs cursor-pointer ${
                            isChristmas
                              ? 'text-red-800 border-amber-300'
                              : 'text-sky-700 border-sky-300'
                          }`}
                          title="음성 듣기"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="font-black text-stone-900 text-sm sm:text-base line-clamp-1">
                          {prod.name}
                        </h3>
                        <div className="flex items-center justify-center gap-1">
                          <Coin3DIcon className="w-4 h-4" isChristmas={isChristmas} />
                          <span
                            className={`font-black font-mono tabular-nums text-base sm:text-lg ${
                              isChristmas ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            {prod.price.toLocaleString()}
                          </span>
                          <span className="text-xs font-black text-stone-500">
                            {config.currencyUnit}
                          </span>
                        </div>
                        <div className="text-2xs font-bold text-stone-400 tabular-nums">
                          {isOutOfStock ? '품절' : `남은 수량 ${prod.stock}개`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Kiosk Bottom 3D Order Tray & Big Checkout Button */}
          <div
            className={`border-t-4 p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 ${
              isChristmas
                ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-amber-300'
                : 'bg-gradient-to-b from-stone-100 to-stone-200 border-stone-300'
            }`}
          >
            {/* Selected Items Tray */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl border-2 border-amber-200 p-3 flex items-center gap-3 overflow-x-auto min-h-[82px]">
              {cart.length === 0 ? (
                <div className="w-full text-center text-sm font-black text-stone-400">
                  위 화면에서 물품을 터치해 담아주세요
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-amber-50 border-2 border-b-4 border-amber-300 shrink-0"
                  >
                    <ProductBadgeIcon
                      icon={item.product.emoji}
                      name={item.product.name}
                      category={item.product.category}
                      imageUrl={item.product.imageUrl}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-black text-stone-900 max-w-[100px] truncate">
                        {item.product.name}
                      </div>
                      <div
                        className={`text-2xs font-bold font-mono tabular-nums ${
                          isChristmas ? 'text-red-700' : 'text-amber-700'
                        }`}
                      >
                        {(item.product.price * item.quantity).toLocaleString()}{' '}
                        {config.currencyUnit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded-xl bg-white border border-b-2 border-stone-300 flex items-center justify-center text-stone-700 active:translate-y-0.5 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-black font-mono tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-7 h-7 rounded-xl bg-white border border-b-2 border-stone-300 flex items-center justify-center text-stone-700 disabled:opacity-40 active:translate-y-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1 text-stone-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Right Total & Big Kiosk Payment Button */}
            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-stone-500 tabular-nums">
                  총 {totalCount}개 선택
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Coin3DIcon className="w-6 h-6" isChristmas={isChristmas} />
                  <span className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-stone-900">
                    {totalAmount.toLocaleString()}
                  </span>
                  <span
                    className={`text-sm font-black ${
                      isChristmas ? 'text-red-700' : 'text-stone-600'
                    }`}
                  >
                    {config.currencyUnit}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="px-4 py-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 border-2 border-b-[5px] border-rose-300 font-black text-xs sm:text-sm active:translate-y-0.5 cursor-pointer"
                >
                  전체 취소
                </button>
              )}

              <button
                onClick={handleOpenKioskCheckout}
                disabled={cart.length === 0 || !config.isOpen}
                className={`px-7 py-4 rounded-2xl font-black text-base sm:text-lg border-2 border-b-[6px] transition-all active:translate-y-1 whitespace-nowrap shrink-0 cursor-pointer ${
                  cart.length === 0 || !config.isOpen
                    ? 'bg-stone-300 border-stone-400 text-stone-500 cursor-not-allowed'
                    : isChristmas
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 border-emerald-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]'
                    : 'bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 border-emerald-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
                }`}
              >
                주문 결제하기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kiosk Checkout Confirmation Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65">
          <div
            className={`bg-white rounded-[32px] max-w-md w-full p-6 border-4 border-b-[10px] shadow-2xl space-y-5 ${
              isChristmas ? 'border-amber-400 border-b-red-950' : 'border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-stone-900">키오스크 결제 확인</h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {loggedInUser ? (
                <div
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between ${
                    isChristmas
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarBadgeIcon avatar={loggedInUser.avatar} size="md" />
                    <div>
                      <div className="font-black text-stone-900">{loggedInUser.name}</div>
                      <div
                        className={`text-xs font-bold font-mono tabular-nums ${
                          isChristmas ? 'text-emerald-800' : 'text-sky-700'
                        }`}
                      >
                        보유 잔액: {loggedInUser.balance.toLocaleString()}{' '}
                        {config.currencyUnit}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-black text-stone-800">
                    주문자 이름 입력
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="이름을 적어주세요"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-amber-300 focus:border-red-500 focus:outline-hidden font-black text-base text-stone-900"
                  />
                </div>
              )}

              <div>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="요청사항 메모 (선택)"
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-stone-200 text-xs font-bold"
                />
              </div>

              {!isGuestMode && !isBalanceEnough && (
                <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs font-black flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>잔액이 부족합니다.</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
                <span className="text-sm font-black text-amber-950">총 결제 금액</span>
                <span
                  className={`text-2xl font-black font-mono tabular-nums ${
                    isChristmas ? 'text-red-700' : 'text-amber-700'
                  }`}
                >
                  {totalAmount.toLocaleString()} {config.currencyUnit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-b-4 border-stone-300 font-black text-sm text-stone-700 active:translate-y-0.5 cursor-pointer"
                >
                  이전으로
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (!loggedInUser && !guestName.trim()) ||
                    !isBalanceEnough
                  }
                  className="py-3.5 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 disabled:opacity-50 border-2 border-b-4 border-emerald-950 font-black text-sm text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-0.5 cursor-pointer"
                >
                  {isSubmitting ? '전송 중...' : '결제 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kiosk Order Success Modal */}
      {orderCompleteName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65">
          <div className="bg-white rounded-[32px] max-w-sm w-full p-7 border-4 border-b-[10px] border-emerald-600 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 border-2 border-b-4 border-emerald-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-stone-900">주문 완료!</h3>
            <p className="text-sm font-bold text-stone-600">
              {orderCompleteName} 님의 주문이 선생님께 전달되었습니다.
            </p>
            <button
              onClick={() => setOrderCompleteName(null)}
              className={`w-full py-3.5 rounded-2xl border-2 border-b-4 text-white font-black text-base active:translate-y-0.5 cursor-pointer ${
                isChristmas
                  ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-950'
                  : 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-700'
              }`}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
