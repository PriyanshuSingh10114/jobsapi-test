import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchSources = () => api.get('/sources').then((res) => res.data.data);
export const fetchStats = () => api.get('/stats').then((res) => res.data.data);
export const fetchJobs = (params) => api.get('/jobs', { params }).then((res) => res.data);
export const searchJobs = (params) => api.get('/jobs/search', { params }).then((res) => res.data);
export const syncJobs = () => api.post('/jobs/sync').then((res) => res.data);

export default api;
