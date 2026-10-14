import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import bookService from '../../services/bookService';
import orderService from '../../services/orderService';
import categoryService from '../../services/categoryService';
import reviewService from '../../services/reviewService';
import couponService from '../../services/couponService';
import languageService from '../../services/languageService';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../utils/formatters';
import Modal from '../../components/Modal';
import BulkImportModal from '../../components/BulkImportModal';
import ExternalLookupModal from '../../components/ExternalLookupModal';
import CoverSelectorModal from '../../components/CoverSelectorModal';
import BookCover from '../../components/BookCover';
import CategoryIcon from '../../components/CategoryIcon';
import CatalogImportTab from '../../components/CatalogImportTab';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'orders' | 'inventory' | 'reviews' | 'coupons' | 'categories' | 'analytics'
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedBook, setSelectedBook] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showExternalLookupModal, setShowExternalLookupModal] = useState(false);
  const [showCoverSelectorModal, setShowCoverSelectorModal] = useState(false);
  const [coverSelectorTarget, setCoverSelectorTarget] = useState('new'); // 'new' | 'edit'
  const [showComicSection, setShowComicSection] = useState(false);
  const [customLangInput, setCustomLangInput] = useState('');
  const [showCustomLangInput, setShowCustomLangInput] = useState(false);
  const [editCustomLangInput, setEditCustomLangInput] = useState('');
  const [showEditCustomLangInput, setShowEditCustomLangInput] = useState(false);

  // Admin Books table search, filtering, and pagination
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookCategoryFilter, setBookCategoryFilter] = useState('ALL');
  const [bookPage, setBookPage] = useState(1);
  const BOOKS_PER_PAGE = 15;

  const filteredAdminBooks = useMemo(() => {
    return books.filter((b) => {
      const q = (bookSearchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q));
      const matchesCategory =
        bookCategoryFilter === 'ALL' ||
        (b.category && b.category.toLowerCase() === bookCategoryFilter.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [books, bookSearchQuery, bookCategoryFilter]);

  const totalAdminBookPages = Math.max(1, Math.ceil(filteredAdminBooks.length / BOOKS_PER_PAGE));
  const paginatedAdminBooks = useMemo(() => {
    const startIndex = (bookPage - 1) * BOOKS_PER_PAGE;
    return filteredAdminBooks.slice(startIndex, startIndex + BOOKS_PER_PAGE);
  }, [filteredAdminBooks, bookPage, BOOKS_PER_PAGE]);

  // Reset to page 1 if query/filter changes
  useEffect(() => {
    setBookPage(1);
  }, [bookSearchQuery, bookCategoryFilter]);

  const handleAddNewLanguage = async (name, target = 'new') => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    try {
      const code = cleanName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) || 'oth';
      const created = await languageService.create({ name: cleanName, code, nativeName: cleanName });
      setLanguages((prev) => [...prev, created]);
      if (target === 'new') {
        setNewBookForm((prev) => ({ ...prev, language: cleanName }));
        setShowCustomLangInput(false);
        setCustomLangInput('');
      } else {
        setEditBookForm((prev) => ({ ...prev, language: cleanName }));
        setShowEditCustomLangInput(false);
        setEditCustomLangInput('');
      }
      toast.success(`Language "${cleanName}" registered in MySQL and selected!`);
    } catch (err) {
      if (target === 'new') {
        setNewBookForm((prev) => ({ ...prev, language: cleanName }));
        setShowCustomLangInput(false);
      } else {
        setEditBookForm((prev) => ({ ...prev, language: cleanName }));
        setShowEditCustomLangInput(false);
      }
      toast.info(`Language set to "${cleanName}"`);
    }
  };

  // New book form state
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    subtitle: '',
    author: '',
    isbn: '',
    price: '',
    originalPrice: '',
    discount: '',
    stock: '50',
    categoryId: '',
    coverUrl: '',
    shortDescription: '',
    description: '',
    language: 'English',
    format: 'Paperback',
    genre: '',
    publisher: '',
    publishDate: '',
    edition: '',
    pages: '320',
    isFeatured: false,
    isBestseller: false,
    isNewArrival: true,
    // Comic & Manga
    seriesName: '',
    volumeNumber: '',
    issueNumber: '',
    illustrator: '',
    artist: '',
    publisherImprint: '',
    readingDirection: 'Left-to-Right',
    ageRecommendation: '',
  });

  // Edit book form state
  const [editBookForm, setEditBookForm] = useState({
    title: '',
    author: '',
    categoryId: '',
    language: 'English',
    format: 'Paperback',
    price: '',
    stock: '',
    coverUrl: '',
  });

  // New Coupon form state
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrderValue: '500',
    maxDiscount: '300',
    usageLimit: '100',
  });

  // New Category form state
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📚',
  });

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [booksData, ordersData, catsData, reviewsData, couponsData, langsData] = await Promise.allSettled([
        bookService.getAll(),
        orderService.getAllOrders(),
        categoryService.getAll(),
        reviewService.getAllReviews(),
        couponService.getAllCoupons(),
        languageService.getAll(),
      ]);

      if (booksData.status === 'fulfilled') setBooks(booksData.value || []);
      if (ordersData.status === 'fulfilled') setOrders(Array.isArray(ordersData.value) ? ordersData.value : []);
      if (catsData.status === 'fulfilled') {
        const cats = catsData.value || [];
        setCategories(cats);
        if (cats.length > 0 && !newBookForm.categoryId) {
          setNewBookForm((prev) => ({ ...prev, categoryId: cats[0].id }));
        }
      }
      if (reviewsData.status === 'fulfilled') setReviews(Array.isArray(reviewsData.value) ? reviewsData.value : []);
      if (couponsData.status === 'fulfilled') setCoupons(Array.isArray(couponsData.value) ? couponsData.value : []);
      if (langsData.status === 'fulfilled') setLanguages(langsData.value || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculation
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length;
  const totalBooks = books.length;
  const lowStockBooks = books.filter((b) => (b.stock !== undefined ? b.stock <= 10 : false));
  const reportedReviews = reviews.filter((r) => r.reported);

  const stats = [
    {
      label: 'Total Revenue',
      value: formatPrice(totalRevenue),
      change: '+14.2%',
      positive: true,
      icon: '💰',
      iconBg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      change: '+8.1%',
      positive: true,
      icon: '📦',
      iconBg: 'rgba(99, 102, 241, 0.15)',
    },
    {
      label: 'Total Books',
      value: totalBooks,
      change: `+${books.length} active`,
      positive: true,
      icon: '📚',
      iconBg: 'rgba(6, 182, 212, 0.15)',
    },
    {
      label: 'Low Stock Alerts',
      value: lowStockBooks.length,
      change: lowStockBooks.length > 0 ? 'Action needed' : 'All good',
      positive: lowStockBooks.length === 0,
      icon: '⚠️',
      iconBg: 'rgba(239, 68, 68, 0.15)',
    },
  ];

  // Book Handlers
  const handleOpenEdit = (b) => {
    setSelectedBook(b);
    setEditBookForm({
      title: b.title || '',
      author: b.author || '',
      categoryId: b.categoryId || (b.category?.id || categories[0]?.id || 1),
      language: b.language || 'English',
      format: b.format || 'Paperback',
      price: b.price !== undefined ? b.price : '',
      stock: b.stock !== undefined ? b.stock : '',
      coverUrl: b.coverUrl || b.cover || '',
    });
    setShowEditModal(true);
  };

  const handleCoverSelected = (coverUrl, metadata) => {
    if (coverSelectorTarget === 'new') {
      setNewBookForm((prev) => ({
        ...prev,
        coverUrl: coverUrl,
        ...(metadata?.publisher && !prev.publisher ? { publisher: metadata.publisher } : {}),
        ...(metadata?.publishDate && !prev.publishDate ? { publishDate: metadata.publishDate } : {}),
        ...(metadata?.pages && !prev.pages ? { pages: metadata.pages } : {}),
        ...(metadata?.isbn && !prev.isbn ? { isbn: metadata.isbn } : {}),
      }));
    } else {
      setEditBookForm((prev) => ({
        ...prev,
        coverUrl: coverUrl,
      }));
    }
  };

  const handleOpenDelete = (b) => {
    setSelectedBook(b);
    setShowDeleteModal(true);
  };

  const handlePreFillFromExternal = (extBook) => {
    let catId = categories[0]?.id || 1;
    if (extBook.category) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === extBook.category.toLowerCase()
      );
      if (match) catId = match.id;
    }

    setNewBookForm((prev) => ({
      ...prev,
      title: extBook.title || '',
      subtitle: extBook.subtitle || '',
      author: extBook.author || '',
      isbn: extBook.isbn || '',
      price: extBook.price ? String(extBook.price) : '599',
      originalPrice: extBook.originalPrice ? String(extBook.originalPrice) : '799',
      stock: extBook.stock ? String(extBook.stock) : '50',
      categoryId: catId,
      coverUrl: extBook.coverUrl || '',
      description: extBook.description || '',
      shortDescription: extBook.description ? extBook.description.slice(0, 160) : '',
      language: extBook.language || 'English',
      format: extBook.format || 'Paperback',
      publisher: extBook.publisher || '',
      publishDate: extBook.publishDate || '',
      pages: extBook.pages ? String(extBook.pages) : '320',
    }));

    setShowAddModal(true);
  };

  const handleAddBook = async (e) => {
    if (e) e.preventDefault();

    if (!newBookForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!newBookForm.author.trim()) {
      toast.error('Author is required');
      return;
    }
    const numPrice = parseFloat(newBookForm.price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Please enter a valid non-negative price');
      return;
    }
    const numStock = parseInt(newBookForm.stock);
    if (isNaN(numStock) || numStock < 0) {
      toast.error('Please enter a valid stock quantity');
      return;
    }

    try {
      const payload = {
        title: newBookForm.title.trim(),
        subtitle: newBookForm.subtitle?.trim() || null,
        author: newBookForm.author.trim(),
        isbn: newBookForm.isbn?.trim() || null,
        price: numPrice,
        originalPrice: newBookForm.originalPrice ? parseFloat(newBookForm.originalPrice) : numPrice * 1.25,
        discount: newBookForm.discount ? parseFloat(newBookForm.discount) : 0,
        stock: numStock,
        category: { id: parseInt(newBookForm.categoryId) || (categories[0]?.id || 1) },
        coverUrl: newBookForm.coverUrl?.trim() || null,
        shortDescription: newBookForm.shortDescription?.trim() || null,
        description: newBookForm.description?.trim() || null,
        language: newBookForm.language || 'English',
        format: newBookForm.format || 'Paperback',
        genre: newBookForm.genre?.trim() || null,
        publisher: newBookForm.publisher?.trim() || null,
        publishDate: newBookForm.publishDate?.trim() || null,
        edition: newBookForm.edition?.trim() || null,
        pages: parseInt(newBookForm.pages) || 320,
        isFeatured: Boolean(newBookForm.isFeatured),
        isBestseller: Boolean(newBookForm.isBestseller),
        isNewArrival: Boolean(newBookForm.isNewArrival),

        // Comic & Manga
        seriesName: newBookForm.seriesName?.trim() || null,
        volumeNumber: newBookForm.volumeNumber?.trim() || null,
        issueNumber: newBookForm.issueNumber?.trim() || null,
        illustrator: newBookForm.illustrator?.trim() || null,
        artist: newBookForm.artist?.trim() || null,
        publisherImprint: newBookForm.publisherImprint?.trim() || null,
        readingDirection: newBookForm.readingDirection || 'Left-to-Right',
        ageRecommendation: newBookForm.ageRecommendation?.trim() || null,
      };

      await bookService.create(payload);
      toast.success(`Book "${payload.title}" saved to MySQL successfully!`);
      setShowAddModal(false);
      setNewBookForm({
        title: '',
        subtitle: '',
        author: '',
        isbn: '',
        price: '',
        originalPrice: '',
        discount: '',
        stock: '50',
        categoryId: categories[0]?.id || '',
        coverUrl: '',
        shortDescription: '',
        description: '',
        language: 'English',
        format: 'Paperback',
        genre: '',
        publisher: '',
        publishDate: '',
        edition: '',
        pages: '320',
        isFeatured: false,
        isBestseller: false,
        isNewArrival: true,
        seriesName: '',
        volumeNumber: '',
        issueNumber: '',
        illustrator: '',
        artist: '',
        publisherImprint: '',
        readingDirection: 'Left-to-Right',
        ageRecommendation: '',
      });
      loadData();
    } catch (err) {
      console.error('Failed to create book:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error('Failed to create book: ' + msg);
    }
  };

  const handleUpdateBook = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBook) return;
    try {
      const payload = {
        ...selectedBook,
        title: editBookForm.title.trim(),
        author: editBookForm.author?.trim() || selectedBook.author,
        category: { id: parseInt(editBookForm.categoryId) || (selectedBook.categoryId || 1) },
        language: editBookForm.language || 'English',
        format: editBookForm.format || 'Paperback',
        price: parseFloat(editBookForm.price),
        stock: parseInt(editBookForm.stock),
        coverUrl: editBookForm.coverUrl?.trim() || null,
      };
      await bookService.update(selectedBook.id, payload);
      toast.success(`Book "${payload.title}" updated successfully in MySQL!`);
      setShowEditModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to update book:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error('Failed to update book: ' + msg);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    try {
      await bookService.delete(selectedBook.id);
      toast.success('Book deleted successfully');
      setShowDeleteModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to delete book');
    }
  };

  const handleQuickRestock = async (book, addedQty = 25) => {
    try {
      const payload = {
        ...book,
        stock: (book.stock || 0) + addedQty,
      };
      await bookService.update(book.id, payload);
      toast.success(`Restocked ${addedQty} copies for "${book.title}"`);
      loadData();
    } catch (err) {
      toast.error('Failed to restock book');
    }
  };

  // Order status update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  // Review deletion
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      toast.success('Review removed by moderator');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      toast.error('Failed to remove review');
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      await couponService.createCoupon({
        code: newCouponForm.code.toUpperCase().trim(),
        type: newCouponForm.type,
        value: parseFloat(newCouponForm.value),
        minOrderValue: parseFloat(newCouponForm.minOrderValue) || 0,
        maxDiscount: newCouponForm.maxDiscount ? parseFloat(newCouponForm.maxDiscount) : null,
        usageLimit: newCouponForm.usageLimit ? parseInt(newCouponForm.usageLimit) : null,
        isActive: true,
      });
      toast.success(`Coupon ${newCouponForm.code.toUpperCase()} created!`);
      setShowAddCouponModal(false);
      setNewCouponForm({
        code: '',
        type: 'percentage',
        value: '',
        minOrderValue: '500',
        maxDiscount: '300',
        usageLimit: '100',
      });
      loadData();
    } catch (err) {
      toast.error('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      await couponService.deleteCoupon(couponId);
      toast.success('Coupon removed');
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  // Category Handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const slug = newCategoryForm.slug || newCategoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await categoryService.create({
        name: newCategoryForm.name,
        slug,
        description: newCategoryForm.description,
        icon: newCategoryForm.icon || '📖',
      });
      toast.success('Category created successfully!');
      setShowAddCategoryModal(false);
      setNewCategoryForm({ name: '', slug: '', description: '', icon: '📖' });
      loadData();
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    const map = {
      DELIVERED: 'badge-success',
      SHIPPED: 'badge-info',
      PROCESSING: 'badge-warning',
      PENDING: 'badge-purple',
      CANCELLED: 'badge-danger',
    };
    return (
      <span className={`badge ${map[s] || 'badge-info'}`}>
        {s.charAt(0) + s.slice(1).toLowerCase()}
      </span>
    );
  };

  // Dynamic Chart Data
  const monthlyRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const monthlyOrders = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  orders.forEach((o) => {
    const d = new Date(o.createdAt || o.orderDate || Date.now());
    const m = d.getMonth();
    monthlyRevenue[m] += Number(o.total || 0);
    monthlyOrders[m] += 1;
  });

  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: monthlyRevenue.some((v) => v > 0) ? monthlyRevenue : [12000, 18500, 24000, 31000, 28000, 42000, 48000, 52000, 61000, 75000, 89000, 102000],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#8b5cf6',
      },
    ],
  };

  const doughnutChartData = {
    labels: categories.slice(0, 6).map((c) => c.name),
    datasets: [
      {
        data: categories.slice(0, 6).map((_, i) => [35, 25, 18, 12, 10, 8][i] || 10),
        backgroundColor: ['#8b5cf6', '#06b6d4', '#3b82f6', '#ec4899', '#f59e0b', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Orders',
        data: monthlyOrders.some((v) => v > 0) ? monthlyOrders : [15, 22, 28, 35, 30, 48, 52, 58, 65, 72, 85, 96],
        backgroundColor: 'rgba(6, 182, 212, 0.6)',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  return (
    <div className="container admin-dashboard" style={{ paddingTop: 'calc(var(--nav-height) + 24px)', paddingBottom: '80px' }}>
      {/* Admin Header */}
      <div className="admin-header">
        <div className="admin-header-titles">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
            📊 Admin <span className="text-gradient">Dashboard</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Store operations, inventory alerts, orders, coupons, and content moderation
          </p>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={loadData} title="Reload live data">
            🔄 Refresh
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ border: '1px solid var(--accent, #a855f7)', color: 'var(--accent, #a855f7)' }}
            onClick={() => setShowExternalLookupModal(true)}
          >
            🔍 External Catalog Lookup
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ border: '1px solid #10b981', color: '#10b981' }}
            onClick={() => setShowBulkImportModal(true)}
          >
            📥 Bulk CSV Import
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add New Book
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-stats admin-stats-grid" id="statsCards">
        {stats.map((s, i) => (
          <div key={i} className="stat-card animate-fade-up">
            <div className="stat-icon" style={{ background: s.iconBg }}>
              {s.icon}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.label}</p>
            <h3>{s.value}</h3>
            <span className={`stat-change ${s.positive ? 'positive' : 'negative'}`}>
              {s.change}
            </span>
          </div>
        ))}
      </div>

      {/* Tabs Menu */}
      <div className="admin-tabs-bar">
        <button
          className={`btn ${activeTab === 'books' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('books')}
        >
          📚 Books ({books.length})
        </button>
        <button
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders ({orders.length})
        </button>
        <button
          className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('inventory')}
          style={{ position: 'relative' }}
        >
          ⚠️ Low Stock Alerts
          {lowStockBooks.length > 0 && (
            <span
              style={{
                marginLeft: '6px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {lowStockBooks.length}
            </span>
          )}
        </button>
        <button
          className={`btn ${activeTab === 'reviews' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('reviews')}
        >
          💬 Reviews ({reviews.length})
        </button>
        <button
          className={`btn ${activeTab === 'coupons' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('coupons')}
        >
          🏷️ Coupons ({coupons.length})
        </button>
        <button
          className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('categories')}
        >
          📂 Categories ({categories.length})
        </button>
        <button
          className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button
          className={`btn ${activeTab === 'catalogImport' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('catalogImport')}
          style={{
            border: activeTab === 'catalogImport' ? 'none' : '1px solid #10b981',
            color: activeTab === 'catalogImport' ? '#fff' : '#10b981',
            fontWeight: 600,
          }}
        >
          🌐 Global Catalog Import
        </button>
      </div>

      {/* Tab Contents */}
      <div id="adminContent">
        {/* BOOKS TAB */}
        {activeTab === 'books' && (
          <div className="admin-books-section">
            {/* Books Toolbar */}
            <div className="admin-books-toolbar">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="🔍 Search by title, author, or ISBN..."
                  value={bookSearchQuery}
                  onChange={(e) => setBookSearchQuery(e.target.value)}
                  style={{ maxWidth: '320px', minWidth: '220px', padding: '8px 14px', fontSize: '0.85rem' }}
                />
                <select
                  className="form-input"
                  value={bookCategoryFilter}
                  onChange={(e) => setBookCategoryFilter(e.target.value)}
                  style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <option value="ALL">All Categories ({books.length})</option>
                  {categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {(bookSearchQuery || bookCategoryFilter !== 'ALL') && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setBookSearchQuery('');
                      setBookCategoryFilter('ALL');
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    ✕ Clear Filters
                  </button>
                )}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Showing <strong>{filteredAdminBooks.length > 0 ? (bookPage - 1) * BOOKS_PER_PAGE + 1 : 0}</strong>–
                <strong>{Math.min(bookPage * BOOKS_PER_PAGE, filteredAdminBooks.length)}</strong> of{' '}
                <strong>{filteredAdminBooks.length}</strong> books
              </div>
            </div>

            {/* Table in dedicated horizontal scrolling container */}
            <div className="admin-table-wrapper">
              <table className="data-table admin-books-table">
                <thead>
                  <tr>
                    <th className="col-cover">Cover</th>
                    <th className="col-title">Title & Subtitle</th>
                    <th className="col-author">Author</th>
                    <th>Language</th>
                    <th>Format</th>
                    <th>Category</th>
                    <th className="col-nowrap">Price</th>
                    <th>Stock</th>
                    <th className="col-nowrap">ISBN</th>
                    <th className="col-nowrap">Rating</th>
                    <th className="col-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAdminBooks.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No books found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAdminBooks.map((b) => (
                      <tr key={b.id}>
                        <td className="col-cover">
                          <div className="admin-cover-box">
                            <BookCover
                              src={b.coverUrl || b.cover}
                              title={b.title}
                              author={b.author}
                              size="sm"
                              fit="cover"
                              className="book-cover"
                            />
                          </div>
                        </td>
                        <td className="col-title">
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{b.title}</strong>
                          {b.subtitle && (
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {b.subtitle}
                            </span>
                          )}
                          {b.seriesName && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--accent, #a855f7)' }}>
                              Series: {b.seriesName} {b.volumeNumber ? `(Vol. ${b.volumeNumber})` : ''}
                            </span>
                          )}
                        </td>
                        <td className="col-author" style={{ color: 'var(--text-secondary)' }}>
                          {b.author}
                        </td>
                        <td>
                          <span className="badge badge-purple">{b.language || 'English'}</span>
                        </td>
                        <td>
                          <span className="badge badge-secondary">{b.format || 'Paperback'}</span>
                        </td>
                        <td>
                          <span className="badge badge-purple">{b.category || 'General'}</span>
                        </td>
                        <td className="col-nowrap" style={{ fontWeight: 600 }}>
                          {formatPrice(b.price)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              b.stock > 20
                                ? 'badge-success'
                                : b.stock > 0
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {b.stock}
                          </span>
                        </td>
                        <td
                          className="col-nowrap"
                          style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}
                        >
                          {b.isbn || '—'}
                        </td>
                        <td className="col-nowrap">★ {Number(b.rating || 0).toFixed(1)}</td>
                        <td className="col-nowrap">
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(b)}
                              title="Edit Book"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleOpenDelete(b)}
                              title="Delete Book"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalAdminBookPages > 1 && (
              <div className="admin-pagination">
                <div className="admin-pagination-info">
                  Page <strong>{bookPage}</strong> of <strong>{totalAdminBookPages}</strong> (
                  {filteredAdminBooks.length} books total)
                </div>
                <div className="admin-pagination-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={bookPage <= 1}
                    onClick={() => setBookPage(1)}
                    title="First page"
                  >
                    «
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={bookPage <= 1}
                    onClick={() => setBookPage((p) => Math.max(1, p - 1))}
                  >
                    ‹ Prev
                  </button>
                  {Array.from({ length: totalAdminBookPages }, (_, idx) => idx + 1)
                    .filter((p) => p === 1 || p === totalAdminBookPages || Math.abs(p - bookPage) <= 2)
                    .map((p, i, arr) => {
                      const prevPage = arr[i - 1];
                      return (
                        <React.Fragment key={p}>
                          {prevPage && p - prevPage > 1 && (
                            <span style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                          )}
                          <button
                            className={`btn ${bookPage === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setBookPage(p)}
                            style={{ minWidth: '34px', padding: '6px 10px' }}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={bookPage >= totalAdminBookPages}
                    onClick={() => setBookPage((p) => Math.min(totalAdminBookPages, p + 1))}
                  >
                    Next ›
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={bookPage >= totalAdminBookPages}
                    onClick={() => setBookPage(totalAdminBookPages)}
                    title="Last page"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="admin-table-wrapper">
            {orders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No customer orders placed yet.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id || o.orderNumber}>
                      <td>
                        <strong>{o.orderNumber || 'BV-' + o.id}</strong>
                      </td>
                      <td>{o.shippingName || o.user?.fullName || 'Guest Reader'}</td>
                      <td>
                        {new Date(o.orderDate || o.createdAt || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{o.items?.length || 1} items</td>
                      <td style={{ fontWeight: 600 }}>{formatPrice(o.total)}</td>
                      <td>{getStatusBadge(o.status)}</td>
                      <td>
                        <select
                          className="form-input"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.8rem',
                            width: 'auto',
                            cursor: 'pointer',
                          }}
                          value={(o.status || 'PENDING').toUpperCase()}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* INVENTORY ALERTS TAB */}
        {activeTab === 'inventory' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="flex-between mb-3">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>⚠️ Low Stock & Depleted Inventory</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Books with 10 or fewer copies remaining that require warehouse replenishment
                </p>
              </div>
            </div>

            {lowStockBooks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#10b981' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                <h4>All Books Are Well Stocked!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No titles currently below the 10-unit replenishment threshold.</p>
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="data-table admin-books-table">
                  <thead>
                    <tr>
                      <th className="col-cover">Cover</th>
                      <th className="col-title">Title</th>
                      <th className="col-author">Author</th>
                      <th>Category</th>
                      <th className="col-nowrap">Price</th>
                      <th>Remaining Stock</th>
                      <th className="col-nowrap">Replenishment Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockBooks.map((b) => (
                      <tr key={'alert-' + b.id}>
                        <td className="col-cover">
                          <div className="admin-cover-box">
                            <BookCover
                              src={b.coverUrl || b.cover}
                              title={b.title}
                              author={b.author}
                              size="sm"
                              fit="cover"
                              className="book-cover"
                            />
                          </div>
                        </td>
                        <td>
                          <strong>{b.title}</strong>
                        </td>
                        <td>{b.author}</td>
                        <td>
                          <span className="badge badge-purple">{b.category || 'General'}</span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatPrice(b.price)}</td>
                        <td>
                          <span className="badge badge-danger" style={{ fontWeight: 700 }}>
                            {b.stock} units left
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleQuickRestock(b, 25)}
                          >
                            ⚡ Quick Restock (+25)
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* REVIEWS MODERATION TAB */}
        {activeTab === 'reviews' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="flex-between mb-3">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>💬 Customer Reviews & Content Moderation</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Review reader submissions, inspect flagged/reported reviews, and manage content integrity
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No reviews found to moderate.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Reviewer</th>
                      <th>Rating</th>
                      <th>Title & Body</th>
                      <th>Status</th>
                      <th>Helpful</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((rev) => (
                      <tr key={rev.id}>
                        <td>
                          <strong>{rev.book?.title || 'Book #' + rev.bookId}</strong>
                        </td>
                        <td>{rev.user?.fullName || 'Verified Reader'}</td>
                        <td>★ {rev.rating}</td>
                        <td style={{ maxWidth: '350px' }}>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{rev.title}</strong>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rev.body}</span>
                        </td>
                        <td>
                          {rev.reported ? (
                            <span className="badge badge-danger">🚩 Flagged</span>
                          ) : (
                            <span className="badge badge-success">✓ Approved</span>
                          )}
                        </td>
                        <td>👍 {rev.helpfulCount || 0}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Delete this review"
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="flex-between mb-3">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🏷️ Discount Coupons & Promotions</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Create promo codes, set minimum order requirements, and configure discounts
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddCouponModal(true)}
              >
                + Create Coupon
              </button>
            </div>

            {coupons.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active promo coupons. Click above to create one.
              </div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Type</th>
                      <th>Discount</th>
                      <th>Min Order</th>
                      <th>Max Discount</th>
                      <th>Used Count</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong style={{ letterSpacing: '1px', color: 'var(--primary, #6366f1)' }}>
                            🏷️ {c.code}
                          </strong>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                        <td style={{ fontWeight: 600 }}>
                          {c.type === 'percentage' ? `${c.value}% OFF` : formatPrice(c.value) + ' OFF'}
                        </td>
                        <td>{formatPrice(c.minOrderValue || 0)}</td>
                        <td>{c.maxDiscount ? formatPrice(c.maxDiscount) : 'None'}</td>
                        <td>{c.usedCount || 0} / {c.usageLimit || '∞'}</td>
                        <td>
                          <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteCoupon(c.id)}
                            title="Delete coupon"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="flex-between mb-3">
              <div>
                <h3 style={{ margin: 0 }}>Manage Categories</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Genres and classifications for catalog discovery
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddCategoryModal(true)}
              >
                + Add Category
              </button>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ color: 'var(--accent, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                    <CategoryIcon name={c.name} icon={c.icon} size={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{c.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      slug: /{c.slug}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '24px',
              }}
            >
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>📈 Monthly Sales Performance</h3>
                <div style={{ height: '300px' }}>
                  <Line data={lineChartData} options={chartOptions} />
                </div>
              </div>
              <div className="glass-card" style={{ padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>📊 Order Volume Trends</h3>
                <div style={{ height: '300px' }}>
                  <Bar data={barChartData} options={chartOptions} />
                </div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>🏆 Top Selling Titles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {books.slice(0, 5).map((b, i) => (
                  <div
                    key={b.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: 700, width: '20px', color: 'var(--text-muted)' }}>
                        #{i + 1}
                      </span>
                      <div>
                        <strong>{b.title}</strong>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {b.author}</p>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, color: 'var(--primary, #6366f1)' }}>
                      {formatPrice(b.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATALOG IMPORT TAB */}
        {activeTab === 'catalogImport' && (
          <CatalogImportTab
            categories={categories}
            languages={languages}
            onBooksUpdated={loadData}
          />
        )}
      </div>

      {/* Add Book Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Book to Catalog"
        maxWidth="750px"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddBook}>
              Save Book to MySQL
            </button>
          </>
        }
      >
        <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Title & Subtitle */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Book Title *</label>
              <input
                className="form-input"
                placeholder="e.g. Godan, Atomic Habits, One Piece..."
                value={newBookForm.title}
                onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Subtitle</label>
              <input
                className="form-input"
                placeholder="Optional subtitle"
                value={newBookForm.subtitle}
                onChange={(e) => setNewBookForm({ ...newBookForm, subtitle: e.target.value })}
              />
            </div>
          </div>

          {/* Row 2: Author, ISBN, Language */}
          <div className="form-row">
            <div className="form-group">
              <label>Author *</label>
              <input
                className="form-input"
                placeholder="Author name"
                value={newBookForm.author}
                onChange={(e) => setNewBookForm({ ...newBookForm, author: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>ISBN (10 or 13)</label>
              <input
                className="form-input"
                placeholder="e.g. 9780132350884"
                value={newBookForm.isbn}
                onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
              />
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Language *</label>
                <button
                  type="button"
                  onClick={() => setShowCustomLangInput(!showCustomLangInput)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent, #8b5cf6)', fontSize: '0.76rem', cursor: 'pointer', padding: 0 }}
                >
                  {showCustomLangInput ? 'Select from list' : '+ Add New Language'}
                </button>
              </div>
              {!showCustomLangInput ? (
                <select
                  className="form-input"
                  value={newBookForm.language}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomLangInput(true);
                    } else {
                      setNewBookForm({ ...newBookForm, language: e.target.value });
                    }
                  }}
                >
                  {languages.length > 0 ? (
                    languages.map((l) => (
                      <option key={l.code || l.name} value={l.name}>
                        {l.name} {l.nativeName ? `(${l.nativeName})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Spanish">Spanish (Español)</option>
                      <option value="Japanese">Japanese (日本語)</option>
                    </>
                  )}
                  <option value="__custom__">+ Add Custom Language...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    className="form-input"
                    placeholder="e.g. Sindhi, Maithili, Swedish..."
                    value={customLangInput}
                    onChange={(e) => setCustomLangInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap', padding: '6px 12px' }}
                    onClick={() => handleAddNewLanguage(customLangInput, 'new')}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Category, Format, Genre */}
          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                className="form-input"
                value={newBookForm.categoryId}
                onChange={(e) => setNewBookForm({ ...newBookForm, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Book Format</label>
              <select
                className="form-input"
                value={newBookForm.format}
                onChange={(e) => setNewBookForm({ ...newBookForm, format: e.target.value })}
              >
                <option value="Paperback">Paperback</option>
                <option value="Hardcover">Hardcover</option>
                <option value="Manga">Manga</option>
                <option value="Comic">Comic Book</option>
                <option value="Graphic Novel">Graphic Novel</option>
                <option value="Textbook">Textbook</option>
                <option value="Audiobook">Audiobook</option>
                <option value="eBook">eBook</option>
              </select>
            </div>
            <div className="form-group">
              <label>Genre / Sub-category</label>
              <input
                className="form-input"
                placeholder="e.g. Shonen, Classic, Self-Help..."
                value={newBookForm.genre}
                onChange={(e) => setNewBookForm({ ...newBookForm, genre: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4: Pricing and Stock */}
          <div className="form-row">
            <div className="form-group">
              <label>Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={newBookForm.price}
                onChange={(e) => setNewBookForm({ ...newBookForm, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Original / MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="Optional MRP"
                value={newBookForm.originalPrice}
                onChange={(e) => setNewBookForm({ ...newBookForm, originalPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity *</label>
              <input
                type="number"
                className="form-input"
                placeholder="50"
                value={newBookForm.stock}
                onChange={(e) => setNewBookForm({ ...newBookForm, stock: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Row 5: Publisher, Publication Date, Pages, Edition */}
          <div className="form-row">
            <div className="form-group">
              <label>Publisher</label>
              <input
                className="form-input"
                placeholder="Publisher name"
                value={newBookForm.publisher}
                onChange={(e) => setNewBookForm({ ...newBookForm, publisher: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Publish Date</label>
              <input
                type="date"
                className="form-input"
                value={newBookForm.publishDate}
                onChange={(e) => setNewBookForm({ ...newBookForm, publishDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Pages</label>
              <input
                type="number"
                className="form-input"
                placeholder="320"
                value={newBookForm.pages}
                onChange={(e) => setNewBookForm({ ...newBookForm, pages: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Edition</label>
              <input
                className="form-input"
                placeholder="e.g. 1st, Special Edition"
                value={newBookForm.edition}
                onChange={(e) => setNewBookForm({ ...newBookForm, edition: e.target.value })}
              />
            </div>
          </div>

          {/* Badges / Status Toggles */}
          <div style={{ display: 'flex', gap: '20px', padding: '8px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={newBookForm.isFeatured}
                onChange={(e) => setNewBookForm({ ...newBookForm, isFeatured: e.target.checked })}
              />
              <span>⭐ Featured Book</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={newBookForm.isBestseller}
                onChange={(e) => setNewBookForm({ ...newBookForm, isBestseller: e.target.checked })}
              />
              <span>🏆 Bestseller</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={newBookForm.isNewArrival}
                onChange={(e) => setNewBookForm({ ...newBookForm, isNewArrival: e.target.checked })}
              />
              <span>✨ New Arrival</span>
            </label>
          </div>

          {/* Comic & Manga Collapsible Section */}
          <div
            style={{
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255,255,255,0.02)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setShowComicSection(!showComicSection)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              <span>🎨 Comic, Manga & Graphic Novel Specifications (Optional)</span>
              <span>{showComicSection ? '▲' : '▼'}</span>
            </button>
            {showComicSection && (
              <div style={{ padding: '14px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Series Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. One Piece, Chacha Chaudhary, Batman"
                      value={newBookForm.seriesName}
                      onChange={(e) => setNewBookForm({ ...newBookForm, seriesName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Volume Number</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Vol. 1"
                      value={newBookForm.volumeNumber}
                      onChange={(e) => setNewBookForm({ ...newBookForm, volumeNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Issue Number</label>
                    <input
                      className="form-input"
                      placeholder="e.g. #102"
                      value={newBookForm.issueNumber}
                      onChange={(e) => setNewBookForm({ ...newBookForm, issueNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Illustrator / Penciller</label>
                    <input
                      className="form-input"
                      placeholder="Illustrator name"
                      value={newBookForm.illustrator}
                      onChange={(e) => setNewBookForm({ ...newBookForm, illustrator: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cover Artist</label>
                    <input
                      className="form-input"
                      placeholder="Artist name"
                      value={newBookForm.artist}
                      onChange={(e) => setNewBookForm({ ...newBookForm, artist: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Reading Direction</label>
                    <select
                      className="form-input"
                      value={newBookForm.readingDirection}
                      onChange={(e) => setNewBookForm({ ...newBookForm, readingDirection: e.target.value })}
                    >
                      <option value="Left-to-Right">Left-to-Right (Standard)</option>
                      <option value="Right-to-Left">Right-to-Left (Manga style)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Age Recommendation</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Teen 13+, All Ages"
                      value={newBookForm.ageRecommendation}
                      onChange={(e) => setNewBookForm({ ...newBookForm, ageRecommendation: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cover URL with Search Cover action & Live Preview */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Cover Image</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 12px', fontSize: '0.78rem', border: '1px solid var(--accent, #8b5cf6)', color: 'var(--accent, #8b5cf6)' }}
                onClick={() => {
                  setCoverSelectorTarget('new');
                  setShowCoverSelectorModal(true);
                }}
              >
                🔍 Search & Pick Cover / Upload
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '68px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <BookCover
                  src={newBookForm.coverUrl}
                  title={newBookForm.title || 'Preview'}
                  author={newBookForm.author || ''}
                  size="sm"
                  fit="contain"
                />
              </div>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Enter image URL or click 'Search & Pick Cover' above"
                value={newBookForm.coverUrl}
                onChange={(e) => setNewBookForm({ ...newBookForm, coverUrl: e.target.value })}
              />
            </div>
          </div>

          {/* Short & Full Description */}
          <div className="form-group">
            <label>Short Description (Summary)</label>
            <input
              className="form-input"
              placeholder="Brief 1-2 sentence teaser"
              value={newBookForm.shortDescription}
              onChange={(e) => setNewBookForm({ ...newBookForm, shortDescription: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Full Synopsis / Description</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Detailed description, themes, author bio..."
              value={newBookForm.description}
              onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
            ></textarea>
          </div>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Book: ${selectedBook?.title}`}
        maxWidth="680px"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdateBook}>
              Save Changes to MySQL
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Title *</label>
            <input
              className="form-input"
              value={editBookForm.title}
              onChange={(e) => setEditBookForm({ ...editBookForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Author *</label>
              <input
                className="form-input"
                value={editBookForm.author}
                onChange={(e) => setEditBookForm({ ...editBookForm, author: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Category</label>
              <select
                className="form-input"
                value={editBookForm.categoryId}
                onChange={(e) => setEditBookForm({ ...editBookForm, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Language</label>
                <button
                  type="button"
                  onClick={() => setShowEditCustomLangInput(!showEditCustomLangInput)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent, #8b5cf6)', fontSize: '0.76rem', cursor: 'pointer', padding: 0 }}
                >
                  {showEditCustomLangInput ? 'Select from list' : '+ Add New Language'}
                </button>
              </div>
              {!showEditCustomLangInput ? (
                <select
                  className="form-input"
                  value={editBookForm.language}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowEditCustomLangInput(true);
                    } else {
                      setEditBookForm({ ...editBookForm, language: e.target.value });
                    }
                  }}
                >
                  {languages.map((l) => (
                    <option key={l.code || l.name} value={l.name}>
                      {l.nativeName ? `${l.name} (${l.nativeName})` : l.name}
                    </option>
                  ))}
                  <option value="__custom__">+ Add Custom Language...</option>
                </select>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    className="form-input"
                    placeholder="e.g. Sindhi, Maithili, Swedish..."
                    value={editCustomLangInput}
                    onChange={(e) => setEditCustomLangInput(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ whiteSpace: 'nowrap', padding: '6px 12px' }}
                    onClick={() => handleAddNewLanguage(editCustomLangInput, 'edit')}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Format</label>
              <select
                className="form-input"
                value={editBookForm.format}
                onChange={(e) => setEditBookForm({ ...editBookForm, format: e.target.value })}
              >
                <option value="Paperback">Paperback</option>
                <option value="Hardcover">Hardcover</option>
                <option value="E-Book">E-Book</option>
                <option value="Audiobook">Audiobook</option>
                <option value="Manga">Manga</option>
                <option value="Comic">Comic</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label>Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                value={editBookForm.price}
                onChange={(e) => setEditBookForm({ ...editBookForm, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Stock *</label>
              <input
                type="number"
                className="form-input"
                value={editBookForm.stock}
                onChange={(e) => setEditBookForm({ ...editBookForm, stock: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Cover URL with Search Cover action & Live Preview */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Cover Image</label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 12px', fontSize: '0.78rem', border: '1px solid var(--accent, #8b5cf6)', color: 'var(--accent, #8b5cf6)' }}
                onClick={() => {
                  setCoverSelectorTarget('edit');
                  setShowCoverSelectorModal(true);
                }}
              >
                🔍 Search & Pick Cover / Upload
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '68px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <BookCover
                  src={editBookForm.coverUrl}
                  title={editBookForm.title || selectedBook?.title}
                  author={editBookForm.author || selectedBook?.author}
                  size="sm"
                  fit="contain"
                />
              </div>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Image URL or click 'Search & Pick Cover' above"
                value={editBookForm.coverUrl}
                onChange={(e) => setEditBookForm({ ...editBookForm, coverUrl: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Book"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteBook}>
              Delete
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-secondary)' }}>
          Are you sure you want to delete <strong>"{selectedBook?.title}"</strong>? This action cannot be undone.
        </p>
      </Modal>

      {/* Create Coupon Modal */}
      <Modal
        isOpen={showAddCouponModal}
        onClose={() => setShowAddCouponModal(false)}
        title="Create New Coupon"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddCouponModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateCoupon}>
              Create Coupon
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCoupon}>
          <div className="form-group">
            <label>Coupon Code *</label>
            <input
              className="form-input"
              placeholder="e.g. SUMMER25"
              value={newCouponForm.code}
              onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Discount Type</label>
              <select
                className="form-input"
                value={newCouponForm.type}
                onChange={(e) => setNewCouponForm({ ...newCouponForm, type: e.target.value })}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Discount Value *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder={newCouponForm.type === 'percentage' ? '15 (for 15%)' : '100 (for ₹100)'}
                value={newCouponForm.value}
                onChange={(e) => setNewCouponForm({ ...newCouponForm, value: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Min Order Value (₹)</label>
              <input
                type="number"
                className="form-input"
                value={newCouponForm.minOrderValue}
                onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrderValue: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Max Discount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Optional"
                value={newCouponForm.maxDiscount}
                onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscount: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add New Category"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddCategoryModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddCategory}>
              Add Category
            </button>
          </>
        }
      >
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label>Category Name *</label>
            <input
              className="form-input"
              placeholder="e.g. Science Fiction"
              value={newCategoryForm.name}
              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Icon Emoji</label>
            <input
              className="form-input"
              placeholder="e.g. 🚀"
              value={newCategoryForm.icon}
              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, icon: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Short genre summary"
              value={newCategoryForm.description}
              onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <BulkImportModal
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportSuccess={loadData}
      />

      {/* External Catalog Lookup Modal */}
      <ExternalLookupModal
        isOpen={showExternalLookupModal}
        onClose={() => setShowExternalLookupModal(false)}
        onSelectBook={handlePreFillFromExternal}
      />

      {/* Cover Selector Modal */}
      <CoverSelectorModal
        isOpen={showCoverSelectorModal}
        onClose={() => setShowCoverSelectorModal(false)}
        initialQuery={
          coverSelectorTarget === 'new'
            ? (newBookForm.isbn || `${newBookForm.title} ${newBookForm.author}`).trim()
            : (selectedBook?.isbn || `${editBookForm.title} ${editBookForm.author}`).trim()
        }
        currentCoverUrl={coverSelectorTarget === 'new' ? newBookForm.coverUrl : editBookForm.coverUrl}
        bookTitle={coverSelectorTarget === 'new' ? newBookForm.title : editBookForm.title}
        bookAuthor={coverSelectorTarget === 'new' ? newBookForm.author : editBookForm.author}
        onSelectCover={handleCoverSelected}
      />
    </div>
  );
};

export default AdminDashboard;
