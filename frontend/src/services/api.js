import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for sanitized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let sanitizedMessage = 'An unexpected error occurred while communicating with the telemetry server.';
    if (error.response) {
      if (typeof error.response.data?.detail === 'string') {
        sanitizedMessage = error.response.data.detail;
      } else if (error.response.status === 404) {
        sanitizedMessage = 'The requested resource was not found on the predictive maintenance server.';
      } else if (error.response.status >= 500) {
        sanitizedMessage = 'The predictive model scoring service encountered a temporary error.';
      }
    } else if (error.request) {
      sanitizedMessage = 'Unable to connect to the backend server at ' + API_BASE_URL + '. Please verify the FastAPI service is running.';
    }
    const cleanError = new Error(sanitizedMessage);
    cleanError.status = error.response?.status;
    cleanError.isAxiosError = true;
    return Promise.reject(cleanError);
  }
);

/**
 * Health check endpoint
 */
export const getHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

/**
 * Root info endpoint
 */
export const getRootInfo = async () => {
  const response = await apiClient.get('/');
  return response.data;
};

/**
 * Fetch all machine predictions for a specific timestamp (or latest)
 */
export const getPredictions = async (as_of = null, signal = null) => {
  const params = {};
  if (as_of) params.as_of = as_of;
  const response = await apiClient.get('/api/v1/predictions', {
    params,
    signal,
  });
  return response.data;
};

/**
 * Fetch machines listing
 */
export const getMachines = async (as_of = null) => {
  const params = {};
  if (as_of) params.as_of = as_of;
  const response = await apiClient.get('/api/v1/machines', { params });
  return response.data;
};

/**
 * Fetch prediction details for a single machine
 */
export const getMachinePrediction = async (machineId, as_of = null) => {
  const params = {};
  if (as_of) params.as_of = as_of;
  const response = await apiClient.get(`/api/v1/predictions/${machineId}`, { params });
  return response.data;
};

/**
 * Fetch historical timeline and actual failures for a specific machine
 */
export const getMachineTimeline = async (machineId, start = null, end = null) => {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  const response = await apiClient.get(`/api/v1/machines/${machineId}/timeline`, { params });
  return response.data;
};

/**
 * Fetch pre-indexed demo timestamps with verified historical events
 */
export const getDemoTimes = async () => {
  const response = await apiClient.get('/api/v1/demo-times');
  return response.data;
};

export { API_BASE_URL };
export default apiClient;
