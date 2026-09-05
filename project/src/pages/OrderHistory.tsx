import { useState, useEffect, useRef } from 'react';
import { Package, ChevronDown, CheckCircle, Clock, XCircle, Truck, Download, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter, Link } from '@/lib/router';
import { supabase } from '@/lib/supabase';
import gsap from 'gsap';

type ProductColor = {
  name: string;
  hex?: string;
  thumbnail?: string;
  images?: string[];
};

type OrderItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  color?: string | null;
  selected_color?: string | null;
  products?: {
    image_url: string | null;
    category: unknown;
    colors?: ProductColor[] | null;
  } | null;
};

type Order = {
  id: string;
  email: string;
  full_name: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  country: string;
  total: number;
  currency?: string;
  status: string;
  notes?: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-yellow-400 bg-amber-500/10 dark:bg-yellow-400/10 border-amber-500/30 dark:border-yellow-400/30' },
  done: { label: 'Done', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/30 dark:border-emerald-400/30' },
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border-emerald-500/30 dark:border-emerald-400/30' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/30 dark:border-blue-400/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-400/10 border-red-500/30 dark:border-red-400/30' },
};

const formatOrderPrice = (amount: number, currencyCode: string = 'USD') => {
  if (typeof amount !== 'number') return '0';
  const code = currencyCode.toUpperCase();
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'PYG'];
  const isZeroDecimal = zeroDecimalCurrencies.includes(code);

  const unitAmount = amount >= 100 ? amount / 100 : amount;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(unitAmount);
  } catch {
    return `${code} ${unitAmount.toFixed(isZeroDecimal ? 0 : 2)}`;
  }
};

export default function OrderHistory() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const expandRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);

  const getItemImage = (item: OrderItem) => {
    const prod = item.products;
    const itemColor = item.color || item.selected_color;

    if (itemColor && Array.isArray(prod?.colors)) {
      const matchedColor = prod.colors.find(
        (c) => c.name?.trim().toLowerCase() === itemColor.trim().toLowerCase()
      );
      if (matchedColor?.thumbnail) {
        return matchedColor.thumbnail;
      }
    }

    return prod?.image_url || null;
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(colors, image_url, category))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders((data as Order[]) || []);
      setLoading(false);
    };

    fetchOrders();

    const channel = supabase
      .channel(`user-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const toggleExpand = (orderId: string) => {
    const isCurrentlyExpanded = !!expandedIds[orderId];
    const el = expandRefs.current[orderId];

    if (!el) {
      setExpandedIds((prev) => ({ ...prev, [orderId]: !isCurrentlyExpanded }));
      return;
    }

    if (!isCurrentlyExpanded) {
      setExpandedIds((prev) => ({ ...prev, [orderId]: true }));
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { height: 0, opacity: 0, y: -10 },
        { height: 'auto', opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    } else {
      gsap.killTweensOf(el);
      gsap.to(el, {
        height: 0,
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          setExpandedIds((prev) => ({ ...prev, [orderId]: false }));
          gsap.set(el, { height: 'auto', y: 0 });
        },
      });
    }
  };

  const handleDownloadInstruction = async (orderId: string) => {
    setDownloadingOrderId(orderId);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/download-instruction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            orderId,
            userId: user?.id ?? null,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        alert(`下載失敗: ${err.error || '已達到最大下載次數限制'}`);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'Instruction.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('下載發生錯誤，請檢查網路連線。');
    } finally {
      setDownloadingOrderId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white dark:bg-neutral-950 min-h-screen flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-700 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 select-none [-webkit-tap-highlight-color:transparent] transition-colors duration-200">
      {/* Header Banner Section aligned with Store Header */}
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-7 h-7 text-neutral-900 dark:text-white" />
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Order History
            </h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">
            View your past orders, shipping details, and order status.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center shadow-sm dark:shadow-none max-w-4xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">No Purchase History</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-sm mx-auto">
              You haven't placed any orders yet. Browse our store and place your first order.
            </p>
            <Link
              to="/store"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:scale-105"
            >
              Browse the Store
            </Link>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {orders.map((order) => {
              const isExpanded = !!expandedIds[order.id];
              const status = statusConfig[order.status] ?? statusConfig.pending;
              const StatusIcon = status.icon;
              const invoiceId = order.id.slice(0, 8).toUpperCase();
              const isDownloading = downloadingOrderId === order.id;
              const orderCurrency = order.currency || 'USD';

              const hasCustomParts = (order.order_items || []).some((item) => {
                const nameMatch = (item.product_name || '').toLowerCase();
                if (nameMatch.includes('custom') || nameMatch.includes('part') || nameMatch.includes('rim')) {
                  return true;
                }

                const category = item?.products?.category;
                if (!category) return false;

                const categoryStr = typeof category === 'string'
                  ? category
                  : JSON.stringify(category);

                const lowerCat = categoryStr.toLowerCase();
                return lowerCat.includes('custom') || lowerCat.includes('part') || lowerCat.includes('rim');
              });

              const canDownload = ['shipped', 'done'].includes(order.status) && !hasCustomParts;

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-none transition-colors"
                >
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full p-5 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left touch-manipulation"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${status.color}`}>
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-neutral-900 dark:text-white font-bold text-sm sm:text-base">
                          Invoice #{invoiceId}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-neutral-900 dark:text-white font-bold text-sm">
                          {formatOrderPrice(order.total, orderCurrency)}
                        </p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                          {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 ${isExpanded ? 'rotate-180' : ''} transition-transform`}>
                        <ChevronDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                    </div>
                  </button>

                  <div
                    ref={(el) => {
                      expandRefs.current[order.id] = el;
                    }}
                    style={{ display: isExpanded ? 'block' : 'none', overflow: 'hidden' }}
                  >
                    <div className="border-t border-neutral-200 dark:border-neutral-800 p-5 space-y-6">
                      <div className="flex items-center justify-between sm:hidden">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                        <p className="text-neutral-900 dark:text-white font-bold">
                          {formatOrderPrice(order.total, orderCurrency)}
                        </p>
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </div>

                      {order.notes && (
                        <div>
                          <h3 className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5 font-semibold">
                            <MessageSquare className="w-3.5 h-3.5" />
                            Order Notes
                          </h3>
                          <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                            {order.notes}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 font-semibold">Items</h3>
                        <div className="space-y-2">
                          {(order.order_items || []).map((item) => {
                            const itemColor = item.color || item.selected_color;
                            const itemImageUrl = getItemImage(item);

                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700/50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                    {itemImageUrl ? (
                                      <img
                                        src={itemImageUrl}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-neutral-900 dark:text-white text-sm font-medium truncate">{item.product_name}</p>
                                    <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                                      Qty: {item.quantity}{itemColor ? ` · Color: ${itemColor}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-neutral-900 dark:text-white text-sm font-bold flex-shrink-0">
                                  {formatOrderPrice(item.unit_price * item.quantity, orderCurrency)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 font-semibold">Shipping Address</h3>
                        <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 space-y-1">
                          <p className="text-neutral-900 dark:text-white font-medium">{order.full_name}</p>
                          <p>{order.shipping_address}</p>
                          <p>
                            {order.city}, {order.postal_code}
                          </p>
                          <p>{order.country}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-neutral-500 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3 font-semibold">Payment Summary</h3>
                        <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-800 px-4 py-3 space-y-2">
                          {(order.order_items || []).map((item) => {
                            const itemColor = item.color || item.selected_color;
                            return (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400">
                                  {item.product_name}{itemColor ? ` (${itemColor})` : ''} × {item.quantity}
                                </span>
                                <span className="text-neutral-900 dark:text-white">
                                  {formatOrderPrice(item.unit_price * item.quantity, orderCurrency)}
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            <span className="text-neutral-900 dark:text-white font-bold">Total</span>
                            <span className="text-neutral-900 dark:text-white font-bold text-lg">
                              {formatOrderPrice(order.total, orderCurrency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canDownload && (
                        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => handleDownloadInstruction(order.id)}
                            disabled={isDownloading}
                            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold text-sm rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98]"
                          >
                            <Download className="w-4 h-4" />
                            {isDownloading ? 'Downloading...' : 'Download Instruction Manual'}
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}