import React from 'react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';
import { handleSecureDownload } from '@/lib/storage';
import { ChartBar as BarChart3, Users, Eye, DollarSign, ShoppingBag, UserCheck, Plus, PencilLine, Trash2, Copy, Check, Loader as Loader2, Package, FileCode, Upload, Download, CircleAlert as AlertCircle, TriangleAlert as AlertTriangle, Calendar, ShieldAlert, ChevronDown, ChevronRight, ArrowUpDown, ShoppingCart, MessageSquare, Layers, Image as ImageIcon } from 'lucide-react';

export type ProductColor = {
  name: string;
  hex?: string;
  thumbnail?: string;
  images?: string[];
};

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number | null;
  category: string;
  theme: string;
  piece_count: number | null;
  image_url: string;
  gallery: string[];
  colors: string[] | ProductColor[] | null;
  stock_quantity: number | null;
  featured: boolean;
  in_stock: boolean;
  rating: number;
  created_at: string;
  section: string;
}

export interface DigitalFile {
  id: string;
  product_id: string;
  source_type: string;
  file_path: string | null;
  external_url: string | null;
  file_name: string;
  created_at: string;
}

export interface Order {
  id: string;
  status: string;
  email: string;
  full_name: string;
  phone?: string;
  shipping_address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  total?: number;
  amount?: number;
  currency?: string;
  download_count?: number;
  user_id?: string;
  visitor_id?: string;
  stripe_session_id?: string;
  notes?: string;
  coupon_code?: string;
  discount_amount?: number;
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_price: number | null;
  price?: number | null;
  color?: string | null;
  selected_color?: string | null;
  created_at: string;
  image_url?: string;
  thumbnail?: string;
  products?: {
    image_url: string | null;
    category: unknown;
    colors?: ProductColor[] | null;
  } | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export type AdminTab = 'analytics' | 'products' | 'digital_files' | 'orders' | 'messages';

export type TimeRange = 'realtime' | 'yesterday' | '7days' | '30days' | 'year';

interface AnalyticsData {
  visitors: number;
  pageViews: number;
  revenue: number;
  paidOrders: number;
  payingBuyers: number;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
}

type ProductSortField = 'id' | 'name' | 'price' | 'category' | 'section' | 'stock_quantity';
type FileSortField = 'id' | 'product_id' | 'file_name' | 'source_type' | 'file_path' | 'external_url';
type OrderSortField = 'id' | 'created_at' | 'user_id' | 'currency' | 'total' | 'status' | 'email';
type MessageSortField = 'id' | 'created_at' | 'name' | 'email' | 'subject';

interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  price: number | '';
  category: string;
  theme: string;
  piece_count: number | '';
  image_url: string;
  gallery: string[];
  colors: string[];
  stock_quantity: number | '';
  featured: boolean;
  in_stock: boolean;
  rating: number;
  section: string;
}

interface OrderFormState {
  user_id: string;
  visitor_id: string;
  stripe_session_id: string;
  currency: string;
  amount: number | '';
  download_count: number | '';
  email: string;
  full_name: string;
  phone: string;
  shipping_address: string;
  city: string;
  postal_code: string;
  country: string;
  status: string;
  coupon_code: string;
  discount_amount: number | '';
  notes: string;
}

const emptyProductForm: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  category: 'Kits',
  theme: 'Custom',
  piece_count: '',
  image_url: '',
  gallery: [],
  colors: [],
  stock_quantity: 0,
  featured: false,
  in_stock: true,
  rating: 5.0,
  section: 'kits',
};

const emptyFileForm: Omit<DigitalFile, 'id' | 'created_at'> = {
  product_id: '',
  source_type: 'external_link',
  file_path: '',
  external_url: '',
  file_name: '',
};

const emptyOrderForm: OrderFormState = {
  user_id: '',
  visitor_id: '',
  stripe_session_id: '',
  currency: 'USD',
  amount: '',
  download_count: 0,
  email: '',
  full_name: '',
  phone: '',
  shipping_address: '',
  city: '',
  postal_code: '',
  country: '',
  status: 'pending',
  coupon_code: '',
  discount_amount: '',
  notes: '',
};

const TAB_ROUTES: Record<AdminTab, string> = {
  analytics: '/admin',
  products: '/admin/products',
  digital_files: '/admin/digital-products',
  orders: '/admin/ordersanditems',
  messages: '/admin/messages',
};

export default function AdminPanel({ initialTab = 'analytics' }: { initialTab?: AdminTab }) {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [timeRange, setTimeRange] = useState<TimeRange>('realtime');
  const [mounted, setMounted] = useState(false);

  // Accordion Expand state for combined Order Items view
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  // Dropdown Menu State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [savedScrollPos, setSavedScrollPos] = useState<number>(0);

  // Sorting States
  const [productSort, setProductSort] = useState<{ field: ProductSortField; direction: 'asc' | 'desc' }>({
    field: 'name',
    direction: 'asc',
  });
  const [fileSort, setFileSort] = useState<{ field: FileSortField; direction: 'asc' | 'desc' }>({
    field: 'file_name',
    direction: 'asc',
  });
  const [orderSort, setOrderSort] = useState<{ field: OrderSortField; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
  });
  const [messageSort, setMessageSort] = useState<{ field: MessageSortField; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
  });

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    visitors: 0,
    pageViews: 0,
    revenue: 0,
    paidOrders: 0,
    payingBuyers: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [galleryInput, setGalleryInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Digital Files State
  const [files, setFiles] = useState<DigitalFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [fileForm, setFileForm] = useState(emptyFileForm);
  const [isAddingFile, setIsAddingFile] = useState(false);

  // Integrated Orders & Order Items State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormState>(emptyOrderForm);
  const [isAddingOrder, setIsAddingOrder] = useState(false);

  // Messages State
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Shared Action & UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal State
  const [confirmModal, setConfirmModal] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    confirmVariant: 'primary',
    onConfirm: () => {},
  });

  // Jump to top directly without smooth scrolling
  useEffect(() => {
    if (editingProductId || isAddingProduct || editingFileId || isAddingFile || editingOrderId || isAddingOrder) {
      window.scrollTo(0, 0);
    }
  }, [editingProductId, isAddingProduct, editingFileId, isAddingFile, editingOrderId, isAddingOrder]);

  // Helper Function for Matching Item Thumbnail and Color
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

    return prod?.image_url || item.thumbnail || item.image_url || null;
  };

  // Tab Item Config
  const tabItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, count: null },
    { id: 'products', label: 'Products', icon: Package, count: products?.length ?? 0 },
    { id: 'digital_files', label: 'Digital Files', icon: FileCode, count: files?.length ?? 0 },
    { id: 'orders', label: 'Orders & Items', icon: ShoppingCart, count: orders?.length ?? 0 },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages?.length ?? 0 },
  ];

  const currentTab = tabItems.find((t) => t.id === activeTab) || tabItems[0];
  const CurrentIcon = currentTab.icon;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (confirmModal.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [confirmModal.isOpen]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchProducts();
      fetchFiles();
      fetchOrdersAndItems();
      fetchMessages();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin && activeTab === 'analytics') {
      fetchAnalytics(timeRange);
    }
  }, [user, isAdmin, activeTab, timeRange]);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Sorting
  const handleProductSort = (field: ProductSortField) => {
    setProductSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFileSort = (field: FileSortField) => {
    setFileSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleOrderSort = (field: OrderSortField) => {
    setOrderSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleMessageSort = (field: MessageSortField) => {
    setMessageSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const valA = a[productSort.field] ?? 0;
      const valB = b[productSort.field] ?? 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return productSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return productSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [products, productSort]);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const valA = a[fileSort.field] ?? '';
      const valB = b[fileSort.field] ?? '';
      return fileSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [files, fileSort]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const valA = a[orderSort.field] ?? 0;
      const valB = b[orderSort.field] ?? 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return orderSort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return orderSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [orders, orderSort]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      const valA = a[messageSort.field] ?? '';
      const valB = b[messageSort.field] ?? '';
      return messageSort.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [messages, messageSort]);

  // Map order items by order ID
  const orderItemsByOrderId = useMemo(() => {
    const map: Record<string, OrderItem[]> = {};
    orderItems.forEach((item) => {
      if (!map[item.order_id]) map[item.order_id] = [];
      map[item.order_id].push(item);
    });
    return map;
  }, [orderItems]);

  // Supabase Fetch Methods
  const getStartDateISO = (range: TimeRange): string => {
    const now = new Date();
    if (range === 'realtime') now.setHours(now.getHours() - 1);
    else if (range === 'yesterday') now.setDate(now.getDate() - 1);
    else if (range === '7days') now.setDate(now.getDate() - 7);
    else if (range === '30days') now.setDate(now.getDate() - 30);
    else if (range === 'year') now.setFullYear(now.getFullYear() - 1);
    return now.toISOString();
  };

  const fetchAnalytics = async (range: TimeRange) => {
    setLoadingAnalytics(true);
    setActionError(null);
    try {
      const startDate = getStartDateISO(range);

      const { data: pageViewRows, error: pvError } = await supabase
        .from('page_views')
        .select('visitor_id')
        .gte('created_at', startDate);

      if (pvError) throw pvError;

      const totalPageViews = pageViewRows?.length || 0;
      const uniqueVisitors = new Set(pageViewRows?.map((pv) => pv.visitor_id)).size;

      const { data: orderRows, error: orderError } = await supabase
        .from('orders')
        .select('amount, total, user_id, visitor_id')
        .or('status.eq.paid,status.eq.done')
        .gte('created_at', startDate);

      if (orderError) throw orderError;

      const totalRevenue = orderRows?.reduce((sum, o) => {
        const rawAmount = o.total ?? o.amount ?? 0;
        return sum + (Number(rawAmount) / 100);
      }, 0) || 0;
      const totalOrders = orderRows?.length || 0;
      const uniqueBuyers = new Set(orderRows?.map((o) => o.user_id || o.visitor_id).filter(Boolean)).size;

      setAnalytics({
        visitors: uniqueVisitors,
        pageViews: totalPageViews,
        revenue: parseFloat(totalRevenue.toFixed(2)),
        paidOrders: totalOrders,
        payingBuyers: uniqueBuyers,
      });
    } catch (error: any) {
      setActionError(`Analytics Fetch Error: ${error.message}`);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setActionError(`Products Fetch Error: ${error.message}`);
    if (!error && data) setProducts(data as Product[]);
    setLoadingProducts(false);
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    const { data, error } = await supabase
      .from('digital_files')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setActionError(`Digital Files Fetch Error: ${error.message}`);
    if (!error && data) setFiles(data as DigitalFile[]);
    setLoadingFiles(false);
  };

  const fetchOrdersAndItems = async () => {
    setLoadingOrders(true);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*, products(colors, image_url, category)')
      .order('created_at', { ascending: false });

    if (ordersError) setActionError(`Orders Fetch Error: ${ordersError.message}`);
    if (itemsError) setActionError(`Order Items Fetch Error: ${itemsError.message}`);

    if (!ordersError && ordersData) setOrders(ordersData as Order[]);
    if (!itemsError && itemsData) setOrderItems(itemsData as OrderItem[]);
    setLoadingOrders(false);
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) setActionError(`Contact Messages Fetch Error: ${error.message}`);
    if (!error && data) setMessages(data as ContactMessage[]);
    setLoadingMessages(false);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Product Handlers
  const handleEditProduct = (product: Product) => {
    setActionError(null);
    setSavedScrollPos(window.scrollY);
    setEditingProductId(product.id);
    setIsAddingProduct(false);
    setProductForm({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price ?? '',
      category: product.category || '',
      theme: product.theme || '',
      piece_count: product.piece_count ?? '',
      image_url: product.image_url || '',
      gallery: product.gallery || [],
      colors: Array.isArray(product.colors) ? product.colors.map(c => typeof c === 'string' ? c : c.name) : [],
      stock_quantity: product.stock_quantity ?? 0,
      featured: product.featured,
      in_stock: product.in_stock,
      rating: product.rating,
      section: product.section ?? '',
    });
    setGalleryInput((product.gallery || []).join(', '));
    setColorsInput((Array.isArray(product.colors) ? product.colors.map(c => typeof c === 'string' ? c : c.name) : []).join(', '));
  };

  const handleDuplicateProduct = async (product: Product) => {
    setActionError(null);
    setIsSubmitting(true);
    const duplicatedPayload = {
      name: `${product.name} (copy)`,
      slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
      description: product.description,
      price: product.price,
      category: product.category,
      theme: product.theme,
      piece_count: product.piece_count,
      image_url: product.image_url,
      gallery: product.gallery,
      colors: product.colors,
      stock_quantity: product.stock_quantity,
      featured: product.featured,
      in_stock: product.in_stock,
      rating: product.rating,
      section: product.section,
    };

    const { error } = await supabase.from('products').insert([duplicatedPayload]);
    if (error) setActionError(`Duplicate Product Error: ${error.message}`);
    else {
      await fetchProducts();
    }
    setIsSubmitting(false);
  };

  const handleSaveProduct = () => {
    const actionText = isAddingProduct ? 'create this new product' : 'save changes to this product';
    setConfirmModal({
      isOpen: true,
      title: isAddingProduct ? 'Create Product' : 'Save Changes',
      message: `Are you sure you want to ${actionText}?`,
      confirmText: 'Save Product',
      confirmVariant: 'primary',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);
        const galleryArray = galleryInput
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url.length > 0);

        const colorsArray = colorsInput
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        const payload = {
          ...productForm,
          price: productForm.price === '' ? null : Number(productForm.price),
          piece_count: productForm.piece_count === '' ? null : Number(productForm.piece_count),
          stock_quantity: productForm.stock_quantity === '' ? null : Number(productForm.stock_quantity),
          gallery: galleryArray,
          colors: colorsArray,
        };

        if (isAddingProduct) {
          const { error } = await supabase.from('products').insert([payload]);
          if (error) setActionError(`Create Product Error: ${error.message}`);
          else {
            await fetchProducts();
            cancelProductForm();
          }
        } else if (editingProductId) {
          const { error } = await supabase.from('products').update(payload).eq('id', editingProductId);
          if (error) setActionError(`Update Product Error: ${error.message}`);
          else {
            await fetchProducts();
            cancelProductForm();
          }
        }
        setIsSubmitting(false);
      },
    });
  };

  const handleDeleteProduct = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) setActionError(`Delete Product Error: ${error.message}`);
        else {
          if (editingProductId === id) cancelProductForm();
          await fetchProducts();
        }
        setIsSubmitting(false);
      },
    });
  };

  const cancelProductForm = () => {
    setEditingProductId(null);
    setIsAddingProduct(false);
    setProductForm(emptyProductForm);
    setGalleryInput('');
    setColorsInput('');
  };

  // Digital File Handlers
  const handleEditFile = (file: DigitalFile) => {
    setActionError(null);
    setSavedScrollPos(window.scrollY);
    setEditingFileId(file.id);
    setIsAddingFile(false);
    setFileForm({
      product_id: file.product_id || '',
      source_type: file.source_type || 'external_link',
      file_path: file.file_path || '',
      external_url: file.external_url || '',
      file_name: file.file_name || '',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setActionError(null);

    const filePath = `digital-assets/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('digital_files').upload(filePath, file);

    if (uploadError) {
      setActionError(`File Upload Failed: ${uploadError.message}`);
    } else {
      setFileForm((prev) => ({
        ...prev,
        file_path: filePath,
        file_name: prev.file_name || file.name,
        source_type: 'storage_path',
      }));
    }
    setUploadingFile(false);
  };

  const handleDuplicateFile = async (file: DigitalFile) => {
    setActionError(null);
    setIsSubmitting(true);
    const duplicatedPayload = {
      product_id: file.product_id,
      source_type: file.source_type,
      file_path: file.file_path,
      external_url: file.external_url,
      file_name: `${file.file_name} (copy)`,
    };

    const { error } = await supabase.from('digital_files').insert([duplicatedPayload]);
    if (error) setActionError(`Duplicate File Error: ${error.message}`);
    else {
      await fetchFiles();
    }
    setIsSubmitting(false);
  };

  const handleSaveFile = () => {
    if (!fileForm.product_id) {
      setActionError('Please select a valid product for this digital file.');
      return;
    }

    const actionText = isAddingFile ? 'create this digital file record' : 'save changes to this file record';
    setConfirmModal({
      isOpen: true,
      title: isAddingFile ? 'Create Digital File' : 'Save File Changes',
      message: `Are you sure you want to ${actionText}?`,
      confirmText: 'Save File',
      confirmVariant: 'primary',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);

        if (isAddingFile) {
          const { error } = await supabase.from('digital_files').insert([fileForm]);
          if (error) setActionError(`Create File Error: ${error.message}`);
          else {
            await fetchFiles();
            cancelFileForm();
          }
        } else if (editingFileId) {
          const { error } = await supabase.from('digital_files').update(fileForm).eq('id', editingFileId);
          if (error) setActionError(`Update File Error: ${error.message}`);
          else {
            await fetchFiles();
            cancelFileForm();
          }
        }
        setIsSubmitting(false);
      },
    });
  };

  const handleDeleteFile = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Digital File',
      message: 'Are you sure you want to delete this file record? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);
        const { error } = await supabase.from('digital_files').delete().eq('id', id);
        if (error) setActionError(`Delete File Error: ${error.message}`);
        else {
          if (editingFileId === id) cancelFileForm();
          await fetchFiles();
        }
        setIsSubmitting(false);
      },
    });
  };

  const cancelFileForm = () => {
    setEditingFileId(null);
    setIsAddingFile(false);
    setFileForm(emptyFileForm);
  };

  // Integrated Order Handlers
  const handleEditOrder = (order: Order) => {
    setActionError(null);
    setSavedScrollPos(window.scrollY);
    setEditingOrderId(order.id);
    setIsAddingOrder(false);
    setOrderForm({
      user_id: order.user_id || '',
      visitor_id: order.visitor_id || '',
      stripe_session_id: order.stripe_session_id || '',
      currency: order.currency || 'USD',
      amount: order.total ?? order.amount ?? 0,
      download_count: order.download_count ?? 0,
      email: order.email || '',
      full_name: order.full_name || '',
      phone: order.phone || '',
      shipping_address: order.shipping_address || '',
      city: order.city || '',
      postal_code: order.postal_code || '',
      country: order.country || '',
      status: order.status || 'pending',
      coupon_code: order.coupon_code || '',
      discount_amount: order.discount_amount ?? '',
      notes: order.notes || '',
    });
  };

  const handleSaveOrder = () => {
    if (!editingOrderId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Save Order Status',
      message: 'Are you sure you want to update this order?',
      confirmText: 'Save Changes',
      confirmVariant: 'primary',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);

        const { error } = await supabase
          .from('orders')
          .update({
            status: orderForm.status,
            email: orderForm.email,
            full_name: orderForm.full_name,
            phone: orderForm.phone,
            shipping_address: orderForm.shipping_address,
            city: orderForm.city,
            postal_code: orderForm.postal_code,
            country: orderForm.country,
            total: orderForm.amount,
            notes: orderForm.notes,
          })
          .eq('id', editingOrderId);

        if (error) {
          setActionError(`Update Order Error: ${error.message}`);
        } else {
          await fetchOrdersAndItems();
          cancelOrderForm();
        }
        setIsSubmitting(false);
      },
    });
  };

  const handleDeleteOrder = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order',
      message: 'Are you sure you want to delete this order? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);

        await supabase.from('order_items').delete().eq('order_id', id);

        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) {
          setActionError(`Delete Order Error: ${error.message}`);
        } else {
          if (editingOrderId === id) cancelOrderForm();
          await fetchOrdersAndItems();
        }
        setIsSubmitting(false);
      },
    });
  };

  const handleDuplicateOrder = async (order: Order) => {
    setActionError(null);
    setIsSubmitting(true);

    const duplicatedPayload = {
      user_id: order.user_id || null,
      visitor_id: order.visitor_id || null,
      stripe_session_id: null,
      currency: order.currency || 'USD',
      total: order.total ?? order.amount ?? 0,
      download_count: order.download_count ?? 0,
      email: order.email || null,
      full_name: order.full_name || null,
      phone: order.phone || null,
      shipping_address: order.shipping_address || null,
      city: order.city || null,
      postal_code: order.postal_code || null,
      country: order.country || null,
      status: order.status || 'pending',
      coupon_code: order.coupon_code || null,
      discount_amount: order.discount_amount ?? 0,
      notes: order.notes || null,
    };

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([duplicatedPayload])
      .select()
      .single();

    if (orderError) {
      setActionError(`Duplicate Order Error: ${orderError.message}`);
      setIsSubmitting(false);
      return;
    }

    const currentItems = orderItemsByOrderId[order.id] || [];
    if (currentItems.length > 0 && newOrder) {
      const duplicatedItems = currentItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        thumbnail: item.thumbnail || item.image_url,
        unit_price: item.unit_price ?? item.price,
        quantity: item.quantity,
        color: item.color || item.selected_color,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(duplicatedItems);

      if (itemsError) {
        setActionError(`Duplicate Items Error: ${itemsError.message}`);
      }
    }

    await fetchOrdersAndItems();
    setIsSubmitting(false);
  };

  const cancelOrderForm = () => {
    setEditingOrderId(null);
    setIsAddingOrder(false);
    setOrderForm(emptyOrderForm);
  };

  // Message Handlers
  const handleDeleteMessage = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: async () => {
        closeConfirmModal();
        setActionError(null);
        setIsSubmitting(true);
        const { error } = await supabase.from('contact_messages').delete().eq('id', id);
        if (error) setActionError(`Delete Message Error: ${error.message}`);
        else {
          await fetchMessages();
        }
        setIsSubmitting(false);
      },
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-neutral-600 dark:text-neutral-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-neutral-900 dark:text-white" />
        <span>Verifying admin permissions...</span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          You must be signed in with an authorized administrator account to access this page.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      {mounted && confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-neutral-950/60 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={closeConfirmModal}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  confirmModal.confirmVariant === 'danger'
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header Banner */}
      <div className="pt-16 md:pt-20 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 md:pt-16 md:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Layers className="w-7 h-7 text-neutral-900 dark:text-white" />
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">Admin Panel</h1>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">
                Manage store analytics, database tables, orders, and digital assets
              </p>
            </div>

            {/* Custom Dropdown Menu */}
            <div className="relative w-full sm:w-auto min-w-[240px]" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 bg-white hover:bg-neutral-50 dark:bg-neutral-900/90 dark:hover:bg-neutral-900 text-neutral-900 dark:text-white font-medium px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm dark:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CurrentIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  <span className="text-sm">
                    {currentTab.label}
                    {currentTab.count !== null && ` (${currentTab.count})`}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 left-0 sm:left-auto sm:w-64 mt-2 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800/90 rounded-2xl shadow-xl dark:shadow-2xl py-2 z-50 divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden">
                  <div className="px-3.5 py-2">
                    <span className="text-[10px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase block">
                      Database Views
                    </span>
                  </div>

                  <div className="py-1">
                    {tabItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id as AdminTab);
                            setActionError(null);
                            setIsDropdownOpen(false);
                            navigate(TAB_ROUTES[item.id as AdminTab]);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm transition-colors text-left ${
                            isActive
                              ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-900 dark:text-white font-medium'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800/50 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.count !== null && (
                            <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {actionError && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 dark:text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 text-sm font-medium">
                <Calendar className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <span>Time Period:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'realtime', label: 'Realtime' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: '7days', label: 'Last 7 Days' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'year', label: 'Last Year' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTimeRange(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      timeRange === item.id
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingAnalytics ? (
              <div className="p-12 flex justify-center text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Supabase Analytics...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-xs uppercase font-medium tracking-wider">Unique Visitors</span>
                    <div className="p-2 bg-indigo-50 dark:bg-neutral-950 rounded-lg border border-indigo-100 dark:border-neutral-800">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{analytics.visitors.toLocaleString()}</div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Unique visitor sessions tracked via Supabase</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-xs uppercase font-medium tracking-wider">Page Views</span>
                    <div className="p-2 bg-cyan-50 dark:bg-neutral-950 rounded-lg border border-cyan-100 dark:border-neutral-800">
                      <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{analytics.pageViews.toLocaleString()}</div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Live view logs recorded in page_views</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-xs uppercase font-medium tracking-wider">Total Revenue</span>
                    <div className="p-2 bg-emerald-50 dark:bg-neutral-950 rounded-lg border border-emerald-100 dark:border-neutral-800">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">${analytics.revenue.toLocaleString()}</div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Sum of paid orders in selected period</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-xs uppercase font-medium tracking-wider">Paid Orders</span>
                    <div className="p-2 bg-amber-50 dark:bg-neutral-950 rounded-lg border border-amber-100 dark:border-neutral-800">
                      <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{analytics.paidOrders.toLocaleString()}</div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Successful database transaction rows</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-5 rounded-2xl space-y-3 sm:col-span-2 lg:col-span-1 shadow-sm">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span className="text-xs uppercase font-medium tracking-wider">Paying Buyers</span>
                    <div className="p-2 bg-purple-50 dark:bg-neutral-950 rounded-lg border border-purple-100 dark:border-neutral-800">
                      <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold">{analytics.payingBuyers.toLocaleString()}</div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Distinct customer accounts/visitors</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">public.products</h2>
              {!isAddingProduct && !editingProductId && (
                <button
                  onClick={() => { 
                    cancelProductForm(); 
                    setIsAddingProduct(true); 
                  }}
                  className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              )}
            </div>

            {(isAddingProduct || editingProductId) ? (
              <div id="edit-product-form" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 space-y-4 shadow-sm scroll-mt-24">
                <h3 className="text-lg font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  {isAddingProduct ? 'Create Product' : 'Edit Product'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editingProductId && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">ID (UUID)</label>
                      <input
                        type="text"
                        readOnly
                        value={editingProductId}
                        className="w-full bg-neutral-100 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800/80 rounded-lg px-3 py-2 text-base sm:text-sm font-mono text-neutral-500 dark:text-neutral-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">name</label>
                    <input
                      type="text"
                      value={productForm.name || ''}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">slug</label>
                    <input
                      type="text"
                      value={productForm.slug || ''}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">price</label>
                    <input
                      type="number"
                      placeholder="NULL"
                      value={productForm.price ?? ''}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">category</label>
                    <input
                      type="text"
                      value={productForm.category || ''}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">theme</label>
                    <input
                      type="text"
                      value={productForm.theme || ''}
                      onChange={(e) => setProductForm({ ...productForm, theme: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">piece_count</label>
                    <input
                      type="number"
                      placeholder="NULL"
                      value={productForm.piece_count ?? ''}
                      onChange={(e) => setProductForm({ ...productForm, piece_count: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">stock_quantity</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={productForm.stock_quantity ?? ''}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">image_url</label>
                    <input
                      type="text"
                      value={productForm.image_url || ''}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">section</label>
                    <input
                      type="text"
                      value={productForm.section || ''}
                      onChange={(e) => setProductForm({ ...productForm, section: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">description</label>
                    <textarea
                      rows={3}
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">gallery (Comma separated URLs)</label>
                    <input
                      type="text"
                      value={galleryInput}
                      onChange={(e) => setGalleryInput(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">colors (Comma separated names)</label>
                    <input
                      type="text"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="flex items-center gap-6 md:col-span-2 lg:col-span-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-0"
                      />
                      <span className="text-sm font-medium">featured</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.in_stock}
                        onChange={(e) => setProductForm({ ...productForm, in_stock: e.target.checked })}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-0"
                      />
                      <span className="text-sm font-medium">in_stock</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={cancelProductForm}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveProduct}
                    className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Product
                  </button>
                </div>
              </div>
            ) : loadingProducts ? (
              <div className="p-12 flex justify-center text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Products...
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                      <tr>
                        <th className="p-4 font-medium">Image</th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleProductSort('name')}>
                          <div className="flex items-center gap-1">Name / Slug <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleProductSort('price')}>
                          <div className="flex items-center gap-1">Price <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleProductSort('category')}>
                          <div className="flex items-center gap-1">Category <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleProductSort('stock_quantity')}>
                          <div className="flex items-center gap-1">Stock <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {sortedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-neutral-400" />
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-neutral-900 dark:text-white">{product.name}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">{product.slug}</div>
                          </td>
                          <td className="p-4 font-mono">
                            {product.price !== null ? `$${product.price.toFixed(2)}` : 'NULL'}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {product.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono">
                            {product.stock_quantity ?? 0}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDuplicateProduct(product)}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Duplicate Product"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Edit Product"
                              >
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-red-500 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* DIGITAL FILES TAB */}
        {activeTab === 'digital_files' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">public.digital_files</h2>
              {!isAddingFile && !editingFileId && (
                <button
                  onClick={() => {
                    cancelFileForm();
                    setIsAddingFile(true);
                  }}
                  className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Digital File
                </button>
              )}
            </div>

            {(isAddingFile || editingFileId) ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  {isAddingFile ? 'Create Digital File' : 'Edit Digital File'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Product</label>
                    <select
                      value={fileForm.product_id}
                      onChange={(e) => setFileForm({ ...fileForm, product_id: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    >
                      <option value="">Select a product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">file_name</label>
                    <input
                      type="text"
                      value={fileForm.file_name}
                      onChange={(e) => setFileForm({ ...fileForm, file_name: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">source_type</label>
                    <select
                      value={fileForm.source_type}
                      onChange={(e) => setFileForm({ ...fileForm, source_type: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    >
                      <option value="external_link">external_link</option>
                      <option value="storage_path">storage_path</option>
                    </select>
                  </div>

                  {fileForm.source_type === 'external_link' ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">external_url</label>
                      <input
                        type="text"
                        value={fileForm.external_url || ''}
                        onChange={(e) => setFileForm({ ...fileForm, external_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">file_path / Storage Upload</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fileForm.file_path || ''}
                          onChange={(e) => setFileForm({ ...fileForm, file_path: e.target.value })}
                          placeholder="digital-assets/filename.zip"
                          className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                        />
                        <label className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer text-xs font-semibold transition-colors">
                          {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>Upload File</span>
                          <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploadingFile} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={cancelFileForm}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveFile}
                    className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Digital File
                  </button>
                </div>
              </div>
            ) : loadingFiles ? (
              <div className="p-12 flex justify-center text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Digital Files...
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                      <tr>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleFileSort('file_name')}>
                          <div className="flex items-center gap-1">File Name <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleFileSort('product_id')}>
                          <div className="flex items-center gap-1">Product ID <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleFileSort('source_type')}>
                          <div className="flex items-center gap-1">Source <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {sortedFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4 font-semibold text-neutral-900 dark:text-white">
                            {f.file_name}
                          </td>
                          <td className="p-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                            {f.product_id}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {f.source_type}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs max-w-xs truncate text-neutral-500 dark:text-neutral-400">
                            {f.source_type === 'external_link' ? f.external_url : f.file_path}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleSecureDownload(f.source_type === 'external_link' ? (f.external_url || '') : (f.file_path || ''), f.file_name)}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Download / Test Link"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDuplicateFile(f)}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Duplicate File"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditFile(f)}
                                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                title="Edit File"
                              >
                                <PencilLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteFile(f.id)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-red-500 transition-colors"
                                title="Delete File"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">public.orders & order_items</h2>
            </div>

            {editingOrderId ? (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 space-y-4 shadow-sm">
                <h3 className="text-lg font-bold border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  Edit Order #{editingOrderId.slice(0, 8)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Status</label>
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="shipped">shipped</option>
                      <option value="done">done</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={orderForm.full_name}
                      onChange={(e) => setOrderForm({ ...orderForm, full_name: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Phone</label>
                    <input
                      type="text"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Total Amount ($)</label>
                    <input
                      type="number"
                      value={orderForm.amount}
                      onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Shipping Address</label>
                    <input
                      type="text"
                      value={orderForm.shipping_address}
                      onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs uppercase text-neutral-500 dark:text-neutral-400 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-base sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={cancelOrderForm}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSaveOrder}
                    className="flex items-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Order
                  </button>
                </div>
              </div>
            ) : loadingOrders ? (
              <div className="p-12 flex justify-center text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Orders & Items...
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                      <tr>
                        <th className="p-4 w-8"></th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleOrderSort('id')}>
                          <div className="flex items-center gap-1">Order ID <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleOrderSort('email')}>
                          <div className="flex items-center gap-1">Customer <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleOrderSort('status')}>
                          <div className="flex items-center gap-1">Status <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleOrderSort('total')}>
                          <div className="flex items-center gap-1">Total <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleOrderSort('created_at')}>
                          <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {sortedOrders.map((order) => {
                        const items = orderItemsByOrderId[order.id] || [];
                        const isExpanded = !!expandedOrders[order.id];

                        return (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                              <td className="p-4">
                                <button
                                  onClick={() => toggleOrderExpand(order.id)}
                                  className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors text-neutral-500"
                                >
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="p-4 font-mono font-semibold text-neutral-900 dark:text-white">
                                #{order.id.slice(0, 8)}
                              </td>
                              <td className="p-4">
                                <div className="font-semibold text-neutral-900 dark:text-white">{order.full_name || 'Guest'}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">{order.email}</div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                  order.status === 'paid' || order.status === 'done'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
                                    : order.status === 'shipped'
                                    ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400'
                                    : order.status === 'cancelled'
                                    ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400'
                                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
                                }`}>
                                  {order.status}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-semibold">
                                ${((order.total ?? order.amount ?? 0) / 100).toFixed(2)}
                              </td>
                              <td className="p-4 text-xs text-neutral-500 dark:text-neutral-400">
                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleDuplicateOrder(order)}
                                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    title="Duplicate Order"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditOrder(order)}
                                    className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                                    title="Edit Order"
                                  >
                                    <PencilLine className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-red-500 transition-colors"
                                    title="Delete Order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Collapsible Order Items Rows */}
                            {isExpanded && (
                              <tr className="bg-neutral-50/50 dark:bg-neutral-950/50">
                                <td colSpan={7} className="p-4 pl-12 border-b border-neutral-200 dark:border-neutral-800">
                                  <div className="space-y-3">
                                    <h4 className="text-xs font-semibold uppercase text-neutral-400 tracking-wider">
                                      Order Items ({items.length})
                                    </h4>
                                    {items.length === 0 ? (
                                      <p className="text-xs text-neutral-500 italic">No line items recorded for this order.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {items.map((item) => {
                                          const img = getItemImage(item);
                                          const price = item.unit_price ?? item.price ?? 0;
                                          return (
                                            <div key={item.id} className="flex items-center gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                              {img ? (
                                                <img src={img} alt={item.product_name || 'Item'} className="w-12 h-12 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800" />
                                              ) : (
                                                <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                                  <Package className="w-6 h-6 text-neutral-400" />
                                                </div>
                                              )}
                                              <div className="min-w-0 flex-1">
                                                <div className="text-sm font-semibold truncate text-neutral-900 dark:text-white">
                                                  {item.product_name || 'Product'}
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                                                  <span>Qty: {item.quantity}</span>
                                                  <span>•</span>
                                                  <span className="font-mono">${(price / 100).toFixed(2)}</span>
                                                  {(item.color || item.selected_color) && (
                                                    <>
                                                      <span>•</span>
                                                      <span className="capitalize">{item.color || item.selected_color}</span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">public.contact_messages</h2>
            </div>

            {loadingMessages ? (
              <div className="p-12 flex justify-center text-neutral-500 dark:text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Messages...
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                      <tr>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleMessageSort('name')}>
                          <div className="flex items-center gap-1">Sender <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleMessageSort('subject')}>
                          <div className="flex items-center gap-1">Subject <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium">Message</th>
                        <th className="p-4 font-medium cursor-pointer" onClick={() => handleMessageSort('created_at')}>
                          <div className="flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></div>
                        </th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {sortedMessages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-neutral-900 dark:text-white">{msg.name}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{msg.email}</div>
                          </td>
                          <td className="p-4 font-medium text-neutral-900 dark:text-white">
                            {msg.subject || 'No Subject'}
                          </td>
                          <td className="p-4 text-xs max-w-xs truncate text-neutral-600 dark:text-neutral-300">
                            {msg.message}
                          </td>
                          <td className="p-4 text-xs text-neutral-500 dark:text-neutral-400">
                            {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-red-500 transition-colors"
                              title="Delete Message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}