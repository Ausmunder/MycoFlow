import axios from 'axios';

// API base URL — reads VITE_API_URL from .env.production, uses Vite proxy in dev
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

// Create axios instance with better defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url === '/auth/verify') {
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new Event('auth-logout'));
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error: No response from server');
    }
    return Promise.reject(error);
  }
);

// ===== AUTH =====

export const login = (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(res => res.data);
};

export const verifyToken = () =>
  api.get('/auth/verify').then(res => res.data);

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

export const getHistoricalAverages = (params = {}) =>
  api.get('/stats/historical-averages', { params }).then(res => res.data);

export const predictColonization = (data) =>
  api.post('/predict-colonization', null, { params: data }).then(res => res.data);

export const predictSpawnColonization = (data) =>
  api.post('/predict-spawn-colonization', null, { params: data }).then(res => res.data);

export const getBatchPrediction = (batchId) =>
  api.get(`/batches/${batchId}/prediction`).then(res => res.data);

export const getWeeklyTrends = (params = {}) =>
  api.get('/stats/weekly-trends', { params }).then(res => res.data);

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

// ===== STRAINS (register) =====

export const getStrains = (params = {}) =>
  api.get('/strains', { params }).then(res => res.data);

export const getStrain = (strainId) =>
  api.get(`/strains/${strainId}`).then(res => res.data);

export const createStrain = (data) =>
  api.post('/strains', data).then(res => res.data);

export const updateStrain = (strainId, data) =>
  api.patch(`/strains/${strainId}`, data).then(res => res.data);

export const deleteStrain = (strainId) =>
  api.delete(`/strains/${strainId}`).then(res => res.data);

// ===== CULTURES (MC / LC / PD / SL) =====

export const getCultures = (params = {}) =>
  api.get('/cultures', { params }).then(res => res.data);

export const getCulture = (code) =>
  api.get(`/cultures/${code}`).then(res => res.data);

export const createCulture = (data) =>
  api.post('/cultures', data).then(res => res.data);

export const updateCulture = (code, data) =>
  api.patch(`/cultures/${code}`, data).then(res => res.data);

export const deleteCulture = (code) =>
  api.delete(`/cultures/${code}`).then(res => res.data);

export const getCultureTrace = (code) =>
  api.get(`/cultures/${code}/trace`).then(res => res.data);

// ===== TRACEABILITY =====

export const getTrace = (code) =>
  api.get(`/trace/${code}`).then(res => res.data);

// ===== SUBSTRATE MIXES =====

export const getSubstrateMixes = (params = {}) =>
  api.get('/substrate-mixes', { params }).then(res => res.data);

export const getSubstrateMix = (mixId) =>
  api.get(`/substrate-mixes/${mixId}`).then(res => res.data);

export const createSubstrateMix = (data) =>
  api.post('/substrate-mixes', data).then(res => res.data);

export const updateSubstrateMix = (mixId, data) =>
  api.put(`/substrate-mixes/${mixId}`, data).then(res => res.data);

export const deleteSubstrateMix = (mixId) =>
  api.delete(`/substrate-mixes/${mixId}`).then(res => res.data);

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

// ===== WORKFLOW =====

export const getWorkflowStatus = (batchId) =>
  api.get(`/batches/${batchId}/workflow`).then(res => res.data);

export const transitionWorkflow = (batchId, action, data = {}) =>
  api.post(`/batches/${batchId}/workflow/transition`, { action, ...data }).then(res => res.data);

export const updateWorkflowPredictions = (batchId) =>
  api.post(`/batches/${batchId}/workflow/update-predictions`).then(res => res.data);

// ===== QR & PRINTING =====

export const printLabel = (batchId, copies = 1) =>
  api.post(`/batches/${batchId}/print`, null, { params: { copies } }).then(res => res.data);

export const getQRCode = (batchId) =>
  api.get(`/batches/${batchId}/qr`).then(res => res.data);

export const testPrinter = () =>
  api.post('/printer/test').then(res => res.data);

export default api;