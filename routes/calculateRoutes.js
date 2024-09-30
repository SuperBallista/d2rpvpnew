const express = require('express');
const router = express.Router();
const { handleCalculation } = require('../controllers/calculateController');

// Route for calculating round results
router.post('/calculate', handleCalculation);

module.exports = router;
