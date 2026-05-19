const express = require('express');
const { getSummary } = require('../controllers/reportsController');
const router = express.Router();

router.get('/', getSummary);
router.get('/summary', getSummary);

module.exports = router;
