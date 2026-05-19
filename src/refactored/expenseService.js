// ============================================
// src/services/expenseService.js
// Модуль управління витратами
// Написаний за принципами SOLID
// ============================================

// Константи (без Magic Numbers)
const MAX_AMOUNT = 1_000_000;
const MIN_AMOUNT = 0.01;

// ─── Валідація (DRY) ───────────────────────
function validateAmount(amount) {
  return typeof amount === 'number' && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
}

function validateDate(date) {
  return typeof date === 'string' && !isNaN(Date.parse(date));
}

// ─── ExpenseRepository (SRP + DIP) ─────────
/**
 * Відповідає ТІЛЬКИ за збереження витрат у БД.
 * Залежність передається через конструктор (DIP).
 */
class ExpenseRepository {
  constructor(db) {
    this.db = db;
  }

  save(userId, categoryId, amount, description, date) {
    return this.db.run(
      `INSERT INTO expenses (user_id, category_id, amount, description, date)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, categoryId, amount, description, date]
    );
  }

  findAllByUser(userId, filters = {}) {
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [userId];

    if (filters.categoryId) {
      query += ' AND category_id = ?';
      params.push(filters.categoryId);
    }
    if (filters.dateFrom) {
      query += ' AND date >= ?';
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      query += ' AND date <= ?';
      params.push(filters.dateTo);
    }

    query += ' ORDER BY date DESC';
    return this.db.all(query, params);
  }

  findById(id) {
    return this.db.get('SELECT * FROM expenses WHERE id = ?', [id]);
  }

  update(id, data) {
    const { amount, description, date, categoryId } = data;
    return this.db.run(
      `UPDATE expenses SET amount = ?, description = ?, date = ?, category_id = ?
       WHERE id = ?`,
      [amount, description, date, categoryId, id]
    );
  }

  delete(id) {
    return this.db.run('DELETE FROM expenses WHERE id = ?', [id]);
  }
}

// ─── ExpenseService (SRP + DIP) ────────────
/**
 * Бізнес-логіка для витрат.
 * Залежить від абстракції (репозиторій), а не від конкретної БД.
 */
class ExpenseService {
  constructor(expenseRepository) {
    this.expenseRepository = expenseRepository; // DIP
  }

  async create(userId, { categoryId, amount, description, date }) {
    // Валідація (DRY)
    if (!validateAmount(amount)) {
      throw new Error(`Сума повинна бути від ${MIN_AMOUNT} до ${MAX_AMOUNT}`);
    }
    if (!validateDate(date)) {
      throw new Error('Некоректний формат дати');
    }

    return this.expenseRepository.save(userId, categoryId, amount, description, date);
  }

  async getAll(userId, filters) {
    return this.expenseRepository.findAllByUser(userId, filters);
  }

  async getById(id, userId) {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) throw new Error('Витрату не знайдено');
    if (expense.user_id !== userId) throw new Error('Немає доступу до цієї витрати');
    return expense;
  }

  async update(id, userId, data) {
    await this.getById(id, userId); // перевірка доступу
    if (data.amount && !validateAmount(data.amount)) {
      throw new Error(`Сума повинна бути від ${MIN_AMOUNT} до ${MAX_AMOUNT}`);
    }
    return this.expenseRepository.update(id, data);
  }

  async delete(id, userId) {
    await this.getById(id, userId); // перевірка доступу
    return this.expenseRepository.delete(id);
  }
}

module.exports = { ExpenseRepository, ExpenseService, validateAmount, validateDate };