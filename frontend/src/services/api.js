import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Auth Token & Correlation
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for Uniform Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage = 
      error.response?.data?.error?.message || 
      error.response?.data?.message || 
      error.message || 
      'An unexpected network error occurred';

    const enhancedError = new Error(customMessage);
    enhancedError.statusCode = error.response?.status;
    enhancedError.code = error.response?.data?.error?.code;
    enhancedError.details = error.response?.data?.error?.details;
    enhancedError.requestId = error.response?.data?.requestId;

    return Promise.reject(enhancedError);
  }
);

// Core API endpoints
export const fetchHealth = () => axios.get(`${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : 'http://localhost:5000'}/health`).then((res) => res.data);
export const fetchSources = () => api.get('/sources').then((res) => res.data.data);
export const fetchStats = () => api.get('/stats').then((res) => res.data.data);
export const fetchJobs = (params) => api.get('/jobs', { params }).then((res) => res.data);
export const fetchJobById = (id) => api.get(`/jobs/${id}`).then((res) => res.data.data);
export const searchJobs = (params) => api.get('/jobs/search', { params }).then((res) => res.data);
export const getSuggestions = (q) => api.get('/jobs/suggestions', { params: { q } }).then((res) => res.data.data);
export const syncJobs = () => api.post('/jobs/sync').then((res) => res.data);

// Automation & Application Endpoints
export const startAutomation = (payload) => api.post('/automation/start', payload).then((res) => res.data);
export const fetchAutomationStatus = (sessionId) => api.get(`/automation/status/${sessionId}`).then((res) => res.data);
export const fetchAutomationLogs = (sessionId) => api.get(`/automation/logs/${sessionId}`).then((res) => res.data);
export const runAutoApply = (payload) => api.post('/auto-apply/run', payload).then((res) => res.data);
export const fetchDiscoveredJobs = (params) => api.get('/discovery/jobs', { params }).then((res) => res.data);

// Analytics Endpoints
export const fetchAnalyticsSources = () => api.get('/analytics/sources').then((res) => res.data.data);
export const fetchApplicationAnalytics = (userId) => api.get('/analytics/dashboard', { params: { userId } }).then((res) => res.data);

// Canonical Candidate Profile Endpoints
export const fetchCandidateProfile = () => api.get('/candidate/profile').then((res) => res.data);
export const updateCandidateProfile = (profileData) => api.put('/candidate/profile', profileData).then((res) => res.data);
export const fetchCandidateReadiness = () => api.get('/candidate/readiness').then((res) => res.data);
export const addExperience = (data) => api.post('/candidate/experience', data).then((res) => res.data);
export const updateExperience = (id, data) => api.put(`/candidate/experience/${id}`, data).then((res) => res.data);
export const deleteExperience = (id) => api.delete(`/candidate/experience/${id}`).then((res) => res.data);
export const addEducation = (data) => api.post('/candidate/education', data).then((res) => res.data);
export const updateEducation = (id, data) => api.put(`/candidate/education/${id}`, data).then((res) => res.data);
export const deleteEducation = (id) => api.delete(`/candidate/education/${id}`).then((res) => res.data);
export const uploadCandidateDocument = (formData) => api.post('/candidate/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then((res) => res.data);
export const updateApplicationAnswer = (data) => api.put('/candidate/application-answers', data).then((res) => res.data);
export const runPreflight = (payload) => api.post('/candidate/preflight', payload).then((res) => res.data);

// User Profile & Registry Endpoints (Aliases / Backwards compatibility)
export const fetchProfile = () => api.get('/candidate/profile').then((res) => res.data);
export const updateProfile = (profileData) => api.put('/candidate/profile', profileData).then((res) => res.data);
export const uploadResume = (formData) => api.post('/candidate/documents', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then((res) => res.data);
export const fetchFieldRegistry = () => api.get('/user/registry').then((res) => res.data);
export const fetchATSReadiness = () => api.get('/candidate/readiness').then((res) => res.data);
export const fetchProfileHistory = () => api.get('/user/history').then((res) => res.data);

export default api;


