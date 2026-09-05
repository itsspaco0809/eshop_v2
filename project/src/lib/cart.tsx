import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CartItem } from './supabase';
import { useCurrency } from './currency';

export type ExtendedCartItem = CartItem & {
  cartItemId: string;
  selectedColor?: string;
  selectedImage?: string;
};

type CartContextValue = {
  items: ExtendedCartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  formattedSubtotal: string;
  formatPrice: (usdAmount: number) => string;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'monochrome-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ExtendedCartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const { currency, formatPrice } = useCurrency();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ExtendedCartItem[];
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((item) => item && item.product));
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // 核心修復：統一讀取顏色並產生獨立的 cartItemId
  const addItem = useCallback((product: Product, quantity = 1, customColor?: string) => {
    if (!product || !product.id) return;

    // 優先讀取傳入的 customColor，次選 product.selectedColor，最後選 product.color
    const color = customColor || (product as any).selectedColor || (product as any).color || 'standard';
    const colorSlug = String(color).toLowerCase().trim().replace(/\s+/g, '-');
    const cartItemId = `${product.id}-${colorSlug}`;

    setItems((prev) => {
      // 依據 cartItemId 比對，顏色不同即視為不同項目
      const existingIndex = prev.findIndex((i) => i.cartItemId === cartItemId || (i.product?.id === product.id && i.selectedColor === color));

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // 新增全新項目，保存顏色資訊與 cartItemId
      return [
        ...prev,
        {
          product: { ...product },
          quantity,
          selectedColor: color,
          cartItemId,
        } as ExtendedCartItem,
      ];
    });

    setIsOpen(true);
  }, []);

  // 依據 cartItemId 刪除 (相容舊版 product.id)
  const removeItem = useCallback((targetId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== targetId && i.product?.id !== targetId));
  }, []);

  // 依據 cartItemId 更新數量 (相容舊版 product.id)
  const updateQuantity = useCallback((targetId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.cartItemId !== targetId && i.product?.id !== targetId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        (i.cartItemId === targetId || i.product?.id === targetId) ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

  const subtotalUSD = items.reduce((sum, i) => {
    if (!i || !i.product) return sum;
    return sum + i.product.price * i.quantity;
  }, 0);

  const formattedSubtotal = formatPrice(subtotalUSD);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal: subtotalUSD,
        formattedSubtotal,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}