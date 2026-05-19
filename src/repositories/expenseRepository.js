let expenses = [
  { id: 1, userId: 1, amount: 1200, category: 'Food', description: 'Groceries', date: '2026-05-01' },
  { id: 2, userId: 1, amount: 350, category: 'Transport', description: 'Taxi', date: '2026-05-04' }
];
let nextId = 3;

class ExpenseRepository {
  findAll(filters = {}) {
    return expenses.filter((expense) => {
      if (filters.category && expense.category !== filters.category) return false;
      if (filters.from && expense.date < filters.from) return false;
      if (filters.to && expense.date > filters.to) return false;
      return true;
    });
  }

  findById(id) {
    return expenses.find((expense) => expense.id === Number(id)) || null;
  }

  create(data) {
    const expense = { id: nextId++, userId: 1, ...data };
    expenses.push(expense);
    return expense;
  }

  update(id, data) {
    const expense = this.findById(id);
    if (!expense) return null;
    Object.assign(expense, data);
    return expense;
  }

  delete(id) {
    const before = expenses.length;
    expenses = expenses.filter((expense) => expense.id !== Number(id));
    return before !== expenses.length;
  }

  resetForTests() {
    expenses = [];
    nextId = 1;
  }
}

module.exports = { ExpenseRepository };
