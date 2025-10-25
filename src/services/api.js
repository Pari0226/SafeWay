import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me')
}

// Routes APIs
export const routesAPI = {
  search: (params) => api.get('/routes/search', { params }),
  save: (data) => api.post('/routes/save', data),
  getFavorites: () => api.get('/routes/favorites'),
  delete: (id) => api.delete(`/routes/${id}`),
  toggleFavorite: (id) => api.patch(`/routes/${id}/favorite`)
}

// Safety APIs
export const safetyAPI = {
  getSafetyScore: (params) => api.get('/safety/score', { params }),
  getCrimeData: (city) => api.get(`/safety/crime-data/${city}`),
  getAllCrimeData: () => api.get('/safety/crime-data'),
  submitReport: (data) => api.post('/safety/report', data),
  getNearbyReports: (params) => api.get('/safety/reports', { params })
}

// SOS APIs
export const sosAPI = {
  getContacts: () => api.get('/sos/contacts'),
  addContact: (data) => api.post('/sos/contacts', data),
  deleteContact: (id) => api.delete(`/sos/contacts/${id}`),
  triggerAlert: (data) => api.post('/sos/alert', data),
  getAlertHistory: () => api.get('/sos/alerts')
}

export default api
