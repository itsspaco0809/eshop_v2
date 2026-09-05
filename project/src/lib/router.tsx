import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { globalLenis } from '@/lib/lenis';

interface RouterContextType {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext =
  createContext<RouterContextType>({
    path:
      typeof window !== 'undefined'
        ? window.location.pathname
        : '/',
    navigate: () => {},
  });

/* =========================================================
   SCROLL TO TOP
   ========================================================= */

const scrollToTop = () => {
  if (globalLenis) {
    globalLenis.scrollTo(0, {
      immediate: true,
    });

    return;
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto',
  });
};

/* =========================================================
   ROUTER PROVIDER
   ========================================================= */

export const RouterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [path, setPath] = useState(
    window.location.pathname
  );

  /* =======================================================
     BROWSER BACK / FORWARD
     ======================================================= */

  useEffect(() => {
    const handlePopState = () => {
      const newPath =
        window.location.pathname;

      setPath(newPath);

      /*
       * Wait until React has rendered
       * the new route before scrolling.
       */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToTop();
        });
      });
    };

    window.addEventListener(
      'popstate',
      handlePopState
    );

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };
  }, []);

  /* =======================================================
     NAVIGATE
     ======================================================= */

  const navigate = (to: string) => {
    const targetPath =
      to.startsWith('/')
        ? to
        : `/${to}`;

    /*
     * Same page:
     *
     * Do absolutely nothing.
     *
     * This is important for:
     * - Navbar logo
     * - current route links
     * - mobile menu
     */
    if (
      window.location.pathname ===
      targetPath
    ) {
      return;
    }

    /*
     * Update browser URL.
     */

    window.history.pushState(
      {},
      '',
      targetPath
    );

    /*
     * Tell React about new route.
     */

    setPath(targetPath);

    /*
     * IMPORTANT:
     *
     * Wait until the new route has rendered.
     *
     * This avoids scrolling while the old
     * ProductDetail DOM is still mounted.
     */

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });
  };

  return (
    <RouterContext.Provider
      value={{
        path,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

/* =========================================================
   ROUTE
   ========================================================= */

interface RouteProps {
  path: string;
  element: React.ReactNode;
  exact?: boolean;
}

export const Route: React.FC<
  RouteProps
> = ({
  path: routePath,
  element,
  exact = false,
}) => {
  const {
    path: currentPath,
  } = useRouter();

  const matchRoute = (
    pattern: string,
    current: string
  ) => {
    /*
     * Exact match.
     */

    if (pattern === current) {
      return true;
    }

    /*
     * Dynamic route.
     *
     * Example:
     *
     * /product/:id
     *
     * matches:
     *
     * /product/123
     */

    if (
      pattern.includes(':')
    ) {
      const patternParts =
        pattern
          .split('/')
          .filter(Boolean);

      const currentParts =
        current
          .split('/')
          .filter(Boolean);

      if (
        patternParts.length !==
        currentParts.length
      ) {
        return false;
      }

      return patternParts.every(
        (part, index) => {
          if (
            part.startsWith(':')
          ) {
            return true;
          }

          return (
            part ===
            currentParts[index]
          );
        }
      );
    }

    /*
     * Nested route matching.
     */

    if (
      !exact &&
      current.startsWith(
        pattern.endsWith('/')
          ? pattern
          : `${pattern}/`
      )
    ) {
      return true;
    }

    return false;
  };

  if (
    matchRoute(
      routePath,
      currentPath
    )
  ) {
    return <>{element}</>;
  }

  return null;
};

/* =========================================================
   LINK
   ========================================================= */

export const Link: React.FC<{
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({
  to,
  children,
  className,
  onClick,
}) => {
  const { navigate } =
    useRouter();

  const handleClick = (
    e: React.MouseEvent
  ) => {
    e.preventDefault();

    /*
     * Component-specific action only.
     *
     * Navbar:
     * - close mobile menu
     *
     * It does NOT control scroll.
     */

    onClick?.();

    /*
     * Router owns navigation + scroll.
     */

    navigate(to);
  };

  return (
    <a
      href={to}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
};

/* =========================================================
   USE ROUTER
   ========================================================= */

export const useRouter = () => {
  return useContext(
    RouterContext
  );
};