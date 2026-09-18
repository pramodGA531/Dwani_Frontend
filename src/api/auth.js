import api from './client';

export const auth = {
  async login(email, password) {
    const response = await api.post('/v1/auth/login/', { email, password });
    return {
      token: response.data.access,
      refresh: response.data.refresh,
      user: response.data.user
    };
  },

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('interview_id');
    return true;
  },

  async getSession() {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token) return null;
    
    try {
      const response = await api.get('/v1/auth/me/');
      return response.data;
    } catch (error) {
      return null;
    }
  }
};
