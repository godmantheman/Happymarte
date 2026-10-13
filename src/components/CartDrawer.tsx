import React, { useState } from 'react';
import { CartItem, Student, StoreConfig } from '../types';
import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playPurchaseSuccessSound } from '../utils/audio';

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
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const studentBalance = selectedStudent?.balance || 0;
  const isBalanceEnough = selectedStudent ? studentBalance >= totalAmount : false;
  const shortage = totalAmount - studentBalance;

  const handleCheckout = async () => {
    if (!selectedStudent) {
      onOpenStudentSelector();
      return;
    }

    if (!isBalanceEnough) {
      return;
    }

    if (items.length === 0) return;

    try {
      setIsSubmitting(true);
      await onSubmitOrder(selectedStudent, memo);

      // Play joyful sound & Confetti
      playPurchaseSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSuccessOrderId('SUCCESS');
      setMemo('');
      onClearCart();
    } catch (err) {
      console.error('Order checkout error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l-4 border-amber-300">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-black">내 장바구니</h2>
              <p className="text-xs text-amber-100 font-medium">
                담은 물품을 확인하고 구매를 신청하세요
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSuccessOrderId(null);
              onClose();
            }}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {successOrderId ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl shadow-inner animate-bounce">
              🎉
            </div>
            <h3 className="text-2xl font-black text-slate-800">
              구매 신청이 완료되었어요!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              선생님께 주문 내용이 실시간으로 전달되었어요.<br />
              선생님이 확인 후 이름을 부르면 교탁으로 오세요!
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 w-full text-xs text-amber-900 font-bold space-y-1">
              <p>구매자: {selectedStudent?.name} 학생</p>
              <p>결제 금액: {totalAmount.toLocaleString()} {config.currencyUnit}</p>
            </div>
            <div className="flex flex-col w-full space-y-2 pt-4">
              <button
                onClick={() => {
                  setSuccessOrderId(null);
                  onClose();
                  onOpenOrderHistory();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-md shadow-amber-500/20"
              >
                <span>내 주문 상태 확인하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSuccessOrderId(null);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                더 둘러보기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Student selection prompt if none selected */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-800 font-bold block">
                  구매 학생 확인
                </span>
                {selectedStudent ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-2xl">{selectedStudent.avatar}</span>
                    <span className="text-base font-black text-slate-800">
                      {selectedStudent.name} 학생
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-rose-600 mt-1 block">
                    ⚠️ 구매할 학생을 먼저 선택해주세요
                  </span>
                )}
              </div>
              <button
                onClick={onOpenStudentSelector}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs transition-colors"
              >
                {selectedStudent ? '변경하기' : '학생 선택'}
              </button>
            </div>

            {/* Cart Items List */}
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <span className="text-5xl">🛒</span>
                <p className="text-slate-500 font-bold text-sm">
                  장바구니가 비어 있습니다.
                </p>
                <p className="text-slate-400 text-xs">
                  마음에 드는 물품을 담아보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>담은 물품 ({items.length}개)</span>
                  <button
                    onClick={onClearCart}
                    className="text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    모두 비우기
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between space-x-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-3xl shrink-0">
                        {item.product.emoji || '🎁'}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-xs font-bold text-amber-700">
                          {(item.product.price * item.quantity).toLocaleString()}{' '}
                          {config.currencyUnit}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="flex items-center space-x-1 bg-white rounded-xl border border-slate-200 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-black text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Student Memo input */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    선생님께 드릴 말씀이나 메모 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="예: 파란색 볼펜으로 주세요! 맛있게 먹을게요"
                    maxLength={100}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-xs font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Checkout Summary Footer */}
        {!successOrderId && (
          <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-4">
            {/* Balance vs Price Breakdown */}
            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex justify-between text-slate-600">
                <span>총 주문 금액:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {totalAmount.toLocaleString()} {config.currencyUnit}
                </span>
              </div>

              {selectedStudent && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>현재 보유 잔액:</span>
                    <span className="font-bold text-amber-800">
                      {studentBalance.toLocaleString()} {config.currencyUnit}
                    </span>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span>구매 후 예상 잔액:</span>
                    <span
                      className={`font-black text-sm ${
                        isBalanceEnough ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {(studentBalance - totalAmount).toLocaleString()}{' '}
                      {config.currencyUnit}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Warning if balance shortage */}
            {selectedStudent && !isBalanceEnough && totalAmount > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  행복머니가 {shortage.toLocaleString()} {config.currencyUnit} 부족해요!
                  선생님께 칭찬을 받고 더 모아보세요. 😊
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleCheckout}
              disabled={
                items.length === 0 ||
                !selectedStudent ||
                !isBalanceEnough ||
                isSubmitting
              }
              className={`w-full py-4 px-4 rounded-2xl font-black text-base flex items-center justify-center space-x-2 transition-all active:scale-98 shadow-md ${
                items.length === 0 || !selectedStudent || !isBalanceEnough
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/25'
              }`}
            >
              {isSubmitting ? (
                <span>주문 신청 중...</span>
              ) : !selectedStudent ? (
                <span>학생을 먼저 선택하세요</span>
              ) : !isBalanceEnough && totalAmount > 0 ? (
                <span>잔액이 부족합니다 😢</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>구매 신청하기 (선생님께 전송) 🚀</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
