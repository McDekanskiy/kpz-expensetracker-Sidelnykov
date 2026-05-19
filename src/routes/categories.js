const express = require('express');
const { listCategories } = require('../controllers/categoriesController');
const router = express.Router();

router.get('/', listCategories);

module.exports = router;
