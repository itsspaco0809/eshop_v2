import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


const toThemeColor = (color: string) => {
  if (color === '#ffffff') return 'rgb(255, 255, 255)';
  if (color === '#0a0a0a') return 'rgb(10, 10, 10)';
  if (color === '#121212') return 'rgb(18, 18, 18)';
  return color;
};

const getSurfaceColors = (theme: Theme) => {
  const isDark = theme === 'dark';
  const pageBackground = isDark ? '#121212' : '#ffffff';
  const overlayBackground = isDark ? '#0a0a0a' : '#ffffff';
  const html = typeof document !== 'undefined' ? document.documentElement : null;

  const isProductDetail = html?.classList.contains('product-detail-open') ??
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/'));
  const isMobileMenuOpen = html?.classList.contains('mobile-menu-open') ?? false;
  const isCartOpen = html?.classList.contains('cart-open') ?? false;

  // Visible fixed surfaces take priority over the normal page canvas.
  const activeSurface =
    isMobileMenuOpen || isCartOpen || isProductDetail
      ? overlayBackground
      : pageBackground;

  return {
    pageBackground,
    overlayBackground,
    activeSurface,
  };
};

const syncThemeDocument = (theme: Theme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const { pageBackground, overlayBackground, activeSurface } =
    getSurfaceColors(theme);
  const isDark = theme === 'dark';

  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';

  // These variables are the single source of truth for all viewport/safe-area
  // surfaces. ProductDetail, Hamburger and CartDrawer all use #0a0a0a in dark mode.
  root.style.backgroundColor = activeSurface;
  root.style.setProperty('--app-background', pageBackground);
  root.style.setProperty('--safe-area-background', activeSurface);
  root.style.setProperty('--mobile-menu-background', overlayBackground);
  root.style.setProperty('--cart-background', overlayBackground);
  root.style.setProperty('--browser-chrome-background', activeSurface);
  root.style.setProperty('--footer-background', pageBackground);

  // iOS Safari may keep a transformed layer's previous paint during the
  // first theme change. Update the independent Hamburger/Cart safe-area
  // elements directly in the same event as the theme toggle.
  const safeAreaBackground = activeSurface;
  document
    .querySelectorAll<HTMLElement>(
      '[data-mobile-menu-safe-area], [data-cart-safe-area]'
    )
    .forEach((element) => {
      element.style.backgroundColor = safeAreaBackground;
    });

  document.body?.style.setProperty('background-color', activeSurface);
  document.body?.style.setProperty('--app-background', pageBackground);
  document.body?.style.setProperty('--safe-area-background', activeSurface);
  document.body?.style.setProperty('--mobile-menu-background', overlayBackground);
  document.body?.style.setProperty('--cart-background', overlayBackground);
  document.body?.style.setProperty('--browser-chrome-background', activeSurface);
  document.body?.style.setProperty('--footer-background', pageBackground);

  // IMPORTANT: keep one existing theme-color meta element and update its
  // content in place. Safari can keep using the first valid theme-color
  // declaration; removing/recreating the element can leave the browser UI
  // painted with the previous color until the page/menu is reopened.
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', toThemeColor(activeSurface));
  } else {
    const createdMeta = document.createElement('meta');
    createdMeta.name = 'theme-color';
    createdMeta.content = toThemeColor(activeSurface);
    document.head.appendChild(createdMeta);
  }

  // Force a synchronous style/layout observation after changing the browser
  // chrome source color. This also flushes the safe-area/background repaint.
  void root.offsetHeight;

  try {
    sessionStorage.setItem('theme', theme);
  } catch {
    // Ignore storage restrictions.
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = sessionStorage.getItem('theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useLayoutEffect(() => {
    syncThemeDocument(theme);
  }, [theme]);

  useLayoutEffect(() => {
    const handleSurfaceChange = () => syncThemeDocument(theme);
    window.addEventListener('lcp-surface-change', handleSurfaceChange);
    return () => window.removeEventListener('lcp-surface-change', handleSurfaceChange);
  }, [theme]);

  const setTheme = (nextTheme: Theme) => {
    // Apply before React re-renders. This is important when Safari is displaying
    // a fixed safe-area while Hamburger/Cart/ProductDetail is already visible.
    syncThemeDocument(nextTheme);
    setThemeState(nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
