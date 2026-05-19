const express = require('express');
const controller = require('../controllers/expensesController');
const router = express.Router();

router.get('/', controller.listExpenses);
router.post('/', controller.createExpense);
router.get('/:id', controller.getExpense);
router.put('/:id', controller.updateExpense);
router.delete('/:id', controller.deleteExpense);

module.exports = router;
