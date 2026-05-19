const { ExpenseService } = require('./expenseService');

class ReportService {
  constructor(expenseService = new ExpenseService()) {
    this.expenseService = expenseService;
  }

  summary(filters = {}) {
    const expenses = this.expenseService.getAll(filters);
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const byCategory = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

    return {
      total,
      count: expenses.length,
      byCategory
    };
  }
}

module.exports = { ReportService };
