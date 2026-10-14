import api from './api';
import { getFallbackMockBooks } from '../utils/formatters';

export const bookService = {
  async getAll() {
    try {
      const response = await api.get('/books');
      return this.transformBooks(response.data);
    } catch (error) {
      console.warn('Falling back to local books data:', error);
      return this.transformBooks(getFallbackMockBooks());
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/books/${id}`);
      return this.transformBook(response.data);
    } catch (error) {
      console.warn(`Failed to fetch book ${id} from API, looking in fallback:`, error);
      const fallback = getFallbackMockBooks().find((b) => b.id === parseInt(id));
      if (fallback) return this.transformBook(fallback);
      throw error;
    }
  },

  async getFeatured() {
    try {
      const response = await api.get('/books/featured');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return this.transformBooks(response.data);
      }
      const all = await this.getAll();
      return all.filter((b) => b.isFeatured || b.featured);
    } catch (error) {
      const all = await this.getAll();
      return all.filter((b) => b.isFeatured || b.featured);
    }
  },

  async getBestsellers() {
    try {
      const response = await api.get('/books/bestsellers');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return this.transformBooks(response.data);
      }
      const all = await this.getAll();
      return all.filter((b) => b.isBestseller || b.rating >= 4.5);
    } catch (error) {
      const all = await this.getAll();
      return all.filter((b) => b.isBestseller || b.rating >= 4.5);
    }
  },

  async getNewArrivals() {
    try {
      const response = await api.get('/books/new-arrivals');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return this.transformBooks(response.data);
      }
      const all = await this.getAll();
      return all.filter((b) => b.isNewArrival);
    } catch (error) {
      const all = await this.getAll();
      return all.slice(0, 8);
    }
  },

  async getByCategory(categoryId) {
    try {
      const response = await api.get(`/books/category/${categoryId}`);
      return this.transformBooks(response.data);
    } catch (error) {
      const all = await this.getAll();
      return all.filter((b) => b.categoryId === parseInt(categoryId));
    }
  },

  async getByLanguage(language) {
    try {
      const response = await api.get(`/books/language/${encodeURIComponent(language)}`);
      return this.transformBooks(response.data);
    } catch (error) {
      const all = await this.getAll();
      if (!language || language.toLowerCase() === 'all') return all;
      return all.filter((b) => (b.language || 'English').toLowerCase() === language.toLowerCase());
    }
  },

  async search(query) {
    try {
      const response = await api.get(`/books/search`, { params: { query } });
      return this.transformBooks(response.data);
    } catch (error) {
      const all = await this.getAll();
      const q = (query || '').toLowerCase().trim();
      return all.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.category?.toLowerCase().includes(q) ||
          b.language?.toLowerCase().includes(q) ||
          b.isbn?.toLowerCase().includes(q)
      );
    }
  },

  async getRelated(id, categoryId) {
    try {
      const response = await api.get(`/books/${id}/related`, { params: { categoryId } });
      return this.transformBooks(response.data);
    } catch (error) {
      const all = await this.getAll();
      return all.filter((b) => b.categoryId === parseInt(categoryId) && b.id !== parseInt(id)).slice(0, 4);
    }
  },

  async getLowStock(threshold = 10) {
    try {
      const response = await api.get(`/books/low-stock`, { params: { threshold } });
      return this.transformBooks(response.data);
    } catch (error) {
      const all = await this.getAll();
      return all.filter((b) => b.stock <= threshold);
    }
  },

  async create(bookData) {
    const response = await api.post('/books', bookData);
    return this.transformBook(response.data);
  },

  async update(id, bookData) {
    const response = await api.put(`/books/${id}`, bookData);
    return this.transformBook(response.data);
  },

  async delete(id) {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  },

  async bulkImport(rows) {
    const response = await api.post('/books/bulk-import', rows);
    return response.data;
  },

  async externalLookup(query) {
    const response = await api.get('/books/external-lookup', { params: { query } });
    return response.data || [];
  },

  transformBook(b) {
    if (!b) return null;
    const transformed = { ...b };
    const rawCover = b.coverUrl || b.cover;
    const isValidCover = rawCover && typeof rawCover === 'string' && !rawCover.includes('via.placeholder.com') && rawCover.trim() !== '';
    transformed.cover = isValidCover ? rawCover.trim() : null;
    transformed.coverUrl = transformed.cover;

    if (b.category && typeof b.category === 'object') {
      transformed.categoryId = b.category.id;
      transformed.categoryName = b.category.name;
      transformed.category = b.category.name;
    } else if (b.category_id && !b.categoryId) {
      transformed.categoryId = b.category_id;
    }

    transformed.rating = b.rating !== undefined && b.rating !== null ? Number(b.rating) : 4.5;
    transformed.reviews = b.reviewCount || b.reviews || 0;
    transformed.pages = b.pages || 320;
    transformed.publisher = b.publisher || 'BookVerse Publishing';
    transformed.year = b.year || (b.publishDate ? new Date(b.publishDate).getFullYear() : 2024);
    transformed.price = Number(b.price || 0);
    transformed.originalPrice = b.originalPrice ? Number(b.originalPrice) : (transformed.price > 0 ? transformed.price * 1.3 : 0);
    transformed.stock = b.stock !== undefined && b.stock !== null ? Number(b.stock) : 50;

    // Multilingual & Enhanced fields
    transformed.language = b.language || 'English';
    transformed.format = b.format || 'Paperback';
    transformed.genre = b.genre || '';
    transformed.subtitle = b.subtitle || '';
    transformed.shortDescription = b.shortDescription || '';
    transformed.isbn = b.isbn || '';
    transformed.edition = b.edition || '';
    transformed.discount = b.discount !== undefined && b.discount !== null ? Number(b.discount) : 0;
    transformed.isFeatured = Boolean(b.isFeatured || b.featured);
    transformed.isBestseller = Boolean(b.isBestseller);
    transformed.isNewArrival = Boolean(b.isNewArrival);

    // Comic & Manga fields
    transformed.seriesName = b.seriesName || '';
    transformed.volumeNumber = b.volumeNumber || '';
    transformed.issueNumber = b.issueNumber || '';
    transformed.illustrator = b.illustrator || '';
    transformed.artist = b.artist || '';
    transformed.publisherImprint = b.publisherImprint || '';
    transformed.readingDirection = b.readingDirection || 'Left-to-Right';
    transformed.ageRecommendation = b.ageRecommendation || '';

    return transformed;
  },

  transformBooks(books) {
    if (!Array.isArray(books)) return [];
    return books.map((b) => this.transformBook(b));
  },
};

export default bookService;
