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
  Gift,
  LogOut,
  Save,
  RotateCcw,
  Store,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  X,
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
import {
  AvatarBadgeIcon,
  ProductBadgeIcon,
  PRODUCT_ICON_OPTIONS,
  AVATAR_OPTIONS,
  Coin3DIcon,
} from './Icons3D';

interface AdminPanelProps {
  orders: Order[];
  products: Product[];
  students: Student[];
  config: StoreConfig;
  onClose: () => void;
  currentUserName: string;
  onLogout: () => void;
}

/**
 * Resize & compress uploaded image file into a compact Data URL for Firestore
 */
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_SIZE = 440;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_SIZE) {
            h = Math.round((h * MAX_SIZE) / w);
            w = MAX_SIZE;
          }
        } else {
          if (h > MAX_SIZE) {
            w = Math.round((w * MAX_SIZE) / h);
            h = MAX_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [rejectReason, setRejectReason] = useState('재고 소진');
  const [customRejectReason, setCustomRejectReason] = useState('');

  // Direct balance inputs state
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
    emoji: 'choco',
    imageUrl: '',
    description: '',
    isAvailable: true,
  });

  // Student modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentBalance, setNewStudentBalance] = useState(3000);
  const [newStudentAvatar, setNewStudentAvatar] = useState('lion');

  // Receipt print modal
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

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
    try {
      playApprovalSound();
      await batchAdjustAllStudents(delta);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBatchSet = async (amount: number) => {
    try {
      playApprovalSound();
      await batchSetAllStudents(amount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetTemplates = async () => {
    try {
      playApprovalSound();
      await resetToTemplateData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: 300,
      category: '간식',
      stock: 10,
      emoji: 'choco',
      imageUrl: '',
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
      emoji: p.emoji || 'choco',
      imageUrl: p.imageUrl || '',
      description: p.description,
      isAvailable: p.isAvailable,
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file);
      setProductForm((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
    } catch (err) {
      console.error('Image upload error:', err);
    }
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
    await deleteProduct(id);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    await addStudent(newStudentName.trim(), newStudentBalance, newStudentAvatar);
    setNewStudentName('');
    setIsStudentModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] flex flex-col font-sans">
      {/* 3D Tactile Admin Header */}
      <header className="sticky top-0 z-30 pt-2.5 px-3 sm:px-6">
        <div className="max-w-[1360px] mx-auto bg-gradient-to-b from-violet-400 via-purple-500 to-purple-600 text-white rounded-3xl px-5 py-3.5 border-2 border-violet-300 border-b-[7px] border-b-purple-900 shadow-[0_10px_24px_rgba(109,40,217,0.22),inset_0_3px_0_rgba(255,255,255,0.45)] space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AvatarBadgeIcon isTeacher size="md" />
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                {currentUserName} 선생님 관리자
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetTemplates}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-purple-100 border-2 border-b-4 border-purple-950 text-xs font-black active:translate-y-0.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>초기 데이터 복원</span>
              </button>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-700 hover:bg-purple-800 text-purple-100 border-2 border-b-4 border-purple-950 text-xs font-black active:translate-y-0.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 border-2 border-b-4 border-amber-700 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.7)] active:translate-y-0.5 transition-all"
              >
                <Store className="w-4 h-4" />
                <span>매장 화면</span>
              </button>
            </div>
          </div>

          {/* 3D Admin Tabs */}
          <div className="flex gap-2 overflow-x-auto pt-1 text-xs sm:text-sm font-black">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-b-4 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-white text-purple-950 border-purple-900'
                  : 'bg-purple-700/70 text-purple-100 border-purple-900/60 hover:bg-purple-700'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>주문 관리</span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-500 text-white text-xs font-black tabular-nums">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('money')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-b-4 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
                activeTab === 'money'
                  ? 'bg-white text-purple-950 border-purple-900'
                  : 'bg-purple-700/70 text-purple-100 border-purple-900/60 hover:bg-purple-700'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>친구들 돈 설정 ({classmates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-b-4 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
                activeTab === 'products'
                  ? 'bg-white text-purple-950 border-purple-900'
                  : 'bg-purple-700/70 text-purple-100 border-purple-900/60 hover:bg-purple-700'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>물품 추가 · 관리 ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-b-4 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-white text-purple-950 border-purple-900'
                  : 'bg-purple-700/70 text-purple-100 border-purple-900/60 hover:bg-purple-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>설정</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-3xl border-2 border-b-[6px] border-amber-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-black">
                {(['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3.5 py-2 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 ${
                      orderFilter === st
                        ? 'bg-amber-400 border-amber-700 text-amber-950'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-amber-50'
                    }`}
                  >
                    {st === 'ALL' && '전체'}
                    {st === 'PENDING' && `대기 (${pendingCount})`}
                    {st === 'APPROVED' && '승인됨'}
                    {st === 'COMPLETED' && '전달완료'}
                    {st === 'REJECTED' && '거부됨'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="학생 또는 물품 검색"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="px-3.5 py-2 rounded-2xl border-2 border-amber-200 text-xs font-bold focus:border-amber-500 focus:outline-hidden w-full sm:w-56"
              />
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-b-[6px] border-amber-200 p-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-stone-600">주문 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isPending = order.status === 'PENDING';
                  const isApproved = order.status === 'APPROVED';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-3xl p-5 border-2 border-b-[7px] transition-all ${
                        isPending
                          ? 'border-amber-400'
                          : order.status === 'APPROVED'
                          ? 'border-emerald-400'
                          : 'border-stone-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-3">
                          <AvatarBadgeIcon size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-stone-900">
                                {order.studentName}
                              </span>
                              <span className="text-xs text-stone-400 font-mono">
                                #{order.id.slice(-6)}
                              </span>
                            </div>
                            <span className="text-xs text-stone-400 font-mono tabular-nums">
                              {new Date(order.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div>
                          {order.status === 'PENDING' && (
                            <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-black border-2 border-amber-300">
                              대기 중
                            </span>
                          )}
                          {order.status === 'APPROVED' && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black border-2 border-emerald-300">
                              승인됨
                            </span>
                          )}
                          {order.status === 'COMPLETED' && (
                            <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-800 text-xs font-black border-2 border-sky-300">
                              전달 완료
                            </span>
                          )}
                          {order.status === 'REJECTED' && (
                            <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-black border-2 border-rose-300">
                              거부됨
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-1.5 rounded-2xl bg-amber-50/60 border-2 border-amber-200 text-xs font-black text-stone-800 flex items-center gap-2"
                            >
                              <ProductBadgeIcon
                                icon={it.emoji}
                                name={it.name}
                                imageUrl={it.imageUrl}
                                size="sm"
                              />
                              <span>{it.name}</span>
                              <span className="text-amber-700 font-mono tabular-nums">
                                ×{it.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.memo && (
                          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-900 flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                            <span>{order.memo}</span>
                          </div>
                        )}

                        {order.status === 'REJECTED' && order.rejectReason && (
                          <div className="p-2.5 rounded-2xl bg-rose-50 text-xs text-rose-800 font-bold">
                            거부 사유: {order.rejectReason}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm font-black font-mono tabular-nums text-stone-900">
                          합계 {order.totalPrice.toLocaleString()}{config.currencyUnit}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setPrintingOrder(order)}
                            className="px-3 py-2 rounded-2xl bg-white hover:bg-stone-50 text-stone-700 border-2 border-b-4 border-stone-300 text-xs font-black flex items-center gap-1.5 active:translate-y-0.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>전표</span>
                          </button>

                          {order.status !== 'REJECTED' && order.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                setRejectingOrder(order);
                                setRejectReason('재고 소진');
                                setCustomRejectReason('');
                              }}
                              className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-b-4 border-rose-300 text-rose-700 text-xs font-black flex items-center gap-1.5 active:translate-y-0.5"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>주문 거부</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleApprove(order)}
                              className="px-4 py-2 rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 border-2 border-b-4 border-emerald-800 text-white text-xs font-black flex items-center gap-1.5 active:translate-y-0.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>승인</span>
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() => handleComplete(order)}
                              className="px-4 py-2 rounded-2xl bg-gradient-to-b from-sky-400 to-sky-600 hover:from-sky-300 hover:to-sky-500 border-2 border-b-4 border-sky-800 text-white text-xs font-black flex items-center gap-1.5 active:translate-y-0.5"
                            >
                              <Gift className="w-4 h-4" />
                              <span>전달 완료</span>
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

        {/* TAB 2: STUDENT MONEY CONTROL */}
        {activeTab === 'money' && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-5 border-2 border-b-[6px] border-amber-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                <span className="text-stone-500 mr-1">일괄 지급:</span>
                <button
                  onClick={() => handleBatchAdjust(500)}
                  className="px-3.5 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-b-4 border-amber-300 text-amber-950 active:translate-y-0.5"
                >
                  전원 +500
                </button>
                <button
                  onClick={() => handleBatchAdjust(1000)}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-100 hover:bg-emerald-200 border-2 border-b-4 border-emerald-300 text-emerald-950 active:translate-y-0.5"
                >
                  전원 +1,000
                </button>
                <button
                  onClick={() => handleBatchSet(3000)}
                  className="px-3.5 py-2 rounded-2xl bg-sky-100 hover:bg-sky-200 border-2 border-b-4 border-sky-300 text-sky-950 active:translate-y-0.5"
                >
                  전원 3,000 초기화
                </button>
              </div>

              <button
                onClick={() => setIsStudentModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-b-4 border-orange-700 text-white font-black text-xs flex items-center gap-1.5 active:translate-y-0.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>학생 추가</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classmates.map((st) => {
                const currentDirectVal =
                  directBalances[st.id] !== undefined ? directBalances[st.id] : st.balance;
                const isSaved = savedSuccessId === st.id;

                return (
                  <div
                    key={st.id}
                    className="bg-white rounded-3xl p-5 border-2 border-b-[7px] border-amber-200 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarBadgeIcon avatar={st.avatar} size="md" />
                          <div>
                            <h3 className="font-black text-stone-900 text-base">{st.name}</h3>
                            <span className="text-xs font-bold text-stone-400">
                              {st.grade} · {st.classroom}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteStudent(st.id)}
                          className="p-1.5 text-stone-300 hover:text-rose-500 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-4 p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between">
                        <span className="text-xs text-amber-900 font-black">보유 잔액</span>
                        <span className="text-lg font-black font-mono tabular-nums text-amber-950">
                          {st.balance.toLocaleString()}{config.currencyUnit}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-stone-100">
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
                          className="flex-1 px-3 py-2 rounded-2xl border-2 border-amber-200 focus:border-amber-500 font-mono tabular-nums font-black text-sm text-stone-900"
                        />
                        <button
                          onClick={() => handleSaveDirectBalance(st.id)}
                          className={`px-3.5 py-2 rounded-2xl text-white font-black text-xs border-2 border-b-4 flex items-center gap-1 active:translate-y-0.5 transition-all ${
                            isSaved
                              ? 'bg-emerald-500 border-emerald-700'
                              : 'bg-violet-500 hover:bg-violet-600 border-violet-800'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaved ? '완료' : '저장'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs font-black font-mono tabular-nums">
                        <button
                          onClick={() => handleQuickDelta(st.id, 100, '보상')}
                          className="py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-b-2 border-amber-300 text-amber-900"
                        >
                          +100
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, 500, '보상')}
                          className="py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-b-2 border-emerald-300 text-emerald-900"
                        >
                          +500
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, 1000, '보상')}
                          className="py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-b-2 border-sky-300 text-sky-900"
                        >
                          +1000
                        </button>
                        <button
                          onClick={() => handleQuickDelta(st.id, -500, '차감')}
                          className="py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-b-2 border-rose-300 text-rose-700"
                        >
                          -500
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTS INVENTORY (WITH CUSTOM IMAGE UPLOAD) */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-stone-900">등록 물품 ({products.length})</h2>
              <button
                onClick={handleOpenAddProduct}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-2 border-b-4 border-orange-700 text-white font-black text-xs sm:text-sm flex items-center gap-1.5 active:translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>물품 추가 (이미지 업로드 가능)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl p-5 border-2 border-b-[7px] border-amber-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-sky-700">
                        {prod.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProduct(prod)}
                          className="p-1.5 rounded-xl text-stone-500 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                          title="수정"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 mb-3">
                      <ProductBadgeIcon
                        icon={prod.emoji}
                        name={prod.name}
                        category={prod.category}
                        imageUrl={prod.imageUrl}
                        size="lg"
                      />
                      <div>
                        <h3 className="font-black text-stone-900 text-base">{prod.name}</h3>
                        {prod.description && (
                          <p className="text-xs text-stone-500 line-clamp-1">
                            {prod.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-sm font-black font-mono tabular-nums text-stone-900">
                          <Coin3DIcon className="w-4 h-4" />
                          <span>
                            {prod.price.toLocaleString()}{config.currencyUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs font-black text-stone-600 font-mono tabular-nums">
                      재고 {prod.stock}개
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          updateProduct(prod.id, {
                            stock: Math.max(0, prod.stock - 1),
                            isAvailable: prod.stock - 1 > 0,
                          })
                        }
                        className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-b-2 border-stone-300 text-stone-700 font-black text-xs"
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
                        className="w-7 h-7 rounded-xl bg-stone-100 hover:bg-stone-200 border border-b-2 border-stone-300 text-stone-700 font-black text-xs"
                      >
                        +1
                      </button>
                      <button
                        onClick={() =>
                          updateProduct(prod.id, {
                            isAvailable: !prod.isAvailable,
                          })
                        }
                        className={`px-2.5 py-1 rounded-xl text-xs font-black border border-b-2 ${
                          prod.isAvailable
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
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

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border-2 border-b-[7px] border-amber-200 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border-2 border-amber-200">
              <span className="font-black text-stone-900 text-sm">매장 운영 상태</span>
              <button
                onClick={() => updateStoreConfig({ isOpen: !config.isOpen })}
                className={`px-4 py-2 rounded-2xl font-black text-xs border-2 border-b-4 active:translate-y-0.5 transition-all ${
                  config.isOpen
                    ? 'bg-emerald-500 border-emerald-700 text-white'
                    : 'bg-rose-500 border-rose-700 text-white'
                }`}
              >
                {config.isOpen ? '영업 중' : '준비 중'}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-stone-700">
                화폐 단위
              </label>
              <input
                type="text"
                defaultValue={config.currencyUnit}
                onBlur={(e) => updateStoreConfig({ currencyUnit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
              />
            </div>

            <div className="pt-2 border-t border-stone-100 flex justify-between items-center">
              <span className="text-xs font-black text-stone-600">초기 템플릿 데이터 복원</span>
              <button
                onClick={handleResetTemplates}
                className="px-4 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2 border-b-4 border-amber-700 text-amber-950 font-black text-xs active:translate-y-0.5"
              >
                복원하기
              </button>
            </div>
          </div>
        )}
      </main>

      {/* REJECTION MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] p-6 max-w-md w-full shadow-2xl border-4 border-b-[10px] border-rose-300 space-y-4">
            <h3 className="text-base font-black text-stone-900">
              주문 거부 ({rejectingOrder.studentName})
            </h3>

            <div className="space-y-1.5">
              {['재고 소진', '잔액 부족', '이용 시간 마감', '직접입력'].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-xs font-bold text-stone-700 p-2 rounded-xl hover:bg-stone-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {rejectReason === '직접입력' && (
                <input
                  type="text"
                  placeholder="사유 입력"
                  value={customRejectReason}
                  onChange={(e) => setCustomRejectReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-stone-300 text-xs font-bold mt-1"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 rounded-2xl bg-stone-100 border-2 border-b-4 border-stone-300 text-stone-700 font-black text-xs"
              >
                취소
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-2xl bg-rose-500 border-2 border-b-4 border-rose-700 text-white font-black text-xs"
              >
                거부 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT ADD / EDIT MODAL (WITH CUSTOM IMAGE UPLOAD) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-[32px] p-6 max-w-lg w-full shadow-2xl border-4 border-b-[10px] border-amber-400 space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-stone-900">
                {editingProduct ? '물품 수정' : '물품 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">물품 이름</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="예: 딸기 초코파이"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs font-black"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-stone-700 mb-1">가격</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={50}
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 mb-1">재고</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-stone-700 mb-1">카테고리</label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        category: e.target.value as ProductCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
                  >
                    <option value="간식">간식</option>
                    <option value="문구류">문구류</option>
                    <option value="특별쿠폰">특별쿠폰</option>
                    <option value="장난감">장난감</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              {/* CUSTOM IMAGE UPLOAD SECTION */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border-2 border-sky-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span>원하는 물품 이미지 업로드 (선택)</span>
                  </label>
                  {productForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: '' })}
                      className="text-2xs font-black text-rose-600 hover:underline"
                    >
                      이미지 제거 (기본 3D 모델 사용)
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {productForm.imageUrl ? (
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-sky-300 overflow-hidden shrink-0 shadow-xs">
                      <img
                        src={productForm.imageUrl}
                        alt="미리보기"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}

                  <label className="flex-1 cursor-pointer px-4 py-3 rounded-2xl bg-white hover:bg-sky-100/60 border-2 border-dashed border-sky-300 text-sky-800 text-xs font-black flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-sky-600" />
                    <span>내 기기에서 사진 파일 선택하기</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 3D Model / Icon Selector (used when no custom image is uploaded) */}
              <div>
                <label className="block text-xs font-black text-stone-700 mb-1.5">
                  기본 3D 모델 선택 {productForm.imageUrl && '(커스텀 이미지가 우선 적용됨)'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_ICON_OPTIONS.map((opt) => {
                    const selected = productForm.emoji === opt.key && !productForm.imageUrl;
                    return (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() =>
                          setProductForm({ ...productForm, emoji: opt.key, imageUrl: '' })
                        }
                        className={`p-2 rounded-2xl border-2 border-b-4 flex flex-col items-center gap-1 text-2xs font-black transition-all active:translate-y-0.5 ${
                          selected
                            ? 'border-amber-500 bg-amber-50 text-amber-950'
                            : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                        }`}
                      >
                        <ProductBadgeIcon icon={opt.key} size="sm" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">
                  간단 메모 (선택)
                </label>
                <input
                  type="text"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm({ ...productForm, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-2xl border-2 border-amber-200 text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-stone-100 border-2 border-b-4 border-stone-300 text-stone-700 font-black text-xs active:translate-y-0.5"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-orange-500 border-2 border-b-4 border-orange-700 text-white font-black text-xs active:translate-y-0.5"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT REGISTRATION MODAL */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border-4 border-b-[10px] border-amber-400 space-y-4">
            <h3 className="text-base font-black text-stone-900">학생 추가</h3>
            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">이름</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 mb-1">초기 잔액</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={newStudentBalance}
                  onChange={(e) => setNewStudentBalance(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 text-xs font-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 mb-1.5">3D 엠블럼</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.key}
                      onClick={() => setNewStudentAvatar(opt.key)}
                      className={`p-1.5 rounded-xl border-2 ${
                        newStudentAvatar === opt.key
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-transparent'
                      }`}
                    >
                      <AvatarBadgeIcon avatar={opt.key} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 rounded-2xl bg-stone-100 border-2 border-b-4 border-stone-300 text-stone-700 font-black text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-2xl bg-amber-400 border-2 border-b-4 border-amber-700 text-amber-950 font-black text-xs"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl border-4 border-b-[10px] border-amber-400 space-y-4">
            <div className="border-b border-dashed border-stone-300 pb-3 text-center">
              <h3 className="text-lg font-black text-stone-900">행복마트 주문 전표</h3>
              <p className="text-xs text-stone-400 font-mono mt-0.5">
                {new Date(printingOrder.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-stone-500">주문자</span>
                <span className="text-stone-900">{printingOrder.studentName}</span>
              </div>
              <div className="border-t border-b border-stone-200 py-2 my-2 space-y-1.5">
                {printingOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-semibold">
                    <span>
                      {it.name} ×{it.quantity}
                    </span>
                    <span className="font-mono tabular-nums">
                      {(it.price * it.quantity).toLocaleString()}{config.currencyUnit}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-black pt-1 font-mono tabular-nums">
                <span>합계</span>
                <span>
                  {printingOrder.totalPrice.toLocaleString()}{config.currencyUnit}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPrintingOrder(null)}
                className="px-4 py-2 rounded-2xl bg-stone-100 border-2 border-b-4 border-stone-300 text-stone-700 font-black text-xs"
              >
                닫기
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-2xl bg-amber-400 border-2 border-b-4 border-amber-700 text-amber-950 font-black text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>인쇄</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
