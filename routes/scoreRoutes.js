const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');

router.post('/update_score', scoreController.updateBScore);

module.exports = router;
