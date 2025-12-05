import axios from 'axios';

// API base URL - uses Vite proxy in dev, direct in production
const API_BASE_URL = import.meta.env.PROD 
  ? 'http://192.168.1.251:8000/api'
  : '/api';

// Create axios instance with better defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for better error handling
api.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response from server');
    }
    return Promise.reject(error);
  }
);

// ===== BATCHES =====

export const getBatches = (params = {}) => 
  api.get('/batches', { params }).then(res => res.data);

export const getBatch = (id) => 
  api.get(`/batches/${id}`).then(res => res.data);

export const createBatch = (data) => 
  api.post('/batches', data).then(res => res.data);

export const updateBatch = (id, data) => 
  api.patch(`/batches/${id}`, data).then(res => res.data);

export const deleteBatch = (id) => 
  api.delete(`/batches/${id}`).then(res => res.data);

export const bulkArchiveBatches = (ids) => 
  api.post('/batches/bulk-archive', ids).then(res => res.data);

export const bulkDeleteBatches = (ids) => 
  api.post('/batches/bulk-delete', ids).then(res => res.data);

// ===== STATISTICS =====

export const getStats = (strain) => 
  api.get('/stats', { params: strain ? { strain } : {} }).then(res => res.data);

export const getNextColonization = () =>
  api.get('/stats/next-colonization').then(res => res.data);

export const predictColonization = (data) =>
  api.post('/predict-colonization', null, { params: data }).then(res => res.data);

// ===== LC CULTURES =====

export const getLCCultures = (params = {}) =>
  api.get('/lc-cultures', { params }).then(res => res.data);

export const getLCCulture = (lcCode) =>
  api.get(`/lc-cultures/${lcCode}`).then(res => res.data);

export const createLCCulture = (data) =>
  api.post('/lc-cultures', data).then(res => res.data);

export const updateLCCulture = (lcCode, data) =>
  api.patch(`/lc-cultures/${lcCode}`, data).then(res => res.data);

export const deleteLCCulture = (lcCode) =>
  api.delete(`/lc-cultures/${lcCode}`).then(res => res.data);

// ===== TEMPLATES =====

export const getTemplates = (strain) => 
  api.get('/templates', { params: strain ? { strain } : {} }).then(res => res.data);

export const createTemplate = (data) => 
  api.post('/templates', data).then(res => res.data);

export const deleteTemplate = (id) => 
  api.delete(`/templates/${id}`).then(res => res.data);

// ===== BATCH INFO =====

export const getBatchInfos = () => 
  api.get('/batch-info').then(res => res.data);

export const getBatchInfo = (spawnBatch) => 
  api.get(`/batch-info/${spawnBatch}`).then(res => res.data);

export const createBatchInfo = (data) => 
  api.post('/batch-info', data).then(res => res.data);

export const toggleFridge = (spawnBatch, inFridge) =>
  api.patch(`/batch-info/${spawnBatch}/fridge`, null, {
    params: { in_fridge: inFridge }
  }).then(res => res.data);

// ===== BATCH UNITS =====

export const getBatchUnits = (spawnBatch) => 
  api.get(`/batch-info/${spawnBatch}/units`).then(res => res.data);

export const createBatchUnit = (spawnBatch, data) =>
  api.post(`/batch-info/${spawnBatch}/units`, data).then(res => res.data);

export const createBatchUnitsBulk = (spawnBatch, data) =>
  api.post(`/batch-info/${spawnBatch}/units/bulk`, data).then(res => res.data);

export const updateBatchUnit = (spawnBatch, unitId, data) =>
  api.patch(`/batch-info/${spawnBatch}/units/${unitId}`, data).then(res => res.data);

export const toggleContamination = (spawnBatch, unitId, contaminated) =>
  api.patch(`/batch-info/${spawnBatch}/units/${unitId}/contamination`, null, {
    params: { contaminated }
  }).then(res => res.data);

export const deleteBatchUnit = (spawnBatch, unitId) =>
  api.delete(`/batch-info/${spawnBatch}/units/${unitId}`).then(res => res.data);

export default api;