import axios from 'axios';

const API_URL = ''; // Relative URLs work because of the proxy/middleware

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zionn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/api/auth/login', credentials);
    localStorage.setItem('zionn_token', response.data.token);
    return response.data.user;
  },
  register: async (data: any) => {
    const response = await api.post('/api/auth/register', data);
    localStorage.setItem('zionn_token', response.data.token);
    return response.data.user;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  updateProfile: async (data: any) => {
    const response = await api.put('/api/auth/profile', data);
    return response.data;
  },
  updatePassword: async (data: any) => {
    const response = await api.put('/api/auth/password', data);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('zionn_token');
  }
};

export const businessApi = {
  getMy: async () => {
    const response = await api.get('/api/businesses/my');
    return response.data;
  },
  getMyBusiness: async () => {
    const response = await api.get('/api/businesses/my');
    return response.data;
  },
  register: async (data: any) => {
    const response = await api.post('/api/businesses', data);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/businesses/stats');
    return response.data;
  },
  createBusiness: async (data: any) => {
    const response = await api.post('/api/businesses', data);
    return response.data;
  }
};

export const adminApi = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },
  updateUserStatus: async (id: string, status: string) => {
    const response = await api.put(`/api/admin/users/${id}/status`, { status });
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
  updateSettings: async (data: any) => {
    const response = await api.put('/api/admin/settings', data);
    return response.data;
  }
};

export const productApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/products', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/api/products/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  }
};

export const negotiationApi = {
  getAll: async () => {
    const response = await api.get('/api/negotiations');
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/negotiations', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await api.put(`/api/negotiations/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/negotiations/${id}`);
    return response.data;
  }
};

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
  }
};

export default api;
