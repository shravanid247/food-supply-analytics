const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PredictionLog, QueryLog, RiskAlertLog } = require('../models/SupplyData');

const ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';
const CPI_DATA_PATH = path.resolve(__dirname, '../../../ml_service/app/data/clean_consumer_price_indices.csv');
const FOOD_DATA_PATH = path.resolve(__dirname, '../../../ml_service/app/data/clean_food_price_indices.csv');

let mapDataCache = {
  loaded: false,
  loadingPromise: null,
  timelineLabels: [],
  latestYear: null,
  yearData: new Map(),
};

const getRiskLevel = (value) => {
  if (value > 300) return 'CRITICAL';
  if (value > 150) return 'HIGH';
  if (value > 110) return 'MEDIUM';
  return 'LOW';
};

const getPercentile = (sortedValues, percentile) => {
  if (!Array.isArray(sortedValues) || sortedValues.length === 0) return 0;
  const boundedPercentile = Math.max(0, Math.min(1, percentile));
  const index = Math.floor((sortedValues.length - 1) * boundedPercentile);
  return sortedValues[index];
};

const riskPriority = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

const buildMapDataCache = async () => {
  const [cpiRaw, foodRaw] = await Promise.all([
    fs.readFile(CPI_DATA_PATH, 'utf8'),
    fs.readFile(FOOD_DATA_PATH, 'utf8'),
  ]);

  const cpiRows = parse(cpiRaw, { columns: true, skip_empty_lines: true, trim: true });
  const foodRows = parse(foodRaw, { columns: true, skip_empty_lines: true, trim: true });

  const latestByCountryByYear = new Map();
  const years = new Set();

  cpiRows.forEach((row) => {
    const country = row.Area;
    const date = new Date(row.Date);
    const cpiValue = Number(row.Value);

    if (!country || Number.isNaN(date.getTime()) || !Number.isFinite(cpiValue) || cpiValue <= 0) {
      return;
    }

    const year = String(date.getUTCFullYear());
    years.add(year);

    let byCountry = latestByCountryByYear.get(year);
    if (!byCountry) {
      byCountry = new Map();
      latestByCountryByYear.set(year, byCountry);
    }

    const current = byCountry.get(country);
    if (!current || date > current.date) {
      byCountry.set(country, { date, cpi_value: cpiValue });
    }
  });

  const latestFoodByYear = new Map();
  foodRows.forEach((row) => {
    const date = new Date(row.Date);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    const year = String(date.getUTCFullYear());
    const current = latestFoodByYear.get(year);
    if (!current || date > current.date) {
      latestFoodByYear.set(year, { date, row });
    }
  });

  const timelineLabels = Array.from(years)
    .sort((a, b) => Number(a) - Number(b))
    .slice(-8);

  const latestYear = timelineLabels[timelineLabels.length - 1] || null;
  const yearData = new Map();

  timelineLabels.forEach((year) => {
    const byCountry = latestByCountryByYear.get(year) || new Map();
    const baseRows = Array.from(byCountry.entries()).map(([country, value]) => ({
      country,
      raw_cpi_value: value.cpi_value,
    }));

    const rawSorted = baseRows
      .map((entry) => entry.raw_cpi_value)
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    const capUpper = getPercentile(rawSorted, 0.95);
    const normalizedRows = baseRows.map((entry) => {
      const normalized = Math.min(entry.raw_cpi_value, capUpper || entry.raw_cpi_value);
      return {
        ...entry,
        cpi_value: normalized,
      };
    });

    const normalizedSorted = normalizedRows
      .map((entry) => entry.cpi_value)
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);

    const mediumThreshold = getPercentile(normalizedSorted, 0.4);
    const highThreshold = getPercentile(normalizedSorted, 0.7);
    const criticalThreshold = getPercentile(normalizedSorted, 0.9);

    const riskData = normalizedRows.map((entry) => {
      let riskLevel = 'LOW';
      if (entry.cpi_value >= criticalThreshold) {
        riskLevel = 'CRITICAL';
      } else if (entry.cpi_value >= highThreshold) {
        riskLevel = 'HIGH';
      } else if (entry.cpi_value >= mediumThreshold) {
        riskLevel = 'MEDIUM';
      }

      return {
        country: entry.country,
        cpi_value: entry.cpi_value,
        raw_cpi_value: entry.raw_cpi_value,
        risk_level: riskLevel,
      };
    });

    const foodSnapshot = latestFoodByYear.get(year)?.row || {};
    const commodityCandidates = ['Cereals', 'Meat', 'Dairy', 'Oils', 'Sugar']
      .map((name) => ({ name, score: Number(foodSnapshot[name]) }))
      .filter((item) => Number.isFinite(item.score))
      .sort((a, b) => b.score - a.score);

    const rankedCountries = riskData
      .slice()
      .sort((a, b) => {
        const riskDiff = (riskPriority[b.risk_level] || 0) - (riskPriority[a.risk_level] || 0);
        if (riskDiff !== 0) return riskDiff;
        return (b.cpi_value || 0) - (a.cpi_value || 0);
      })
      .slice(0, 10);

    const tradeRoutes = rankedCountries.map((countryEntry, index) => {
      const commodity = commodityCandidates[index % Math.max(commodityCandidates.length, 1)]?.name || 'Cereals';
      return {
        country: countryEntry.country,
        commodity,
        status: countryEntry.risk_level,
      };
    });

    yearData.set(year, {
      risk_data: riskData,
      trade_routes: tradeRoutes,
    });
  });

  mapDataCache = {
    loaded: true,
    loadingPromise: null,
    timelineLabels,
    latestYear,
    yearData,
  };
};

const ensureMapDataCache = async () => {
  if (mapDataCache.loaded) {
    return;
  }

  if (!mapDataCache.loadingPromise) {
    mapDataCache.loadingPromise = buildMapDataCache();
  }

  await mapDataCache.loadingPromise;
};

const loadMapDataFromLocalCsv = async (requestedYear) => {
  await ensureMapDataCache();

  const normalizedYear = requestedYear ? String(requestedYear) : mapDataCache.latestYear;
  const activeYear = mapDataCache.yearData.has(normalizedYear)
    ? normalizedYear
    : mapDataCache.latestYear;

  const yearPayload = mapDataCache.yearData.get(activeYear) || { risk_data: [], trade_routes: [] };

  return {
    status: 'success',
    selected_year: activeYear,
    cpi_mode: 'yearly_normalized',
    risk_data: yearPayload.risk_data,
    trade_routes: yearPayload.trade_routes,
    timeline_labels: mapDataCache.timelineLabels,
  };
};

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

    const data = await loadMapDataFromLocalCsv(req.query.year);

    const logsToSave = data.risk_data.map((item) => ({
      country: item.country,
      cpi_value: item.cpi_value,
      risk_level: item.risk_level,
    }));
    if (logsToSave.length) {
      await RiskAlertLog.insertMany(logsToSave);
    }

    res.status(200).json({
      ...data,
      total_countries: data.risk_data.length,
    });
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

const getMapData = async (req, res) => {
  try {
    const data = await loadMapDataFromLocalCsv(req.query.year);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPrediction, getPredictionHistory, getRisk, getRiskHistory, getMapData };