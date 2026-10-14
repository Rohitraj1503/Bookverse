import api from './api';

export const cartService = {
  async getByUserId(userId) {
    const response = await api.get(`/cart/${userId}`);
    return response.data;
  },

  async addToCart(cartItem) {
    const response = await api.post('/cart/add', cartItem);
    return response.data;
  },

  async clearCart(userId) {
    const response = await api.delete(`/cart/clear/${userId}`);
    return response.data;
  },
};

export default cartService;
