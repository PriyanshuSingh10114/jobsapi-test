import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSources = () => api.get('/sources').then((res) => res.data.data);
export const fetchStats = () => api.get('/stats').then((res) => res.data.data);
export const fetchJobs = (params) => api.get('/jobs', { params }).then((res) => res.data);
export const searchJobs = (params) => api.get('/jobs/search', { params }).then((res) => res.data);
export const getSuggestions = (q) => api.get('/jobs/suggestions', { params: { q } }).then((res) => res.data.data);
export const syncJobs = () => api.post('/jobs/sync').then((res) => res.data);

// Analytics Endpoints
export const fetchAnalyticsSources = () => api.get('/analytics/sources').then((res) => res.data.data);

export default api;
