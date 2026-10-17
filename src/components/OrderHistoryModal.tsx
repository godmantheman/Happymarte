import React, { useState } from 'react';
import { Order, Student, StoreConfig, OrderStatus } from '../types';
import {
  X,
  Clock,
  CheckCircle,
  Gift,
  XCircle,
  AlertCircle,
  Search,
  Package,
  FileText,
} from 'lucide-react';
import { Coin3DIcon, ProductBadgeIcon } from './Icons3D';

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
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-amber-100 text-amber-800 border-2 border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            승인 대기
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            승인 완료
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-sky-100 text-sky-800 border-2 border-sky-300">
            <Gift className="w-3.5 h-3.5 mr-1" />
            수령 완료
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black bg-rose-100 text-rose-800 border-2 border-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            주문 거부
          </span>
        );
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getMonth() + 1}/${d.getDate()} ${d
        .getHours()
        .toString()
        .padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#FFFDF7] w-full max-w-2xl rounded-[32px] shadow-2xl border-4 border-b-[10px] border-sky-400 overflow-hidden flex flex-col max-h-[85vh]">
        {/* 3D Tactile Header */}
        <div className="bg-gradient-to-b from-sky-400 to-sky-500 p-5 text-white flex items-center justify-between border-b-[6px] border-sky-700 shadow-[inset_0_3px_0_rgba(255,255,255,0.45)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white border-2 border-b-4 border-sky-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-lg font-black tracking-tight">주문 내역</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white hover:bg-sky-50 text-sky-950 border-2 border-b-4 border-sky-700 active:translate-y-0.5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="px-5 py-3 bg-sky-50 border-b-2 border-sky-200 flex flex-wrap items-center justify-between gap-2 text-xs font-black">
          <div className="relative flex-1 sm:max-w-xs">
            <input
              type="text"
              placeholder="이름 검색"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-3.5 py-2 pl-8 rounded-2xl border-2 border-sky-200 text-xs font-black bg-white focus:outline-hidden focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5">
            {selectedStudent && (
              <button
                onClick={() => {
                  setFilterStudentOnly(true);
                  setSearchName('');
                }}
                className={`px-3 py-1.5 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 ${
                  filterStudentOnly && !searchName
                    ? 'bg-sky-500 text-white border-sky-700'
                    : 'bg-white text-stone-600 border-stone-300'
                }`}
              >
                내 주문 ({selectedStudent.name})
              </button>
            )}
            <button
              onClick={() => {
                setFilterStudentOnly(false);
                setSearchName('');
              }}
              className={`px-3 py-1.5 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 ${
                !filterStudentOnly && !searchName
                  ? 'bg-sky-500 text-white border-sky-700'
                  : 'bg-white text-stone-600 border-stone-300'
              }`}
            >
              전체
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {displayOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-sky-100 border-2 border-b-4 border-sky-300 text-sky-600 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7" />
              </div>
              <p className="text-stone-500 font-black text-sm">주문 내역이 없습니다</p>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-3xl border-2 border-b-[6px] border-amber-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 text-sm">
                      {order.studentName}
                    </span>
                    <span className="text-xs text-stone-400 font-mono tabular-nums">
                      {formatTime(order.createdAt)}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Items */}
                <div className="flex flex-wrap gap-2">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs font-black text-stone-800"
                    >
                      <ProductBadgeIcon
                        icon={item.emoji}
                        name={item.name}
                        imageUrl={item.imageUrl}
                        size="sm"
                      />
                      <span>{item.name}</span>
                      <span className="text-amber-700 font-mono tabular-nums">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {order.status === 'REJECTED' && order.rejectReason && (
                  <div className="p-2.5 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-black">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>사유: {order.rejectReason}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-amber-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-bold">
                    {order.memo ? `메모: ${order.memo}` : ''}
                  </span>
                  <div className="flex items-center gap-1 font-black font-mono tabular-nums text-stone-900 text-sm">
                    <Coin3DIcon className="w-4 h-4" />
                    <span>
                      {order.totalPrice.toLocaleString()}
                      {config.currencyUnit}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
