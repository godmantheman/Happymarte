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
  cleanupLegacyTemplateProducts,
} from './services/storeService';
import { TEMPLATE_CONFIG } from './utils/initialData';
import {
  isChristmasSeason,
  getStoreBrandName,
  getEffectiveCurrencyUnit,
} from './utils/seasonTheme';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { AdminPanel } from './components/AdminPanel';
import { NameLoginModal } from './components/NameLoginModal';
import { KioskView } from './components/KioskView';
import { Christmas3DBackground } from './components/Christmas3DBackground';
import { playNewOrderChime } from './utils/audio';
import { AvatarBadgeIcon, Coin3DIcon } from './components/Icons3D';
import {
  ShoppingBag,
  Clock,
  ShieldCheck,
  UserCheck,
  LogOut,
  CheckCircle2,
  Package,
  Plus,
} from 'lucide-react';

const LOCAL_USER_NAME_KEY = 'happy_mart_user_name';

export default function App() {
  const [isChristmas, setIsChristmas] = useState<boolean>(() => isChristmasSeason());

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<StoreConfig>(TEMPLATE_CONFIG);

  const [loggedInUser, setLoggedInUser] = useState<Student | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminInitialTab, setAdminInitialTab] = useState<
    'orders' | 'money' | 'products' | 'settings'
  >('orders');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const prevPendingCountRef = useRef<number>(0);

  // Automatic next-year (2027) check every 60s + dynamic document title sync
  useEffect(() => {
    const syncSeason = () => {
      const active = isChristmasSeason();
      setIsChristmas(active);
      document.title = getStoreBrandName(active);
    };
    syncSeason();
    const timer = window.setInterval(syncSeason, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  useEffect(() => {
    testConnection();
    cleanupLegacyTemplateProducts().then(() => {
      seedInitialDataIfNeeded();
    });

    const unsubProducts = subscribeProducts((items) => {
      setProducts(items);
    });

    const unsubStudents = subscribeStudents((list) => {
      setStudents(list);
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
      const currentPending = orderList.filter((o) => o.status === 'PENDING').length;
      if (currentPending > prevPendingCountRef.current && soundEnabled) {
        playNewOrderChime();
      }
      prevPendingCountRef.current = currentPending;
    });

    const storedName = localStorage.getItem(LOCAL_USER_NAME_KEY);
    if (storedName) {
      loginByName(storedName)
        .then((user) => {
          setLoggedInUser(user);
        })
        .catch(() => {
          setIsLoginModalOpen(false);
        });
    }

    return () => {
      unsubProducts();
      unsubStudents();
      unsubConfig();
      unsubOrders();
    };
  }, [soundEnabled]);

  const effectiveConfig: StoreConfig = {
    ...config,
    currencyUnit: getEffectiveCurrencyUnit(config.currencyUnit, isChristmas),
  };

  const handleNameLogin = async (name: string) => {
    const user = await loginByName(name);
    setLoggedInUser(user);
    localStorage.setItem(LOCAL_USER_NAME_KEY, user.name);
    setIsLoginModalOpen(false);
    showToast(`${user.name} 로그인 완료`);
  };

  const handleGuestMode = () => {
    localStorage.removeItem(LOCAL_USER_NAME_KEY);
    setLoggedInUser(null);
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_USER_NAME_KEY);
    setLoggedInUser(null);
    setIsAdminMode(false);
    setCart([]);
    showToast('로그아웃되었습니다');
  };

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
    showToast(`${product.name} 담김`);
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

  const handleSubmitOrder = async (student: Student, memo: string) => {
    const orderItems = cart.map((c) => ({
      productId: c.product.id,
      name: c.product.name,
      price: c.product.price,
      quantity: c.quantity,
      emoji: c.product.emoji,
      ...(c.product.imageUrl ? { imageUrl: c.product.imageUrl } : {}),
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

  const isTeacher = loggedInUser?.name === '방소정' || loggedInUser?.role === 'TEACHER';

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      if (isTeacher) {
        setAdminInitialTab('orders');
        setIsAdminMode(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
  };

  const handleOpenAdminProducts = () => {
    setAdminInitialTab('products');
    setIsAdminMode(true);
  };

  const handleScrollToSection = (sectionId: string) => {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === '전체') return true;
    return p.category === selectedCategory;
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <div
      id="top"
      className={`min-h-screen flex flex-col font-sans relative ${
        isChristmas ? 'bg-[#0B1A2B] text-stone-900' : 'bg-[#FFFDF7] text-stone-900'
      }`}
    >
      {/* Full-Screen 3D Christmas Winter Village Backdrop (automatically unmounts in 2027) */}
      {isChristmas && <Christmas3DBackground />}

      {/* Foreground Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {toastMessage && (
          <div
            className={`fixed top-24 right-6 z-50 border-2 border-b-4 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2 ${
              isChristmas
                ? 'bg-gradient-to-b from-amber-300 to-amber-400 text-red-950 border-red-900'
                : 'bg-gradient-to-b from-amber-300 to-amber-400 text-amber-950 border-amber-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {isAdminMode ? (
          <AdminPanel
            isChristmas={isChristmas}
            initialTab={adminInitialTab}
            orders={orders}
            products={products}
            students={students}
            config={effectiveConfig}
            onClose={() => setIsAdminMode(false)}
            currentUserName={loggedInUser?.name || '방소정'}
            onLogout={handleLogout}
          />
        ) : isKioskMode ? (
          <>
            <Header
              isChristmas={isChristmas}
              isAdminMode={isAdminMode}
              onToggleAdminMode={handleToggleAdminMode}
              isKioskMode={isKioskMode}
              onToggleKioskMode={() => setIsKioskMode((prev) => !prev)}
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              config={effectiveConfig}
              cartCount={cartTotalCount}
              onOpenCart={() => setIsCartOpen(true)}
              pendingOrdersCount={pendingOrdersCount}
              onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onScrollToSection={handleScrollToSection}
            />
            <KioskView
              isChristmas={isChristmas}
              products={products}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              loggedInUser={loggedInUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              config={effectiveConfig}
              onSubmitOrder={handleSubmitOrder}
              onExitKiosk={() => setIsKioskMode(false)}
            />
          </>
        ) : (
          <>
            <Header
              isChristmas={isChristmas}
              isAdminMode={isAdminMode}
              onToggleAdminMode={handleToggleAdminMode}
              isKioskMode={isKioskMode}
              onToggleKioskMode={() => setIsKioskMode((prev) => !prev)}
              loggedInUser={loggedInUser}
              onLogout={handleLogout}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              config={effectiveConfig}
              cartCount={cartTotalCount}
              onOpenCart={() => setIsCartOpen(true)}
              pendingOrdersCount={pendingOrdersCount}
              onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onScrollToSection={handleScrollToSection}
            />

            <main
              id="catalog-grid"
              className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6"
            >
              {/* 3D Tactile Toolbar: Categories + User/Balance/Admin Bar */}
              <div
                className={`rounded-3xl p-4 border-2 border-b-[7px] flex flex-wrap items-center justify-between gap-4 ${
                  isChristmas
                    ? 'bg-gradient-to-b from-emerald-800 to-emerald-900 border-amber-300/70 border-b-emerald-950 shadow-[0_12px_28px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.22)]'
                    : 'bg-gradient-to-b from-sky-100 to-sky-200/80 border-sky-300 shadow-[0_8px_20px_rgba(14,165,233,0.12),inset_0_2px_0_rgba(255,255,255,0.85)]'
                }`}
              >
                {/* 3D Category Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {(['전체', '간식', '문구류', '특별쿠폰', '장난감', '기타'] as const).map(
                    (cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap shrink-0 border-2 border-b-[5px] transition-all active:translate-y-0.5 cursor-pointer ${
                            isSelected
                              ? isChristmas
                                ? 'bg-gradient-to-b from-red-500 to-red-700 border-red-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]'
                                : 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
                              : isChristmas
                              ? 'bg-[#FFFDF9] hover:bg-amber-50 border-emerald-950/80 text-emerald-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]'
                              : 'bg-white hover:bg-amber-50 border-sky-300 text-sky-950 shadow-[inset_0_2px_0_rgba(255,255,255,0.9)]'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Active User / Balance / Login 3D Controls */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {loggedInUser ? (
                    <>
                      <div
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#FFFDF9] border-2 border-b-4 ${
                          isChristmas ? 'border-emerald-950/80' : 'border-sky-300'
                        }`}
                      >
                        <AvatarBadgeIcon
                          avatar={loggedInUser.avatar}
                          isTeacher={isTeacher}
                          size="sm"
                        />
                        <span className="text-sm font-black text-stone-900">
                          {loggedInUser.name}
                        </span>
                        {!isTeacher && (
                          <div
                            className={`flex items-center gap-1 pl-2 border-l-2 ${
                              isChristmas ? 'border-amber-200' : 'border-sky-100'
                            }`}
                          >
                            <Coin3DIcon className="w-4 h-4" isChristmas={isChristmas} />
                            <span
                              className={`text-sm font-black font-mono tabular-nums ${
                                isChristmas ? 'text-red-800' : 'text-amber-700'
                              }`}
                            >
                              {loggedInUser.balance.toLocaleString()} {effectiveConfig.currencyUnit}
                            </span>
                          </div>
                        )}
                      </div>

                      {isTeacher && (
                        <button
                          onClick={() => {
                            setAdminInitialTab('orders');
                            setIsAdminMode(true);
                          }}
                          className={`px-4 py-2.5 rounded-2xl border-2 border-b-4 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                            isChristmas
                              ? 'bg-gradient-to-b from-amber-300 to-amber-500 hover:from-amber-200 hover:to-amber-400 text-red-950 border-amber-900'
                              : 'bg-gradient-to-b from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white border-purple-900'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>관리자 패널</span>
                        </button>
                      )}

                      <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className={`px-3.5 py-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-amber-50 border-2 border-b-4 font-black text-xs active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isChristmas
                            ? 'text-emerald-950 border-emerald-950/80'
                            : 'text-sky-900 border-sky-300'
                        }`}
                      >
                        변경
                      </button>

                      <button
                        onClick={handleLogout}
                        title="로그아웃"
                        className={`p-2.5 rounded-2xl bg-[#FFFDF9] hover:bg-rose-50 hover:text-rose-600 text-stone-500 border-2 border-b-4 active:translate-y-0.5 transition-all cursor-pointer ${
                          isChristmas ? 'border-emerald-950/80' : 'border-sky-300'
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className={`px-4 py-2.5 rounded-2xl border-2 border-b-4 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.7)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isChristmas
                          ? 'bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-red-950 border-amber-900'
                          : 'bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 border-amber-700'
                      }`}
                    >
                      <UserCheck
                        className={`w-4 h-4 ${isChristmas ? 'text-red-800' : 'text-amber-800'}`}
                      />
                      <span>이름 로그인</span>
                    </button>
                  )}
                </div>
              </div>

              {!effectiveConfig.isOpen && (
                <div className="bg-rose-50 border-2 border-b-4 border-rose-300 rounded-3xl p-4 flex items-center gap-3 text-rose-900 text-xs font-black shadow-md">
                  <Clock className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>현재 매장 준비 중입니다.</span>
                </div>
              )}

              {/* Products Grid with 3D Models & Custom Image Support */}
              {filteredProducts.length === 0 ? (
                <div
                  className={`rounded-3xl border-2 border-b-[7px] p-16 text-center space-y-3.5 ${
                    isChristmas
                      ? 'bg-[#FFFDF9]/95 border-amber-300 border-b-red-900 shadow-[0_18px_36px_rgba(0,0,0,0.4)]'
                      : 'bg-white border-amber-200'
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-3xl border-2 border-b-4 flex items-center justify-center mx-auto ${
                      isChristmas
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-amber-100 border-amber-300 text-amber-600'
                    }`}
                  >
                    <Package className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-stone-800">
                    등록된 물품이 없습니다
                  </h3>
                  {isTeacher && (
                    <div className="pt-1">
                      <button
                        onClick={handleOpenAdminProducts}
                        className={`px-5 py-2.5 rounded-2xl border-2 border-b-4 text-white font-black text-sm inline-flex items-center gap-1.5 active:translate-y-0.5 transition-all cursor-pointer ${
                          isChristmas
                            ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 border-red-950'
                            : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-orange-700'
                        }`}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>물품 추가하기</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((prod) => {
                    const cartItem = cart.find((c) => c.product.id === prod.id);
                    return (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        config={effectiveConfig}
                        isChristmas={isChristmas}
                        onAddToCart={handleAddToCart}
                        isInCart={Boolean(cartItem)}
                        cartQuantity={cartItem?.quantity || 0}
                      />
                    );
                  })}
                </div>
              )}
            </main>

            {cartTotalCount > 0 && !isTeacher && (
              <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%]">
                <button
                  onClick={() => setIsCartOpen(true)}
                  className={`w-full py-3.5 px-5 rounded-3xl border-2 border-b-[6px] font-black text-sm shadow-2xl flex items-center justify-between active:translate-y-0.5 transition-all cursor-pointer ${
                    isChristmas
                      ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white border-red-950'
                      : 'bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white border-orange-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                    <span>장바구니</span>
                    <span
                      className={`font-mono tabular-nums px-2 py-0.5 rounded-xl font-black text-xs ${
                        isChristmas
                          ? 'bg-amber-300 text-red-950'
                          : 'bg-white text-orange-600'
                      }`}
                    >
                      {cartTotalCount}
                    </span>
                  </div>
                  <span
                    className={`px-3.5 py-1 rounded-2xl text-xs font-black border ${
                      isChristmas
                        ? 'bg-emerald-600 text-white border-emerald-900'
                        : 'bg-amber-200 text-amber-950 border-amber-600'
                    }`}
                  >
                    결제하기
                  </span>
                </button>
              </div>
            )}

            <CartDrawer
              isOpen={isCartOpen}
              onClose={() => setIsCartOpen(false)}
              items={cart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClearCart={handleClearCart}
              selectedStudent={loggedInUser}
              onOpenStudentSelector={() => setIsLoginModalOpen(true)}
              config={effectiveConfig}
              isChristmas={isChristmas}
              onSubmitOrder={handleSubmitOrder}
              onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
            />

            <OrderHistoryModal
              isOpen={isOrderHistoryOpen}
              isChristmas={isChristmas}
              onClose={() => setIsOrderHistoryOpen(false)}
              orders={orders}
              selectedStudent={loggedInUser}
              config={effectiveConfig}
            />
          </>
        )}

        <NameLoginModal
          isOpen={isLoginModalOpen}
          isChristmas={isChristmas}
          currencyUnit={effectiveConfig.currencyUnit}
          onLogin={handleNameLogin}
          onGuestMode={handleGuestMode}
          onClose={() => setIsLoginModalOpen(false)}
          allowClose={true}
          registeredStudents={students}
        />
      </div>
    </div>
  );
}
