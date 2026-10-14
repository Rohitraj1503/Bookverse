import api from './api';

export const couponService = {
  async validateCoupon(code, orderAmount, userId = null) {
    const params = { code, orderAmount };
    if (userId) params.userId = userId;
    const response = await api.get('/coupons/validate', { params });
    return response.data;
  },

  async getAllCoupons() {
    const response = await api.get('/coupons');
    return response.data;
  },

  async createCoupon(couponData) {
    const response = await api.post('/coupons', couponData);
    return response.data;
  },

  async updateCoupon(id, couponData) {
    const response = await api.put(`/coupons/${id}`, couponData);
    return response.data;
  },

  async deleteCoupon(id) {
    const response = await api.delete(`/coupons/${id}`);
    return response.data;
  },
};

export default couponService;
