const mongoose = require('mongoose');

const PredictionLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  requested_at: { type: Date, default: Date.now },
  current_price: { type: Number },
  predictions: [
    {
      month: String,
      predicted_price: Number,
    },
  ],
});

const QueryLogSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  searched_at: { type: Date, default: Date.now },
  country: { type: String },
  commodity: { type: String },
});

const RiskAlertLogSchema = new mongoose.Schema({
  country: { type: String, required: true },
  cpi_value: { type: Number },
  risk_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
  recorded_at: { type: Date, default: Date.now },
});

const PredictionLog = mongoose.model('PredictionLog', PredictionLogSchema);
const QueryLog = mongoose.model('QueryLog', QueryLogSchema);
const RiskAlertLog = mongoose.model('RiskAlertLog', RiskAlertLogSchema);

module.exports = { PredictionLog, QueryLog, RiskAlertLog };