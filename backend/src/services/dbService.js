const { PredictionLog, QueryLog, RiskAlertLog } = require('../models/SupplyData');

const savePredictionLog = async (userId, currentPrice, predictions) => {
  return await PredictionLog.create({
    user_id: userId,
    current_price: currentPrice,
    predictions,
  });
};

const saveQueryLog = async (userId, country, commodity) => {
  return await QueryLog.create({
    user_id: userId,
    country,
    commodity,
  });
};

const saveRiskLogs = async (riskData) => {
  const logs = riskData.map((item) => ({
    country: item.country,
    cpi_value: item.cpi_value,
    risk_level: item.risk_level,
  }));
  return await RiskAlertLog.insertMany(logs);
};

const getUserPredictionHistory = async (userId) => {
  return await PredictionLog.find({ user_id: userId })
    .sort({ requested_at: -1 })
    .limit(10);
};

const getCountryRiskHistory = async (country) => {
  const filter = country ? { country } : {};
  return await RiskAlertLog.find(filter)
    .sort({ recorded_at: -1 })
    .limit(50);
};

module.exports = {
  savePredictionLog,
  saveQueryLog,
  saveRiskLogs,
  getUserPredictionHistory,
  getCountryRiskHistory,
};