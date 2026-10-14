import api from './api';

export const reviewService = {
  async getByBookId(bookId) {
    const response = await api.get(`/reviews/book/${bookId}`);
    return response.data;
  },

  async getRatingStats(bookId) {
    const response = await api.get(`/reviews/book/${bookId}/stats`);
    return response.data;
  },

  async getByUserId(userId) {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },

  async createReview(reviewData) {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  async markHelpful(reviewId) {
    const response = await api.post(`/reviews/${reviewId}/helpful`);
    return response.data;
  },

  async reportReview(reviewId) {
    const response = await api.post(`/reviews/${reviewId}/report`);
    return response.data;
  },

  async getAllReviews() {
    const response = await api.get('/reviews/admin/all');
    return response.data;
  },

  async deleteReview(reviewId) {
    const response = await api.delete(`/reviews/admin/${reviewId}`);
    return response.data;
  },
};

export default reviewService;
