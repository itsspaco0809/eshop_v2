import {
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from 'react';

import {
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  Check,
  Truck,
  Shield,
  Wrench,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PackageCheck,
  Download,
  MessageSquare,
  Package,
  Users,
  ShieldCheck,
} from 'lucide-react';

import StarRating from '@/components/StarRating';
import ProductCard from '@/components/ProductCard';

import {
  supabase,
  type Product,
} from '@/lib/supabase';

import { useCart } from '@/lib/cart';
import { useCurrency } from '@/lib/currency';
import {
  Link,
  useRouter,
} from '@/lib/router';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const RECENTLY_VIEWED_KEY =
  'recently_viewed_products';

const TRUST_FEATURES = [
  {
    icon: MessageSquare,
    title: 'Free Replacement Parts',
    description:
      "Lost a building piece? We'll replace them",
  },
  {
    icon: Package,
    title: 'International Shipping',
    description:
      'Worldwide shipping & 30-days return',
  },
  {
    icon: Users,
    title: 'Builder Support',
    description:
      'Tutorial guide and building process support',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payment',
    description:
      'Your payment information is processed securely',
  },
];

export interface ColorOption {
  name: string;
  hex: string;
  thumbnail?: string;
  gallery?: string[];
}

export interface CustomProduct
  extends Product {
  colors?: ColorOption[];
  stock_quantity?: number;
}

interface ProductDetailProps {
  slug: string;
  onLoadingChange?: (
    loading: boolean
  ) => void;
}

export default function ProductDetail({
  slug,
  onLoadingChange,
}: ProductDetailProps) {
  const { addItem, openCart } =
    useCart();

  const { formatPrice } =
    useCurrency();

  const { navigate } =
    useRouter();

  const [product, setProduct] =
    useState<CustomProduct | null>(
      null
    );

  const [selectedColor, setSelectedColor] =
    useState<ColorOption | null>(
      null
    );

  const [addOnProduct, setAddOnProduct] =
    useState<Product | null>(
      null
    );

  const [badgeLabel, setBadgeLabel] =
    useState<string | null>(
      null
    );

  const [latestProductIds, setLatestProductIds] =
    useState<Set<string>>(
      new Set()
    );

  const [featuredTopRated, setFeaturedTopRated] =
    useState<Product[]>([]);

  const [recentlyViewed, setRecentlyViewed] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [featuredLoading, setFeaturedLoading] =
    useState(true);

  const [quantity, setQuantity] =
    useState(1);

  const [activeImage, setActiveImage] =
    useState(0);

  const [added, setAdded] =
    useState(false);

  const [detailsExpanded, setDetailsExpanded] =
    useState(false);

  const [shippingExpanded, setShippingExpanded] =
    useState(false);

  const [wheelSetupExpanded, setWheelSetupExpanded] =
    useState(false);

  const [addOnSelected, setAddOnSelected] =
    useState(false);

  const [activeFeatureIndex, setActiveFeatureIndex] =
    useState(0);

  /*
   * =========================================================
   * PRODUCT READY
   * =========================================================
   */

  const [isReady, setIsReady] =
    useState(false);

  /*
   * =========================================================
   * ANIMATION STATE
   * =========================================================
   *
   * IMPORTANT:
   *
   * main animation and background animations
   * are completely separated.
   *
   * Background products will NEVER restart
   * the main ProductDetail animation.
   */

  const mainAnimationDoneRef =
    useRef(false);

  const detailsAnimationDoneRef =
    useRef(false);

  const galleryRef =
    useRef<HTMLDivElement>(null);

  const containerRef =
    useRef<HTMLDivElement>(null);

  const detailsRef =
    useRef<HTMLDivElement>(null);

  const featuredRef =
    useRef<HTMLElement>(null);

  const recentRef =
    useRef<HTMLElement>(null);

  const maxAvailableStock =
    product?.stock_quantity !==
    undefined
      ? product.stock_quantity
      : 50;

  /*
   * =========================================================
   * VISITED FLAG
   * =========================================================
   */

  const handleSetVisitedFlag =
    () => {
      sessionStorage.setItem(
        'store_has_visited',
        'true'
      );
    };

  /*
   * =========================================================
   * TRUST FEATURE MOBILE CAROUSEL
   * =========================================================
   */

  const handleFeatureScroll = (
    e: React.UIEvent<HTMLDivElement>
  ) => {
    const container =
      e.currentTarget;

    const width =
      container.offsetWidth;

    if (width > 0) {
      const newIndex =
        Math.round(
          container.scrollLeft /
            width
        );

      if (
        newIndex !==
        activeFeatureIndex
      ) {
        setActiveFeatureIndex(
          newIndex
        );
      }
    }
  };

  /*
   * =========================================================
   * RECENTLY VIEWED
   * =========================================================
   */

  const updateAndGetRecentIds =
    (
      currentId: string
    ): string[] => {
      try {
        const stored =
          localStorage.getItem(
            RECENTLY_VIEWED_KEY
          );

        let ids: string[] =
          stored
            ? JSON.parse(stored)
            : [];

        if (
          !Array.isArray(ids)
        ) {
          ids = [];
        }

        const currentIdStr =
          String(currentId);

        ids = [
          currentIdStr,
          ...ids.filter(
            (id) =>
              String(id) !==
              currentIdStr
          ),
        ].slice(0, 15);

        localStorage.setItem(
          RECENTLY_VIEWED_KEY,
          JSON.stringify(ids)
        );

        const otherIds =
          ids.filter(
            (id) =>
              String(id) !==
              currentIdStr
          );

        return otherIds.length >
          0
          ? otherIds.slice(0, 4)
          : ids.slice(0, 4);
      } catch (e) {
        console.error(
          'Failed to update recently viewed:',
          e
        );

        return [];
      }
    };

  /*
   * =========================================================
   * PRODUCT DATA FETCH
   * =========================================================
   */

  useEffect(() => {
    let isMounted = true;

    /*
     * Reset page state
     */

    setLoading(true);
    setIsReady(false);

    /*
     * Reset animation flags
     */

    mainAnimationDoneRef.current =
      false;

    detailsAnimationDoneRef.current =
      false;

    setActiveImage(0);
    setQuantity(1);
    setAdded(false);

    setDetailsExpanded(false);
    setShippingExpanded(false);
    setWheelSetupExpanded(false);

    setAddOnSelected(false);
    setSelectedColor(null);

    setProduct(null);
    setAddOnProduct(null);
    setFeaturedTopRated([]);
    setRecentlyViewed([]);
    setBadgeLabel(null);

    setLatestProductIds(
      new Set()
    );

    setFeaturedLoading(true);

    /*
     * =====================================================
     * MAIN PRODUCT
     * =====================================================
     */

    const loadProduct =
      async () => {
        const {
          data: mainProduct,
          error: mainError,
        } =
          await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (
          mainError ||
          !mainProduct
        ) {
          setProduct(null);
          setLoading(false);
          setFeaturedLoading(false);
          return;
        }

        const fetchedProduct =
          mainProduct as CustomProduct;

        /*
         * CRITICAL:
         *
         * Commit main product immediately.
         */

        setProduct(
          fetchedProduct
        );

        if (
          fetchedProduct.colors &&
          fetchedProduct.colors.length >
            0
        ) {
          setSelectedColor(
            fetchedProduct.colors[0]
          );
        }

        /*
         * Main product data ready.
         */

        setLoading(false);

        /*
         * Background data NEVER blocks
         * ProductDetail.
         */

        void loadBackgroundData(
          mainProduct
        );
      };

    /*
     * =====================================================
     * BACKGROUND DATA
     * =====================================================
     */

    const loadBackgroundData =
      async (
        mainProduct: Product
      ) => {
        const [
          addOnResult,
          latestResult,
          featuredResult,
        ] =
          await Promise.all([
            supabase
              .from('products')
              .select('*')
              .or(
                'section.ilike.addon,section.ilike.add_on,section.ilike.add-on'
              )
              .limit(1)
              .maybeSingle(),

            supabase
              .from('products')
              .select(
                'id, section, created_at'
              )
              .ilike(
                'section',
                'kits'
              )
              .order(
                'created_at',
                {
                  ascending:
                    false,
                }
              )
              .limit(6),

            supabase
              .from('products')
              .select('*')
              .eq(
                'featured',
                true
              )
              .ilike(
                'section',
                'kits'
              )
              .neq(
                'id',
                mainProduct.id
              )
              .order(
                'rating',
                {
                  ascending:
                    false,
                }
              )
              .limit(4),
          ]);

        if (!isMounted) {
          return;
        }

        /*
         * ADD ON
         */

        const addOnData =
          addOnResult.data;

        if (
          addOnData &&
          addOnData.id !==
            mainProduct.id
        ) {
          setAddOnProduct(
            addOnData
          );
        } else {
          setAddOnProduct(null);
        }

        /*
         * LATEST
         */

        const latestProducts =
          latestResult.data;

        const latestSet =
          new Set<string>(
            (
              latestProducts ||
              []
            ).map((p) =>
              String(p.id)
            )
          );

        setLatestProductIds(
          latestSet
        );

        const productSection =
          (
            mainProduct.section ||
            ''
          )
            .trim()
            .toLowerCase();

        const isKit =
          productSection ===
          'kits';

        const isNewInKits =
          latestSet.has(
            String(
              mainProduct.id
            )
          );

        if (
          isKit &&
          isNewInKits
        ) {
          setBadgeLabel(
            'NEW IN'
          );
        } else {
          setBadgeLabel(null);
        }

        /*
         * FEATURED
         */

        setFeaturedTopRated(
          featuredResult.data ||
            []
        );

        setFeaturedLoading(
          false
        );

        /*
         * RECENTLY VIEWED
         */

        const targetRecentIds =
          updateAndGetRecentIds(
            String(
              mainProduct.id
            )
          );

        if (
          targetRecentIds.length >
          0
        ) {
          const {
            data: recentData,
          } =
            await supabase
              .from('products')
              .select('*')
              .in(
                'id',
                targetRecentIds
              );

          if (
            isMounted &&
            recentData
          ) {
            const sortedRecent =
              targetRecentIds
                .map((id) =>
                  recentData.find(
                    (p) =>
                      String(
                        p.id
                      ) ===
                      String(id)
                  )
                )
                .filter(
                  (
                    p
                  ): p is Product =>
                    Boolean(p)
                );

            setRecentlyViewed(
              sortedRecent
            );
          }
        } else {
          setRecentlyViewed([]);
        }
      };

    void loadProduct();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  /*
   * =========================================================
   * CRITICAL IMAGE PRELOAD
   * =========================================================
   */

  useEffect(() => {
    if (
      loading ||
      !product
    ) {
      setIsReady(false);
      return;
    }

    let isActive = true;

    setIsReady(false);

    const colorImages:
      Array<string | undefined> =
      (
        product.colors ||
        []
      ).flatMap(
        (color) => [
          color.thumbnail,
          ...(color.gallery ||
            []),
        ]
      );

    const imagesToLoad:
      string[] = [
      product.image_url,
      ...(product.gallery ||
        []),
      ...colorImages,
    ].filter(
      (
        src
      ): src is string =>
        Boolean(src)
    );

    const uniqueImages = [
      ...new Set(
        imagesToLoad
      ),
    ];

    if (
      uniqueImages.length ===
      0
    ) {
      setIsReady(true);
      return;
    }

    const imagePromises =
      uniqueImages.map(
        (src) =>
          new Promise<void>(
            (resolve) => {
              const img =
                new Image();

              let finished =
                false;

              const finish =
                () => {
                  if (
                    finished
                  ) {
                    return;
                  }

                  finished =
                    true;

                  img.onload =
                    null;

                  img.onerror =
                    null;

                  resolve();
                };

              img.onload =
                finish;

              img.onerror =
                finish;

              img.src = src;

              if (
                img.complete
              ) {
                finish();
              }
            }
          )
      );

    /*
     * Keep loader for at least 350ms.
     */

    const minimumDelay =
      new Promise<void>(
        (resolve) => {
          setTimeout(
            resolve,
            350
          );
        }
      );

    /*
     * Never block forever.
     */

    const maximumWait =
      new Promise<void>(
        (resolve) => {
          setTimeout(
            resolve,
            3000
          );
        }
      );

    Promise.race([
      Promise.all([
        minimumDelay,
        ...imagePromises,
      ]),
      maximumWait,
    ]).then(() => {
      if (isActive) {
        setIsReady(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    product,
    loading,
  ]);

  /*
   * =========================================================
   * GLOBAL PRODUCT LOADING CALLBACK
   * =========================================================
   */

  useEffect(() => {
    const isPageLoading =
      loading ||
      (
        product !== null &&
        !isReady
      );

    onLoadingChange?.(
      isPageLoading
    );

    return () => {
      onLoadingChange?.(
        false
      );
    };
  }, [
    loading,
    product,
    isReady,
    onLoadingChange,
  ]);

  /*
   * =========================================================
   * PRODUCT SCROLL LOCK
   * =========================================================
   */

  useEffect(() => {
    const shouldLock =
      loading ||
      (
        product !== null &&
        !isReady
      );

    if (!shouldLock) {
      document.documentElement.classList.remove(
        'product-loading'
      );

      return;
    }

    document.documentElement.classList.add(
      'product-loading'
    );

    const preventScroll =
      (event: Event) => {
        event.preventDefault();
      };

    window.addEventListener(
      'wheel',
      preventScroll,
      {
        passive: false,
        capture: true,
      }
    );

    window.addEventListener(
      'touchmove',
      preventScroll,
      {
        passive: false,
        capture: true,
      }
    );

    return () => {
      document.documentElement.classList.remove(
        'product-loading'
      );

      window.removeEventListener(
        'wheel',
        preventScroll,
        true
      );

      window.removeEventListener(
        'touchmove',
        preventScroll,
        true
      );
    };
  }, [
    loading,
    product,
    isReady,
  ]);

  /*
   * =========================================================
   * MAIN PRODUCT GSAP
   * =========================================================
   *
   * IMPORTANT FIX:
   *
   * 1. useLayoutEffect instead of useEffect
   * 2. Only depends on isReady/loading
   * 3. Background data cannot restart this
   * 4. Once animation completes, it is permanently
   *    marked as completed for this product.
   */

  useLayoutEffect(() => {
    if (
      !isReady ||
      loading ||
      !containerRef.current
    ) {
      return;
    }

    if (
      mainAnimationDoneRef.current
    ) {
      return;
    }

    const ctx =
      gsap.context(() => {
        const sectionItems =
          containerRef.current?.querySelectorAll(
            '.animate-section-item'
          );

        const detailItems =
          detailsRef.current?.querySelectorAll(
            '.animate-detail-item'
          );

        /*
         * IMPORTANT:
         *
         * Force initial state BEFORE browser paint.
         */

        if (
          sectionItems &&
          sectionItems.length > 0
        ) {
          gsap.set(
            sectionItems,
            {
              opacity: 0,
              y: 35,
            }
          );
        }

        if (
          detailItems &&
          detailItems.length > 0
        ) {
          gsap.set(
            detailItems,
            {
              opacity: 0,
              y: 25,
            }
          );
        }

        /*
         * MAIN SECTION
         */

        if (
          sectionItems &&
          sectionItems.length > 0
        ) {
          gsap.to(
            sectionItems,
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.06,
              ease: 'power3.out',
            }
          );
        }

        /*
         * DETAILS
         */

        if (
          detailItems &&
          detailItems.length > 0
        ) {
          gsap.to(
            detailItems,
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              delay: 0.05,
              ease: 'power3.out',
              onComplete:
                () => {
                  detailsAnimationDoneRef.current =
                    true;

                  detailItems.forEach(
                    (el) => {
                      el.classList.remove(
                        'opacity-0',
                        'translate-y-5'
                      );
                    }
                  );
                },
            }
          );
        }

        /*
         * Remove animation classes after
         * the main section animation completes.
         */

        gsap.delayedCall(
          0.9,
          () => {
            sectionItems?.forEach(
              (el) => {
                el.classList.remove(
                  'opacity-0',
                  'translate-y-6'
                );
              }
            );

            mainAnimationDoneRef.current =
              true;
          }
        );

        /*
         * Allow browser to calculate layout.
         */

        requestAnimationFrame(
          () => {
            ScrollTrigger.refresh();
          }
        );
      }, containerRef);

    return () => {
      /*
       * IMPORTANT:
       *
       * Do NOT reset completed animation
       * back to opacity 0.
       */

      if (
        mainAnimationDoneRef.current
      ) {
        return;
      }

      ctx.revert();
    };
  }, [
    isReady,
    loading,
  ]);

  /*
   * =========================================================
   * FEATURED GSAP
   * =========================================================
   *
   * Completely independent from main ProductDetail.
   */

  useLayoutEffect(() => {
    if (
      !isReady ||
      featuredLoading ||
      !featuredRef.current ||
      featuredTopRated.length === 0
    ) {
      return;
    }

    const cards =
      featuredRef.current.querySelectorAll(
        '.featured-card-item'
      );

    if (
      cards.length === 0
    ) {
      return;
    }

    const ctx =
      gsap.context(() => {
        gsap.set(cards, {
          opacity: 0,
          y: 45,
        });

        gsap.to(cards, {
          scrollTrigger: {
            trigger:
              featuredRef.current,
            start: 'top 85%',
            toggleActions:
              'play none none none',
          },

          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',

          onComplete:
            () => {
              cards.forEach(
                (el) => {
                  el.classList.remove(
                    'opacity-0',
                    'translate-y-[45px]'
                  );
                }
              );
            },
        });
      }, featuredRef);

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
    };
  }, [
    isReady,
    featuredLoading,
    featuredTopRated.length,
  ]);

  /*
   * =========================================================
   * RECENTLY VIEWED GSAP
   * =========================================================
   */

  useLayoutEffect(() => {
    if (
      !isReady ||
      recentlyViewed.length === 0 ||
      !recentRef.current
    ) {
      return;
    }

    const cards =
      recentRef.current.querySelectorAll(
        '.recent-card-item'
      );

    if (
      cards.length === 0
    ) {
      return;
    }

    const ctx =
      gsap.context(() => {
        gsap.set(cards, {
          opacity: 0,
          y: 45,
        });

        gsap.to(cards, {
          scrollTrigger: {
            trigger:
              recentRef.current,
            start: 'top 85%',
            toggleActions:
              'play none none none',
          },

          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',

          onComplete:
            () => {
              cards.forEach(
                (el) => {
                  el.classList.remove(
                    'opacity-0',
                    'translate-y-[45px]'
                  );
                }
              );
            },
        });
      }, recentRef);

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
    };
  }, [
    isReady,
    recentlyViewed.length,
  ]);

  /*
   * =========================================================
   * ADD TO CART
   * =========================================================
   */

  const handleAdd = () => {
    if (
      !product ||
      !product.in_stock ||
      maxAvailableStock <= 0
    ) {
      return;
    }

    const validQty =
      Math.max(
        1,
        Math.min(
          maxAvailableStock,
          quantity || 1
        )
      );

    const colorName =
      selectedColor?.name;

    const productToAdd =
      colorName
        ? {
            ...product,
            selectedColor:
              colorName,
          }
        : product;

    addItem(
      productToAdd,
      validQty,
      colorName
    );

    if (
      addOnSelected &&
      addOnProduct
    ) {
      addItem(
        addOnProduct,
        1
      );
    }

    setQuantity(
      validQty
    );

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  /*
   * =========================================================
   * QUANTITY
   * =========================================================
   */

  const handleQuantityInputChange =
    (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const val =
        e.target.value;

      if (
        val === ''
      ) {
        setQuantity(0);
        return;
      }

      const parsed =
        parseInt(
          val,
          10
        );

      if (
        !isNaN(parsed)
      ) {
        setQuantity(
          parsed
        );
      }
    };

  const handleQuantityInputBlur =
    () => {
      if (
        quantity < 1 ||
        isNaN(quantity)
      ) {
        setQuantity(1);
      } else if (
        quantity >
        maxAvailableStock
      ) {
        setQuantity(
          maxAvailableStock
        );
      }
    };

  /*
   * =========================================================
   * BACK PATH
   * =========================================================
   */

  const getBackPathAndLabel =
    () => {
      if (product) {
        const section = (
          product.section ||
          ''
        ).toLowerCase();

        const categories =
          Array.isArray(
            product.category
          )
            ? product.category.map(
                (c) =>
                  c.toLowerCase()
              )
            : [
                (
                  product.category ||
                  ''
                ).toLowerCase(),
              ];

        const hasCategory =
          (
            term: string
          ) =>
            categories.some(
              (c) =>
                c.includes(term)
            );

        if (
          section.includes(
            'instruction'
          ) ||
          hasCategory(
            'instruction'
          )
        ) {
          return {
            path: '/instructions',
            label:
              'Back to Instructions',
          };
        }

        if (
          section.includes(
            'custom'
          ) ||
          hasCategory(
            'custom'
          )
        ) {
          return {
            path: '/custom-parts',
            label:
              'Back to Custom Parts',
          };
        }
      }

      const referrer =
        typeof document !==
        'undefined'
          ? document.referrer
          : '';

      if (
        referrer.includes(
          '/instructions'
        )
      ) {
        return {
          path: '/instructions',
          label:
            'Back to Instructions',
        };
      }

      if (
        referrer.includes(
          '/custom-parts'
        )
      ) {
        return {
          path: '/custom-parts',
          label:
            'Back to Custom Parts',
        };
      }

      return {
        path: '/store',
        label: 'Back to Kits',
      };
    };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * =========================================================
   * NOT FOUND
   * =========================================================
   */

  if (!product) {
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen flex flex-col justify-center items-center gap-4 py-20">
        <p className="text-neutral-900 dark:text-white text-xl font-semibold">
          Product not found
        </p>

        <Link
          to="/store"
          onClick={
            handleSetVisitedFlag
          }
          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
        >
          Back to store
        </Link>
      </div>
    );
  }

  /*
   * =========================================================
   * CRITICAL IMAGE LOADING
   * =========================================================
   */

  if (!isReady) {
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  /*
   * =========================================================
   * PRODUCT TYPE
   * =========================================================
   */

  const section = (
    product.section ||
    ''
  ).toLowerCase();

  const categories =
    Array.isArray(
      product.category
    )
      ? product.category.map(
          (c) =>
            c.toLowerCase()
        )
      : [
          (
            product.category ||
            ''
          ).toLowerCase(),
        ];

  const isInstruction =
    section.includes(
      'instruction'
    ) ||
    categories.some(
      (c) =>
        c.includes(
          'instruction'
        )
    );

  const isDigital =
    (
      product as {
        is_digital?: boolean;
      }
    ).is_digital ||
    isInstruction ||
    section.includes(
      'digital'
    ) ||
    categories.some(
      (c) =>
        c.includes(
          'digital'
        )
    );

  /*
   * =========================================================
   * ACTIVE GALLERY
   * =========================================================
   */

  const activeGallery =
    (() => {
      if (
        selectedColor
      ) {
        const colorImgs:
          string[] = [
          selectedColor.thumbnail,
          ...(selectedColor.gallery ||
            []),
        ].filter(
          (
            src
          ): src is string =>
            Boolean(src)
        );

        if (
          colorImgs.length >
          0
        ) {
          return colorImgs;
        }
      }

      return [
        product.image_url,
        ...(product.gallery ||
          []),
      ].filter(
        (
          src
        ): src is string =>
          Boolean(src)
      );
    })();

  /*
   * =========================================================
   * GALLERY SCROLL
   * =========================================================
   */

  const scrollToImage = (
    index: number
  ) => {
    const container =
      galleryRef.current;

    if (!container) {
      return;
    }

    const slideWidth =
      container.offsetWidth;

    container.scrollTo({
      left:
        slideWidth * index,
      behavior:
        'smooth',
    });

    setActiveImage(
      index
    );
  };

  const handleScroll =
    () => {
      const container =
        galleryRef.current;

      if (!container) {
        return;
      }

      const slideWidth =
        container.offsetWidth;

      if (
        slideWidth === 0
      ) {
        return;
      }

      const newIndex =
        Math.round(
          container.scrollLeft /
            slideWidth
        );

      if (
        newIndex !==
        activeImage
      ) {
        setActiveImage(
          newIndex
        );
      }
    };

  /*
   * =========================================================
   * COLOR
   * =========================================================
   */

  const handleColorChange =
    (
      colorObj: ColorOption
    ) => {
      setSelectedColor(
        colorObj
      );

      setActiveImage(0);

      requestAnimationFrame(
        () => {
          const container =
            galleryRef.current;

          if (
            !container
          ) {
            return;
          }

          container.scrollTo({
            left: 0,
            behavior:
              'smooth',
          });
        }
      );
    };

  const backInfo =
    getBackPathAndLabel();

  /*
   * =========================================================
   * MAIN RENDER
   * =========================================================
   */

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-neutral-950 min-h-screen select-none [-webkit-tap-highlight-color:transparent]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 md:pt-28 w-full">

        {/* BACK */}

        <div className="animate-section-item opacity-0 translate-y-6 will-change-transform">
          <Link
            to={
              backInfo.path
            }
            onClick={
              handleSetVisitedFlag
            }
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors mb-6 text-sm touch-manipulation active:opacity-70"
          >
            <ArrowLeft className="w-4 h-4" />
            {
              backInfo.label
            }
          </Link>
        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* GALLERY */}

          <div className="animate-section-item opacity-0 translate-y-6 will-change-transform">
            <div className="relative">

              {badgeLabel && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                  <span
                    className="px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full shadow-xl inline-block text-neutral-950"
                    style={{
                      backgroundColor:
                        '#D2FF00',
                    }}
                  >
                    {badgeLabel}
                  </span>
                </div>
              )}

              <div
                ref={
                  galleryRef
                }
                onScroll={
                  handleScroll
                }
                className="relative rounded-2xl overflow-hidden aspect-square bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth touch-pan-x touch-pan-y [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {activeGallery.map(
                  (
                    img,
                    i
                  ) => (
                    <div
                      key={`${selectedColor?.name || 'default'}-${i}`}
                      className="relative w-full h-full flex-shrink-0 snap-center"
                    >
                      <img
                        src={img}
                        alt={
                          i ===
                          0
                            ? product.name
                            : `${product.name} ${i + 1}`
                        }
                        className="w-full h-full object-cover pointer-events-none select-none"
                        loading={
                          i ===
                          0
                            ? 'eager'
                            : 'lazy'
                        }
                        draggable={
                          false
                        }
                      />
                    </div>
                  )
                )}
              </div>

              {activeGallery.length >
                1 && (
                <>
                  <button
                    onClick={() =>
                      scrollToImage(
                        Math.max(
                          0,
                          activeImage -
                            1
                        )
                      )
                    }
                    disabled={
                      activeImage ===
                      0
                    }
                    className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 touch-manipulation active:scale-90 transition-all disabled:opacity-30 disabled:cursor-default"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <button
                    onClick={() =>
                      scrollToImage(
                        Math.min(
                          activeGallery.length -
                            1,
                          activeImage +
                            1
                        )
                      )
                    }
                    disabled={
                      activeImage ===
                      activeGallery.length -
                        1
                    }
                    className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 items-center justify-center rounded-full bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 touch-manipulation active:scale-90 transition-all disabled:opacity-30 disabled:cursor-default"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </>
              )}

              {activeGallery.length >
                1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none z-10">
                  {activeGallery.map(
                    (
                      _,
                      i
                    ) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeImage ===
                          i
                            ? 'w-6 bg-neutral-900 dark:bg-black/80'
                            : 'w-1.5 bg-neutral-400 dark:bg-black/40'
                        }`}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DETAILS */}

          <div
            ref={
              detailsRef
            }
            className="flex flex-col"
          >

            {/* Rating */}

            <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform flex items-center gap-3 mb-2">
              <StarRating
                rating={
                  product.rating
                }
                size="w-4 h-4"
              />

              <span className="text-neutral-600 dark:text-neutral-400 text-sm">
                {product.rating >=
                0
                  ? `${Number(
                      product.rating
                    ).toFixed(
                      1
                    )} rating`
                  : 'No rating'}
              </span>
            </div>

            {/* Title */}

            <h1 className="animate-detail-item opacity-0 translate-y-5 will-change-transform text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {
                product.name
              }
            </h1>

            {/* Price */}

            <p className="animate-detail-item opacity-0 translate-y-5 will-change-transform text-xl text-neutral-900 dark:text-white mt-3 font-semibold">
              {formatPrice(
                product.price
              )}
            </p>

            {/* COLORS */}

            {product.colors &&
              product.colors.length >
                0 && (
                <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform mt-6">

                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2.5">
                    Color:{' '}
                    <span className="text-neutral-900 dark:text-white capitalize font-bold">
                      {
                        selectedColor?.name
                      }
                    </span>
                  </p>

                  <div className="flex items-center gap-2.5">
                    {product.colors.map(
                      (
                        colorObj,
                        idx
                      ) => {
                        const isSelected =
                          selectedColor?.name ===
                          colorObj.name;

                        return (
                          <button
                            key={
                              idx
                            }
                            type="button"
                            onClick={() =>
                              handleColorChange(
                                colorObj
                              )
                            }
                            title={
                              colorObj.name
                            }
                            className={`relative w-6 h-6 rounded-full transition-all touch-manipulation ${
                              isSelected
                                ? 'ring-2 ring-neutral-100 dark:ring-white scale-110'
                                : 'opacity-80 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{
                              backgroundColor:
                                colorObj.hex,
                            }}
                            aria-label={`Select ${colorObj.name}`}
                          >
                            <span className="absolute inset-0 rounded-full border border-black/10 dark:border-white/10 pointer-events-none" />
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* QUANTITY */}

            <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform flex items-stretch gap-4 mt-6 h-11">

              <div className="flex items-center h-full bg-neutral-50 border-neutral-200 dark:bg-neutral-900/50 dark:border-neutral-800 rounded-full border overflow-hidden">

                <button
                  onClick={() =>
                    setQuantity(
                      Math.max(
                        1,
                        quantity -
                          1
                      )
                    )
                  }
                  disabled={
                    quantity <=
                      1 ||
                    !product.in_stock ||
                    maxAvailableStock <=
                      0
                  }
                  className="h-full px-3 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="number"
                  min={1}
                  max={
                    maxAvailableStock
                  }
                  value={
                    quantity ===
                    0
                      ? ''
                      : quantity
                  }
                  onChange={
                    handleQuantityInputChange
                  }
                  onBlur={
                    handleQuantityInputBlur
                  }
                  disabled={
                    !product.in_stock ||
                    maxAvailableStock <=
                      0
                  }
                  className="w-10 h-full bg-transparent text-neutral-900 dark:text-white text-sm font-bold text-center focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                  aria-label="Quantity"
                />

                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(
                        maxAvailableStock,
                        quantity +
                          1
                      )
                    )
                  }
                  disabled={
                    quantity >=
                      maxAvailableStock ||
                    !product.in_stock ||
                    maxAvailableStock <=
                      0
                  }
                  className="h-full px-3 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={
                  handleAdd
                }
                disabled={
                  !product.in_stock ||
                  maxAvailableStock <=
                    0
                }
                className="flex-1 h-full flex items-center justify-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-bold text-sm uppercase tracking-wider rounded-full transition-all touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* VIEW CART */}

            {added && (
              <button
                onClick={
                  openCart
                }
                className="text-neutral-500 dark:text-neutral-400 text-sm mt-3 hover:text-neutral-900 dark:hover:text-white transition-colors text-center w-full touch-manipulation"
              >
                View cart
              </button>
            )}

            {/* PRODUCT META */}

            <div
              className={`animate-detail-item opacity-0 translate-y-5 will-change-transform grid ${
                isInstruction
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              } gap-2 sm:gap-4 lg:gap-6 mt-6 p-4 min-h-[76px] items-center bg-neutral-50 border-neutral-200 dark:bg-neutral-900/50 dark:border-neutral-800 rounded-xl border`}
            >
              {!isInstruction && (
                <div className="flex flex-col justify-center min-w-0 w-full">
                  <p className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-wider">
                    Pieces
                  </p>

                  <p className="text-neutral-900 dark:text-white font-bold text-sm mt-0.5 truncate">
                    {
                      product.piece_count
                    }
                  </p>
                </div>
              )}

              <div className="flex flex-col justify-center min-w-0 w-full">
                <p className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-wider">
                  Theme
                </p>

                <p className="text-neutral-900 dark:text-white font-bold text-sm mt-0.5 capitalize truncate">
                  {
                    product.theme
                  }
                </p>
              </div>

              <div className="flex flex-col justify-center min-w-0 w-full">
                <p className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-wider">
                  Stock
                </p>

                <p
                  className={`font-bold text-sm mt-0.5 flex items-center gap-1.5 sm:gap-2 ${
                    product.in_stock
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        product.in_stock
                          ? 'bg-emerald-400'
                          : 'bg-red-400'
                      }`}
                    />

                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        product.in_stock
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </span>

                  <span className="truncate">
                    {product.in_stock
                      ? 'In Stock'
                      : 'Out of Stock'}
                  </span>
                </p>
              </div>
            </div>

            {/* ADD ON */}

            {addOnProduct && (
              <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform mt-6">
                <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
                  Add On
                </h3>

                <div
                  onClick={() =>
                    setAddOnSelected(
                      !addOnSelected
                    )
                  }
                  className={`flex items-center justify-between p-4 min-h-[76px] rounded-xl border transition-all cursor-pointer select-none ${
                    addOnSelected
                      ? 'bg-neutral-100 border-neutral-900 ring-1 ring-neutral-900/20 dark:bg-neutral-900 dark:border-white/40 dark:ring-white/20'
                      : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 dark:bg-neutral-900/50 dark:border-neutral-800 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 overflow-hidden shrink-0">
                      <img
                        src={
                          addOnProduct.image_url
                        }
                        alt={
                          addOnProduct.name
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-neutral-900 dark:text-white text-sm font-medium truncate">
                        {
                          addOnProduct.name
                        }
                      </p>

                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                        {formatPrice(
                          addOnProduct.price
                        )}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      addOnSelected
                        ? 'bg-neutral-900 border-neutral-900 text-white dark:bg-white dark:border-white dark:text-neutral-950'
                        : 'border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800'
                    }`}
                  >
                    {addOnSelected && (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACCORDIONS */}

            <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform mt-6 border-t border-neutral-200 dark:border-neutral-800">

              {/* PRODUCT DETAILS */}

              <div className="border-b border-neutral-200 dark:border-neutral-800/60 py-4">
                <button
                  onClick={() =>
                    setDetailsExpanded(
                      !detailsExpanded
                    )
                  }
                  className="w-full flex items-center justify-between text-left text-neutral-900 dark:text-white font-medium hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <span>
                    Product Details
                  </span>

                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                      detailsExpanded
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {detailsExpanded && (
                  <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-5 leading-relaxed">
                    <p>
                      {
                        product.description
                      }
                    </p>

                    {isDigital ? (
                      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />

                        <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">
                          Digital download:{' '}
                          <span className="font-semibold text-blue-800 dark:text-blue-300">
                            Downloads will be available immediately in the order history after checkout
                          </span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                        <div className="flex items-center gap-2">
                          <PackageCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />

                          <h3 className="text-emerald-700 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                            What's Included:
                          </h3>
                        </div>

                        <ul className="text-neutral-700 dark:text-neutral-300 text-sm space-y-1.5 pl-7 list-disc">
                          <li>
                            Building Pieces
                          </li>
                          <li>
                            Exclusive Custom Graphics Postcard
                          </li>
                          <li>
                            Exclusive Custom Sticker Sheet
                          </li>
                          <li>
                            Digital Instructions
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SHIPPING */}

              <div className="border-b border-neutral-200 dark:border-neutral-800/60 py-4">
                <button
                  onClick={() =>
                    setShippingExpanded(
                      !shippingExpanded
                    )
                  }
                  className="w-full flex items-center justify-between text-left text-neutral-900 dark:text-white font-medium hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <span>
                    Shipping &amp; Returns
                  </span>

                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                      shippingExpanded
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {shippingExpanded && (
                  <div className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 space-y-5 leading-relaxed">
                    <div className="space-y-3">
                      <h4 className="font-bold text-neutral-900 dark:text-white text-base">
                        Shipping
                      </h4>

                      <p>
                        Fast, tracked and carefully packed.
                      </p>

                      <div className="space-y-1">
                        <h5 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Estimated delivery times
                        </h5>

                        <ul className="list-disc pl-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                          <li>
                            <strong className="text-neutral-900 dark:text-white">
                              EU/EEA, USA, Canada, Australia &amp; New Zealand:
                            </strong>{' '}
                            5–10 business days
                          </li>

                          <li>
                            <strong className="text-neutral-900 dark:text-white">
                              Rest of world:
                            </strong>{' '}
                            7–15 business days
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Packaging that protects your model
                        </h5>

                        <p className="text-neutral-700 dark:text-neutral-300">
                          To speed up delivery and keep your item safe, we may replace any original boxes with compact, reinforced packaging. Large models ship in plain boxes; smaller models may ship in padded mailers.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Order tracking
                        </h5>

                        <p className="text-neutral-700 dark:text-neutral-300">
                          You'll receive a tracking number as soon as your order leaves our warehouse.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="font-semibold text-neutral-800 dark:text-neutral-200">
                          Good to know
                        </h5>

                        <p className="text-neutral-700 dark:text-neutral-300">
                          Delivery times are estimates and may vary during holidays, peak periods or for remote areas. Local customs duties or taxes may apply according to your country’s regulations.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 space-y-3">
                      <h4 className="font-bold text-neutral-900 dark:text-white text-base">
                        Returns
                      </h4>

                      <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                        Shop with confidence.
                      </p>

                      <ul className="list-disc pl-5 space-y-1.5 text-neutral-700 dark:text-neutral-300">
                        <li>
                          If it isn't quite right, you have 7 days from delivery to request a return.
                        </li>

                        <li>
                          Items must be unused, complete and in their original condition.
                        </li>

                        <li>
                          Contact us via the Get in Touch form and we'll guide you through every step.
                        </li>

                        <li>
                          Once we received and checked, we'll issue a refund to your original payment method.
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* WHEEL SETUP */}

              <div className="border-b border-neutral-200 dark:border-neutral-800/60 py-4">
                <button
                  onClick={() =>
                    setWheelSetupExpanded(
                      !wheelSetupExpanded
                    )
                  }
                  className="w-full flex items-center justify-between text-left text-neutral-900 dark:text-white font-medium hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <span>
                    Want a different wheel setup?
                  </span>

                  <ChevronDown
                    className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${
                      wheelSetupExpanded
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {wheelSetupExpanded && (
                  <div className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-normal">
                    Browse our Rim Collection and leave your preferred rim name in the Order Notes at checkout. We'll swap them onto your build at no extra cost.
                  </div>
                )}
              </div>
            </div>

            {/* TRUST BAR */}

            <div className="animate-detail-item opacity-0 translate-y-5 will-change-transform py-6">
              <div className="grid grid-cols-3 gap-3 items-center justify-center">
                {[
                  {
                    icon: Truck,
                    label:
                      'Free shipping over $99',
                  },
                  {
                    icon: Shield,
                    label:
                      'Quality Guaranteed',
                  },
                  {
                    icon: Wrench,
                    label:
                      'Maximum Details',
                  },
                ].map(
                  (
                    item,
                    i
                  ) => (
                    <div
                      key={i}
                      className="group flex flex-col items-center text-center gap-1.5 cursor-pointer transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
                    >
                      <item.icon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors duration-200 shrink-0" />

                      <p className="text-xs font-medium leading-snug text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors duration-200">
                        {
                          item.label
                        }
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* FEATURED */}

        {(featuredLoading ||
          featuredTopRated.length >
            0) && (
          <section
            ref={
              featuredRef
            }
            className="pt-8 border-t border-neutral-200 dark:border-neutral-900 mt-12"
          >
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />

                  Featured Builds
                </p>

                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  You Might Also Like
                </h2>
              </div>

              <Link
                to="/store"
                onClick={
                  handleSetVisitedFlag
                }
                className="group hidden sm:flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white text-sm font-medium uppercase tracking-wider transition-colors touch-manipulation"
              >
                View All

                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4].map(
                  (i) => (
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
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {featuredTopRated
                  .slice(0, 4)
                  .map(
                    (p) => {
                      const pSection =
                        (
                          p.section ||
                          ''
                        )
                          .trim()
                          .toLowerCase();

                      const isNewKit =
                        pSection ===
                          'kits' &&
                        latestProductIds.has(
                          String(
                            p.id
                          )
                        );

                      return (
                        <div
                          key={
                            p.id
                          }
                          onClick={
                            handleSetVisitedFlag
                          }
                          className="featured-card-item opacity-0 translate-y-[45px] will-change-transform"
                        >
                          <ProductCard
                            product={
                              p
                            }
                            isNew={
                              isNewKit
                            }
                          />
                        </div>
                      );
                    }
                  )}
              </div>
            )}
          </section>
        )}

        {/* RECENTLY VIEWED */}

        {recentlyViewed.length >
          0 && (
          <section
            ref={
              recentRef
            }
            className="pt-16 border-t border-neutral-200 dark:border-neutral-900 mt-16"
          >
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />

                  Browsing History
                </p>

                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  Recently Viewed
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {recentlyViewed
                .slice(0, 4)
                .map(
                  (p) => {
                    const pSection =
                      (
                        p.section ||
                        ''
                      )
                        .trim()
                        .toLowerCase();

                    const isNewKit =
                      pSection ===
                        'kits' &&
                      latestProductIds.has(
                        String(
                          p.id
                        )
                      );

                    return (
                      <div
                        key={
                          p.id
                        }
                        onClick={
                          handleSetVisitedFlag
                        }
                        className="recent-card-item opacity-0 translate-y-[45px] will-change-transform"
                      >
                        <ProductCard
                          product={
                            p
                          }
                          isNew={
                            isNewKit
                          }
                        />
                      </div>
                    );
                  }
                )}
            </div>
          </section>
        )}

        {/* TRUST FEATURES */}

        <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">

          {/* MOBILE */}

          <div className="block lg:hidden">
            <div
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              onScroll={
                handleFeatureScroll
              }
            >
              {TRUST_FEATURES.map(
                (
                  feature,
                  idx
                ) => {
                  const Icon =
                    feature.icon;

                  return (
                    <div
                      key={
                        idx
                      }
                      className="w-full flex-shrink-0 snap-center flex flex-col items-center text-center px-6 py-4"
                    >
                      <Icon className="w-8 h-8 text-neutral-900 dark:text-white mb-4 stroke-[1.5]" />

                      <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                        {
                          feature.title
                        }
                      </h3>

                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                        {
                          feature.description
                        }
                      </p>
                    </div>
                  );
                }
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-6">
              {TRUST_FEATURES.map(
                (
                  _,
                  idx
                ) => (
                  <span
                    key={
                      idx
                    }
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeFeatureIndex ===
                      idx
                        ? 'w-6 bg-neutral-900 dark:bg-white'
                        : 'w-1.5 bg-neutral-400 dark:bg-neutral-700'
                    }`}
                  />
                )
              )}
            </div>
          </div>

          {/* DESKTOP */}

          <div className="hidden lg:grid grid-cols-4 gap-8">
            {TRUST_FEATURES.map(
              (
                feature,
                idx
              ) => {
                const Icon =
                  feature.icon;

                return (
                  <div
                    key={
                      idx
                    }
                    className={`flex items-start gap-4 pr-4 ${
                      idx <
                      TRUST_FEATURES.length -
                        1
                        ? 'border-r border-neutral-200 dark:border-neutral-800'
                        : ''
                    }`}
                  >
                    <Icon className="w-6 h-6 text-neutral-900 dark:text-white shrink-0 mt-0.5" />

                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        {
                          feature.title
                        }
                      </h3>

                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {
                          feature.description
                        }
                      </p>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}