/**
 * 행복마트 (중학교 2학년 특수학급 전용 마켓)
 * 메인 애플리케이션 컴포넌트
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  Product,
  Order,
  Student,
  StoreConfig,
  CartItem,
} from './types';
import { testConnection } from './firebase';
import {
  subscribeProducts,
  subscribeOrders,
  subscribeStudents,
  subscribeStoreConfig,
  placeOrder,
  loginByName,
  seedInitialDataIfNeeded,
} from './services/storeService';
import { TEMPLATE_CONFIG } from './utils/initialData';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AdminPanel } from './components/AdminPanel';
import { NameLoginModal } from './components/NameLoginModal';
import { playNewOrderChime } from './utils/audio';
import { Sparkles, ShoppingBag, Clock, ShieldCheck, UserCheck, HeartHandshake } from 'lucide-react';

const LOCAL_USER_NAME_KEY = 'happy_mart_user_name';

export default function App() {
  // App state
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<StoreConfig>(TEMPLATE_CONFIG);

  // Name-based logged in user state (null = Guest Mode)
  const [loggedInUser, setLoggedInUser] = useState<Student | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Admin Mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);

  // Filters & Sound
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Incoming order chime tracker
  const prevPendingCountRef = useRef<number>(0);

  // 1. Initial Setup and Firebase Listeners
  useEffect(() => {
    testConnection();
    seedInitialDataIfNeeded();

    // Subscriptions
    const unsubProducts = subscribeProducts((items) => {
      setProducts(items);
    });

    const unsubStudents = subscribeStudents((list) => {
      setStudents(list);

      // Keep loggedInUser updated if balance or data changes in Firestore
      setLoggedInUser((curr) => {
        if (!curr) return null;
        const fresh = list.find((s) => s.id === curr.id || s.name === curr.name);
        return fresh || curr;
      });
    });

    const unsubConfig = subscribeStoreConfig((cfg) => {
      setConfig(cfg);
    });

    const unsubOrders = subscribeOrders((orderList) => {
      setOrders(orderList);

      // Play chime if new pending order arrived
      const currentPending = orderList.filter((o) => o.status === 'PENDING').length;
      if (currentPending > prevPendingCountRef.current && soundEnabled) {
        playNewOrderChime();
      }
      prevPendingCountRef.current = currentPending;
    });

    // Check stored user name
    const storedName = localStorage.getItem(LOCAL_USER_NAME_KEY);
    if (storedName) {
      loginByName(storedName)
        .then((user) => {
          setLoggedInUser(user);
        })
        .catch(() => {
          // If login fails, default to guest mode without forcing modal
          setIsLoginModalOpen(false);
        });
    } else {
      // Default to opening modal, but user can easily choose guest mode
      setIsLoginModalOpen(true);
    }

    return () => {
      unsubProducts();
      unsubStudents();
      unsubConfig();
      unsubOrders();
    };
  }, [soundEnabled]);

  // Handle Name Login
  const handleNameLogin = async (name: string) => {
    const user = await loginByName(name);
    setLoggedInUser(user);
    localStorage.setItem(LOCAL_USER_NAME_KEY, user.name);
    setIsLoginModalOpen(false);
  };

  // Handle Guest Mode (no login required)
  const handleGuestMode = () => {
    localStorage.removeItem(LOCAL_USER_NAME_KEY);
    setLoggedInUser(null);
    setIsLoginModalOpen(false);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem(LOCAL_USER_NAME_KEY);
    setLoggedInUser(null);
    setIsAdminMode(false);
    setCart([]);
    setIsLoginModalOpen(true);
  };

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Order Submission Handler
  const handleSubmitOrder = async (student: Student, memo: string) => {
    const orderItems = cart.map((c) => ({
      productId: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
      emoji: c.product.emoji,
    }));

    const itemsSummary = cart
      .map((c) => `${c.product.name} ${c.quantity}개`)
      .join(', ');

    const totalPrice = cart.reduce(
      (sum, c) => sum + c.product.price * c.quantity,
      0
    );

    await placeOrder({
      studentId: student.id,
      studentName: student.name,
      items: orderItems,
      itemsSummary,
      totalPrice,
      memo: memo.trim(),
    });

    // Immediately update local balance state so money decreases on screen without waiting
    setLoggedInUser((curr) => {
      if (!curr) return null;
      if (curr.id === student.id || curr.name.trim() === student.name.trim()) {
        return {
          ...curr,
          balance: Math.max(0, curr.balance - totalPrice),
          totalSpent: (curr.totalSpent || 0) + totalPrice,
        };
      }
      return curr;
    });

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === student.id || s.name.trim() === student.name.trim()) {
          return {
            ...s,
            balance: Math.max(0, s.balance - totalPrice),
            totalSpent: (s.totalSpent || 0) + totalPrice,
          };
        }
        return s;
      })
    );
  };

  // Admin access toggle
  const isTeacher = loggedInUser?.name === '방소정' || loggedInUser?.role === 'TEACHER';

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      if (isTeacher) {
        setIsAdminMode(true);
      } else {
        // Teacher not logged in: inform and open name modal so they can type '방소정'
        alert('선생님 권한(방소정)으로 로그인 후 이용할 수 있습니다.');
        setIsLoginModalOpen(true);
      }
    }
  };

  // Filter products by category
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === '전체') return true;
    return p.category === selectedCategory;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-50/50 flex flex-col font-sans">
      {/* Teacher Admin Panel Full View */}
      {isAdminMode ? (
        <AdminPanel
          orders={orders}
          products={products}
          students={students}
          config={config}
          onClose={() => setIsAdminMode(false)}
          currentUserName={loggedInUser?.name || '방소정'}
          onLogout={handleLogout}
        />
      ) : (
        <>
          {/* Main Mart Store View */}
          <Header
            isAdminMode={isAdminMode}
            onToggleAdminMode={handleToggleAdminMode}
            loggedInUser={loggedInUser}
            onLogout={handleLogout}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            config={config}
            cartCount={cartTotalCount}
            onOpenCart={() => setIsCartOpen(true)}
            pendingOrdersCount={pendingOrdersCount}
            onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
          />

          {/* Store Announcement Banner */}
          {config.storeNotice && (
            <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 text-amber-950 px-4 py-2.5 shadow-xs">
              <div className="max-w-7xl mx-auto flex items-center justify-center text-xs sm:text-sm font-black space-x-2 text-center">
                <Sparkles className="w-4 h-4 shrink-0 text-white animate-spin" />
                <span>{config.storeNotice}</span>
              </div>
            </div>
          )}

          {/* Main Hero & User Status Bar */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
            {/* User Greeting & Status Banner */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200/90 shadow-md shadow-amber-200/20 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 select-none pointer-events-none">
                🏪
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-4xl sm:text-5xl shadow-inner cursor-pointer hover:scale-105 transition-transform"
                    title={loggedInUser ? '이름 변경/로그아웃' : '이름으로 로그인'}
                  >
                    {loggedInUser?.avatar || (isTeacher ? '👩‍🏫' : '🛍️')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        중2 특수학급
                      </span>
                      {isTeacher && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
                          방소정 선생님 (관리자)
                        </span>
                      )}
                      {!loggedInUser && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                          게스트 (손님) 모드
                        </span>
                      )}
                      <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="text-xs font-bold text-amber-700 underline hover:text-amber-900"
                      >
                        {loggedInUser ? '[이름 변경/로그아웃]' : '[이름 로그인하기]'}
                      </button>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {loggedInUser ? (
                        <>
                          <span className={isTeacher ? 'text-purple-700' : 'text-amber-800'}>
                            {loggedInUser.name}
                          </span>{' '}
                          {isTeacher ? '선생님, 마트를 관리해보세요!' : '학생, 환영해요! 👋'}
                        </>
                      ) : (
                        <span>게스트 모드: 자유롭게 물품을 담아보세요! 🛒</span>
                      )}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      {isTeacher
                        ? '선생님 권한으로 물품을 등록하거나 실시간 주문 승인/거부 및 친구들의 행복머니를 설정할 수 있습니다.'
                        : !loggedInUser
                        ? '별도 로그인이나 돈 없이 결제할 때 이름만 적으면 선생님이 확인 후 수락해 줍니다!'
                        : '열심히 모은 행복머니로 사고 싶은 물품을 고르고 선생님께 구매를 신청해보세요.'}
                    </p>
                  </div>
                </div>

                {/* Right Side Card: Teacher Panel Jump / Wallet / Guest Guide */}
                <div>
                  {isTeacher ? (
                    <button
                      onClick={() => setIsAdminMode(true)}
                      className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-purple-500/25 flex items-center space-x-3 transition-transform active:scale-95 text-left"
                    >
                      <ShieldCheck className="w-8 h-8 text-amber-300" />
                      <div>
                        <span className="text-2xs text-purple-200 font-bold block">관리자 제어 센터</span>
                        <span className="text-sm font-black">선생님 관리자 패널 열기 ⚙️</span>
                        <span className="text-2xs text-amber-300 font-bold block mt-0.5">
                          주문 수락 & 친구들 돈 설정
                        </span>
                      </div>
                    </button>
                  ) : loggedInUser ? (
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-orange-500/20 flex flex-col justify-center min-w-[200px]">
                      <span className="text-xs text-amber-100 font-bold">내 행복머니 지갑</span>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <span className="text-2xl sm:text-3xl font-black">
                          {loggedInUser.balance.toLocaleString()}
                        </span>
                        <span className="text-sm font-bold text-amber-100">
                          {config.currencyUnit}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-purple-700 to-indigo-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg shadow-purple-500/20 flex flex-col justify-center min-w-[200px] border border-purple-500/40">
                      <span className="text-xs text-purple-200 font-bold flex items-center space-x-1">
                        <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
                        <span>게스트 바로 결제 지원</span>
                      </span>
                      <span className="text-sm font-black mt-1 text-amber-300">
                        돈 필요 없음!
                      </span>
                      <span className="text-2xs text-purple-200 mt-0.5">
                        결제 시 이름만 적으면 선생님이 수락해요
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Closed store warning if mart is paused */}
            {!config.isOpen && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-5 flex items-center space-x-4 text-rose-800">
                <Clock className="w-8 h-8 text-rose-500 shrink-0" />
                <div>
                  <h4 className="font-black text-base">현재 행복마트는 준비 중입니다.</h4>
                  <p className="text-xs font-medium">
                    물품 구경은 가능하지만, 선생님이 마트를 열어줄 때까지 잠시만 기다려주세요!
                  </p>
                </div>
              </div>
            )}

            {/* Category Filter Tabs */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {(['전체', '간식', '문구류', '특별쿠폰', '장난감', '기타'] as const).map(
                (cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 sm:px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all shadow-xs active:scale-95 ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-amber-500/30'
                          : 'bg-white hover:bg-amber-100 text-slate-700 border border-amber-200'
                      }`}
                    >
                      {cat === '전체' && '🌟 전체 보기'}
                      {cat === '간식' && '🍫 맛있는 간식'}
                      {cat === '문구류' && '✏️ 학용품 & 문구'}
                      {cat === '특별쿠폰' && '🎟️ 특별활동 쿠폰'}
                      {cat === '장난감' && '🧩 장난감 & 힐링'}
                      {cat === '기타' && '🎁 기타 선물'}
                    </button>
                  );
                }
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-amber-200 p-16 text-center space-y-3">
                <span className="text-5xl">🎁</span>
                <h3 className="text-lg font-black text-slate-700">등록된 물품이 없습니다.</h3>
                <p className="text-xs text-slate-400">
                  방소정 선생님 관리자 패널에서 새로운 물품을 추가해보세요!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((prod) => {
                  const cartItem = cart.find((c) => c.product.id === prod.id);
                  return (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      config={config}
                      onAddToCart={handleAddToCart}
                      isInCart={Boolean(cartItem)}
                      cartQuantity={cartItem?.quantity || 0}
                    />
                  );
                })}
              </div>
            )}
          </main>

          {/* Floating Cart Trigger on Mobile / Bottom Action */}
          {cartTotalCount > 0 && !isTeacher && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%]">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full py-4 px-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-base shadow-xl shadow-orange-500/30 flex items-center justify-between animate-bounce"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-6 h-6" />
                  <span>장바구니 확인하기 ({cartTotalCount}개)</span>
                </div>
                <span className="bg-white/20 px-3 py-1 rounded-xl text-sm font-bold">
                  주문 신청 🚀
                </span>
              </button>
            </div>
          )}

          {/* Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            items={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            selectedStudent={loggedInUser}
            onOpenStudentSelector={() => setIsLoginModalOpen(true)}
            config={config}
            onSubmitOrder={handleSubmitOrder}
            onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
          />

          {/* Order History Modal */}
          <OrderHistoryModal
            isOpen={isOrderHistoryOpen}
            onClose={() => setIsOrderHistoryOpen(false)}
            orders={orders}
            selectedStudent={loggedInUser}
            config={config}
          />
        </>
      )}

      {/* Name Login Modal with Guest browsing option */}
      <NameLoginModal
        isOpen={isLoginModalOpen}
        onLogin={handleNameLogin}
        onGuestMode={handleGuestMode}
        onClose={() => setIsLoginModalOpen(false)}
        allowClose={true}
        registeredStudents={students}
      />
    </div>
  );
}
