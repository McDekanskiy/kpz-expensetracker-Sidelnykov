const { ExpenseService } = require('../services/expenseService');
const { ReportService } = require('../services/reportService');

class ExpenseFacade {
  constructor(expenseService = new ExpenseService(), reportService = new ReportService(expenseService)) {
    this.expenseService = expenseService;
    this.reportService = reportService;
  }

  addAndReturnSummary(data) {
    const created = this.expenseService.create(data);
    return { created, summary: this.reportService.summary() };
  }
}

module.exports = { ExpenseFacade };
