import React, { useRef, useState } from 'react';
import { Product, StoreConfig } from '../types';
import { Volume2, Plus, Check } from 'lucide-react';
import { speakText, playCartSound } from '../utils/audio';
import { Product3DCanvas } from './Product3DCanvas';
import { Coin3DIcon } from './Icons3D';
import { getSpokenCurrencyUnit } from '../utils/seasonTheme';

interface ProductCardProps {
  product: Product;
  config: StoreConfig;
  isChristmas: boolean;
  onAddToCart: (product: Product) => void;
  isInCart: boolean;
  cartQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  config,
  isChristmas,
  onAddToCart,
  isInCart,
  cartQuantity,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const isOutOfStock = product.stock <= 0 || !product.isAvailable;
  const isStoreOpen = config.isOpen;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 10;
    const rx = (0.5 - py) * 10;
    setTilt({ rx, ry, gx: px * 100, gy: py * 100, active: true });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const spokenUnit = getSpokenCurrencyUnit(config.currencyUnit);
    speakText(`${product.name}. ${product.price} ${spokenUnit}.`);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || !isStoreOpen) return;
    playCartSound();
    onAddToCart(product);
  };

  const hasCustomImage = Boolean(product.imageUrl);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: tilt.active
          ? `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
          : 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      }}
      className={`group relative rounded-[28px] p-5 transition-all duration-150 flex flex-col justify-between select-none border-2 border-b-[8px] ${
        isChristmas
          ? isOutOfStock
            ? 'bg-stone-100 border-stone-300 opacity-75 shadow-lg'
            : isInCart
            ? 'bg-[#FFFDF9] border-emerald-400 border-b-emerald-700 shadow-[0_14px_28px_rgba(0,0,0,0.32),inset_0_3px_0_rgba(255,255,255,0.95)]'
            : 'bg-[#FFFDF9] border-amber-200 border-b-red-900 hover:border-amber-400 hover:border-b-red-700 shadow-[0_14px_28px_rgba(0,0,0,0.32),inset_0_3px_0_rgba(255,255,255,0.95)]'
          : isOutOfStock
          ? 'bg-stone-100 border-stone-300 opacity-70 shadow-[0_10px_20px_rgba(217,119,6,0.12)]'
          : isInCart
          ? 'bg-white border-emerald-400 border-b-emerald-600 shadow-[0_10px_20px_rgba(217,119,6,0.12),inset_0_3px_0_rgba(255,255,255,0.9)]'
          : 'bg-white border-amber-200 border-b-amber-400 hover:border-amber-400 hover:border-b-amber-500 shadow-[0_10px_20px_rgba(217,119,6,0.12),inset_0_3px_0_rgba(255,255,255,0.9)]'
      }`}
    >
      <div>
        {/* 3D Model / Custom Image Stage */}
        <div
          className={`relative w-full h-48 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 shadow-inner ${
            isChristmas
              ? hasCustomImage
                ? 'bg-[#FFFDF9] border-amber-200'
                : 'bg-gradient-to-b from-[#0E2439] via-[#15354E] to-[#1D4B43] border-amber-300/60'
              : 'bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 border-sky-200/80'
          }`}
        >
          <div
            style={{
              background: isChristmas && !hasCustomImage
                ? `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(253, 224, 71, 0.22), transparent 62%)`
                : `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 255, 255, 0.7), transparent 65%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="relative z-10 w-full h-full">
            <Product3DCanvas
              iconKey={product.emoji}
              name={product.name}
              category={product.category}
              imageUrl={product.imageUrl}
              isHovered={tilt.active}
              isChristmas={isChristmas}
            />
          </div>

          <button
            type="button"
            onClick={handleSpeak}
            title="음성 듣기"
            className={`absolute top-3 right-3 z-20 p-2 rounded-xl border-2 border-b-4 active:translate-y-0.5 transition-all shadow-xs cursor-pointer ${
              isChristmas
                ? 'bg-[#FFFDF9] hover:bg-amber-50 text-red-800 border-amber-300'
                : 'bg-white hover:bg-amber-50 text-sky-700 border-sky-300'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Unboxed Metadata */}
        <div
          className={`flex items-center gap-2 text-xs font-bold mb-1 ${
            isChristmas ? 'text-emerald-800' : 'text-sky-700'
          }`}
        >
          <span>{product.category}</span>
          <span aria-hidden="true">·</span>
          {isOutOfStock ? (
            <span className="text-rose-600 font-black">품절</span>
          ) : (
            <span className="text-stone-500 tabular-nums">재고 {product.stock}개</span>
          )}
        </div>

        {/* Title & Concise Note */}
        <h3
          className={`text-lg font-black text-stone-900 transition-colors line-clamp-1 ${
            isChristmas ? 'group-hover:text-red-700' : 'group-hover:text-amber-700'
          }`}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs font-medium text-stone-500 mt-0.5 line-clamp-1">
            {product.description}
          </p>
        )}
      </div>

      {/* Price & 3D Tactile Add Button */}
      <div
        className={`mt-4 pt-3.5 border-t-2 flex items-center justify-between gap-3 ${
          isChristmas ? 'border-amber-200/70' : 'border-amber-100'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Coin3DIcon className="w-6 h-6 shrink-0" isChristmas={isChristmas} />
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono tabular-nums text-stone-900">
              {product.price.toLocaleString()}
            </span>
            <span
              className={`text-xs font-black ${
                isChristmas ? 'text-red-700' : 'text-stone-500'
              }`}
            >
              {config.currencyUnit}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock || !isStoreOpen}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer ${
            isOutOfStock
              ? 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
              : !isStoreOpen
              ? 'bg-stone-200 border-stone-300 text-stone-500 cursor-not-allowed'
              : isInCart
              ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-900 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]'
              : isChristmas
              ? 'bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 border-red-950 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.4)]'
              : 'bg-gradient-to-b from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 border-orange-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.5)]'
          }`}
        >
          {isOutOfStock ? (
            <span>품절</span>
          ) : !isStoreOpen ? (
            <span>준비 중</span>
          ) : isInCart ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="tabular-nums">담김 ({cartQuantity})</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>담기</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
