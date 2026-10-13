import React, { useState } from 'react';
import {
  Order,
  Product,
  Student,
  StoreConfig,
  OrderStatus,
  ProductCategory,
} from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Package,
  Coins,
  Settings,
  Bell,
  Plus,
  Trash2,
  Edit3,
  Printer,
  Sparkles,
  Gift,
  RefreshCw,
  LogOut,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  updateOrderStatus,
  addProduct,
  updateProduct,
  deleteProduct,
  adjustStudentBalance,
  setStudentBalance,
  batchSetAllStudents,
  batchAdjustAllStudents,
  addStudent,
  deleteStudent,
  updateStoreConfig,
  resetToTemplateData,
} from '../services/storeService';
import { playApprovalSound, playRejectSound } from '../utils/audio';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  students: Student[];
  config: StoreConfig;
  onClose: () => void;
  currentUserName: string;
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  products,
  students,
  config,
  onClose,
  currentUserName,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'money' | 'products' | 'settings'>('orders');
  const [orderFilter, setOrderFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Rejection modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('재고가 모두 소진되었어요');
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Direct balance inputs state (for friends money editing)
  const [directBalances, setDirectBalances] = useState<{ [id: string]: number }>({});
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: 300,
    category: '간식' as ProductCategory,
    stock: 10,
    emoji: '🍫',
    description: '',
    isAvailable: true,
  });

  // Student modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBalance, setNewStudentBalance] = useState(3000);
  const [newStudentAvatar, setNewStudentAvatar] = useState('🧒');

  // Receipt print modal
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'ALL' && o.status !== orderFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      return (
        o.studentName.toLowerCase().includes(q) ||
        o.itemsSummary?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const classmates = students.filter((s) => s.name !== '방소정');

  // Order Handlers
  const handleApprove = async (order: Order) => {
    try {
      playApprovalSound();
      await updateOrderStatus(order, 'APPROVED');
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (order: Order) => {
    try {
      await updateOrderStatus(order, 'COMPLETED');
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    try {
      playRejectSound();
      const finalReason = rejectReason === '직접입력' ? customRejectReason : rejectReason;
      await updateOrderStatus(rejectingOrder, 'REJECTED', finalReason);
      setRejectingOrder(null);
      setCustomRejectReason('');
    } catch (err) {
      console.error(err);
    }
  };

  // Direct Money Setting Handlers
  const handleSaveDirectBalance = async (studentId: string) => {
    const targetBalance = directBalances[studentId];
    if (targetBalance === undefined || isNaN(targetBalance)) return;

    try {
      await setStudentBalance(studentId, targetBalance);
      playApprovalSound();
      setSavedSuccessId(studentId);
      setTimeout(() => setSavedSuccessId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickDelta = async (studentId: string, delta: number, reason: string) => {
    try {
      playApprovalSound();
      await adjustStudentBalance(studentId, delta, reason);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchAdjust = async (delta: number) => {
    if (!confirm(`모든 친구들에게 ${delta > 0 ? `+${delta}원` : `${delta}원`}을 적용하시겠습니까?`)) return;
    try {
      playApprovalSound();
      await batchAdjustAllStudents(delta);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchSet = async (amount: number) => {
    if (!confirm(`모든 친구들의 잔액을 ${amount}원으로 통일하시겠습니까?`)) return;
    try {
      playApprovalSound();
      await batchSetAllStudents(amount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetTemplates = async () => {
    if (!confirm('기본 템플릿(학생 4명 및 대표 물품 6개)을 파이어베이스에 복원하시겠습니까?')) return;
    try {
      await resetToTemplateData();
      alert('기본 템플릿이 복원되었습니다!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (studentId: string, name: string) => {
    if (!confirm(`${name} 학생을 목록에서 삭제하시겠습니까?`)) return;
    try {
      await deleteStudent(studentId);
    } catch (err) {
      console.error(err);
    }
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 300,
      category: '간식',
      stock: 10,
      emoji: '🍫',
      description: '',
      isAvailable: true,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      price: p.price,
      category: p.category,
      stock: p.stock,
      emoji: p.emoji,
      description: p.description,
      isAvailable: p.isAvailable,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) return;

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
      } else {
        await addProduct(productForm);
      }
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('이 물품을 삭제하시겠습니까?')) {
      await deleteProduct(id);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await addStudent(newStudentName.trim(), newStudentBalance, newStudentAvatar);
    setNewStudentName('');
    setIsStudentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-xl shadow-md">
                👩‍🏫
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-black tracking-tight">
                    {currentUserName} 선생님 관리자 패널
                  </h1>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-500 text-white shadow-xs">
                    최고 관리자 권한
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  중학교 2학년 특수학급 마트 운영 및 친구들 돈 관리
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Reset to template button */}
              <button
                onClick={handleResetTemplates}
                title="기본 템플릿 복원"
                className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>템플릿 복원</span>
              </button>

              {/* Logout / Switch user */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>

              {/* Back to mart shopping view */}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                마트 화면으로 🛒
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 sm:space-x-2 border-t border-slate-800 pt-1 pb-2 overflow-x-auto text-xs sm:text-sm font-bold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>실시간 주문 로그</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-xs font-black animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* TAB 2: 친구들 돈 설정 (Highlighted feature) */}
            <button
              onClick={() => setActiveTab('money')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'money'
                  ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-400'
                  : 'text-purple-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-300" />
              <span className="text-amber-200">💰 친구들 돈 설정 ({classmates.length}명)</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>물품 관리 ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>운영 설정</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* ============================================================ */}
        {/* TAB 1: ORDERS LOGS & CONTROL */}
        {/* ============================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Control Bar: Filters & Search */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-bold">
                <span className="text-slate-500 mr-1 hidden sm:inline">상태 필터:</span>
                {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl transition-colors ${
                      orderFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL' && '전체 보기'}
                    {st === 'PENDING' && `대기 중 (${pendingCount})`}
                    {st === 'APPROVED' && '승인됨'}
                    {st === 'COMPLETED' && '전달완료'}
                    {st === 'REJECTED' && '거부/취소됨'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="학생 이름 또는 물품 검색..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-purple-500 w-full sm:w-60"
                />
              </div>
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3">
                <span className="text-5xl">📭</span>
                <p className="text-base font-black text-slate-700">해당 조건의 주문이 없습니다.</p>
                <p className="text-xs text-slate-400">
                  학생들이 마트에서 구매 신청을 하면 이곳에 실시간으로 로그가 도착합니다.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isApproved = order.status === 'APPROVED';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-3xl p-5 border-2 transition-all shadow-xs ${
                        isPending
                          ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-300/50'
                          : order.status === 'APPROVED'
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : order.status === 'REJECTED'
                          ? 'border-rose-200 bg-rose-50/20 opacity-80'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl font-bold">
                            🛍️
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-black text-slate-900">
                                {order.studentName} 학생
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                                #{order.id.slice(-6)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              주문 시각: {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center space-x-2">
                          {order.status === 'PENDING' && (
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 flex items-center">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-ping"></span>
                              대기 중 (승인/거부 필요)
                            </span>
                          )}
                          {order.status === 'APPROVED' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                              승인됨 (물품 전달 대기)
                            </span>
                          )}
                          {order.status === 'COMPLETED' && (
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-black border border-blue-300">
                              전달 완료 ✓
                            </span>
                          )}
                          {order.status === 'REJECTED' && (
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black border border-rose-300">
                              거부됨 (환불완료)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items Details */}
                      <div className="py-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 flex items-center space-x-1.5"
                            >
                              <span className="text-base">{it.emoji || '🎁'}</span>
                              <span>{it.name}</span>
                              <span className="text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-md">
                                {it.quantity}개
                              </span>
                              <span className="text-slate-400 font-normal">
                                ({(it.price * it.quantity).toLocaleString()} {config.currencyUnit})
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Student Memo */}
                        {order.memo && (
                          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center space-x-2">
                            <span className="text-base">💬</span>
                            <span>학생 요청: &ldquo;{order.memo}&rdquo;</span>
                          </div>
                        )}

                        {/* Reject Reason display */}
                        {order.status === 'REJECTED' && order.rejectReason && (
                          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                            <strong>거부 사유:</strong> {order.rejectReason} (행복머니 자동 환불 완료)
                          </div>
                        )}
                      </div>

                      {/* Bottom Total & Teacher Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-black text-slate-800">
                          결제 총액:{' '}
                          <span className="text-purple-700 text-base">
                            {order.totalPrice.toLocaleString()} {config.currencyUnit}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Receipt print button */}
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>전표/영수증</span>
                          </button>

                          {/* Reject button */}
                          {order.status !== 'REJECTED' && order.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setRejectingOrder(order);
                                setRejectReason('재고가 모두 소진되었어요');
                                setCustomRejectReason('');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center space-x-1 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>주문 거부 (환불)</span>
                            </button>
                          )}

                          {/* Approve button */}
                          {isPending && (
                            <button
                              onClick={() => handleApprove(order)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center space-x-1 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>주문 승인하기</span>
                            </button>
                          )}

                          {/* Complete button */}
                          {isApproved && (
                            <button
                              onClick={() => handleComplete(order)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center space-x-1 shadow-md shadow-blue-600/20 transition-all active:scale-95"
                            >
                              <Gift className="w-4 h-4" />
                              <span>물품 전달 완료</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: 친구들 돈 설정 (STUDENT MONEY CONTROL) */}
        {/* ============================================================ */}
        {activeTab === 'money' && (
          <div className="space-y-6">
            {/* Header & Quick Action Banner */}
            <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">💰</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                      친구들 행복머니 직접 설정 & 장부
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200 mt-1">
                    방소정 선생님 권한: 각 친구들의 전용 잔액을 직접 입력해 수정하거나 일괄 보상을 지급합니다. (파이어베이스 실시간 저장)
                  </p>
                </div>

                <button
                  onClick={() => setIsStudentModalOpen(true)}
                  className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-400/20 self-start sm:self-auto transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>새 친구 등록</span>
                </button>
              </div>

              {/* Batch Actions Bar */}
              <div className="pt-3 border-t border-purple-600/70 flex flex-wrap items-center gap-2 text-xs font-black">
                <span className="text-purple-300 mr-1">일괄 처리:</span>
                <button
                  onClick={() => handleBatchAdjust(500)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  ⭐ 전원 +500원 칭찬
                </button>
                <button
                  onClick={() => handleBatchAdjust(1000)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  🏆 전원 +1,000원 주간보상
                </button>
                <button
                  onClick={() => handleBatchSet(3000)}
                  className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50 transition-colors"
                >
                  🔄 전원 3,000원 초기화
                </button>
              </div>
            </div>

            {/* Classmates Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classmates.map((st) => {
                const currentDirectVal =
                  directBalances[st.id] !== undefined ? directBalances[st.id] : st.balance;
                const isSaved = savedSuccessId === st.id;

                return (
                  <div
                    key={st.id}
                    className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
                  >
                    {/* Top Student Info */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{st.avatar || '🧒'}</span>
                          <div>
                            <h3 className="font-black text-slate-900 text-lg">{st.name}</h3>
                            <span className="text-2xs text-slate-400 font-bold">
                              {st.grade} • {st.classroom}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteStudent(st.id, st.name)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                          title="학생 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Current Balance Display */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                        <span className="text-xs text-amber-900 font-bold">현재 보유 잔액:</span>
                        <span className="text-xl font-black text-amber-950">
                          {st.balance.toLocaleString()} {config.currencyUnit}
                        </span>
                      </div>
                    </div>

                    {/* DIRECT BALANCE EDIT FIELD */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-black text-slate-700">
                        ✏️ 친구 돈 직접 설정:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={currentDirectVal}
                          onChange={(e) =>
                            setDirectBalances({
                              ...directBalances,
                              [st.id]: Number(e.target.value),
                            })
                          }
                          className="flex-1 px-3 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-500 font-black text-sm text-slate-900"
                        />
                        <button
                          onClick={() => handleSaveDirectBalance(st.id)}
                          className={`px-3.5 py-2 rounded-xl text-white font-black text-xs flex items-center space-x-1 transition-all ${
                            isSaved
                              ? 'bg-emerald-600'
                              : 'bg-purple-600 hover:bg-purple-700 shadow-xs'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaved ? '저장됨 ✓' : '저장'}</span>
                        </button>
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="grid grid-cols-4 gap-1 pt-1 text-2xs font-bold">
                        <button
                          onClick={() => handleQuickDelta(st.id, 100, '바른 태도 칭찬')}
                          className="py-1 px-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-center"
                        >
                          +100원
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, 500, '과제 완성')}
                          className="py-1 px-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-center"
                        >
                          +500원
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, 1000, '특별 칭찬')}
                          className="py-1 px-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-center"
                        >
                          +1000원
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, -500, '차감')}
                          className="py-1 px-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-center"
                        >
                          -500원
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: PRODUCTS INVENTORY */}
        {/* ============================================================ */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800">행복마트 물품 관리</h2>
                <p className="text-xs text-slate-500 font-medium">
                  학생들이 구매할 수 있는 간식, 문구, 활동 쿠폰 등을 등록하고 수정합니다.
                </p>
              </div>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm flex items-center space-x-2 shadow-md shadow-purple-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>새 물품 등록</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
                        {prod.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl">
                        {prod.emoji || '🎁'}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{prod.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{prod.description}</p>
                        <div className="mt-1 text-sm font-black text-amber-800">
                          💰 {prod.price.toLocaleString()} {config.currencyUnit}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock control */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      현재 재고: <strong className="text-slate-900">{prod.stock}개</strong>
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() =>
                          updateProduct(prod.id, {
                            stock: Math.max(0, prod.stock - 1),
                            isAvailable: prod.stock - 1 > 0,
                          })
                        }
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        -1
                      </button>
                      <button
                        onClick={() =>
                          updateProduct(prod.id, {
                            stock: prod.stock + 1,
                            isAvailable: true,
                          })
                        }
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                      >
                        +1
                      </button>
                      <button
                        onClick={() =>
                          updateProduct(prod.id, {
                            isAvailable: !prod.isAvailable,
                          })
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          prod.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {prod.isAvailable ? '판매중' : '품절'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: STORE SETTINGS */}
        {/* ============================================================ */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-3">
              마트 운영 환경 설정
            </h2>

            {/* Mart Open/Close Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <h4 className="font-black text-slate-800 text-base">행복마트 오픈 상태</h4>
                <p className="text-xs text-slate-500 font-medium">
                  스위치를 끄면 학생들이 구매 신청을 할 수 없고 &lsquo;준비 중&rsquo;으로 표시됩니다.
                </p>
              </div>
              <button
                onClick={() => updateStoreConfig({ isOpen: !config.isOpen })}
                className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all shadow-xs ${
                  config.isOpen
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                }`}
              >
                {config.isOpen ? '🟢 현재 영업 중' : '🔴 현재 준비 중'}
              </button>
            </div>

            {/* Store Notice Banner */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                마트 공지사항 배너 문구
              </label>
              <textarea
                rows={3}
                defaultValue={config.storeNotice}
                onBlur={(e) => updateStoreConfig({ storeNotice: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-medium"
              />
            </div>

            {/* Currency Unit */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                학급 전용 화폐 단위 명칭
              </label>
              <input
                type="text"
                defaultValue={config.currencyUnit}
                onBlur={(e) => updateStoreConfig({ currencyUnit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-purple-500 text-xs font-bold"
              />
            </div>

            {/* Template Restoration Button */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <h4 className="font-black text-amber-950 text-sm">기본 템플릿 데이터 복원</h4>
              <p className="text-xs text-amber-800">
                학생 명부(방소정 선생님, 김도윤, 이서연, 박지훈, 최예은)와 기본 추천 물품 6종을 파이어베이스에 다시 동기화합니다.
              </p>
              <button
                onClick={handleResetTemplates}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
              >
                기본 템플릿 복원하기 🔄
              </button>
            </div>

            {/* System Info */}
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
              <p className="font-bold">🔥 Firebase Cloud Firestore 실시간 연동 중</p>
              <p className="text-purple-700">
                데이터베이스 ID: ai-studio-feb261ab-c0df-4a97-b35e-9931ed80da14
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* REJECTION MODAL */}
      {/* ============================================================ */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-rose-300 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <XCircle className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-black text-slate-900">주문 거부 및 환불 처리</h3>
                <p className="text-xs text-slate-500">
                  {rejectingOrder.studentName} 학생의 주문 (#{rejectingOrder.id.slice(-6)})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              주문을 거부하면 학생이 사용한 행복머니(
              <strong>{rejectingOrder.totalPrice.toLocaleString()} {config.currencyUnit}</strong>
              )가 즉시 자동 환불되며, 학생 화면에 사유가 표시됩니다.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">거부 사유 선택:</label>
              {[
                '재고가 모두 소진되었어요',
                '행복머니 잔액이 부족해요',
                '마트 이용 시간이 마감되었어요',
                '선생님과 먼저 이야기해봐요',
                '직접입력',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center space-x-2 text-xs font-semibold text-slate-700 p-2 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {rejectReason === '직접입력' && (
                <input
                  type="text"
                  placeholder="학생에게 전달할 따뜻한 사유를 적어주세요"
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-400 mt-2"
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20"
              >
                주문 거부 & 환불 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRODUCT ADD / EDIT MODAL */}
      {/* ============================================================ */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border-4 border-purple-300 space-y-4">
            <h3 className="text-lg font-black text-slate-900">
              {editingProduct ? '물품 정보 수정' : '새 행복물품 등록'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">물품 이름 *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="예: 맛있는 딸기 젤리"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    가격 ({config.currencyUnit}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={50}
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">재고 수량 *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">카테고리 *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="간식">간식 🍫</option>
                    <option value="문구류">문구류 ✏️</option>
                    <option value="특별쿠폰">특별쿠폰 🎟️</option>
                    <option value="장난감">장난감 🧩</option>
                    <option value="기타">기타 🎁</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">대표 이모지</label>
                  <input
                    type="text"
                    value={productForm.emoji}
                    onChange={(e) => setProductForm({ ...productForm, emoji: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  설명 (학생에게 들려줄 내용)
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  placeholder="예: 달콤하고 상큼한 젤리 1봉지예요."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-600/20"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* STUDENT REGISTRATION MODAL */}
      {/* ============================================================ */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-purple-300 space-y-4">
            <h3 className="text-lg font-black text-slate-900">새 친구 등록</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">학생 이름 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 강하늘"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">초기 지급 행복머니</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={newStudentBalance}
                  onChange={(e) => setNewStudentBalance(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">대표 아바타 이모지</label>
                <div className="flex gap-2 justify-center py-2 text-2xl">
                  {['🦁', '🐰', '🐼', '🐱', '🐶', '🐥', '⭐', '🐨'].map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setNewStudentAvatar(em)}
                      className={`p-1.5 rounded-xl border-2 ${
                        newStudentAvatar === em ? 'border-purple-600 bg-purple-50' : 'border-transparent'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-xs"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRINT RECEIPT MODAL */}
      {/* ============================================================ */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-slate-300 space-y-4">
            <div className="border-b-2 border-dashed border-slate-300 pb-3 text-center">
              <h3 className="text-xl font-black text-slate-800">🏪 행복마트 전표</h3>
              <p className="text-xs text-slate-500">중학교 2학년 특수학급 물품 수령증</p>
              <p className="text-2xs text-slate-400 mt-1">
                일시: {new Date(printingOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">구매 학생:</span>
                <span className="text-slate-900 font-black text-sm">{printingOrder.studentName} 학생</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">주문 번호:</span>
                <span className="text-slate-700">#{printingOrder.id.slice(-6)}</span>
              </div>

              <div className="border-t border-b border-slate-200 py-2 my-2 space-y-1">
                <span className="text-2xs font-bold text-slate-400 block mb-1">구매 물품 내역:</span>
                {printingOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold">
                    <span>
                      {it.emoji} {it.name} × {it.quantity}
                    </span>
                    <span>{(it.price * it.quantity).toLocaleString()}원</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black pt-1">
                <span>합계:</span>
                <span className="text-purple-700">
                  {printingOrder.totalPrice.toLocaleString()} {config.currencyUnit}
                </span>
              </div>

              {printingOrder.memo && (
                <p className="p-2 rounded-lg bg-slate-50 text-2xs text-slate-600">
                  메모: {printingOrder.memo}
                </p>
              )}
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-xs text-slate-500 font-medium">
              ❤️ 참 잘했어요! 행복한 하루 보내세요 ❤️
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setPrintingOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs"
              >
                인쇄하기 🖨️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
