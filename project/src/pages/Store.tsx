import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Cuboid,
  ChevronDown,
  Check,
  MessageSquare,
  Box,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { supabase, type Product } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { useRouter } from '@/lib/router';
import gsap from 'gsap';

const CATEGORIES = [
  'all',
  'City Car',
  'Concept Car',
  'Coupe',
  'EV',
  'Sedan',
  'Sports Car',
  'Super Car',
  'SUV',
  'Track Car',
  'Truck',
  'Wagon',
  'Scene',
];

const THEMES = ['all'];

const SORTS = [
  { label: 'Latest Release', value: 'date-desc' },
  { label: 'Name: A to Z', value: 'name-asc' },
  { label: 'Name: Z to A', value: 'name-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
];

const TRUST_FEATURES = [
  {
    icon: MessageSquare,
    title: 'Free Replacement Parts',
    description: "Lost a building piece? We'll replace them",
  },
  {
    icon: Box,
    title: 'International Shipping',
    description: 'Worldwide shipping & 30-days return',
  },
  {
    icon: Users,
    title: 'Builder Support',
    description: 'Tutorial guide and building process support',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payment',
    description: 'Your payment information is processed securely',
  },
];

const ITEMS_PER_PAGE = 16;

let cachedProducts: Product[] | null = null;

export default function Store() {
  const { path } = useRouter();

  const [products, setProducts] = useState<Product[]>(
    () => cachedProducts || []
  );

  const [loading, setLoading] = useState(() => !cachedProducts);

  const [category, setCategory] = useState('all');
  const [theme, setTheme] = useState('all');
  const [sort, setSort] = useState('date-desc');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  // Custom Dropdown Menu State & Outside-Click Handling
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleScroll = () => {
      setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const [isReady, setIsReady] = useState(() => !!cachedProducts);

  const isMountedRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // =========================================================
  // Read category from URL query
  // =========================================================

  useEffect(() => {
    const params = new URLSearchParams(path.split('?')[1] || '');
    const cat = params.get('category');

    if (cat && CATEGORIES.includes(cat)) {
      setCategory(cat);
    } else if (!cat) {
      setCategory('all');
    }
  }, [path]);

  // =========================================================
  // Fetch products data
  // =========================================================

  useEffect(() => {
    let isCurrent = true;

    (async () => {
      if (!cachedProducts) {
        setLoading(true);
      }

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('section', 'kits');

      if (isCurrent && data) {
        cachedProducts = data;
        setProducts(data);
        setLoading(false);
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, []);

  // =========================================================
  // Filter + Sort
  // =========================================================

  const filtered = useMemo(() => {
    const newestProductIds = new Set(
      [...products]
        .sort(
          (a, b) =>
            new Date(
              b.created_at || b.createdAt || 0
            ).getTime() -
            new Date(
              a.created_at || a.createdAt || 0
            ).getTime()
        )
        .slice(0, 6)
        .map((p) => p.id)
    );

    let result = products.map((p) => {
      const isTop6Newest = newestProductIds.has(p.id);

      return {
        ...p,
        is_new: isTop6Newest,
        isNew: isTop6Newest,
      };
    });

    // Category filter
    if (category !== 'all') {
      result = result.filter((p) => {
        if (Array.isArray(p.category)) {
          return p.category.includes(category);
        }

        return p.category === category;
      });
    }

    // Theme filter
    if (theme !== 'all') {
      result = result.filter((p) => p.theme === theme);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();

      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sort) {
      case 'date-desc':
        result.sort(
          (a, b) =>
            new Date(
              b.created_at || b.createdAt || 0
            ).getTime() -
            new Date(
              a.created_at || a.createdAt || 0
            ).getTime()
        );
        break;

      case 'name-asc':
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case 'name-desc':
        result.sort((a, b) =>
          b.name.localeCompare(a.name)
        );
        break;

      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;

      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;

      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;

      default:
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
    }

    return result;
  }, [products, category, theme, sort, search]);

  // =========================================================
  // Reset page when filters change
  // =========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [category, theme, sort, search]);

  // =========================================================
  // SMOOTH SCROLL TO TOP WHEN PAGE CHANGES
  // =========================================================
  //
  // Page 1 → Page 2 → Smooth scroll to top
  // Page 2 → Page 3 → Smooth scroll to top
  // Page 3 → Page 4 → Smooth scroll to top
  //
  // requestAnimationFrame ensures React has updated the page
  // before the scrolling animation starts.
  // =========================================================

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    });
  }, [currentPage]);

  // =========================================================
  // Pagination
  // =========================================================

  const totalPages =
    Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;

  const paginatedProducts = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return filtered.slice(
      start,
      start + ITEMS_PER_PAGE
    );
  }, [filtered, currentPage]);

  const filteredIds = useMemo(
    () =>
      paginatedProducts
        .map((p) => p.id)
        .join(','),
    [paginatedProducts]
  );

  // =========================================================
  // Image Preloading
  // =========================================================

  useEffect(() => {
    if (loading) return;

    if (
      paginatedProducts.length === 0 ||
      isMountedRef.current
    ) {
      setIsReady(true);
      return;
    }

    let isActive = true;

    const imagePromises =
      paginatedProducts.map((product) => {
        return new Promise<void>((resolve) => {
          if (!product.image_url) {
            resolve();
            return;
          }

          const img = new Image();

          img.src = product.image_url;

          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
      });

    const maxFallbackTimer = new Promise(
      (resolve) =>
        setTimeout(resolve, 800)
    );

    Promise.race([
      Promise.all(imagePromises),
      maxFallbackTimer,
    ]).then(() => {
      if (isActive) {
        setIsReady(true);
        isMountedRef.current = true;
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    filteredIds,
    loading,
    paginatedProducts,
  ]);

  // =========================================================
  // GSAP Stagger Animation
  // =========================================================

  useEffect(() => {
    if (
      loading ||
      !isReady ||
      paginatedProducts.length === 0
    ) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to('.store-product-card', {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.04,
        ease: 'power2.out',

        onComplete: function () {
          const elements =
            gridRef.current?.querySelectorAll(
              '.store-product-card'
            );

          elements?.forEach((el) =>
            el.classList.remove(
              'opacity-0',
              'translate-y-6'
            )
          );
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, [
    loading,
    isReady,
    filteredIds,
    paginatedProducts.length,
  ]);

  // =========================================================
  // Page Change
  // =========================================================

  const handlePageChange = (newPage: number) => {
    if (
      newPage < 1 ||
      newPage > totalPages ||
      newPage === currentPage
    ) {
      return;
    }

    setCurrentPage(newPage);
  };

  // =========================================================
  // Trust Feature Mobile Carousel
  // =========================================================

  const handleFeatureScroll = (
    e: React.UIEvent<HTMLDivElement>
  ) => {
    const container = e.currentTarget;

    const scrollPosition =
      container.scrollLeft;

    const width = container.offsetWidth;

    if (width > 0) {
      const index = Math.round(
        scrollPosition / width
      );

      setActiveFeatureIndex(index);
    }
  };

  const currentSortLabel =
    SORTS.find(
      (s) => s.value === sort
    )?.label || 'Sort By';

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">

          <div className="flex items-center gap-3 mb-2">
            <Cuboid className="w-7 h-7 text-neutral-900 dark:text-white" />

            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Kits
            </h1>
          </div>

          <p className="text-neutral-500 dark:text-neutral-400">
            {filtered.length}{' '}
            {filtered.length === 1
              ? 'kit'
              : 'kits'}{' '}
            available
          </p>

        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ===================================================
            SEARCH + SORT
        =================================================== */}

        <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-4 mb-6">

          {/* Search */}
          <div className="relative flex-1">

            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />

            <input
              type="text"
              placeholder="Search kits..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full h-12 pl-11 pr-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors"
            />

          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-3 w-full sm:w-auto">

            {/* Mobile Filters */}
            <button
              onClick={() =>
                setShowFilters(!showFilters)
              }
              className="sm:hidden flex items-center justify-center gap-2 h-12 px-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors w-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            {/* Sort Dropdown */}
            <div
              className="relative h-12 w-full sm:w-auto"
              ref={dropdownRef}
            >

              <button
                type="button"
                onClick={() =>
                  setIsDropdownOpen(
                    (prev) => !prev
                  )
                }
                className="w-full flex items-center justify-between gap-3 h-full sm:min-w-[200px] px-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 focus:outline-none transition-colors cursor-pointer"
              >

                <span className="font-medium text-sm truncate">
                  {currentSortLabel}
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-200 ${
                    isDropdownOpen
                      ? 'rotate-180'
                      : ''
                  }`}
                />

              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">

                  {SORTS.map((s) => {
                    const isSelected =
                      sort === s.value;

                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => {
                          setSort(s.value);
                          setIsDropdownOpen(
                            false
                          );
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >

                        <span>
                          {s.label}
                        </span>

                        {isSelected && (
                          <Check className="w-4 h-4 text-neutral-900 dark:text-white flex-shrink-0" />
                        )}

                      </button>
                    );
                  })}

                </div>
              )}

            </div>

          </div>

        </div>

        {/* ===================================================
            CATEGORY FILTERS
        =================================================== */}

        <div
          className={`space-y-4 mb-6 ${
            showFilters
              ? 'block'
              : 'hidden sm:block'
          }`}
        >

          <div className="flex flex-wrap gap-2">

            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setCategory(cat)
                }
                className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-all ${
                  category === cat
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="w-px h-px" />

            {THEMES.filter(
              (t) => t !== 'all'
            ).map((t) => (
              <button
                key={t}
                onClick={() =>
                  setTheme(
                    theme === t
                      ? 'all'
                      : t
                  )
                }
                className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-all border ${
                  theme === t
                    ? 'bg-neutral-800 text-white dark:bg-neutral-700 dark:text-white border-neutral-700 dark:border-neutral-600'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}

            {(category !== 'all' ||
              theme !== 'all' ||
              search) && (
              <button
                onClick={() => {
                  setCategory('all');
                  setTheme('all');
                  setSearch('');
                }}
                className="px-4 py-2 rounded-full text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            PRODUCTS
        =================================================== */}

        {loading ? (

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 min-h-[600px] items-start">

            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (i) => (
                <div
                  key={i}
                  className="w-full max-w-[320px] mx-auto sm:mx-0 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-pulse aspect-[3/4]"
                />
              )
            )}

          </div>

        ) : filtered.length === 0 ? (

          <div className="flex flex-col items-center justify-center py-20 text-center min-h-[400px]">

            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-4">

              <Search className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />

            </div>

            <p className="text-neutral-900 dark:text-white font-semibold text-lg">
              No kits found
            </p>

            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              Try adjusting your filters or search.
            </p>

          </div>

        ) : (

          <>

            {/* Product Grid */}
            <div
              ref={gridRef}
              className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 min-h-[600px] items-start"
            >

              {paginatedProducts.map((p) => (

                <div
                  key={p.id}
                  className="store-product-card opacity-0 translate-y-6 will-change-transform w-full max-w-[320px] mx-auto sm:mx-0"
                >

                  <ProductCard
                    product={p}
                    isNew={p.is_new}
                    isReady={isReady}
                  />

                </div>

              ))}

            </div>

            {/* =================================================
                PAGINATION
            ================================================= */}

            {totalPages > 1 && (

              <div className="flex items-center justify-center gap-3 mt-12 pt-6 font-sans">

                <div className="flex items-center gap-1.5">

                  {Array.from(
                    {
                      length: totalPages,
                    },
                    (_, i) => i + 1
                  ).map((page) => (

                    <button
                      key={page}
                      onClick={() =>
                        handlePageChange(page)
                      }
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                        currentPage === page
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {page}
                    </button>

                  ))}

                </div>

                {currentPage <
                  totalPages && (

                  <button
                    onClick={() =>
                      handlePageChange(
                        currentPage + 1
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-neutral-900 dark:text-white hover:opacity-70 transition-opacity ml-1"
                    aria-label="Next Page"
                  >

                    <span>
                      Next
                    </span>

                    <span className="text-base leading-none">
                      →
                    </span>

                  </button>

                )}

              </div>

            )}

            {/* =================================================
                TRUST FEATURES
            ================================================= */}

            <div className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">

              {/* Mobile Carousel */}
              <div className="block lg:hidden">

                <div
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  onScroll={
                    handleFeatureScroll
                  }
                >

                  {TRUST_FEATURES.map(
                    (feature, idx) => {

                      const Icon =
                        feature.icon;

                      return (
                        <div
                          key={idx}
                          className="w-full flex-shrink-0 snap-center flex flex-col items-center text-center px-6 py-4"
                        >

                          <Icon className="w-8 h-8 text-neutral-900 dark:text-white mb-4 stroke-[1.5]" />

                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                            {feature.title}
                          </h3>

                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                            {feature.description}
                          </p>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* Carousel Dots */}
                <div className="flex items-center justify-center gap-1.5 mt-6">

                  {TRUST_FEATURES.map(
                    (_, idx) => (

                      <span
                        key={idx}
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

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-4 gap-8">

                {TRUST_FEATURES.map(
                  (feature, idx) => {

                    const Icon =
                      feature.icon;

                    return (
                      <div
                        key={idx}
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
                            {feature.title}
                          </h3>

                          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {feature.description}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </>

        )}

      </div>
    </div>
  );
}