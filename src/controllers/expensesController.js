const { ExpenseService } = require('../services/expenseService');
const service = new ExpenseService();

function listExpenses(req, res, next) {
  try {
    res.json(service.getAll(req.query));
  } catch (error) {
    next(error);
  }
}

function getExpense(req, res, next) {
  try {
    res.json(service.getById(req.params.id));
  } catch (error) {
    next(error);
  }
}

function createExpense(req, res, next) {
  try {
    res.status(201).json(service.create(req.body));
  } catch (error) {
    next(error);
  }
}

function updateExpense(req, res, next) {
  try {
    res.json(service.update(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
}

function deleteExpense(req, res, next) {
  try {
    res.json(service.remove(req.params.id));
  } catch (error) {
    next(error);
  }
}

module.exports = { listExpenses, getExpense, createExpense, updateExpense, deleteExpense };
