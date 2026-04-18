const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const fetchPrediction = async () => {
  const response = await axios.get(`${ML_URL}/predict`);
  return response.data;
};

const fetchRisk = async () => {
  const response = await axios.get(`${ML_URL}/risk`);
  return response.data;
};

const checkHealth = async () => {
  const response = await axios.get(`${ML_URL}/health`);
  return response.data;
};

module.exports = { fetchPrediction, fetchRisk, checkHealth };