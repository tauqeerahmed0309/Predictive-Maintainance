import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
});

export const getHealth = () => api.get('/health');
export const getPredictions = (as_of) => api.get('/api/v1/predictions', { params: { as_of } });
export const getMachines = (as_of) => api.get('/api/v1/machines', { params: { as_of } });
export const getMachinePrediction = (machine_id, as_of) => api.get(`/api/v1/predictions/${machine_id}`, { params: { as_of } });
export const getMachineTimeline = (machine_id, start, end) => api.get(`/api/v1/machines/${machine_id}/timeline`, { params: { start, end } });
export const getDemoTimes = () => api.get('/api/v1/demo-times');

export default api;
