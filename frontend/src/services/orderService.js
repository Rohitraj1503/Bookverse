import api from './api';

export const orderService = {
  async placeOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getByUserId(userId) {
    const response = await api.get(`/orders/${userId}`);
    return response.data;
  },

  async getAllOrders() {
    const response = await api.get('/orders');
    return response.data;
  },

  async updateOrderStatus(id, status) {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  async trackOrder(orderNumber) {
    const response = await api.get(`/orders/track/${orderNumber}`);
    return response.data;
  },

  async getOrderDetails(id) {
    const response = await api.get(`/orders/details/${id}`);
    return response.data;
  },
};

export default orderService;
