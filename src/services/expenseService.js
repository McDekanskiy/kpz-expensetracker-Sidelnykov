const { z } = require('zod');
const { ExpenseRepository } = require('../repositories/expenseRepository');
const { ValidationError, NotFoundError } = require('../exceptions');

const expenseSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(2),
  description: z.string().optional().default(''),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

class ExpenseService {
  constructor(repository = new ExpenseRepository()) {
    this.repository = repository;
  }

  getAll(filters) {
    return this.repository.findAll(filters);
  }

  getById(id) {
    const expense = this.repository.findById(id);
    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  create(data) {
    const result = expenseSchema.safeParse(data);
    if (!result.success) {
      throw new ValidationError('Invalid expense data');
    }
    return this.repository.create(result.data);
  }

  update(id, data) {
    const expense = this.repository.update(id, data);
    if (!expense) throw new NotFoundError('Expense not found');
    return expense;
  }

  remove(id) {
    const deleted = this.repository.delete(id);
    if (!deleted) throw new NotFoundError('Expense not found');
    return { deleted: true };
  }
}

module.exports = { ExpenseService };
