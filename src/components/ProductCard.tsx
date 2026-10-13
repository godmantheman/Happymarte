import React from 'react';
import { Product, StoreConfig } from '../types';
import { Volume2, Plus, Check } from 'lucide-react';
import { speakText, playCartSound } from '../utils/audio';

interface ProductCardProps {
  product: Product;
  config: StoreConfig;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  config,
  onAddToCart,
  isInCart,
  cartQuantity,
}) => {
  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isStoreOpen = config.isOpen;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `${product.name}. 가격은 ${product.price} ${config.currencyUnit}입니다. ${product.description}`;
    speakText(message);
  };

  const handleAdd = () => {
    if (isOutOfStock || !isStoreOpen) return;
    playCartSound();
    onAddToCart(product);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case '간식':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case '문구류':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '특별쿠폰':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case '장난감':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div
      className={`group relative bg-white rounded-3xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
        isOutOfStock
          ? 'border-slate-200 bg-slate-50/70 opacity-75'
          : 'border-amber-200/80 hover:border-amber-400 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      <div>
        {/* Top Badges: Category & TTS sound button */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black border ${getCategoryColor(
              product.category
            )}`}
          >
            {product.category}
          </span>

          <div className="flex items-center space-x-1">
            {/* TTS Audio helper button */}
            <button
              onClick={handleSpeak}
              title="이 물품 설명 소리로 듣기"
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-700 transition-colors flex items-center space-x-1 text-xs font-bold"
            >
              <Volume2 className="w-4 h-4" />
              <span className="hidden sm:inline">읽어주기</span>
            </button>
          </div>
        </div>

        {/* Big Emoji / Visual Area */}
        <div className="w-full h-32 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50/50 flex items-center justify-center mb-4 border border-amber-100/60 group-hover:scale-105 transition-transform">
          <span className="text-6xl drop-shadow-sm select-none">
            {product.emoji || '🎁'}
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-800 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium line-clamp-2 h-8 leading-relaxed">
            {product.description || '선생님이 준비한 특별한 행복 선물입니다.'}
          </p>
        </div>
      </div>

      {/* Bottom Area: Price, Stock, & Add button */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          {/* Price */}
          <div className="flex items-baseline space-x-1">
            <span className="text-xs text-amber-600 font-bold">💰</span>
            <span className="text-2xl font-black text-amber-950">
              {product.price.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {config.currencyUnit}
            </span>
          </div>

          {/* Stock badge */}
          {isOutOfStock ? (
            <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200">
              품절 ❌
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              남은 수량: <strong className="text-slate-800">{product.stock}개</strong>
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleAdd}
          disabled={isOutOfStock || !isStoreOpen}
          className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xs ${
            isOutOfStock
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : !isStoreOpen
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : isInCart
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-500/20'
          }`}
        >
          {isOutOfStock ? (
            <span>지금은 재고가 없어요</span>
          ) : !isStoreOpen ? (
            <span>마트 준비 중</span>
          ) : isInCart ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>장바구니 담김 ({cartQuantity}개) +</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>장바구니에 담기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
