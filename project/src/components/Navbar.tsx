import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  ShoppingBag,
  Menu,
  X,
  User as UserIcon,
  Package,
  House as Home,
  Cuboid,
  FileText,
  Wrench,
  Mail,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
} from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { globalLenis } from '@/lib/lenis';
import AuthModal from '@/components/AuthModal';
import { useCurrency, CURRENCIES } from '@/lib/currency';
import { useTheme } from '@/lib/theme';

interface NavbarProps {
  isIntroFinished?: boolean;
}

export default function Navbar({
  isIntroFinished = false,
}: NavbarProps) {
  const { totalItems, openCart } = useCart();
  const { path, navigate } = useRouter();
  const { user, isAdmin, signOut } = useAuth();

  const {
    currency,
    setCurrency,
    currencyConfig,
  } = useCurrency();

  const { theme, toggleTheme } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuRendered, setMobileMenuRendered] = useState(false);
  const [mobileMenuAnimating, setMobileMenuAnimating] = useState(false);

  const [authOpen, setAuthOpen] = useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [currencyMenuOpen, setCurrencyMenuOpen] =
    useState(false);

  const [mobileCurrencyOpen, setMobileCurrencyOpen] =
    useState(false);

  const [hidden, setHidden] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const userMenuRef =
    useRef<HTMLDivElement>(null);

  const currencyMenuRef =
    useRef<HTMLDivElement>(null);

  const introAnimatedRef =
    useRef(false);

  const headerRef =
    useRef<HTMLElement>(null);

  const mobileMenuRef =
    useRef<HTMLDivElement>(null);

  const mobileMenuSafeAreaRef =
    useRef<HTMLDivElement>(null);

  const mobileMenuScrollRef =
    useRef<HTMLDivElement>(null);

  const mobileOpenRef =
    useRef(false);

  const mobileMenuScrollLockedRef =
    useRef(false);

  const wasMobileMenuOpenRef =
    useRef(false);

  const mobileMenuUnlockTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const mobileMenuUnmountTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const mobileMenuAnimationFrameRef =
    useRef<number | null>(null);

  const CurrentFlag =
    currencyConfig?.Flag;

  /*
   * =========================================================
   * RESPONSIVE BREAKPOINT
   *
   * < 1536px
   * Mobile / Tablet / iPad
   *
   * >= 1536px
   * Desktop
   * =========================================================
   */

  const MOBILE_BREAKPOINT = 1536;

  /*
   * =========================================================
   * MOBILE MENU + SCROLL LOCK
   *
   * CartDrawer-style locking, but the menu stays mounted all
   * the time. This removes mount/RAF delay and keeps the bottom
   * safe area in the same fixed menu layer.
   * =========================================================
   */

  const hasOtherScrollLock = () => {
    const html = document.documentElement;

    return (
      html.classList.contains('cart-open') ||
      html.classList.contains('product-loading') ||
      html.classList.contains('intro-active')
    );
  };

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;

    if (mobileMenuUnlockTimerRef.current) {
      clearTimeout(mobileMenuUnlockTimerRef.current);
      mobileMenuUnlockTimerRef.current = null;
    }

    if (mobileMenuUnmountTimerRef.current) {
      clearTimeout(mobileMenuUnmountTimerRef.current);
      mobileMenuUnmountTimerRef.current = null;
    }

    if (mobileMenuAnimationFrameRef.current !== null) {
      cancelAnimationFrame(mobileMenuAnimationFrameRef.current);
      mobileMenuAnimationFrameRef.current = null;
    }

    if (mobileOpen) {
      // Mount the menu immediately when opening.
      setMobileMenuRendered(true);

      // Start the CSS transform transition on the next frame so the
      // menu does not appear instantly at translate-x-0.
      mobileMenuAnimationFrameRef.current =
        requestAnimationFrame(() => {
          mobileMenuAnimationFrameRef.current = null;
          setMobileMenuAnimating(true);
        });

      wasMobileMenuOpenRef.current = true;
      mobileMenuScrollLockedRef.current = true;

      document.documentElement.classList.add('mobile-menu-open');
      document.body.classList.add('mobile-menu-open');
      window.dispatchEvent(new Event('lcp-surface-change'));

      if (globalLenis) {
        globalLenis.stop();
      }

      return;
    }

    // Ignore the initial closed state.
    if (!wasMobileMenuOpenRef.current) {
      setMobileMenuAnimating(false);
      setMobileMenuRendered(false);
      mobileMenuScrollLockedRef.current = false;
      return;
    }

    wasMobileMenuOpenRef.current = false;

    // Start the close animation immediately. The menu, including the
    // bottom safe area, stays mounted until the 300ms transition ends.
    setMobileMenuAnimating(false);

    // Keep scrolling locked while the menu slides out.
    mobileMenuScrollLockedRef.current = true;

    mobileMenuUnmountTimerRef.current = setTimeout(() => {
      // This is the exact point where the safe-area layer is removed.
      setMobileMenuRendered(false);

      mobileMenuScrollLockedRef.current = false;

      document.documentElement.classList.remove('mobile-menu-open');
      document.body.classList.remove('mobile-menu-open');
      window.dispatchEvent(new Event('lcp-surface-change'));

      if (globalLenis && !hasOtherScrollLock()) {
        globalLenis.resize();
        globalLenis.start();
      }

      mobileMenuUnmountTimerRef.current = null;
    }, 300);

    return () => {
      if (mobileMenuUnlockTimerRef.current) {
        clearTimeout(mobileMenuUnlockTimerRef.current);
        mobileMenuUnlockTimerRef.current = null;
      }
    };
  }, [mobileOpen]);

  /*
   * =========================================================
   * MOBILE MENU THEME / SAFE AREA REPAINT
   *
   * Keep the menu and its bottom safe-area layer on the same
   * concrete background color. Updating the DOM styles directly
   * avoids the iOS Safari compositing/repaint delay that can leave
   * the safe area showing the previous theme until the menu is
   * closed and opened again.
   * =========================================================
   */

  useLayoutEffect(() => {
    const background =
      theme === 'dark' ? '#0a0a0a' : '#ffffff';

    if (mobileMenuRef.current) {
      mobileMenuRef.current.style.backgroundColor = background;
    }

    if (mobileMenuSafeAreaRef.current) {
      mobileMenuSafeAreaRef.current.style.backgroundColor = background;
    }

    // The safe-area layer is intentionally outside the transformed menu.
    // Update every matching layer immediately so iOS Safari never keeps
    // the first theme's bottom paint after a theme toggle.
    document
      .querySelectorAll<HTMLElement>('[data-mobile-menu-safe-area]')
      .forEach((element) => {
        element.style.backgroundColor = background;
      });
  }, [theme, mobileMenuRendered]);

  /*
   * =========================================================
   * PREVENT PAGE SCROLL WHEN MOBILE MENU IS OPEN/CLOSING
   *
   * The listener stays installed so the page is still locked
   * during the 300ms close animation. Only the inner menu
   * scroll container is allowed to receive wheel/touch scroll.
   * =========================================================
   */

  useEffect(() => {
    const handlePreventScroll = (e: TouchEvent | WheelEvent) => {
      if (!mobileMenuScrollLockedRef.current) {
        return;
      }

      const target = e.target as Node | null;

      if (
        mobileMenuScrollRef.current &&
        target &&
        mobileMenuScrollRef.current.contains(target)
      ) {
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handlePreventKeys = (e: KeyboardEvent) => {
      if (!mobileMenuScrollLockedRef.current) {
        return;
      }

      const target = e.target as Node | null;

      if (
        mobileMenuScrollRef.current &&
        target &&
        mobileMenuScrollRef.current.contains(target)
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

    window.addEventListener('wheel', handlePreventScroll, {
      passive: false,
      capture: true,
    });

    window.addEventListener('touchmove', handlePreventScroll, {
      passive: false,
      capture: true,
    });

    window.addEventListener('keydown', handlePreventKeys, {
      passive: false,
    });

    return () => {
      window.removeEventListener('wheel', handlePreventScroll, true);
      window.removeEventListener('touchmove', handlePreventScroll, true);
      window.removeEventListener('keydown', handlePreventKeys);
    };
  }, []);

  /*
   * =========================================================
   * CLEANUP MOBILE MENU LOCK
   * =========================================================
   */

  useEffect(() => {
    return () => {
      mobileMenuScrollLockedRef.current = false;

      if (mobileMenuUnlockTimerRef.current) {
        clearTimeout(mobileMenuUnlockTimerRef.current);
        mobileMenuUnlockTimerRef.current = null;
      }

      if (mobileMenuUnmountTimerRef.current) {
        clearTimeout(mobileMenuUnmountTimerRef.current);
        mobileMenuUnmountTimerRef.current = null;
      }

      if (mobileMenuAnimationFrameRef.current !== null) {
        cancelAnimationFrame(mobileMenuAnimationFrameRef.current);
        mobileMenuAnimationFrameRef.current = null;
      }

      document.documentElement.classList.remove('mobile-menu-open');
      document.body.classList.remove('mobile-menu-open');
      window.dispatchEvent(new Event('lcp-surface-change'));
    };
  }, []);

  /*
   * =========================================================
   * iOS / iPad VIEWPORT SAFE AREA
   *
   * viewport-fit=cover
   * =========================================================
   */

  useEffect(() => {
    let viewportMeta =
      document.querySelector(
        'meta[name="viewport"]'
      );

    if (!viewportMeta) {
      viewportMeta =
        document.createElement('meta');

      viewportMeta.setAttribute(
        'name',
        'viewport'
      );

      viewportMeta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover'
      );

      document.head.appendChild(
        viewportMeta
      );

      return;
    }

    const currentContent =
      viewportMeta.getAttribute(
        'content'
      ) || '';

    if (
      !currentContent
        .toLowerCase()
        .includes('viewport-fit')
    ) {
      viewportMeta.setAttribute(
        'content',
        `${currentContent}${
          currentContent
            ? ', '
            : ''
        }viewport-fit=cover`
      );
    }
  }, []);

  /*
   * =========================================================
   * INTRO SEQUENCE ANIMATION
   * =========================================================
   */

  useEffect(() => {
    if (
      !headerRef.current ||
      !isIntroFinished
    ) {
      return;
    }

    if (
      introAnimatedRef.current
    ) {
      gsap.set(
        headerRef.current,
        {
          clearProps:
            'y,opacity',
        }
      );

      const items =
        headerRef.current.querySelectorAll(
          '.mobile-header-item, .desktop-header-item'
        );

      gsap.set(items, {
        clearProps:
          'transform,opacity',
      });

      return;
    }

    const ctx = gsap.context(() => {
      const mobileItems =
        headerRef.current?.querySelectorAll(
          '.mobile-header-item'
        );

      const desktopItems =
        headerRef.current?.querySelectorAll(
          '.desktop-header-item'
        );

      const isMobile =
        window.innerWidth <
        MOBILE_BREAKPOINT;

      const targetItems =
        isMobile
          ? mobileItems
          : desktopItems;

      if (
        !targetItems ||
        targetItems.length === 0
      ) {
        return;
      }

      gsap.set(
        headerRef.current,
        {
          y: -50,
          opacity: 0,
        }
      );

      gsap.set(
        targetItems,
        {
          y: -30,
          opacity: 0,
        }
      );

      const tl =
        gsap.timeline({
          onComplete: () => {
            introAnimatedRef.current =
              true;

            gsap.set(
              [
                headerRef.current,
                targetItems,
              ],
              {
                clearProps:
                  'transform,opacity,y',
              }
            );
          },
        });

      tl.to(
        headerRef.current,
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          ease: 'power3.out',
        }
      ).to(
        targetItems,
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: isMobile
            ? 0.05
            : 0.04,
          ease: 'power2.out',
          clearProps:
            'transform,opacity',
        },
        '-=0.2'
      );
    }, headerRef);

    return () =>
      ctx.revert();
  }, [isIntroFinished]);

  /*
   * =========================================================
   * MOBILE HEADER HIDE / SHOW
   *
   * < 1536px ONLY
   * =========================================================
   */

  useEffect(() => {
    if (
      !headerRef.current ||
      !isIntroFinished
    ) {
      return;
    }

    const isMobile =
      window.innerWidth <
      MOBILE_BREAKPOINT;

    if (isMobile) {
      gsap.to(
        headerRef.current,
        {
          yPercent:
            hidden &&
            !mobileOpen
              ? -100
              : 0,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        }
      );
    } else {
      gsap.to(
        headerRef.current,
        {
          yPercent: 0,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto',
        }
      );
    }
  }, [
    hidden,
    mobileOpen,
    isIntroFinished,
  ]);

  /*
   * =========================================================
   * CLOSE MENUS ON SCROLL / ESC
   * =========================================================
   */

  useEffect(() => {
    if (
      !userMenuOpen &&
      !currencyMenuOpen
    ) {
      return;
    }

    const handleScrollOrKey = (
      e: Event
    ) => {
      if (
        e.type === 'keydown' &&
        (e as KeyboardEvent).key !==
          'Escape'
      ) {
        return;
      }

      if (
        e.type === 'scroll' &&
        currencyMenuRef.current?.contains(
          e.target as Node
        )
      ) {
        return;
      }

      setUserMenuOpen(false);
      setCurrencyMenuOpen(false);
    };

    window.addEventListener(
      'scroll',
      handleScrollOrKey,
      {
        passive: true,
        capture: true,
      }
    );

    window.addEventListener(
      'keydown',
      handleScrollOrKey
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScrollOrKey,
        {
          capture: true,
        }
      );

      window.removeEventListener(
        'keydown',
        handleScrollOrKey
      );
    };
  }, [
    userMenuOpen,
    currencyMenuOpen,
  ]);

  /*
   * =========================================================
   * CLICK OUTSIDE
   * =========================================================
   */

  useEffect(() => {
    const handleClickOutside = (
      event:
        | MouseEvent
        | TouchEvent
    ) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setUserMenuOpen(false);
      }

      if (
        currencyMenuRef.current &&
        !currencyMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setCurrencyMenuOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    document.addEventListener(
      'touchstart',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

      document.removeEventListener(
        'touchstart',
        handleClickOutside
      );
    };
  }, []);

  /*
   * =========================================================
   * SCROLL LOGIC
   * =========================================================
   */

  useEffect(() => {
    const handleScrollLogic = (
      currentScrollY: number,
      direction?: number
    ) => {
      const isMobile =
        window.innerWidth <
        MOBILE_BREAKPOINT;

      /*
       * =======================================================
       * DESKTOP
       * =======================================================
       */

      if (!isMobile) {
        setHidden(false);

        setScrolled(
          currentScrollY > 10
        );

        lastScrollY.current =
          Math.max(
            0,
            currentScrollY
          );

        return;
      }

      /*
       * =======================================================
       * MOBILE MENU OPEN
       *
       * DO NOT LOCK SCROLL.
       *
       * DO NOT STOP LENIS.
       *
       * Only pause Navbar hide/show state.
       * =======================================================
       */

      if (
        mobileOpenRef.current
      ) {
        return;
      }

      const viewportHeight =
        window.innerHeight;

      setScrolled(
        currentScrollY > 10
      );

      if (
        direction !== undefined
      ) {
        if (
          currentScrollY >
            viewportHeight &&
          direction === 1
        ) {
          setHidden(true);
        } else if (
          direction === -1 ||
          currentScrollY <=
            viewportHeight
        ) {
          setHidden(false);
        }

        lastScrollY.current =
          Math.max(
            0,
            currentScrollY
          );
      } else {
        const diff =
          currentScrollY -
          lastScrollY.current;

        if (
          currentScrollY >
            viewportHeight &&
          diff > 5
        ) {
          setHidden(true);
        } else if (
          diff < -5 ||
          currentScrollY <=
            viewportHeight
        ) {
          setHidden(false);
        }

        lastScrollY.current =
          Math.max(
            0,
            currentScrollY
          );
      }
    };

    /*
     * =======================================================
     * NATIVE SCROLL
     * =======================================================
     */

    const onNativeScroll = () => {
      if (ticking.current) {
        return;
      }

      ticking.current = true;

      window.requestAnimationFrame(
        () => {
          const currentScrollY =
            window.scrollY ||
            document.documentElement
              .scrollTop ||
            0;

          handleScrollLogic(
            currentScrollY
          );

          ticking.current = false;
        }
      );
    };

    /*
     * =======================================================
     * LENIS SCROLL
     * =======================================================
     */

    const onLenisScroll = (
      e: any
    ) => {
      handleScrollLogic(
        Number(e?.scroll) || 0,
        e?.direction
      );
    };

    if (globalLenis) {
      globalLenis.on(
        'scroll',
        onLenisScroll
      );
    }

    window.addEventListener(
      'scroll',
      onNativeScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      'resize',
      onNativeScroll,
      {
        passive: true,
      }
    );

    return () => {
      if (globalLenis) {
        globalLenis.off(
          'scroll',
          onLenisScroll
        );
      }

      window.removeEventListener(
        'scroll',
        onNativeScroll
      );

      window.removeEventListener(
        'resize',
        onNativeScroll
      );
    };
  }, []);

  /*
   * =========================================================
   * ROUTE CHANGE
   * =========================================================
   */

  useEffect(() => {
    setUserMenuOpen(false);
    setCurrencyMenuOpen(false);
    setMobileCurrencyOpen(false);
    setMobileOpen(false);
  }, [path]);

  /*
   * =========================================================
   * NAV CLICK
   * =========================================================
   */

  const handleNavClick = (
    _to: string
  ) => {
    setMobileCurrencyOpen(false);
    setMobileOpen(false);
  };

  /*
   * =========================================================
   * NAV LINKS
   * =========================================================
   */

  const navLinks = [
    {
      label: 'Home',
      to: '/',
      icon: Home,
    },
    {
      label: 'Kits',
      to: '/store',
      icon: Cuboid,
    },
    {
      label: 'Instructions',
      to: '/instructions',
      icon: FileText,
    },
    {
      label: 'Custom Parts',
      to: '/custom-parts',
      icon: Wrench,
    },
    {
      label: 'Contact',
      to: '/contact',
      icon: Mail,
    },
  ];

  const isActive = (
    to: string
  ) =>
    to === '/'
      ? path === '/'
      : path.startsWith(to);

  /*
   * =========================================================
   * LOGO
   * =========================================================
   */

  const logoUrl =
    'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/LCP_logo_trans.png';

  /*
   * =========================================================
   * MONOCHROME PAGE
   * =========================================================
   */

  const isMonochromePage =
    path === '/' ||
    path.startsWith('/orders') ||
    path.startsWith('/admin') ||
    path.startsWith('/checkout');

  /*
   * =========================================================
   * MOBILE ROW BASE
   * =========================================================
   */

  const mobileRowBase =
    'mobile-nav-item w-full h-12 px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between text-base font-bold uppercase tracking-wider transition-colors';

  return (
    <>
      <style>
        {`
          @keyframes gradientShiftNav {
            0% {
              background-position: 0% 50%;
            }

            50% {
              background-position: 100% 50%;
            }

            100% {
              background-position: 0% 50%;
            }
          }

          .animate-nav-gradient {
            background-size: 200% 200%;
            animation:
              gradientShiftNav
              5s ease infinite;
          }

          @keyframes slideUpIn {
            0% {
              transform: translateY(100%);
            }

            100% {
              transform: translateY(0%);
            }
          }

          @keyframes slideUpOut {
            0% {
              transform: translateY(0%);
            }

            100% {
              transform: translateY(-100%);
            }
          }

          .nav-pill-up {
            position: relative;
            overflow: hidden;
            color: #a3a3a3;
          }

          .nav-pill-up:hover {
            color: #ffffff;
          }

          .nav-pill-up::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background-color: #171717;
            pointer-events: none;
            z-index: 0;
            transform: translateY(100%);
            animation:
              slideUpOut
              300ms ease-out forwards;
          }

          .nav-pill-up:hover::before {
            animation:
              slideUpIn
              300ms ease-out forwards;
          }

          .dark .nav-pill-up {
            color: #a3a3a3;
          }

          .dark .nav-pill-up:hover {
            color: #000000;
          }

          .dark .nav-pill-up::before {
            background-color: #ffffff;
          }

          .nav-pill-up > span {
            position: relative;
            z-index: 10;
          }
        `}
      </style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header
        ref={headerRef}
        className={`
          fixed
          top-0
          left-0
          right-0
          z-50
          transition-colors
          duration-300
          ease-in-out
          bg-white
          dark:bg-neutral-950

          ${
            scrolled
              ? 'border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm'
              : 'border-b border-transparent'
          }

          ${
            !isIntroFinished
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          }
        `}
      >
        <nav
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
            relative
            z-50
            pt-[env(safe-area-inset-top)]
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              h-20
              min-[1536px]:h-28
              relative
            "
          >
            {/* =================================================
                MOBILE HAMBURGER
                ================================================= */}

            <button
              onClick={() => {
                setMobileOpen(
                  (prev) => !prev
                );
              }}
              className="
                mobile-header-item
                min-[1536px]:hidden
                p-2
                text-neutral-900
                dark:text-white
                relative
                w-10
                h-10
                flex
                items-center
                justify-center
                focus:outline-none
                z-50
              "
              aria-label="Toggle menu"
              aria-expanded={
                mobileOpen
              }
            >
              <Menu
                className={`
                  w-6
                  h-6
                  absolute
                  transition-all
                  duration-300
                  ease-out

                  ${
                    mobileOpen
                      ? 'opacity-0 rotate-90 scale-75 pointer-events-none'
                      : 'opacity-100 rotate-0 scale-100'
                  }
                `}
              />

              <X
                className={`
                  w-6
                  h-6
                  absolute
                  transition-all
                  duration-300
                  ease-out

                  ${
                    mobileOpen
                      ? 'opacity-100 rotate-0 scale-100'
                      : 'opacity-0 -rotate-90 scale-75 pointer-events-none'
                  }
                `}
              />
            </button>

            {/* =================================================
                LOGO
                ================================================= */}

            <div
              className="
                absolute
                left-1/2
                -translate-x-1/2
                min-[1536px]:static
                min-[1536px]:translate-x-0
                flex
                items-center
                justify-center
              "
            >
              <Link
                to="/"
                onClick={() =>
                  handleNavClick('/')
                }
                className="
                  mobile-header-item
                  desktop-header-item
                  group
                  relative
                  flex
                  items-center
                  justify-center
                  h-14
                  min-[1536px]:h-20
                  w-32
                  min-[1536px]:w-44
                  transition-transform
                  duration-300
                  ease-out
                  min-[1536px]:hover:scale-110
                  min-[1536px]:active:scale-95
                  touch-manipulation
                  z-50
                  select-none
                "
                aria-label="Home"
              >
                <img
                  src={logoUrl}
                  alt="LCP logo"
                  className={`
                    absolute
                    inset-0
                    w-full
                    h-full
                    object-contain
                    pointer-events-none
                    transition-opacity
                    duration-300
                    ease-in-out

                    ${
                      theme ===
                      'dark'
                        ? 'brightness-0 invert'
                        : 'brightness-0'
                    }

                    ${
                      isMonochromePage
                        ? 'opacity-100'
                        : 'opacity-0'
                    }
                  `}
                />

                <div
                  className={`
                    absolute
                    inset-0
                    w-full
                    h-full
                    pointer-events-none
                    transition-opacity
                    duration-300
                    ease-in-out
                    bg-gradient-to-r
                    from-emerald-400
                    via-lime-300
                    to-yellow-400
                    animate-nav-gradient

                    ${
                      !isMonochromePage
                        ? 'opacity-100'
                        : 'opacity-0'
                    }
                  `}
                  style={{
                    maskImage:
                      `url(${logoUrl})`,
                    WebkitMaskImage:
                      `url(${logoUrl})`,
                    maskSize:
                      'contain',
                    WebkitMaskSize:
                      'contain',
                    maskRepeat:
                      'no-repeat',
                    WebkitMaskRepeat:
                      'no-repeat',
                    maskPosition:
                      'center',
                    WebkitMaskPosition:
                      'center',
                  }}
                />
              </Link>
            </div>

            {/* =================================================
                DESKTOP NAV
                ================================================= */}

            <div
              className="
                hidden
                min-[1536px]:flex
                items-center
                gap-6
              "
            >
              {navLinks.map(
                (link) => {
                  const active =
                    isActive(
                      link.to
                    );

                  return (
                    <Link
                      key={
                        link.to
                      }
                      to={
                        link.to
                      }
                      onClick={() =>
                        handleNavClick(
                          link.to
                        )
                      }
                      className={`
                        desktop-header-item
                        relative
                        text-sm
                        font-semibold
                        uppercase
                        tracking-wider
                        px-5
                        py-2.5
                        rounded-full
                        transition-colors
                        duration-300

                        ${
                          active
                            ? `
                              bg-neutral-950
                              text-white
                              shadow-md
                              dark:bg-white
                              dark:text-black
                            `
                            : `
                              nav-pill-up
                              text-neutral-400
                              hover:text-white
                              dark:text-neutral-400
                              dark:hover:text-black
                            `
                        }
                      `}
                    >
                      <span className="relative z-10">
                        {
                          link.label
                        }
                      </span>
                    </Link>
                  );
                }
              )}
            </div>

            {/* =================================================
                RIGHT ACTIONS
                ================================================= */}

            <div
              className="
                flex
                items-center
                gap-3
                z-50
              "
            >
              {/* =================================================
                  DESKTOP CURRENCY
                  ================================================= */}

              <div
                className="
                  hidden
                  min-[1536px]:block
                  desktop-header-item
                  relative
                "
                ref={
                  currencyMenuRef
                }
              >
                <button
                  onClick={() => {
                    setCurrencyMenuOpen(
                      (prev) =>
                        !prev
                    );

                    setUserMenuOpen(
                      false
                    );
                  }}
                  className="
                    p-2
                    text-neutral-700
                    dark:text-white
                    hover:text-neutral-900
                    dark:hover:text-neutral-300
                    transition-colors
                    flex
                    items-center
                    gap-2
                    focus:outline-none
                  "
                  aria-label="Select currency"
                  aria-expanded={
                    currencyMenuOpen
                  }
                >
                  {CurrentFlag && (
                    <CurrentFlag
                      className="
                        w-5
                        h-3.5
                        object-cover
                        rounded-sm
                      "
                    />
                  )}

                  <span
                    className="
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                    "
                  >
                    {currencyConfig?.code ||
                      currency}
                  </span>
                </button>

                {currencyMenuOpen && (
                  <div
                    className="
                      absolute
                      right-0
                      top-full
                      mt-2
                      w-64
                      bg-white
                      dark:bg-neutral-900
                      border
                      border-neutral-200
                      dark:border-neutral-800
                      rounded-xl
                      shadow-2xl
                      z-50
                      overflow-hidden
                      animate-[fadeIn_0.15s_ease]
                    "
                  >
                    <div
                      className="
                        px-4
                        py-3
                        border-b
                        border-neutral-200
                        dark:border-neutral-800
                      "
                    >
                      <p
                        className="
                          text-neutral-500
                          dark:text-neutral-400
                          text-xs
                          font-semibold
                          uppercase
                          tracking-wider
                        "
                      >
                        Select Country /
                        Currency
                      </p>
                    </div>

                    <div
                      className="
                        max-h-60
                        sm:max-h-80
                        overflow-y-auto
                        overscroll-contain
                        touch-pan-y
                      "
                      data-lenis-prevent
                      onWheel={(e) =>
                        e.stopPropagation()
                      }
                    >
                      {Object.entries(
                        CURRENCIES
                      ).map(
                        ([
                          key,
                          item,
                        ]) => {
                          const ItemFlag =
                            item.Flag;

                          const isSelected =
                            key ===
                              currency ||
                            item.code ===
                              currency;

                          return (
                            <button
                              key={
                                key
                              }
                              onClick={() => {
                                setCurrency(
                                  key
                                );

                                setCurrencyMenuOpen(
                                  false
                                );
                              }}
                              className={`
                                flex
                                items-center
                                justify-between
                                w-full
                                px-4
                                py-3
                                text-sm
                                transition-colors

                                ${
                                  isSelected
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                                    : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                                }
                              `}
                            >
                              <span className="flex items-center gap-3">
                                {ItemFlag && (
                                  <ItemFlag
                                    className="
                                      w-5
                                      h-3.5
                                      object-cover
                                      rounded-sm
                                      shadow-sm
                                    "
                                  />
                                )}

                                <span>
                                  {
                                    item.name
                                  }
                                </span>
                              </span>

                              <span
                                className="
                                  text-xs
                                  text-neutral-400
                                  dark:text-neutral-500
                                  font-mono
                                "
                              >
                                {
                                  item.code
                                }
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  DESKTOP USER
                  ================================================= */}

              <div
                className="
                  hidden
                  min-[1536px]:block
                  desktop-header-item
                  relative
                "
                ref={
                  userMenuRef
                }
              >
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setUserMenuOpen(
                          (prev) =>
                            !prev
                        );

                        setCurrencyMenuOpen(
                          false
                        );
                      }}
                      className="
                        p-2
                        text-neutral-700
                        dark:text-white
                        hover:text-neutral-900
                        dark:hover:text-neutral-300
                        transition-colors
                        flex
                        items-center
                        gap-1.5
                        focus:outline-none
                      "
                      aria-label="Account menu"
                      aria-expanded={
                        userMenuOpen
                      }
                    >
                      <div
                        className="
                          w-7
                          h-7
                          rounded-full
                          bg-neutral-200
                          dark:bg-neutral-700
                          text-neutral-900
                          dark:text-white
                          flex
                          items-center
                          justify-center
                          text-xs
                          font-bold
                        "
                      >
                        {user.email?.[0]?.toUpperCase() ??
                          'U'}
                      </div>
                    </button>

                    {userMenuOpen && (
                      <div
                        className="
                          absolute
                          right-0
                          top-full
                          mt-2
                          w-56
                          bg-white
                          dark:bg-neutral-900
                          border
                          border-neutral-200
                          dark:border-neutral-800
                          rounded-xl
                          shadow-2xl
                          z-50
                          overflow-hidden
                          animate-[fadeIn_0.15s_ease]
                        "
                      >
                        <div
                          className="
                            px-4
                            py-3
                            border-b
                            border-neutral-200
                            dark:border-neutral-800
                          "
                        >
                          <p
                            className="
                              text-neutral-500
                              dark:text-neutral-400
                              text-xs
                              uppercase
                              tracking-wider
                            "
                          >
                            Signed in as
                          </p>

                          <p
                            className="
                              text-neutral-900
                              dark:text-white
                              text-sm
                              font-medium
                              truncate
                            "
                          >
                            {
                              user.email
                            }
                          </p>
                        </div>

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            px-4
                            py-3
                            text-sm
                            text-neutral-700
                            dark:text-neutral-300
                            border-b
                            border-neutral-200
                            dark:border-neutral-800
                          "
                        >
                          <span className="font-medium">
                            Theme
                          </span>

                          <button
                            type="button"
                            onClick={(
                              e
                            ) => {
                              e.stopPropagation();
                              toggleTheme();
                            }}
                            className="
                              relative
                              flex
                              items-center
                              justify-between
                              w-12
                              h-6
                              p-0.5
                              rounded-full
                              bg-neutral-200
                              dark:bg-neutral-800
                              transition-colors
                              focus:outline-none
                              select-none
                            "
                            aria-label={`Switch to ${
                              theme ===
                              'dark'
                                ? 'light'
                                : 'dark'
                            } mode`}
                          >
                            <span
                              className={`
                                absolute
                                top-0.5
                                left-0.5
                                w-5
                                h-5
                                rounded-full
                                bg-white
                                dark:bg-neutral-950
                                shadow-md
                                transform
                                transition-transform
                                duration-200
                                ease-out

                                ${
                                  theme ===
                                  'dark'
                                    ? 'translate-x-6'
                                    : 'translate-x-0'
                                }
                              `}
                            />

                            <span className="relative z-10 flex items-center justify-center w-5 h-5">
                              <Sun
                                className={`
                                  w-3
                                  h-3
                                  transition-colors
                                  duration-200

                                  ${
                                    theme ===
                                    'light'
                                      ? 'text-amber-500'
                                      : 'text-neutral-400 dark:text-neutral-500'
                                  }
                                `}
                              />
                            </span>

                            <span className="relative z-10 flex items-center justify-center w-5 h-5">
                              <Moon
                                className={`
                                  w-3
                                  h-3
                                  transition-colors
                                  duration-200

                                  ${
                                    theme ===
                                    'dark'
                                      ? 'text-indigo-400'
                                      : 'text-neutral-400'
                                  }
                                `}
                              />
                            </span>
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            navigate(
                              '/orders'
                            );

                            setUserMenuOpen(
                              false
                            );
                          }}
                          className="
                            flex
                            items-center
                            gap-3
                            w-full
                            px-4
                            py-3
                            text-neutral-700
                            dark:text-neutral-300
                            hover:text-neutral-900
                            dark:hover:text-white
                            hover:bg-neutral-100
                            dark:hover:bg-neutral-800
                            transition-colors
                            text-sm
                          "
                        >
                          <Package className="w-4 h-4" />
                          Order History
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              navigate(
                                '/admin'
                              );

                              setUserMenuOpen(
                                false
                              );
                            }}
                            className="
                              flex
                              items-center
                              gap-3
                              w-full
                              px-4
                              py-3
                              text-neutral-700
                              dark:text-neutral-300
                              hover:text-neutral-900
                              dark:hover:text-white
                              hover:bg-neutral-100
                              dark:hover:bg-neutral-800
                              transition-colors
                              text-sm
                            "
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            Admin Dashboard
                          </button>
                        )}

                        <button
                          onClick={() => {
                            signOut();

                            setUserMenuOpen(
                              false
                            );

                            navigate(
                              '/'
                            );
                          }}
                          className="
                            flex
                            items-center
                            gap-3
                            w-full
                            px-4
                            py-3
                            text-neutral-700
                            dark:text-neutral-300
                            hover:text-neutral-900
                            dark:hover:text-white
                            transition-colors
                            text-sm
                            border-t
                            border-neutral-200
                            dark:border-neutral-800
                          "
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() =>
                      setAuthOpen(
                        true
                      )
                    }
                    className="
                      p-2
                      text-neutral-700
                      dark:text-white
                      hover:text-neutral-900
                      dark:hover:text-neutral-300
                      transition-colors
                    "
                    aria-label="Sign in"
                  >
                    <UserIcon className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* =================================================
                  CART
                  ================================================= */}

              <button
                onClick={openCart}
                className="
                  mobile-header-item
                  desktop-header-item
                  relative
                  p-2
                  text-neutral-900
                  dark:text-white
                  hover:text-neutral-600
                  dark:hover:text-neutral-300
                  transition-colors
                "
                aria-label="Open cart"
              >
                <ShoppingBag className="w-6 h-6" />

                {totalItems > 0 && (
                  <span
                    className="
                      absolute
                      -top-0.5
                      -right-0.5
                      w-5
                      h-5
                      bg-neutral-900
                      dark:bg-white
                      text-white
                      dark:text-neutral-950
                      text-xs
                      font-bold
                      rounded-full
                      flex
                      items-center
                      justify-center
                      animate-[fadeIn_0.3s_ease]
                    "
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* =======================================================
          MOBILE MENU

          IMPORTANT
          ─────────────────────────────────────────────────────
          The menu is rendered only while OPEN or during the close
          transition. The bottom safe area is inside this same fixed
          layer, so it slides out together with the menu and is removed
          only after the 300ms close animation finishes.

          OPEN:
            - mobileOpen = true
            - menu mounts immediately
            - next frame starts the 300ms slide-in
            - Lenis stops immediately
            - page scroll is locked

          CLOSE:
            - menu starts sliding out immediately
            - safe area slides out with the menu
            - page remains locked for the full 300ms transition
            - menu + safe area unmount after 300ms
            - Lenis restarts only after unmount

          Only the inner overflow-y-auto container can scroll.
          ======================================================= */}

      {mobileMenuRendered && (
        <div
          ref={mobileMenuRef}
          aria-hidden={!mobileOpen}
          className={`
            fixed

            top-0
            left-0
            right-0
            bottom-0

            w-full

            h-[100dvh]
            min-h-[100svh]

            overflow-hidden

            bg-white
            dark:bg-neutral-950

            z-40

            min-[1536px]:hidden

            flex
            flex-col
            justify-start

            px-0

            pt-[calc(5rem+env(safe-area-inset-top))]

            transform
            transform-gpu
            will-change-transform

            transition-transform
            duration-300
            ease-out

            overscroll-contain

            ${
              mobileMenuAnimating
                ? 'translate-x-0 pointer-events-auto'
                : '-translate-x-full pointer-events-none'
            }
          `}
          style={{
            backgroundColor:
              theme === 'dark' ? '#0a0a0a' : '#ffffff',
          }}
        >
          {/* ===================================================
              SCROLLABLE MENU CONTENT
              =================================================== */}

          <div
            ref={mobileMenuScrollRef}
            className="
              flex-1
              min-h-0
              w-full

              overflow-y-auto
              overflow-x-hidden

              overscroll-contain
              touch-pan-y
              overscroll-y-contain
            "
            data-lenis-prevent
            data-lenis-prevent-wheel
            onWheel={(event) => {
              event.stopPropagation();
            }}
            onTouchMove={(event) => {
              event.stopPropagation();
            }}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
            }}
          >
            <div
              className="
                w-full
                flex
                flex-col
              "
            >
              {/* =================================================
                  MAIN NAV LINKS
                  ================================================= */}

              {navLinks.map(
                (link) => {
                  const Icon =
                    link.icon;

                  const active =
                    isActive(
                      link.to
                    );

                  return (
                    <Link
                      key={
                        link.to
                      }
                      to={
                        link.to
                      }
                      onClick={() =>
                        handleNavClick(
                          link.to
                        )
                      }
                      className={`
                        ${mobileRowBase}

                        ${
                          active
                            ? 'text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-neutral-900/60'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />

                        {
                          link.label
                        }
                      </span>
                    </Link>
                  );
                }
              )}

              {/* =================================================
                  USER LINKS
                  ================================================= */}

              {user && (
                <>
                  <Link
                    to="/orders"
                    onClick={() => {
                      setMobileOpen(
                        false
                      );
                    }}
                    className={`
                      ${mobileRowBase}
                      text-neutral-500
                      dark:text-neutral-400
                      hover:text-neutral-900
                      dark:hover:text-white
                    `}
                  >
                    <span className="flex items-center gap-3">
                      <Package className="w-5 h-5" />

                      Order History
                    </span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => {
                        setMobileOpen(
                          false
                        );
                      }}
                      className={`
                        ${mobileRowBase}
                        text-neutral-500
                        dark:text-neutral-400
                        hover:text-neutral-900
                        dark:hover:text-white
                      `}
                    >
                      <span className="flex items-center gap-3">
                        <ShieldCheck className="w-5 h-3.5 text-emerald-600 dark:text-emerald-400" />

                        Admin Dashboard
                      </span>
                    </Link>
                  )}
                </>
              )}

              {/* =================================================
                  MOBILE CURRENCY
                  ================================================= */}

              <div className="w-full">
                <button
                  onClick={() =>
                    setMobileCurrencyOpen(
                      (prev) =>
                        !prev
                    )
                  }
                  className={`
                    ${mobileRowBase}
                    text-neutral-900
                    dark:text-white
                  `}
                  aria-expanded={
                    mobileCurrencyOpen
                  }
                >
                  <span>
                    Currency
                  </span>

                  <div className="flex items-center gap-2">
                    {CurrentFlag && (
                      <CurrentFlag
                        className="
                          w-5
                          h-3.5
                          object-cover
                          rounded-sm
                          shadow-sm
                        "
                      />
                    )}

                    <span
                      className="
                        text-sm
                        font-bold
                        tracking-normal
                        text-neutral-500
                        dark:text-neutral-400
                      "
                    >
                      {currencyConfig?.code ||
                        currency}
                    </span>

                    <ChevronDown
                      className={`
                        w-4
                        h-4
                        transition-transform
                        duration-200
                        text-neutral-400

                        ${
                          mobileCurrencyOpen
                            ? 'rotate-180'
                            : ''
                        }
                      `}
                    />
                  </div>
                </button>

                {mobileCurrencyOpen && (
                  <div
                    className="
                      bg-neutral-50
                      dark:bg-neutral-900/50

                      border-b
                      border-neutral-200/80
                      dark:border-neutral-800/80

                      px-6
                      py-2

                      space-y-1
                    "
                    data-lenis-prevent
                  >
                    {Object.entries(
                      CURRENCIES
                    ).map(
                      ([
                        key,
                        item,
                      ]) => {
                        const ItemFlag =
                          item.Flag;

                        const isSelected =
                          key ===
                            currency ||
                          item.code ===
                            currency;

                        return (
                          <button
                            key={
                              key
                            }
                            onClick={() => {
                              setCurrency(
                                key
                              );

                              setMobileCurrencyOpen(
                                false
                              );
                            }}
                            className={`
                              flex
                              items-center
                              justify-between
                              w-full
                              px-3
                              py-2.5
                              rounded-lg
                              text-xs
                              font-semibold
                              uppercase
                              tracking-wider
                              transition-colors

                              ${
                                isSelected
                                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-bold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                              }
                            `}
                          >
                            <span className="flex items-center gap-2.5">
                              {ItemFlag && (
                                <ItemFlag
                                  className="
                                    w-4
                                    h-3
                                    object-cover
                                    rounded-sm
                                    shadow-sm
                                  "
                                />
                              )}

                              <span>
                                {
                                  item.name
                                }
                              </span>
                            </span>

                            <span
                              className="
                                text-[10px]
                                text-neutral-400
                                dark:text-neutral-500
                                font-mono
                              "
                            >
                              {
                                item.code
                              }
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* =================================================
                  MOBILE THEME
                  ================================================= */}

              {user && (
                <div
                  className={`
                    ${mobileRowBase}
                    text-neutral-900
                    dark:text-white
                  `}
                >
                  <span>
                    Theme
                  </span>

                  <button
                    type="button"
                    onClick={
                      toggleTheme
                    }
                    className="
                      relative
                      flex
                      items-center
                      justify-between
                      w-16
                      h-8
                      p-1
                      rounded-full
                      bg-neutral-200/80
                      dark:bg-neutral-800
                      transition-colors
                      focus:outline-none
                      select-none
                    "
                    aria-label={`Switch to ${
                      theme ===
                      'dark'
                        ? 'light'
                        : 'dark'
                    } mode`}
                  >
                    <span
                      className={`
                        absolute
                        top-1
                        left-1
                        w-6
                        h-6
                        rounded-full
                        bg-white
                        dark:bg-neutral-950
                        shadow-md
                        transform
                        transition-transform
                        duration-200
                        ease-out

                        ${
                          theme ===
                          'dark'
                            ? 'translate-x-8'
                            : 'translate-x-0'
                        }
                      `}
                    />

                    <span className="relative z-10 flex items-center justify-center w-6 h-6">
                      <Sun
                        className={`
                          w-3.5
                          h-3.5
                          transition-colors
                          duration-200

                          ${
                            theme ===
                            'light'
                              ? 'text-amber-500'
                              : 'text-neutral-400 dark:text-neutral-500'
                          }
                        `}
                      />
                    </span>

                    <span className="relative z-10 flex items-center justify-center w-6 h-6">
                      <Moon
                        className={`
                          w-3.5
                          h-3.5
                          transition-colors
                          duration-200

                          ${
                            theme ===
                            'dark'
                              ? 'text-indigo-400'
                              : 'text-neutral-400'
                          }
                        `}
                      />
                    </span>
                  </button>
                </div>
              )}

              {/* =================================================
                  MOBILE ACCOUNT
                  ================================================= */}

              <div
                className="
                  mobile-nav-item
                  w-full
                  px-6
                  py-5
                  border-b
                  border-neutral-200/80
                  dark:border-neutral-800/80
                "
              >
                {user ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          w-9
                          h-9
                          rounded-full
                          bg-neutral-200
                          dark:bg-neutral-700
                          flex
                          items-center
                          justify-center
                          text-xs
                          font-bold
                          text-neutral-900
                          dark:text-white
                          shrink-0
                        "
                      >
                        {user.email?.[0]?.toUpperCase() ??
                          'U'}
                      </div>

                      <div
                        className="
                          flex
                          flex-col
                          min-w-0
                        "
                      >
                        <span
                          className="
                            text-[10px]
                            text-neutral-500
                            dark:text-neutral-400
                            uppercase
                            tracking-wider
                          "
                        >
                          Signed in as
                        </span>

                        <span
                          className="
                            text-xs
                            font-semibold
                            text-neutral-900
                            dark:text-white
                            truncate
                          "
                        >
                          {
                            user.email
                          }
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        signOut();

                        setMobileOpen(
                          false
                        );

                        navigate(
                          '/'
                        );
                      }}
                      className="
                        w-full
                        flex
                        items-center
                        justify-center
                        gap-2
                        py-3
                        px-4
                        bg-neutral-100
                        dark:bg-neutral-900
                        hover:bg-neutral-200
                        dark:hover:bg-neutral-800
                        border
                        border-neutral-200
                        dark:border-neutral-800
                        rounded-xl
                        text-neutral-700
                        dark:text-neutral-300
                        hover:text-neutral-900
                        dark:hover:text-white
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        transition-colors
                      "
                    >
                      <LogOut className="w-3.5 h-3.5" />

                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMobileOpen(
                        false
                      );

                      setAuthOpen(
                        true
                      );
                    }}
                    className="
                      w-full
                      flex
                      items-center
                      justify-center
                      gap-2
                      py-3.5
                      px-4
                      bg-neutral-900
                      dark:bg-white
                      text-white
                      dark:text-neutral-950
                      rounded-xl
                      text-xs
                      font-bold
                      uppercase
                      tracking-wider
                      transition-all
                      shadow-sm
                      active:scale-98
                    "
                  >
                    <UserIcon className="w-4 h-4" />

                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =====================================================
          MOBILE BOTTOM SAFE AREA

          IMPORTANT:
          This layer is intentionally OUTSIDE the transformed
          Hamburger menu. iOS Safari can retain the paint of a
          transformed layer when the theme changes for the first
          time. Keeping this fixed layer independent makes the
          bottom safe area repaint immediately.
          ===================================================== */}

      {mobileMenuRendered && (
        <div
          ref={mobileMenuSafeAreaRef}
          data-mobile-menu-safe-area="true"
          aria-hidden="true"
          className="
            fixed
            left-0
            right-0
            bottom-0
            w-full
            h-[env(safe-area-inset-bottom,0px)]
            min-[1536px]:hidden
            bg-white
            dark:bg-neutral-950
            pointer-events-none
            z-[60]
          "
          style={{
            backgroundColor:
              theme === 'dark' ? '#0a0a0a' : '#ffffff',
          }}
        />
      )}

      {/* =====================================================
          AUTH MODAL
          ===================================================== */}

      <AuthModal
        isOpen={authOpen}
        onClose={() =>
          setAuthOpen(false)
        }
      />
    </>
  );
}