const { calculateRound } = require('../services/calculateService');

// Controller function to handle POST request for calculations
const handleCalculation = (req, res) => {
  const startTime = Date.now();
  const params = req.body;

  try {
    const result = calculateRound(params);
    const duration = Date.now() - startTime;
    console.info(`Request processed in ${duration} milliseconds`);
    res.json(result);
  } catch (e) {
    console.error(`Error processing request: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
};

module.exports = { handleCalculation };
