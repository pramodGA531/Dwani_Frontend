import api from './client';

export const auth = {
  async login(email, password) {
    const response = await api.post('/v1/auth/login/', { email, password });
    return {
      access: response.data.access,
      refresh: response.data.refresh,
      user: response.data.user
    };
  },

  async logout() {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    return true;
  },

  async getSession() {
    const token = localStorage.getItem('access');
    if (!token) return null;
    
    try {
      const response = await api.get('/v1/auth/me/');
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
