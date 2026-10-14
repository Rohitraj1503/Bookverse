import api from './api';

export const wishlistService = {
  async getWishlist(userId) {
    const response = await api.get(`/wishlist/${userId}`);
    return response.data;
  },

  async addToWishlist(userId, bookId) {
    const response = await api.post(`/wishlist/${userId}/add/${bookId}`);
    return response.data;
  },

  async removeFromWishlist(userId, bookId) {
    const response = await api.delete(`/wishlist/${userId}/remove/${bookId}`);
    return response.data;
  },

  async toggleWishlist(userId, bookId) {
    const response = await api.post(`/wishlist/${userId}/toggle/${bookId}`);
    return response.data;
  },

  async checkWishlist(userId, bookId) {
    const response = await api.get(`/wishlist/${userId}/check/${bookId}`);
    return response.data;
  },
};

export default wishlistService;
