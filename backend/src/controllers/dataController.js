const axios = require('axios');
const { PredictionLog, QueryLog, RiskAlertLog } = require('../models/SupplyData');

const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const getPrediction = async (req, res) => {
  try {
    const response = await axios.get(`${ML_URL}/predict`);
    const data = response.data;

    await PredictionLog.create({
      user_id: req.user.id,
      current_price: data.current_price,
      predictions: data.predictions,
    });

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPredictionHistory = async (req, res) => {
  try {
    const logs = await PredictionLog.find({ user_id: req.user.id })
      .sort({ requested_at: -1 })
      .limit(10);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRisk = async (req, res) => {
  try {
    const { country, commodity } = req.query;

    if (country || commodity) {
      await QueryLog.create({
        user_id: req.user.id,
        country: country || null,
        commodity: commodity || null,
      });
    }

    const response = await axios.get(`${ML_URL}/risk`);
    const data = response.data;

    const logsToSave = data.risk_data.map((item) => ({
      country: item.country,
      cpi_value: item.cpi_value,
      risk_level: item.risk_level,
    }));
    await RiskAlertLog.insertMany(logsToSave);

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getRiskHistory = async (req, res) => {
  try {
    const { country } = req.query;
    const filter = country ? { country } : {};
    const logs = await RiskAlertLog.find(filter)
      .sort({ recorded_at: -1 })
      .limit(50);
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPrediction, getPredictionHistory, getRisk, getRiskHistory };