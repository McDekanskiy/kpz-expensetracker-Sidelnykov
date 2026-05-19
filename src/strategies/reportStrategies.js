class MonthlyReportStrategy {
  calculate(expenses) {
    return expenses.reduce((acc, item) => {
      const month = item.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + item.amount;
      return acc;
    }, {});
  }
}

class CategoryReportStrategy {
  calculate(expenses) {
    return expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  }
}

class TotalReportStrategy {
  calculate(expenses) {
    return { total: expenses.reduce((sum, item) => sum + item.amount, 0) };
  }
}

class ReportContext {
  constructor(strategy) { this.strategy = strategy; }
  setStrategy(strategy) { this.strategy = strategy; }
  execute(expenses) { return this.strategy.calculate(expenses); }
}

module.exports = { MonthlyReportStrategy, CategoryReportStrategy, TotalReportStrategy, ReportContext };
