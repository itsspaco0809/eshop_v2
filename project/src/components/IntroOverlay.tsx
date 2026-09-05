import {
  useLayoutEffect,
  useRef,
} from 'react';

import gsap from 'gsap';

import {
  useTheme,
} from '@/lib/theme';

import {
  getGlobalLenis,
} from '@/lib/lenis';

interface IntroOverlayProps {
  onComplete?: () => void;
}

export default function IntroOverlay({
  onComplete,
}: IntroOverlayProps) {
  const overlayRef =
    useRef<HTMLDivElement>(null);

  const pathRef =
    useRef<SVGPathElement>(null);

  const { theme } =
    useTheme();

  const isDark =
    theme === 'dark';

  const logoUrl =
    'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/LCP_logo_trans.png';

  useLayoutEffect(() => {
    const overlay =
      overlayRef.current;

    const path =
      pathRef.current;

    const mainContent =
      document.getElementById(
        'main-content'
      );

    if (
      !overlay ||
      !path ||
      !mainContent
    ) {
      return;
    }

    /*
     * =======================================================
     * LOCK PAGE IMMEDIATELY
     * =======================================================
     *
     * This happens before the first Intro frame is displayed.
     *
     * Home physically starts below the viewport.
     */
    gsap.set(
      mainContent,
      {
        y: window.innerHeight,
        opacity: 1,
        visibility: 'visible',
        force3D: true,
        willChange: 'transform',
      }
    );

    /*
     * Overlay is always fully visible initially.
     */
    gsap.set(
      overlay,
      {
        yPercent: 0,
        opacity: 1,
        visibility: 'visible',
        display: 'flex',
        force3D: true,
        willChange: 'transform',
      }
    );

    /*
     * SVG path setup.
     */
    let pathLength = 300;

    try {
      pathLength =
        path.getTotalLength() ||
        300;
    } catch {
      // fallback
    }

    gsap.set(
      path,
      {
        strokeDasharray:
          pathLength,
        strokeDashoffset:
          pathLength,
        opacity: 0,
      }
    );

    /*
     * =======================================================
     * TIMELINE
     * =======================================================
     */
    const tl =
      gsap.timeline({
        defaults: {
          overwrite: 'auto',
        },
      });

    /*
     * Small initial pause.
     */
    tl.to(
      {},
      {
        duration: 0.25,
      }
    );

    /*
     * Show line.
     */
    tl.to(
      path,
      {
        opacity: 1,
        duration: 0.05,
      }
    );

    /*
     * Draw logo.
     */
    tl.to(
      path,
      {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: 'power2.inOut',
      }
    );

    /*
     * Short hold.
     */
    tl.to(
      {},
      {
        duration: 0.1,
      }
    );

    /*
     * =======================================================
     * REVEAL
     * =======================================================
     *
     * Home and Intro move simultaneously.
     *
     * Home:
     *     y = viewport height
     *             ↓
     *     y = 0
     *
     * Intro:
     *     y = 0
     *             ↓
     *     y = -100%
     *
     * This creates the exact "Home pushes upward" effect.
     */
    tl.add('reveal');

    tl.to(
      mainContent,
      {
        y: 0,
        duration: 1,
        ease: 'power3.inOut',
        force3D: true,
      },
      'reveal'
    );

    tl.to(
      overlay,
      {
        yPercent: -100,
        duration: 1,
        ease: 'power3.inOut',
        force3D: true,

        onComplete: () => {
          /*
           * =================================================
           * CLEANUP
           * =================================================
           */

          gsap.set(
            mainContent,
            {
              clearProps:
                'transform,willChange',
            }
          );

          gsap.set(
            overlay,
            {
              clearProps:
                'transform,willChange',
            }
          );

          overlay.style.display =
            'none';

          /*
           * Restart Lenis after the physical transition.
           */
          const lenis =
            getGlobalLenis();

          if (lenis) {
            lenis.resize();
            lenis.start();
          }

          /*
           * Tell App that Intro is FINISHED.
           *
           * App then saves:
           *
           * lcp_intro_v2_completed = true
           */
          window.dispatchEvent(
            new CustomEvent(
              'introComplete'
            )
          );

          onComplete?.();
        },
      },
      'reveal'
    );

    /*
     * =======================================================
     * RESIZE SAFETY
     * =======================================================
     */
    const handleResize =
      () => {
        /*
         * Only update starting position if the intro is
         * still before the reveal.
         */
        if (
          !overlay ||
          overlay.style.display ===
            'none'
        ) {
          return;
        }
      };

    window.addEventListener(
      'resize',
      handleResize
    );

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );

      tl.kill();

      gsap.set(
        mainContent,
        {
          clearProps:
            'transform,willChange',
        }
      );
    };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[9999] w-full h-[100dvh] min-h-[100svh] flex items-center justify-center overflow-hidden select-none pointer-events-none ${
        isDark
          ? 'bg-[#0a0a0a]'
          : 'bg-white'
      }`}
      style={{
        paddingTop:
          'env(safe-area-inset-top)',
        paddingBottom:
          'env(safe-area-inset-bottom)',

        willChange: 'transform',

        backfaceVisibility:
          'hidden',

        WebkitBackfaceVisibility:
          'hidden',
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-80 h-80 md:w-[450px] md:h-[450px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
            viewBox="0 0 300 150"
            fill="none"
          >
            <path
              ref={pathRef}
              d="M 42 90 C 32 62, 60 18, 72 18 C 82 18, 68 82, 78 92 C 86 100, 102 68, 114 68 C 92 72, 92 94, 108 94 C 122 94, 132 76, 140 60 C 140 85, 137 116, 135 138 C 134 142, 142 78, 152 66 C 166 52, 188 60, 182 80 C 175 98, 146 95, 162 95 C 185 95, 220 90, 260 84"
              stroke="#D2FF00"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: 0,
                filter:
                  'drop-shadow(0px 0px 6px rgba(210, 255, 0, 0.45))',
              }}
            />
          </svg>

          <img
            src={logoUrl}
            alt="LCP Logo"
            className={`relative z-20 w-4/5 h-4/5 object-contain ${
              isDark
                ? 'invert-0'
                : 'invert'
            }`}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}