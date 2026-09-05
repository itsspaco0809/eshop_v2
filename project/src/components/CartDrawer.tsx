import { useEffect, useLayoutEffect, useState, useRef } from 'react';
import {
X,
Plus,
Minus,
Trash2,
ShoppingBag,
} from 'lucide-react';

import { useCart } from '@/lib/cart';
import { Link } from '@/lib/router';
import { globalLenis } from '@/lib/lenis';
import type { ColorOption } from '@/pages/ProductDetail';
import { useTheme } from '@/lib/theme';

export default function CartDrawer() {
const {
items,
isOpen,
closeCart,
updateQuantity,
removeItem,
subtotal,
totalItems,
formatPrice,
} = useCart();

const { theme } = useTheme();

const [isRendered, setIsRendered] = useState(isOpen);
const [isAnimating, setIsAnimating] = useState(false);

const drawerRef = useRef<HTMLElement>(null);
const cartSafeAreaRef = useRef<HTMLDivElement>(null);

/*

=========================================================

CHECK GLOBAL SCROLL LOCKS

=========================================================



CartDrawer MUST NOT restart Lenis if another system

is still holding the page locked.



Current global locks:



ProductDetail loading



Intro overlay



Mobile menu



cart-open itself is excluded because this function is

normally called after cart-open has been removed.

=========================================================
*/

const hasOtherScrollLock = () => {
const html = document.documentElement;

return (
  html.classList.contains('product-loading') ||
  html.classList.contains('intro-active') ||
  html.classList.contains('mobile-menu-open')
);

};

/*

=========================================================

DRAWER / SAFE AREA BACKGROUND

=========================================================
*/

useLayoutEffect(() => {
const background =
  theme === 'dark' ? '#0a0a0a' : '#ffffff';

if (drawerRef.current) {
  drawerRef.current.style.backgroundColor = background;
}

if (cartSafeAreaRef.current) {
  cartSafeAreaRef.current.style.backgroundColor = background;
}
}, [theme, isRendered]);

/*

=========================================================

DRAWER OPEN / CLOSE

=========================================================
*/

useEffect(() => {
if (isOpen) {
setIsRendered(true);

  /*
   * Lock native page scrolling.
   *
   * Use HTML as the primary lock target.
   * This works together with index.css:
   *
   * html.cart-open,
   * html.cart-open body {
   *   overflow: hidden !important;
   * }
   */
  document.documentElement.classList.add('cart-open');
  window.dispatchEvent(new Event('lcp-surface-change'));

  /*
   * Keep this class for compatibility with existing CSS.
   */
  document.body.classList.add('cart-open');

  /*
   * Stop Lenis immediately.
   */
  if (globalLenis) {
    globalLenis.stop();
  }

  /*
   * Start drawer transition on next frame.
   */
  const raf = requestAnimationFrame(() => {
    setIsAnimating(true);
  });

  return () => {
    cancelAnimationFrame(raf);
  };
}

/*
 * =======================================================
 * CLOSE
 * =======================================================
 */

setIsAnimating(false);

document.documentElement.classList.remove('cart-open');
document.body.classList.remove('cart-open');
window.dispatchEvent(new Event('lcp-surface-change'));

/*
 * IMPORTANT:
 *
 * Do NOT blindly restart Lenis.
 *
 * ProductDetail may still be loading.
 * Intro may still be active.
 * Mobile menu may still be open.
 */
if (globalLenis && !hasOtherScrollLock()) {
  requestAnimationFrame(() => {
    /*
     * Re-check again inside RAF because another component
     * may have added a lock between this effect and RAF.
     */
    if (
      globalLenis &&
      !hasOtherScrollLock()
    ) {
      globalLenis.resize();
      globalLenis.start();
    }
  });
}

/*
 * Keep drawer mounted until transition finishes.
 */
const timer = window.setTimeout(() => {
  setIsRendered(false);
}, 300);

return () => {
  window.clearTimeout(timer);
};

}, [isOpen]);

/*

=========================================================

PREVENT PAGE SCROLL OUTSIDE DRAWER

=========================================================
*/

useEffect(() => {
if (!isOpen) return;

const handlePreventScroll = (
  e: TouchEvent | WheelEvent
) => {
  const target = e.target as Node | null;

  /*
   * Allow scrolling inside drawer.
   *
   * The cart list itself controls its own scrolling.
   */
  if (
    drawerRef.current &&
    target &&
    drawerRef.current.contains(target)
  ) {
    return;
  }

  /*
   * Prevent background page scrolling.
   */
  if (e.cancelable) {
    e.preventDefault();
  }
};

const handlePreventKeys = (
  e: KeyboardEvent
) => {
  const target = e.target as Node | null;

  /*
   * Do not block keyboard interaction inside drawer.
   */
  if (
    drawerRef.current &&
    target &&
    drawerRef.current.contains(target)
  ) {
    return;
  }

  const blockedKeys = [
    'Space',
    'PageUp',
    'PageDown',
    'End',
    'Home',
    'ArrowUp',
    'ArrowDown',
  ];

  if (
    blockedKeys.includes(e.code) ||
    blockedKeys.includes(e.key)
  ) {
    if (e.cancelable) {
      e.preventDefault();
    }
  }
};

window.addEventListener(
  'wheel',
  handlePreventScroll,
  {
    passive: false,
    capture: true,
  }
);

window.addEventListener(
  'touchmove',
  handlePreventScroll,
  {
    passive: false,
    capture: true,
  }
);

window.addEventListener(
  'keydown',
  handlePreventKeys,
  {
    passive: false,
  }
);

return () => {
  window.removeEventListener(
    'wheel',
    handlePreventScroll,
    true
  );

  window.removeEventListener(
    'touchmove',
    handlePreventScroll,
    true
  );

  window.removeEventListener(
    'keydown',
    handlePreventKeys
  );
};

}, [isOpen]);

/*

=========================================================

CLEANUP

=========================================================
*/

useEffect(() => {
return () => {
document.documentElement.classList.remove(
'cart-open'
);

  document.body.classList.remove(
    'cart-open'
  );
};

}, []);

/*

=========================================================

VALID CART ITEMS

=========================================================
*/

const validItems = items.filter(
(item) => Boolean(item?.product)
);

/*

=========================================================

RENDER

=========================================================
*/

if (!isRendered && !isOpen) {
return null;
}

return (
<>
{/* =====================================================
BACKDROP
===================================================== */}

  <div
    className={`
      fixed
      inset-0

      z-[60]

      bg-black/60
      backdrop-blur-sm

      transition-opacity
      duration-300
      ease-in-out

      touch-none
      overscroll-none

      ${
        isAnimating
          ? 'opacity-100'
          : 'opacity-0'
      }
    `}
    onClick={closeCart}
    aria-hidden="true"
  />

  {/* =====================================================
      CART DRAWER
      
      IMPORTANT:
      Use 100dvh instead of inset-y-0.
      
      This makes the drawer follow the dynamic viewport
      on iOS Safari and prevents the bottom safe-area from
      exposing the page underneath.
      ===================================================== */}

  <aside
    ref={drawerRef}
    className={`
      fixed

      top-0
      right-0

      h-[100dvh]
      min-h-[100svh]

      z-[70]

      w-full
      max-w-md

      bg-white
      dark:bg-neutral-950

      border-l-0
      md:border-l

      border-neutral-200
      dark:border-neutral-800

      flex
      flex-col

      overflow-hidden

      transform-gpu
      will-change-transform

      transition-transform
      duration-300
      ease-in-out

      ${
        isAnimating
          ? 'translate-x-0'
          : 'translate-x-full'
      }
    `}
  >
    {/* =================================================
        HEADER
        ================================================= */}

    <div
      className="
        flex
        items-center
        justify-between

        px-6

        pt-[calc(1.25rem+env(safe-area-inset-top))]
        pb-5

        border-b
        border-neutral-200
        dark:border-neutral-800

        flex-shrink-0

        bg-white
        dark:bg-neutral-950
      "
    >
      <div className="flex items-center gap-2">
        <ShoppingBag
          className="
            w-5
            h-5

            text-neutral-900
            dark:text-white
          "
        />

        <h2
          className="
            text-neutral-900
            dark:text-white

            font-bold
            uppercase
            tracking-wider
            text-sm
          "
        >
          Cart{' '}
          {totalItems > 0 &&
            `(${totalItems})`}
        </h2>
      </div>

      <button
        type="button"
        onClick={closeCart}
        className="
          p-2

          text-neutral-500
          hover:text-neutral-900

          dark:text-neutral-400
          dark:hover:text-white

          transition-colors

          cursor-pointer
        "
        aria-label="Close cart"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* =================================================
        CART ITEM LIST
        ================================================= */}

    <div
      className="
        flex-1
        min-h-0

        overflow-y-auto

        px-6
        py-4

        overscroll-contain
        touch-pan-y

        bg-white
        dark:bg-neutral-950
      "
      data-lenis-prevent
    >
      {validItems.length === 0 ? (
        <div
          className="
            flex
            flex-col
            items-center
            justify-center

            h-full

            text-center
            gap-4
          "
        >
          <div
            className="
              w-20
              h-20

              rounded-full

              bg-neutral-100
              dark:bg-neutral-900

              flex
              items-center
              justify-center
            "
          >
            <ShoppingBag
              className="
                w-8
                h-8

                text-neutral-400
                dark:text-neutral-600
              "
            />
          </div>

          <div>
            <p
              className="
                text-neutral-900
                dark:text-white

                font-semibold
                mb-1
              "
            >
              Your cart is empty
            </p>

            <p
              className="
                text-neutral-500
                text-sm
              "
            >
              Browse the store to find your
              next build.
            </p>
          </div>

          <Link
            to="/store"
            onClick={closeCart}
            className="
              mt-2

              px-6
              py-3

              bg-neutral-900
              dark:bg-white

              text-white
              dark:text-neutral-950

              text-sm
              font-bold
              uppercase
              tracking-wider

              rounded-lg

              hover:bg-neutral-800
              dark:hover:bg-neutral-200

              transition-colors
            "
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {validItems.map((item) => {
            const prod = item.product as any;

            const maxStock =
              prod.stock_quantity ??
              Infinity;

            const isMaxReached =
              typeof prod.stock_quantity ===
                'number' &&
              item.quantity >= maxStock;

            const displayColorName =
              item.selectedColor ||
              prod.selectedColor ||
              '';

            const targetId =
              (item as any).cartItemId ||
              (item as any).id ||
              prod.id;

            const matchedColorObj = (
              prod.colors as
                | ColorOption[]
                | undefined
            )?.find(
              (c) =>
                c.name?.toLowerCase() ===
                displayColorName?.toLowerCase()
            );

            const displayImage =
              item.selectedImage ||
              matchedColorObj?.thumbnail ||
              matchedColorObj?.gallery?.[0] ||
              prod.image_url;

            return (
              <div
                key={targetId}
                className="
                  flex
                  gap-4

                  bg-neutral-50
                  dark:bg-neutral-900

                  rounded-xl
                  p-3

                  border
                  border-neutral-200
                  dark:border-neutral-800
                "
              >
                {/* Product Image */}

                <div
                  className="
                    w-20
                    h-20

                    rounded-lg
                    overflow-hidden

                    flex-shrink-0

                    bg-neutral-200
                    dark:bg-neutral-800
                  "
                >
                  <img
                    src={displayImage}
                    alt={prod.name}
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />
                </div>

                {/* Product Information */}

                <div
                  className="
                    flex-1
                    min-w-0
                  "
                >
                  <h3
                    className="
                      text-neutral-900
                      dark:text-white

                      text-sm
                      font-semibold

                      truncate
                    "
                  >
                    {prod.name}
                  </h3>

                  <p
                    className="
                      text-neutral-500

                      text-xs
                      uppercase
                      tracking-wider

                      mt-0.5
                    "
                  >
                    {displayColorName
                      ? `Color: ${displayColorName}`
                      : ''}
                  </p>

                  <div
                    className="
                      flex
                      items-center
                      justify-between

                      mt-2
                    "
                  >
                    {/* Quantity Controls */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2

                        bg-white
                        dark:bg-neutral-950

                        rounded-lg

                        border
                        border-neutral-200
                        dark:border-neutral-800
                      "
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          updateQuantity(
                            targetId,
                            item.quantity - 1
                          );
                        }}
                        className="
                          p-1.5

                          text-neutral-500
                          hover:text-neutral-900

                          dark:text-neutral-400
                          dark:hover:text-white

                          transition-colors

                          cursor-pointer
                        "
                        aria-label="Decrease quantity"
                      >
                        <Minus
                          className="
                            w-3.5
                            h-3.5
                          "
                        />
                      </button>

                      <span
                        className="
                          text-neutral-900
                          dark:text-white

                          text-sm
                          font-medium

                          w-6

                          text-center
                        "
                      >
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          updateQuantity(
                            targetId,
                            item.quantity + 1
                          );
                        }}
                        disabled={isMaxReached}
                        className="
                          p-1.5

                          text-neutral-500
                          hover:text-neutral-900

                          dark:text-neutral-400
                          dark:hover:text-white

                          transition-colors

                          disabled:opacity-30
                          disabled:cursor-not-allowed

                          cursor-pointer
                        "
                        aria-label="Increase quantity"
                      >
                        <Plus
                          className="
                            w-3.5
                            h-3.5
                          "
                        />
                      </button>
                    </div>

                    {/* Remove / Price */}

                    <div
                      className="
                        flex
                        items-center
                        gap-3
                      "
                    >
                      <span
                        className="
                          text-neutral-900
                          dark:text-white

                          text-sm
                          font-bold
                        "
                      >
                        {formatPrice(
                          prod.price *
                            item.quantity
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          removeItem(
                            targetId
                          );
                        }}
                        className="
                          p-1

                          text-neutral-400
                          hover:text-red-500

                          dark:text-neutral-600
                          dark:hover:text-red-400

                          transition-colors

                          cursor-pointer
                        "
                        aria-label="Remove item"
                      >
                        <Trash2
                          className="
                            w-4
                            h-4
                          "
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* =================================================
        CART FOOTER
        ================================================= */}

    {validItems.length > 0 && (
      <div
        className="
          flex-shrink-0

          border-t
          border-neutral-200
          dark:border-neutral-800

          bg-white
          dark:bg-neutral-950
        "
      >
        {/* Main footer content */}

        <div
          className="
            px-6
            pt-5

            space-y-4

            bg-white
            dark:bg-neutral-950
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                text-neutral-500
                dark:text-neutral-400

                text-sm
                uppercase
                tracking-wider
              "
            >
              Subtotal
            </span>

            <span
              className="
                text-neutral-900
                dark:text-white

                text-xl
                font-bold
              "
            >
              {formatPrice(subtotal)}
            </span>
          </div>

          <p
            className="
              text-neutral-500
              text-xs
            "
          >
            Shipping and taxes calculated
            at checkout.
          </p>

          <Link
            to="/checkout"
            onClick={closeCart}
            className="
              block
              w-full

              py-4

              bg-neutral-900
              dark:bg-white

              text-white
              dark:text-neutral-950

              text-center

              text-sm
              font-bold
              uppercase
              tracking-wider

              rounded-lg

              hover:bg-neutral-800
              dark:hover:bg-neutral-200

              transition-all

              hover:scale-[1.02]
              active:scale-[0.98]
            "
          >
            Checkout
          </Link>
        </div>

        {/* =================================================
            SAFE AREA

            IMPORTANT:
            This is intentionally the SAME background as
            the drawer and footer.

            Because the parent itself is 100dvh, this area
            is never showing the page underneath.
            ================================================= */}

        <div
          ref={cartSafeAreaRef}
          data-cart-safe-area="true"
          aria-hidden="true"
          className="
            w-full
            flex-shrink-0

            h-[env(safe-area-inset-bottom)]

            bg-white
            dark:bg-neutral-950
          "
          style={{
            backgroundColor:
              'var(--cart-background)',
          }}
        />
      </div>
    )}
  </aside>
</>

);
}