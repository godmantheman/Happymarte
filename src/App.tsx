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
import { KioskView } from './components/KioskView';
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
} from 'lucide-react';

const LOCAL_USER_NAME_KEY = 'happy_mart_user_name';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<StoreConfig>(TEMPLATE_CONFIG);

  const [loggedInUser, setLoggedInUser] = useState<Student | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const prevPendingCountRef = useRef<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  useEffect(() => {
    testConnection();
    seedInitialDataIfNeeded();

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
        setIsAdminMode(true);
      } else {
        setIsLoginModalOpen(true);
      }
    }
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
    <div id="top" className="min-h-screen bg-[#FFFDF7] text-stone-900 flex flex-col font-sans">
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-gradient-to-b from-amber-300 to-amber-400 text-amber-950 border-2 border-b-4 border-amber-700 px-4 py-2.5 rounded-2xl shadow-xl text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
      ) : isKioskMode ? (
        <>
          <Header
            isAdminMode={isAdminMode}
            onToggleAdminMode={handleToggleAdminMode}
            isKioskMode={isKioskMode}
            onToggleKioskMode={() => setIsKioskMode((prev) => !prev)}
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
            onScrollToSection={handleScrollToSection}
          />
          <KioskView
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            loggedInUser={loggedInUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            config={config}
            onSubmitOrder={handleSubmitOrder}
            onExitKiosk={() => setIsKioskMode(false)}
          />
        </>
      ) : (
        <>
          <Header
            isAdminMode={isAdminMode}
            onToggleAdminMode={handleToggleAdminMode}
            isKioskMode={isKioskMode}
            onToggleKioskMode={() => setIsKioskMode((prev) => !prev)}
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
            onScrollToSection={handleScrollToSection}
          />

          <main
            id="catalog-grid"
            className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6"
          >
            {/* 3D Tactile Toolbar: Categories + User/Balance/Admin Bar */}
            <div className="bg-gradient-to-b from-sky-100 to-sky-200/80 rounded-3xl p-4 border-2 border-b-[7px] border-sky-300 shadow-[0_8px_20px_rgba(14,165,233,0.12),inset_0_2px_0_rgba(255,255,255,0.85)] flex flex-wrap items-center justify-between gap-4">
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
                            ? 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
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
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border-2 border-b-4 border-sky-300">
                      <AvatarBadgeIcon
                        avatar={loggedInUser.avatar}
                        isTeacher={isTeacher}
                        size="sm"
                      />
                      <span className="text-sm font-black text-stone-900">
                        {loggedInUser.name}
                      </span>
                      {!isTeacher && (
                        <div className="flex items-center gap-1 pl-2 border-l-2 border-sky-100">
                          <Coin3DIcon className="w-4 h-4" />
                          <span className="text-sm font-black font-mono tabular-nums text-amber-700">
                            {loggedInUser.balance.toLocaleString()}
                            {config.currencyUnit}
                          </span>
                        </div>
                      )}
                    </div>

                    {isTeacher && (
                      <button
                        onClick={() => setIsAdminMode(true)}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white border-2 border-b-4 border-purple-900 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>관리자 패널</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-sky-900 border-2 border-b-4 border-sky-300 font-black text-xs active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                    >
                      변경
                    </button>

                    <button
                      onClick={handleLogout}
                      title="로그아웃"
                      className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 hover:text-rose-600 text-stone-500 border-2 border-b-4 border-sky-300 active:translate-y-0.5 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-amber-300 to-amber-400 hover:from-amber-200 hover:to-amber-300 text-amber-950 border-2 border-b-4 border-amber-700 font-black text-xs sm:text-sm flex items-center gap-2 shadow-[inset_0_2px_0_rgba(255,255,255,0.7)] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                  >
                    <UserCheck className="w-4 h-4 text-amber-800" />
                    <span>이름 로그인</span>
                  </button>
                )}
              </div>
            </div>

            {!config.isOpen && (
              <div className="bg-rose-50 border-2 border-b-4 border-rose-300 rounded-3xl p-4 flex items-center gap-3 text-rose-900 text-xs font-black">
                <Clock className="w-5 h-5 text-rose-600 shrink-0" />
                <span>현재 매장 준비 중입니다.</span>
              </div>
            )}

            {/* Products Grid with 3D Models & Custom Image Support */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-b-[6px] border-amber-200 p-16 text-center space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-amber-100 border-2 border-b-4 border-amber-300 text-amber-600 flex items-center justify-center mx-auto">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-stone-700">
                  등록된 물품이 없습니다
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {cartTotalCount > 0 && !isTeacher && (
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%]">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full py-3.5 px-5 rounded-3xl bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400 text-white border-2 border-b-[6px] border-orange-800 font-black text-sm shadow-2xl flex items-center justify-between active:translate-y-0.5 transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                  <span>장바구니</span>
                  <span className="font-mono tabular-nums bg-white text-orange-600 px-2 py-0.5 rounded-xl font-black text-xs">
                    {cartTotalCount}
                  </span>
                </div>
                <span className="bg-amber-200 text-amber-950 border border-amber-600 px-3.5 py-1 rounded-2xl text-xs font-black">
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
            config={config}
            onSubmitOrder={handleSubmitOrder}
            onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
          />

          <OrderHistoryModal
            isOpen={isOrderHistoryOpen}
            onClose={() => setIsOrderHistoryOpen(false)}
            orders={orders}
            selectedStudent={loggedInUser}
            config={config}
          />
        </>
      )}

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
