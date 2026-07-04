import axios from 'axios'

const DEFAULT_API = 'https://smart-interviewss.onrender.com/api'
export const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('messpulse_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
