import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// DAG APIs
export const getDags = async () => {
  const response = await api.get('/dags');
  return response.data;
};

export const getDagDetails = async (dagId) => {
  const response = await api.get(`/dags/${dagId}`);
  return response.data;
};

export const triggerDag = async (dagId, conf = {}) => {
  const response = await api.post(`/dags/${dagId}/dagRuns`, { conf });
  return response.data;
};

export const pauseUnpauseDag = async (dagId, isPaused) => {
  const response = await api.patch(`/dags/${dagId}`, { is_paused: isPaused });
  return response.data;
};

// DAG Run APIs
export const getDagRuns = async (dagId, limit = 10, offset = 0) => {
  const response = await api.get(`/dags/${dagId}/dagRuns`, {
    params: { limit, offset }
  });
  return response.data;
};

export const getAllDagRuns = async (limit = 25, offset = 0) => {
  const response = await api.get('/dagRuns', {
    params: { limit, offset }
  });
  return response.data;
};

export const getTaskInstances = async (dagId, dagRunId) => {
  const response = await api.get(`/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`);
  return response.data;
};

// Status APIs
export const getRunningStatus = async () => {
  const response = await api.get('/status/running');
  return response.data;
};

export default api;

