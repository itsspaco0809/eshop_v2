import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Star, House } from 'lucide-react';
import { Link } from '@/lib/router';
import { supabase, type Product } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import FallingStickersBg from '@/components/FallingStickersBg';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Typed from 'typed.js';

gsap.registerPlugin(ScrollTrigger);

function CustomFlameIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C10.5 4.5 10 7 10.5 9.5C9.2 8.3 8.5 6.7 8.5 5C5.5 8 4 12 4 15.5C4 19.1 6.9 22 10.5 22C14.1 22 17 19.1 17 15.5C17 13.5 16.1 11.7 14.8 10.5C14.5 12.5 13.5 14 12 15C12.5 12.5 12 10 10.5 8C11.5 6 12 4 12 2Z"
        fill="#F97316"
      />
      <path
        d="M11 13.5C10 14.8 9.5 16.2 9.5 17.5C9.5 19.4 10.8 21 12.5 21C14.2 21 15.5 19.4 15.5 17.5C15.5 16 14.8 14.7 13.8 13.8C13.5 15.2 12.8 16.2 11.8 16.8C12.2 15.2 11.8 14.2 11 13.5Z"
        fill="#FACC15"
      />
    </svg>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newIn, setNewIn] = useState<Product[]>([]);
  const [scenes, setScenes] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const typedEl = useRef<HTMLSpanElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const newInRef = useRef<HTMLElement>(null);
  const featuredRef = useRef<HTMLElement>(null);
  const scenesRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);

  // 打字機效果初始化
  useEffect(() => {
    if (!typedEl.current) return;

    const typed = new Typed(typedEl.current, {
      strings: ['Something', '?gnihtemoS'],
      typeSpeed: 150,
      backSpeed: 150,
      loop: true,
      backDelay: 1500,
    });

    return () => {
      typed.destroy();
    };
  }, []);

  // Fetch Supabase Data
  useEffect(() => {
    (async () => {
      const { data: featuredData } = await supabase
        .from('products')
        .select('*')
        .eq('featured', true)
        .eq('section', 'kits')
        .order('rating', { ascending: false });

      const { data: kitsData } = await supabase
        .from('products')
        .select('*')
        .eq('section', 'kits');

      const { data: scenesData } = await supabase
        .from('products')
        .select('*')
        .eq('section', 'kits')
        .contains('category', ['Scene']);

      if (kitsData) {
        const sortedKits = [...kitsData].sort(
          (a, b) =>
            new Date(b.created_at || b.createdAt || 0).getTime() -
            new Date(a.created_at || a.createdAt || 0).getTime()
        );
        setNewIn(sortedKits.slice(0, 6));
      }

      setFeatured(featuredData || []);
      setScenes(scenesData || []);
      setLoading(false);
    })();
  }, []);

  // Intro 完成後重新整理 ScrollTrigger
  // IntroOverlay 本身負責控制 Intro 動畫，
  // Home 不再控制 Intro 顯示/隱藏，避免首次載入時互相競爭。
  useEffect(() => {
    const handleIntroComplete = () => {
      window.scrollTo(0, 0);

      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    };

    window.addEventListener('introComplete', handleIntroComplete);

    return () => {
      window.removeEventListener('introComplete', handleIntroComplete);
    };
  }, []);

  // 預載圖片以防止網頁跳動 (Layout Shift)
  useEffect(() => {
    const allProducts = [...featured, ...newIn, ...scenes];
    if (allProducts.length === 0) {
      setIsReady(true);
      return;
    }

    setIsReady(false);
    let isActive = true;

    const minTimer = new Promise((resolve) => setTimeout(resolve, 300));
    const imagePromises = allProducts.map((product) => {
      if (!product.image_url) return Promise.resolve();
      const img = new Image();
      img.src = product.image_url;
      return img.decode().catch(() => {});
    });

    const maxFallbackTimer = new Promise((resolve) => setTimeout(resolve, 2000));

    Promise.race([
      Promise.all([minTimer, ...imagePromises]),
      maxFallbackTimer,
    ]).then(() => {
      if (isActive) setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [featured, newIn, scenes]);

  // GSAP 區塊動畫
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(
        ['.hero-title', '.hero-description', '.hero-button', '.hero-scroll-indicator'],
        {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power1.out',
          force3D: true,
        }
      );

      gsap.to('.category-card', {
        scrollTrigger: {
          trigger: categoriesRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power1.out',
        force3D: true,
      });

      gsap.to(
        ['.cta-item-images', '.cta-item-title', '.cta-item-desc', '.cta-item-button'],
        {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power1.out',
          force3D: true,
        }
      );

      gsap.to('.cta-card-bg', {
        x: 3,
        y: -2.5,
        rotate: '-3deg',
        duration: 5.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.cta-card-fg', {
        x: -3.5,
        y: -3,
        rotate: '4deg',
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.3,
      });

      if (ctaButtonRef.current) {
        gsap.fromTo(
          ctaButtonRef.current,
          { scale: 0.95, opacity: 0 },
          {
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
            scale: 1,
            opacity: 1,
            duration: 0.5,
            delay: 0.3,
            ease: 'power1.out',
            force3D: true,
          }
        );
      }

      gsap.fromTo(
        '.cta-underline-path',
        { strokeDashoffset: 200, strokeDasharray: 200 },
        {
          scrollTrigger: {
            trigger: ctaRef.current,
            start: 'top 75%',
            toggleActions: 'play none none none',
          },
          strokeDashoffset: 0,
          duration: 1.0,
          delay: 0.2,
          ease: 'power1.inOut',
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  // Product cards 動畫
  useEffect(() => {
    if (!isReady || loading) return;

    const ctx = gsap.context(() => {
      const cardSelectors = [
        '.home-product-card',
        '.featured-product-card',
        '.scene-product-card',
      ];

      cardSelectors.forEach((selector) => {
        const triggerRef =
          selector === '.home-product-card'
            ? newInRef.current
            : selector === '.featured-product-card'
              ? featuredRef.current
              : scenesRef.current;

        if (!triggerRef) return;

        gsap.to(selector, {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: triggerRef,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onComplete: function () {
            const elements = pageRef.current?.querySelectorAll(selector);
            elements?.forEach((el) =>
              el.classList.remove('opacity-0', 'translate-y-6')
            );
          },
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, [isReady, loading]);

  return (
    <div
      id="home-page"
      ref={pageRef}
      className="pt-16 sm:pt-20 md:pt-24 bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-white relative"
    >
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap');`}
      </style>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-8 sm:pt-12 pb-16"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <FallingStickersBg isIntroFinished={true} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10 flex flex-col items-center text-center">
          <div className="max-w-4xl flex flex-col items-center text-center">
            <h1 className="hero-title opacity-0 translate-y-[11px] transform-gpu text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-neutral-900 dark:text-white leading-[0.95] tracking-tight text-center">
              <span className="block">
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  From
                </span>{' '}
                <span className="font-bold">Nothing...</span>
              </span>

              <span className="block whitespace-nowrap mt-2">
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  to
                </span>{' '}
                <span className="bg-gradient-to-r from-emerald-600 via-lime-500 to-yellow-500 dark:from-emerald-400 dark:via-lime-300 dark:to-yellow-400 bg-clip-text text-transparent font-bold bg-[length:200%_auto] animate-gradient pr-2">
                  <span ref={typedEl}></span>
                </span>
              </span>
            </h1>

            <div className="hero-button opacity-0 translate-y-[11px] transform-gpu mt-10 flex justify-center items-center w-full">
              <Link
                to="/store"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
              >
                Explore the Store
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NEW IN Section */}
      <section
        ref={newInRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8"
      >
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
              <CustomFlameIcon className="w-5 h-5 animate-star-pulse" /> Fresh Releases
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              New In
            </h2>
          </div>

          <Link
            to="/store?sort=date-desc"
            className="group hidden sm:flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium uppercase tracking-wider transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading || !isReady ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
                <div className="p-3 sm:p-5 space-y-3">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {newIn.map((p) => (
              <div
                key={p.id}
                className="home-product-card opacity-0 translate-y-6 will-change-transform w-full"
              >
                <ProductCard product={p} isNew={true} isReady={isReady} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section
        ref={featuredRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400 animate-star-pulse" /> Featured Builds
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Top Rated Kits
            </h2>
          </div>

          <Link
            to="/store"
            className="group hidden sm:flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium uppercase tracking-wider transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading || !isReady ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
                <div className="p-3 sm:p-5 space-y-3">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {featured.map((p) => (
              <div
                key={p.id}
                className="featured-product-card opacity-0 translate-y-6 will-change-transform w-full"
              >
                <ProductCard product={p} isReady={isReady} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scenes Section */}
      <section
        ref={scenesRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8"
      >
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-neutral-500 dark:text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
              <House className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-star-pulse" /> Place your builds there!
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Scenes
            </h2>
          </div>

          <Link
            to="/store?category=Scene"
            className="group hidden sm:flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium uppercase tracking-wider transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading || !isReady ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
                <div className="p-3 sm:p-5 space-y-3">
                  <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-neutral-500 dark:text-neutral-400 text-sm py-6">
            No scene products available yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {scenes.map((p) => (
              <div
                key={p.id}
                className="scene-product-card opacity-0 translate-y-6 will-change-transform w-full"
              >
                <ProductCard product={p} isReady={isReady} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Categories Showcase */}
      <section
        ref={categoriesRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20"
      >
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2">
              Browse by Theme
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Find Your Style
            </h2>
          </div>

          <Link
            to="/store"
            className="group hidden sm:flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-sm font-medium uppercase tracking-wider transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              title: 'Concept Car',
              img: 'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Alpine/Alpenglow/MC00003200/0.webp?auto=compress&cs=tinysrgb&h=650&w=940',
              cat: 'Concept Car',
            },
            {
              title: 'Super Car',
              img: 'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Chevrolet/Corvette_CX/MC00002500/0.webp?auto=compress&cs=tinysrgb&h=650&w=940',
              cat: 'Super Car',
            },
            {
              title: 'Sports Car',
              img: 'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Hyundai/Ioniq_6_N/MC00002800/0.webp?auto=compress&cs=tinysrgb&h=650&w=940',
              cat: 'Sports Car',
            },
            {
              title: 'SUV',
              img: 'https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Mercedes-Maybach/GLS/MC00003600/0.webp?auto=compress&cs=tinysrgb&h=650&w=940',
              cat: 'SUV',
            },
          ].map((cat) => (
            <Link
              key={cat.title}
              to={`/store?category=${cat.cat}`}
              className="category-card group relative rounded-2xl overflow-hidden aspect-square block opacity-0 translate-y-[12px] transform-gpu"
            >
              <img
                src={cat.img}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-active:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6">
                <h3 className="text-white text-lg sm:text-2xl font-bold mb-0.5 sm:mb-1">
                  {cat.title}
                </h3>

                <div className="mt-2 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm font-medium opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  Explore
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Banner Section */}
      <section
        ref={ctaRef}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        <div className="relative rounded-3xl bg-white dark:bg-neutral-950 p-6 sm:p-10 md:p-16 border-0 shadow-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left: Overlapping Tilted Cards */}
            <div className="cta-item-images opacity-0 translate-y-[2.5px] transform-gpu lg:col-span-6 relative h-[260px] sm:h-[320px] lg:h-[360px] flex items-center justify-center w-full py-4">

              {/* Background Card */}
              <div className="cta-card-bg absolute w-40 sm:w-52 lg:w-64 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl transform -rotate-6 lg:-rotate-12 -translate-x-6 sm:-translate-x-10 lg:-translate-x-12 -translate-y-2 sm:-translate-y-4 bg-neutral-900 will-change-transform">
                <img
                  src="https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Ford/Mustang_GTD/MC00001900/0.webp?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Custom Build 1"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Foreground Card */}
              <div className="cta-card-fg absolute w-40 sm:w-52 lg:w-64 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl transform rotate-3 lg:rotate-6 translate-x-6 sm:translate-x-10 lg:translate-x-12 translate-y-2 sm:translate-y-4 bg-neutral-900 z-10 will-change-transform">
                <img
                  src="https://raw.githubusercontent.com/itsspaco0809/scitem-images/main/Chevrolet/Corvette_CX/MC00002500/0.webp?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Custom Build 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right: Text & Action */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="cta-item-title opacity-0 translate-y-[2.5px] transform-gpu text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight mb-4 leading-tight">
                Want a{' '}
                <span className="relative inline-block">
                  Custom Model?
                  <svg
                    className="absolute -bottom-2 left-0 w-full h-3 overflow-visible"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      className="cta-underline-path"
                      d="M 5 15 Q 50 2 95 15"
                      stroke="#D2FF00"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>

              <p className="cta-item-desc opacity-0 translate-y-[2.5px] transform-gpu text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl mb-8">
                Share reference photos of your own vehicle, and we'll bring it to life.{' '}
                From personalized{' '}
                <strong className="text-neutral-900 dark:text-white font-semibold">
                  license plates
                </strong>{' '}
                to a{' '}
                <strong className="text-neutral-900 dark:text-white font-semibold">
                  custom wheel setup
                </strong>{' '}
                and specific aero details — we design every detail to match your exact vision.
              </p>

              <div className="cta-item-button opacity-0 translate-y-[2.5px] transform-gpu">
                <Link
                  ref={ctaButtonRef}
                  to="/contact"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105 active:scale-95"
                >
                  Request a Build
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}