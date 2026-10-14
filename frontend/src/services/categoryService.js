import api from './api';
import { getFallbackMockCategories } from '../utils/formatters';

export const categoryService = {
  async getAll() {
    try {
      const response = await api.get('/categories');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((cat) => ({
          ...cat,
          icon: cat.icon || '📖',
          count: cat.count !== undefined ? cat.count : 10,
        }));
      }
      return getFallbackMockCategories();
    } catch (error) {
      console.warn('Falling back to mock categories:', error);
      return getFallbackMockCategories();
    }
  },

  async create(categoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },
};

export default categoryService;
