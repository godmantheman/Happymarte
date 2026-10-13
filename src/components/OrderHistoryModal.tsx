import React, { useState } from 'react';
import { Order, Student, StoreConfig, OrderStatus } from '../types';
import { X, Clock, CheckCircle, Gift, XCircle, AlertCircle, Search } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  selectedStudent: Student | null;
  config: StoreConfig;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  selectedStudent,
  config,
}) => {
  const [filterStudentOnly, setFilterStudentOnly] = useState(Boolean(selectedStudent));
  const [searchName, setSearchName] = useState('');

  if (!isOpen) return null;

  // Filter orders
  const displayOrders = orders.filter((o) => {
    if (searchName.trim()) {
      return o.studentName.toLowerCase().includes(searchName.toLowerCase().trim());
    }
    if (filterStudentOnly && selectedStudent) {
      return o.studentId === selectedStudent.id || o.studentName === selectedStudent.name;
    }
    return true;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
            선생님 수락 대기 중
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            결제 수락 완료! 교탁으로 오세요 🎉
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
            <Gift className="w-3.5 h-3.5 mr-1" />
            물품 전달 완료
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            주문 거부됨
          </span>
        );
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">📜</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight">주문 내역 및 수락 상태</h2>
              <p className="text-amber-100 text-xs font-medium">
                선생님이 주문을 수락(승인)했는지 실시간으로 확인할 수 있어요!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="내 이름으로 검색..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full px-3 py-1.5 pl-8 rounded-xl border border-amber-300 text-xs font-bold bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex space-x-2">
            {selectedStudent && (
              <button
                onClick={() => {
                  setSearchName('');
                  setFilterStudentOnly(true);
                }}
                className={`px-3 py-1 rounded-xl transition-colors ${
                  filterStudentOnly && !searchName
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                {selectedStudent.name} 주문만
              </button>
            )}
            <button
              onClick={() => {
                setSearchName('');
                setFilterStudentOnly(false);
              }}
              className={`px-3 py-1 rounded-xl transition-colors ${
                !filterStudentOnly && !searchName
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              전체 주문 보기
            </button>
          </div>
        </div>

        {/* Orders list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {displayOrders.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <span className="text-5xl">📦</span>
              <p className="text-slate-500 font-bold text-sm">
                주문 내역이 아직 없습니다.
              </p>
              <p className="text-slate-400 text-xs">
                원하는 물품을 골라 장바구니에서 신청해보세요!
              </p>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div
                key={order.id}
                className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                  order.status === 'APPROVED'
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-sm'
                    : order.status === 'REJECTED'
                    ? 'border-rose-200 bg-rose-50/30'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-slate-900">
                      {order.studentName} 학생의 주문
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-500">주문한 물품:</div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 shadow-2xs"
                      >
                        <span className="mr-1.5">{it.emoji || '🎁'}</span>
                        <span>{it.name}</span>
                        <span className="ml-1 text-amber-700">× {it.quantity}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Memo if any */}
                {order.memo && (
                  <div className="p-2.5 rounded-xl bg-white border border-amber-200/80 text-xs text-slate-600 font-medium">
                    <span className="font-bold text-amber-800 mr-1">📝 남긴 메모:</span>
                    {order.memo}
                  </div>
                )}

                {/* Rejection reason notice if rejected */}
                {order.status === 'REJECTED' && (
                  <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-300 text-xs text-rose-800 font-semibold flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">선생님의 주문 안내:</span>
                      <span>
                        {order.rejectReason || '선생님과 이야기 후 다시 신청해주세요.'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 text-xs font-bold text-slate-600">
                  <span>주문 번호: #{order.id.slice(-6)}</span>
                  <span>
                    신청 물품:{' '}
                    <strong className="text-slate-800 text-sm">
                      {order.items.reduce((s, i) => s + i.quantity, 0)}개
                    </strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors shadow-xs"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
