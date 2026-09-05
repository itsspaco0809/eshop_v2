import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';

const STICKER_FILES = [
  'Alpine_Alpenglow_trans_w_stroke.webp',
  'BMW_M5_G99_trans_w_stroke.webp',
  'BMW_Speedtop_trans_w_stroke.webp',
  'BMW_Vision_M_Next_v2_trans_w_stroke.webp',
  'BMW_iX_trans_w_stroke.webp',
  'Corvette_CX_Concept_trans_w_stroke.webp',
  'Ferrari_849_Testarossa_trans_w_stroke.webp',
  'Flos_V8_Cafe_trans_w_stroke.webp',
  'Ford_Mustang_GTD_v2_white_w_stroke.webp',
  'Hot_Wheels_Chevroletor_trans_w_stroke.webp',
  'Hyundai_Ioniq_6_N_trans_w_stroke.webp',
  'Lamborghini_Lazandor_trans_w_stroke.webp',
  'Maserati_MCXtrema_trans_w_stroke.webp',
  'Mercedes_GLS_Maybach_trans_w_stroke.webp',
  'Mercedes_Vision_OneEleven_trans_w_stroke.webp',
  'Nilu_27_trans_w_stroke.webp',
  'Polestar_Synergy_trans_w_stroke.webp',
  'Rexy_Porsche_911_w_stroke.webp',
  'Volvo_XC40_trans_w_stroke.webp',
];

const BASE_RAW_URL = 'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/stroke_webp/';

if (typeof window !== 'undefined') {
  STICKER_FILES.forEach((file) => {
    const img = new Image();
    img.src = `${BASE_RAW_URL}${file}`;
  });
}

const DISPLAY_COUNT = 14;

// SSR 相容嘅 LayoutEffect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function FallingStickersBg({ isIntroFinished }: { isIntroFinished?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridSizes, setGridSizes] = useState({ mobile: 100, desktop: 100 });

  // 1. 使用 useMemo 鎖定貼紙初始資料，防止 Re-render 時 randomSize 不斷改變導致畫面跳動
  const items = useMemo(() => {
    return Array.from({ length: DISPLAY_COUNT }).map((_, i) => {
      const fileName = STICKER_FILES[i % STICKER_FILES.length];
      const randomSize = Math.floor(Math.random() * 60) + 120;

      return {
        id: i,
        src: `${BASE_RAW_URL}${fileName}`,
        size: randomSize,
      };
    });
  }, []);

  useEffect(() => {
    const updateSizes = () => {
      const vw = window.innerWidth;
      setGridSizes({
        mobile: vw * 0.333333,
        desktop: vw * 0.125,
      });
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // 2. 改用 useIsomorphicLayoutEffect 喺繪製前初始化 GSAP
  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const bubbles = containerRef.current?.querySelectorAll<HTMLElement>('.falling-bubble');
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight || 800;

      const startY = -winHeight * 0.3;
      const endY = winHeight * 1.25;

      bubbles?.forEach((bubble, i) => {
        const laneWidth = (winWidth * 0.9) / DISPLAY_COUNT;

        const animate = (isFirstRun = false) => {
          const duration = gsap.utils.random(22, 32);
          const delay = isFirstRun ? 0 : gsap.utils.random(0.2, 2);
          const rotateDeg = gsap.utils.random(-180, 180);

          const isCurved = i % 2 === 0 || Math.random() > 0.4;
          const curveDir = Math.random() < 0.5 ? 1 : -1;
          const swing1 = gsap.utils.random(40, 80) * curveDir;
          const swing2 = gsap.utils.random(-30, -60) * curveDir;
          const endXOffset = gsap.utils.random(-25, 25);

          if (!isFirstRun) {
            const img = bubble.querySelector('img');
            if (img) {
              const randomImg = STICKER_FILES[Math.floor(Math.random() * STICKER_FILES.length)];
              img.src = `${BASE_RAW_URL}${randomImg}`;
            }
          }

          const currentX = winWidth * 0.05 + i * laneWidth + Math.random() * (laneWidth * 0.4);

          const tl = gsap.timeline({
            delay: delay,
            onComplete: () => animate(false),
          });

          // 3. 使用 fromTo 直接指定起點同終點，避免 tl.set 同 progress() 衝突
          tl.fromTo(
            bubble,
            {
              x: currentX,
              y: startY,
              rotate: 0,
              scale: 1,
              opacity: 1,
            },
            {
              y: endY,
              rotate: rotateDeg,
              duration: duration,
              ease: 'sine.inOut',
            },
            0
          );

          if (isCurved) {
            tl.to(
              bubble,
              {
                keyframes: [
                  { x: currentX + swing1, duration: duration * 0.4, ease: 'sine.inOut' },
                  { x: currentX + swing2, duration: duration * 0.4, ease: 'sine.inOut' },
                  { x: currentX + endXOffset, duration: duration * 0.2, ease: 'sine.out' },
                ],
              },
              0
            );
          } else {
            tl.to(
              bubble,
              {
                x: currentX + gsap.utils.random(-35, 35),
                duration: duration,
                ease: 'sine.inOut',
              },
              0
            );
          }

          tl.to(
            bubble,
            {
              scale: 0.2,
              opacity: 0,
              duration: duration * 0.2,
              ease: 'power2.out',
            },
            duration * 0.8
          );

          if (isFirstRun) {
            tl.progress(gsap.utils.random(0, 0.8));
          }
        };

        animate(true);
      });
    }, containerRef);

    return () => ctx.revert();
  }, []); // 4. 移除 [isIntroFinished]，確保 GSAP 只喺組件 Mount 時初始化一次，不會中途重設

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-white dark:bg-neutral-950 transition-colors duration-300 transform-gpu [touch-action:none] [overscroll-behavior:none]"
    >
      <div className="absolute inset-0 pointer-events-none opacity-100 dark:opacity-40 transition-opacity duration-300">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="hero-grid-mobile"
              width={gridSizes.mobile}
              height={gridSizes.mobile}
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 8 V 0 H 8"
                fill="none"
                className="stroke-neutral-400 dark:stroke-white/70"
                strokeWidth="1.5"
              />
            </pattern>

            <pattern
              id="hero-grid-desktop"
              width={gridSizes.desktop}
              height={gridSizes.desktop}
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 0 10 V 0 H 10"
                fill="none"
                className="stroke-neutral-400 dark:stroke-white/70"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#hero-grid-mobile)" className="block md:hidden" />
          <rect width="100%" height="100%" fill="url(#hero-grid-desktop)" className="hidden md:block" />
        </svg>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="falling-bubble absolute top-0 left-0 opacity-0 will-change-transform transform-gpu flex items-center justify-center z-10 scale-65 sm:scale-100"
          style={{
            width: `${item.size}px`,
            height: `${item.size}px`,
            transform: 'translateZ(0)',
          }}
        >
          <img
            src={item.src}
            alt="Sticker"
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white dark:from-neutral-950/30 dark:via-transparent dark:to-neutral-950 pointer-events-none z-20 transition-colors duration-300" />
    </div>
  );
}