import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, Check, ShoppingBag, AlertCircle, Tag, Banknote } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { Link, useRouter } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/currency';
import { US, HK, CA, GB, AU, EU, JP } from 'country-flag-icons/react/3x2';

// 🔒 從 .env 讀取 Admin Email 清單，安全不洩漏
const rawAdminEmails = import.meta.env.VITE_ADMIN_EMAILS || '';
const ADMIN_EMAILS = rawAdminEmails
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

const COUNTRY_CONFIG: Record<
  string,
  { currency: string; rate: number; symbol: string; taxRate: number; Flag: React.ComponentType<{ className?: string }> }
> = {
  'Hong Kong': { currency: 'HKD', rate: 7.8, symbol: 'HK$', taxRate: 0, Flag: HK },
  'United States': { currency: 'USD', rate: 1.0, symbol: '$', taxRate: 0.08, Flag: US },
  'Canada': { currency: 'CAD', rate: 1.35, symbol: 'CA$', taxRate: 0.08, Flag: CA },
  'United Kingdom': { currency: 'GBP', rate: 0.78, symbol: '£', taxRate: 0.08, Flag: GB },
  'Australia': { currency: 'AUD', rate: 1.52, symbol: 'A$', taxRate: 0.08, Flag: AU },
  'Germany': { currency: 'EUR', rate: 0.92, symbol: '€', taxRate: 0.08, Flag: EU },
  'France': { currency: 'EUR', rate: 0.92, symbol: '€', taxRate: 0.08, Flag: EU },
  'Japan': { currency: 'JPY', rate: 155.0, symbol: '¥', taxRate: 0.08, Flag: JP },
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  'Hong Kong': 'HKD',
  'United States': 'USD',
  'Canada': 'CAD',
  'United Kingdom': 'GBP',
  'Australia': 'AUD',
  'Germany': 'EUR',
  'France': 'EUR',
  'Japan': 'JPY',
};

const CURRENCY_TO_COUNTRY: Record<string, string> = {
  HKD: 'Hong Kong',
  USD: 'United States',
  CAD: 'Canada',
  GBP: 'United Kingdom',
  AUD: 'Australia',
  EUR: 'Germany',
  JPY: 'Japan',
};

type AppliedCoupon = {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: string;
};

export default function Checkout() {
  const { items = [], clearCart } = useCart();
  const { navigate } = useRouter();
  const { user } = useAuth(); // 使用 Supabase 認證登入的 User
  const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();

  const [form, setForm] = useState({
    email: '',
    phone: '',
    full_name: '',
    shipping_address: '',
    city: '',
    postal_code: '',
    country: CURRENCY_TO_COUNTRY[globalCurrency] || 'United States',
    notes: '',
  });

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbOrderStatus, setDbOrderStatus] = useState<string>('pending');

  // 🛡️ 嚴格權限檢查：必須「已登入」且「認證 Email 喺 Admin 名單內」
  const authenticatedEmail = user?.email?.trim().toLowerCase();
  const isAdmin = Boolean(user) && Boolean(authenticatedEmail) && ADMIN_EMAILS.includes(authenticatedEmail!);
  
  // 只有真正 Admin 打 "CASH" 才能觸發 Bypass
  const isCashPayment = isAdmin && form.notes.trim().toUpperCase().includes('CASH');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTop = 0;
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('status');
    const paramOrderId = searchParams.get('order_id');

    if (paymentStatus === 'success' || paramOrderId) {
      if (paramOrderId) setOrderId(paramOrderId);
      setStatus('success');
      clearCart();
      scrollToTop();

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    const matchingCountry = CURRENCY_TO_COUNTRY[globalCurrency];
    if (matchingCountry && form.country !== matchingCountry) {
      setForm((prev) => ({ ...prev, country: matchingCountry }));
      setAppliedCoupon(null);
      setCouponError(null);
    }
  }, [globalCurrency]);

  const selectedCountryConfig = COUNTRY_CONFIG[form.country] || COUNTRY_CONFIG['United States'];
  const { taxRate, symbol, rate, currency: selectedCurrency } = selectedCountryConfig;
  const SelectedCountryFlag = selectedCountryConfig.Flag;

  const calculateLocalAmount = (usdAmount: number) => {
    const raw = usdAmount * rate;
    return selectedCurrency === 'HKD' ? Math.ceil(raw) : Number(raw.toFixed(2));
  };

  const renderFormattedPrice = (usdAmount: number) => {
    const localAmount = calculateLocalAmount(usdAmount);
    const isHKD = selectedCurrency === 'HKD';

    const formattedNumber = localAmount.toLocaleString('en-US', {
      minimumFractionDigits: isHKD ? 0 : 2,
      maximumFractionDigits: isHKD ? 0 : 2,
    });

    return `${symbol}${formattedNumber}`;
  };

  const handleCountryChange = (country: string) => {
    setForm((prev) => ({ ...prev, country }));
    const newCurrency = COUNTRY_TO_CURRENCY[country];
    if (newCurrency && newCurrency !== globalCurrency) {
      setGlobalCurrency(newCurrency);
      setAppliedCoupon(null);
      setCouponError(null);
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (words <= 200 || text.length < form.notes.length) {
      setForm((prev) => ({ ...prev, notes: text }));
    }
  };

  const getProductPriceUSD = (price?: number) => {
    if (typeof price !== 'number') return 0;
    return price / 100;
  };

  const isInstructionItem = (item?: (typeof items)[0]) => {
    if (!item?.product) return false;

    const rawCategory = item.product.category;
    const rawName = item.product.name;

    const categoryStr = Array.isArray(rawCategory)
      ? rawCategory.join(' ')
      : String(rawCategory || '');

    const nameStr = Array.isArray(rawName)
      ? rawName.join(' ')
      : String(rawName || '');

    const category = categoryStr.toLowerCase();
    const name = nameStr.toLowerCase();

    return category.includes('instruction') || name.includes('[instruction]');
  };

  const normalizedSubtotalUSD = items.reduce((acc, item) => {
    if (!item?.product) return acc;
    return acc + getProductPriceUSD(item.product.price) * (item.quantity || 1);
  }, 0);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponInput.trim().toUpperCase();

    if (!code) return;

    setIsValidatingCoupon(true);

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        setCouponError('Invalid coupon code.');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('This coupon has expired.');
        return;
      }

      const couponCurrency = data.currency || 'USD';

      if (couponCurrency !== 'ALL' && couponCurrency !== selectedCurrency) {
        setCouponError(`This coupon is only valid for purchases in ${couponCurrency}.`);
        return;
      }

      const currentSubtotalLocal = calculateLocalAmount(normalizedSubtotalUSD);

      if (data.min_spend && currentSubtotalLocal < data.min_spend) {
        setCouponError(`Minimum order spend of ${symbol}${data.min_spend} required.`);
        return;
      }

      setAppliedCoupon({
        code: data.code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        currency: couponCurrency,
      });
      setCouponInput('');
    } catch {
      setCouponError('Failed to validate coupon.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  useEffect(() => {
    if (status === 'success') {
      scrollToTop();
    }
  }, [status]);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderStatus = async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle();
      if (data?.status) {
        setDbOrderStatus(data.status);
      }
    };
    fetchOrderStatus();

    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.new && payload.new.status) {
            setDbOrderStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  let discountAmountUSD = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmountUSD = (normalizedSubtotalUSD * appliedCoupon.discountValue) / 100;
    } else {
      discountAmountUSD = appliedCoupon.currency !== 'USD'
        ? appliedCoupon.discountValue / rate
        : appliedCoupon.discountValue;
    }
  }

  const discountedSubtotalUSD = Math.max(0, normalizedSubtotalUSD - discountAmountUSD);

  const basePhysicalSubtotalUSD = items.reduce((acc, item) => {
    if (item?.product && !isInstructionItem(item)) {
      return acc + getProductPriceUSD(item.product.price) * (item.quantity || 1);
    }
    return acc;
  }, 0);

  const hasPhysicalItems = items.some((item) => item?.product && !isInstructionItem(item));
  const isInstructionOnly = items.length > 0 && items.every((item) => item?.product && isInstructionItem(item));

  const freeShippingThresholdUSD = 99;
  const isHongKong = form.country === 'Hong Kong';

  const baseShippingUSD =
    isHongKong ||
    !hasPhysicalItems ||
    basePhysicalSubtotalUSD === 0 ||
    basePhysicalSubtotalUSD >= freeShippingThresholdUSD
      ? 0
      : 7.99;

  const baseTaxUSD = discountedSubtotalUSD === 0 ? 0 : discountedSubtotalUSD * taxRate;
  const baseTotalUSD = discountedSubtotalUSD + baseShippingUSD + baseTaxUSD;

  const wordCount = form.notes.trim() ? form.notes.trim().split(/\s+/).length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);

    const invalidItems = items.filter((item) => !item?.product);
    if (invalidItems.length > 0) {
      setStatus('idle');
      setErrorMessage('Failed to fetch product details. Please refresh or remove invalid cart items.');
      return;
    }

    const targetStatus = isCashPayment || isInstructionOnly ? 'done' : 'pending';
    const localTotalAmount = calculateLocalAmount(baseTotalUSD);
    const localDiscountAmount = calculateLocalAmount(discountAmountUSD);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('create-order', {
        body: {
          user_id: user?.id ?? null,
          email: form.email,
          full_name: form.full_name,
          phone: form.phone,
          shipping_address: `${form.shipping_address}, ${form.city}, ${form.postal_code}`,
          city: form.city,
          postal_code: form.postal_code,
          country: form.country,
          currency: globalCurrency,
          status: targetStatus,
          payment_method: isCashPayment ? 'cash' : 'stripe',
          notes: form.notes,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          discount_amount: Math.round(localDiscountAmount * 100),
          total_amount: Math.round(localTotalAmount * 100),
          items: items.map((item) => {
            const prod = item.product as any;
            const itemPriceUSD = getProductPriceUSD(prod?.price);
            const itemLocalPrice = calculateLocalAmount(itemPriceUSD);
            const colorName = item.selectedColor || prod?.selectedColor || null;

            return {
              product_id: prod?.id,
              product_name: prod?.name,
              selected_color: colorName,
              quantity: item.quantity,
              price: Math.round(itemLocalPrice * 100),
            };
          }),
        },
      });

      if (funcError) {
        let serverMessage = funcError.message;
        if (funcError.context && typeof funcError.context.json === 'function') {
          try {
            const errBody = await funcError.context.json();
            if (errBody?.error) serverMessage = errBody.error;
            else if (errBody?.message) serverMessage = errBody.message;
          } catch (_) {}
        }
        throw new Error(serverMessage || 'Failed to fetch product details or process order.');
      }

      if (!data?.success) throw new Error(data?.error || 'Order creation failed');

      if (isCashPayment || baseTotalUSD === 0 || !data.url) {
        setOrderId(data.order_id);
        setDbOrderStatus(data.status || targetStatus);
        scrollToTop();
        setStatus('success');
        clearCart();
      } else {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setStatus('idle');
      console.error('Order submission error:', err);
      setErrorMessage(err?.message || 'Failed to process order.');
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-[16px] focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-600 transition-colors';

  if (status === 'success') {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen flex flex-col justify-start items-center px-4 py-12 transition-colors">
        <div className="max-w-md text-center pt-8 md:pt-12">
          <div className="w-20 h-20 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white dark:text-neutral-950" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">Order Confirmed!</h1>
          <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider mb-4">
            <span
              className={`w-2 h-2 rounded-full ${
                dbOrderStatus === 'done' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className={dbOrderStatus === 'done' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
              Status: {dbOrderStatus}
            </span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">
            {dbOrderStatus === 'done'
              ? 'Your order has been completed and processed!'
              : "Thank you for your purchase. We've received your order."}
          </p>
          {orderId && (
            <p className="text-neutral-500 text-sm mb-8">
              Order reference: <span className="text-neutral-800 dark:text-neutral-300 font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
          )}
          <Link
            to="/store"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen flex items-center justify-center px-4 transition-colors">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-900 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-neutral-500 dark:text-neutral-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Your cart is empty</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">Add some kits to your cart before checking out.</p>
          <Link
            to="/store"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105"
          >
            Browse the Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen transition-colors pt-20 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          type="button"
          onClick={() => navigate('/store')}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </button>

        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight mb-8">Checkout</h1>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-start">
          <div className="w-full space-y-6 order-1">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm dark:shadow-none">
              <h2 className="text-neutral-900 dark:text-white font-bold text-lg mb-4">Contact Information</h2>
              <div className="space-y-4">
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{ fontSize: '16px' }}
                  className={inputClass}
                />
                <input
                  required
                  type="tel"
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={{ fontSize: '16px' }}
                  className={inputClass}
                />
                <input
                  required
                  type="text"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  style={{ fontSize: '16px' }}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm dark:shadow-none">
              <h2 className="text-neutral-900 dark:text-white font-bold text-lg mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <input
                  required
                  type="text"
                  placeholder="Street address"
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                  style={{ fontSize: '16px' }}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    style={{ fontSize: '16px' }}
                    className={inputClass}
                  />
                  <input
                    required
                    type="text"
                    placeholder="Postal code"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    style={{ fontSize: '16px' }}
                    className={inputClass}
                  />
                </div>
                <select
                  value={form.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  style={{ fontSize: '16px' }}
                  className={inputClass + ' cursor-pointer'}
                >
                  {Object.keys(COUNTRY_CONFIG).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm dark:shadow-none">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-neutral-900 dark:text-white font-bold text-lg">Order Notes (Optional)</h2>
                <span className="text-xs text-neutral-500 font-mono">{wordCount} / 200 words</span>
              </div>
              <textarea
                rows={3}
                placeholder="Delivery instructions, gift notes, wheel setup, etc."
                value={form.notes}
                onChange={handleNotesChange}
                style={{ fontSize: '16px' }}
                className={inputClass + ' resize-none'}
              />
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm dark:shadow-none">
              <div className="flex items-center gap-2 mb-4">
                {isCashPayment ? (
                  <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CreditCard className="w-5 h-5 text-neutral-900 dark:text-white" />
                )}
                <h2 className="text-neutral-900 dark:text-white font-bold text-lg">
                  {isCashPayment ? 'Payment (Cash on Store)' : 'Payment'}
                </h2>
              </div>
              
              {isCashPayment ? (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                    Store Cash Payment detected. Stripe checkout will be bypassed.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-neutral-100 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <Lock className="w-5 h-5 text-neutral-500" />
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Secure checkout powered by Stripe.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="w-full order-2 lg:sticky lg:top-24 self-start space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-6 shadow-sm dark:shadow-none">
              <div className="flex justify-between items-center">
                <h2 className="text-neutral-900 dark:text-white font-bold text-lg">Order Summary</h2>
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700/50">
                  <SelectedCountryFlag className="w-4 h-3 object-cover rounded-sm" />
                  <span>{globalCurrency}</span>
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item, idx) => {
                  if (!item?.product) {
                    return (
                      <div key={idx} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-xs">
                        Failed to fetch product details
                      </div>
                    );
                  }
                  const prod = item.product as any;
                  const unitPriceUSD = getProductPriceUSD(prod.price);

                  const displayColorName = item.selectedColor || prod.selectedColor;

                  const matchedColorObj = (prod.colors as any[])?.find(
                    (c) => c.name?.toLowerCase() === displayColorName?.toLowerCase()
                  );

                  const displayImage =
                    item.selectedImage ||
                    matchedColorObj?.thumbnail ||
                    matchedColorObj?.gallery?.[0] ||
                    prod.image_url;

                  return (
                    <div key={`${prod.id}-${displayColorName || idx}`} className="flex gap-3 items-center">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                        <img
                          src={displayImage}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-900 dark:text-white text-sm font-semibold truncate">{prod.name}</p>
                        <p className="text-neutral-500 text-xs truncate">
                          Qty: {item.quantity} {displayColorName ? `· Color: ${displayColorName}` : ''}
                        </p>
                      </div>
                      <p className="text-neutral-900 dark:text-white text-sm font-bold flex-shrink-0">
                        {unitPriceUSD === 0 ? 'Free' : renderFormattedPrice(unitPriceUSD * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 font-medium">Coupon Code</label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="font-mono font-bold">{appliedCoupon.code}</span>
                      <span className="text-xs">
                        ({appliedCoupon.discountType === 'percentage'
                          ? `${appliedCoupon.discountValue}% OFF`
                          : `-${renderFormattedPrice(discountAmountUSD)}`})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-mono focus:outline-none focus:border-neutral-500 dark:focus:border-neutral-600 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold text-xs rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    >
                      {isValidatingCoupon ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{couponError}</p>}
              </div>

              <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
                  <span className="text-neutral-900 dark:text-white">
                    {normalizedSubtotalUSD === 0 ? 'Free' : renderFormattedPrice(normalizedSubtotalUSD)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{renderFormattedPrice(discountAmountUSD)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">Shipping</span>
                  <span className="text-neutral-900 dark:text-white">
                    {baseShippingUSD === 0 ? 'Free' : renderFormattedPrice(baseShippingUSD)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    Tax {taxRate > 0 ? `(${taxRate * 100}%)` : ''}
                  </span>
                  <span className="text-neutral-900 dark:text-white">
                    {taxRate === 0 || baseTaxUSD === 0 ? 'Free' : renderFormattedPrice(baseTaxUSD)}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-neutral-900 dark:text-white font-bold">Total</span>
                  <span className="text-neutral-900 dark:text-white text-xl font-bold">
                    {baseTotalUSD === 0 ? 'Free' : renderFormattedPrice(baseTotalUSD)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={status === 'submitting'}
                className={`flex items-center justify-center gap-2 w-full py-4 text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
                  isCashPayment
                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-white'
                    : 'bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200'
                }`}
              >
                {status === 'submitting'
                  ? 'Processing...'
                  : isCashPayment
                  ? `Place Cash Order · ${renderFormattedPrice(baseTotalUSD)}`
                  : baseTotalUSD === 0
                  ? 'Place Order · Free'
                  : `Place Order · ${renderFormattedPrice(baseTotalUSD)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}