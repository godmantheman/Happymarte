import React, { useState } from 'react';
import { CartItem, Student, StoreConfig } from '../types';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
  User,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playPurchaseSuccessSound } from '../utils/audio';
import { AvatarBadgeIcon, Coin3DIcon, ProductBadgeIcon } from './Icons3D';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  selectedStudent: Student | null;
  onOpenStudentSelector: () => void;
  config: StoreConfig;
  onSubmitOrder: (student: Student, memo: string) => Promise<void>;
  onOpenOrderHistory: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedStudent,
  onOpenStudentSelector,
  config,
  onSubmitOrder,
  onOpenOrderHistory,
}) => {
  const [guestName, setGuestName] = useState('');
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [submittedStudentName, setSubmittedStudentName] = useState('');

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const isGuestMode = !selectedStudent;
  const studentBalance = selectedStudent?.balance || 0;
  const isBalanceEnough = isGuestMode ? true : studentBalance >= totalAmount;
  const shortage = totalAmount - studentBalance;

  const canCheckout =
    items.length > 0 &&
    (Boolean(selectedStudent) || guestName.trim().length > 0) &&
    isBalanceEnough;

  const handleCheckout = async () => {
    if (!canCheckout) return;

    const buyerName = selectedStudent ? selectedStudent.name : guestName.trim();
    if (!buyerName) return;

    const studentToSubmit: Student = selectedStudent || {
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

      setSubmittedStudentName(buyerName);
      playPurchaseSuccessSound();
      confetti({
        particleCount: 80,
        spread: 65,
        origin: { y: 0.6 },
      });

      setSuccessOrderId('SUCCESS');
      setMemo('');
      setGuestName('');
      onClearCart();
    } catch (err) {
      console.error('Order checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-sky-950/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="bg-[#FFFDF7] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l-4 border-amber-300">
        {/* 3D Tactile Header */}
        <div className="p-5 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 text-amber-950 flex items-center justify-between border-b-[6px] border-amber-700 shadow-[inset_0_3px_0_rgba(255,255,255,0.75)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white border-2 border-b-4 border-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-black">장바구니</h2>
          </div>
          <button
            onClick={() => {
              setSuccessOrderId(null);
              onClose();
            }}
            className="p-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 border-2 border-b-4 border-amber-700 active:translate-y-0.5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successOrderId ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 border-2 border-b-4 border-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-stone-900">
              주문 신청 완료
            </h3>
            <p className="text-xs font-bold text-stone-500">
              신청자: <strong className="text-stone-800">{submittedStudentName}</strong>
            </p>
            <div className="flex flex-col w-full space-y-2.5 pt-3">
              <button
                onClick={() => {
                  setSuccessOrderId(null);
                  onClose();
                  onOpenOrderHistory();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-500 border-2 border-b-4 border-sky-700 text-white font-black text-sm flex items-center justify-center gap-2 active:translate-y-0.5"
              >
                <span>주문 내역 보기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSuccessOrderId(null);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-white border-2 border-b-4 border-stone-300 text-stone-700 font-black text-sm active:translate-y-0.5"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Buyer Identity */}
            {selectedStudent ? (
              <div className="p-4 rounded-3xl bg-white border-2 border-b-[5px] border-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AvatarBadgeIcon
                    avatar={selectedStudent.avatar}
                    isTeacher={selectedStudent.role === 'TEACHER'}
                    size="md"
                  />
                  <div>
                    <span className="text-sm font-black text-stone-900 block">
                      {selectedStudent.name}
                    </span>
                    <span className="text-xs font-bold text-amber-700 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                      <Coin3DIcon className="w-3.5 h-3.5" />
                      잔액 {selectedStudent.balance.toLocaleString()}{config.currencyUnit}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onOpenStudentSelector}
                  className="px-3.5 py-2 rounded-2xl bg-sky-100 hover:bg-sky-200 border-2 border-b-4 border-sky-300 text-sky-900 font-black text-xs active:translate-y-0.5"
                >
                  변경
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-white border-2 border-b-[5px] border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>주문자 이름 입력 (게스트 결제)</span>
                  </label>
                  <button
                    onClick={onOpenStudentSelector}
                    className="text-xs font-black text-sky-700 hover:underline"
                  >
                    계정 로그인
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="이름 입력"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-300 focus:border-amber-500 focus:outline-hidden font-black text-sm text-stone-900 bg-amber-50/40"
                />
              </div>
            )}

            {/* Cart Items List */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-amber-100 border-2 border-b-4 border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-stone-500 font-black text-sm">
                  장바구니가 비어 있습니다
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500 font-black">
                  <span>담은 물품 ({items.length})</span>
                  <button
                    onClick={onClearCart}
                    className="text-rose-500 hover:underline"
                  >
                    전체 삭제
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-3xl border-2 border-b-[5px] border-amber-200 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductBadgeIcon
                        icon={item.product.emoji}
                        name={item.product.name}
                        category={item.product.category}
                        imageUrl={item.product.imageUrl}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-xs font-black font-mono tabular-nums text-amber-700">
                          {(item.product.price * item.quantity).toLocaleString()}
                          {config.currencyUnit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-2xl p-1">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white border border-b-2 border-amber-300 text-stone-700 active:translate-y-0.5"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black font-mono tabular-nums text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white border border-b-2 border-amber-300 text-stone-700 disabled:opacity-30 active:translate-y-0.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-500 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="요청 메모 (선택)"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-stone-200 bg-white focus:outline-hidden focus:border-amber-400 text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checkout Footer */}
        {!successOrderId && (
          <div className="p-5 bg-white border-t-4 border-amber-200 space-y-4">
            <div className="space-y-1.5 text-xs font-bold">
              <div className="flex justify-between text-stone-600">
                <span>수량</span>
                <span className="font-black font-mono tabular-nums text-stone-900">
                  {items.reduce((s, i) => s + i.quantity, 0)}개
                </span>
              </div>

              {!isGuestMode && (
                <>
                  <div className="flex justify-between text-stone-600">
                    <span>보유 잔액</span>
                    <span className="font-black font-mono tabular-nums text-stone-900">
                      {studentBalance.toLocaleString()}{config.currencyUnit}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-stone-200">
                    <span>결제 후 잔액</span>
                    <span
                      className={`font-black font-mono tabular-nums text-sm ${
                        isBalanceEnough ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {(studentBalance - totalAmount).toLocaleString()}
                      {config.currencyUnit}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!isGuestMode && !isBalanceEnough && totalAmount > 0 && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-black">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  잔액이 {shortage.toLocaleString()}{config.currencyUnit} 부족합니다.
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={!canCheckout || isSubmitting}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm border-2 border-b-[5px] flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
                !canCheckout
                  ? 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 border-emerald-800 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
              }`}
            >
              {isSubmitting ? (
                <span>처리 중...</span>
              ) : isGuestMode && !guestName.trim() ? (
                <span>이름을 입력해주세요</span>
              ) : (
                <span>결제 신청하기</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
