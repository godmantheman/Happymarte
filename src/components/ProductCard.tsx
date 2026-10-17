import React, { useRef, useState } from 'react';
import { Product, StoreConfig } from '../types';
import { Volume2, Plus, Check } from 'lucide-react';
import { speakText, playCartSound } from '../utils/audio';
import { Product3DCanvas } from './Product3DCanvas';
import { Coin3DIcon } from './Icons3D';

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
    speakText(`${product.name}. ${product.price} ${config.currencyUnit}.`);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock || !isStoreOpen) return;
    playCartSound();
    onAddToCart(product);
  };

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
      className={`group relative rounded-[28px] p-5 transition-all duration-150 flex flex-col justify-between select-none border-2 border-b-[8px] shadow-[0_10px_20px_rgba(217,119,6,0.12),inset_0_3px_0_rgba(255,255,255,0.9)] ${
        isOutOfStock
          ? 'bg-stone-100 border-stone-300 opacity-70'
          : isInCart
          ? 'bg-white border-emerald-400 border-b-emerald-600'
          : 'bg-white border-amber-200 border-b-amber-400 hover:border-amber-400 hover:border-b-amber-500'
      }`}
    >
      <div>
        {/* Bright Cheerful 3D Model / Custom Image Stage */}
        <div className="relative w-full h-48 rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 flex items-center justify-center mb-4 overflow-hidden border-2 border-sky-200/80 shadow-inner">
          <div
            style={{
              background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 255, 255, 0.7), transparent 65%)`,
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
            />
          </div>

          <button
            type="button"
            onClick={handleSpeak}
            title="음성 듣기"
            className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-white hover:bg-amber-50 text-sky-700 border-2 border-b-4 border-sky-300 active:translate-y-0.5 transition-all shadow-xs"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Unboxed Metadata */}
        <div className="flex items-center gap-2 text-xs font-bold text-sky-700 mb-1">
          <span>{product.category}</span>
          <span aria-hidden="true">·</span>
          {isOutOfStock ? (
            <span className="text-rose-600 font-black">품절</span>
          ) : (
            <span className="text-stone-500 tabular-nums">재고 {product.stock}개</span>
          )}
        </div>

        {/* Title & Concise Note */}
        <h3 className="text-lg font-black text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs font-medium text-stone-500 mt-0.5 line-clamp-1">
            {product.description}
          </p>
        )}
      </div>

      {/* Price & 3D Tactile Add Button */}
      <div className="mt-4 pt-3.5 border-t-2 border-amber-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Coin3DIcon className="w-6 h-6 shrink-0" />
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-mono tabular-nums text-stone-900">
              {product.price.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-stone-500">
              {config.currencyUnit}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isOutOfStock || !isStoreOpen}
          className={`px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 whitespace-nowrap shrink-0 ${
            isOutOfStock
              ? 'bg-stone-200 border-stone-300 text-stone-400 cursor-not-allowed'
              : !isStoreOpen
              ? 'bg-stone-200 border-stone-300 text-stone-500 cursor-not-allowed'
              : isInCart
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-500 border-emerald-700 text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45)]'
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
