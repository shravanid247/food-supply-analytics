const express = require('express');
const {
  getPrediction,
  getPredictionHistory,
  getRisk,
  getRiskHistory,
} = require('../controllers/dataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/predict', authMiddleware, getPrediction);
router.get('/predict/history', authMiddleware, getPredictionHistory);
router.get('/risk', authMiddleware, getRisk);
router.get('/risk/history', authMiddleware, getRiskHistory);

module.exports = router;