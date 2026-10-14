import api from './api';

export const userService = {
  async updateProfile(userId, profileData) {
    const response = await api.put(`/users/${userId}`, profileData);
    return response.data;
  },

  async getUser(userId) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

export default userService;
