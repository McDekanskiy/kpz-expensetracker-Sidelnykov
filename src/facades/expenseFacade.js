/**
 * Facade Pattern Implementation for Expense Tracker
 * 
 * Патерн Facade надає простий інтерфейс до складної підсистеми
 * з багатьма класами та сервісами
 */

const { ExpenseSubject } = require('../observers/expenseObserver');
const { ExpenseList, SortStrategyFactory } = require('../strategies/sortStrategy');

/**
 * ExpenseFacade - спрощений інтерфейс для роботи з витратами
 * 
 * Приховує складність взаємодії між:
 * - Репозиторієм витрат
 * - Системою подій (Observer)
 * - Валідацією
 * - Нотифікаціями
 * - Статистикою
 */
class ExpenseFacade {
    constructor(expenseRepository, userRepository, notificationService) {
        // Залежності (підсистеми)
        this.expenseRepo = expenseRepository;
        this.userRepo = userRepository;
        this.notificationService = notificationService;
        
        // Observer для подій
        this.eventSubject = new ExpenseSubject();
        
        // Внутрішня статистика
        this.stats = {
            totalExpenses: 0,
            totalAmount: 0,
            byCategory: {}
        };
    }

    /**
     * Підписати спостерігача на події витрат
     * @param {ExpenseObserver} observer 
     */
    subscribeToEvents(observer) {
        this.eventSubject.subscribe(observer);
    }

    /**
     * FACADE METHOD: Створити витрату з повною обробкою
     * 
     * Ця одна функція виконує:
     * 1. Валідацію даних
     * 2. Перевірку користувача
     * 3. Збереження у БД
     * 4. Відправку нотифікації
     * 5. Оновлення статистики
     * 6. Сповіщення підписників
     * 
     * @param {number} userId - ID користувача
     * @param {Object} expenseData - Дані витрати
     * @returns {Object} - Створена витрата
     */
    async createExpenseForUser(userId, expenseData) {
        console.log(`[FACADE] Створення витрати для користувача #${userId}`);
        
        // 1. Валідація даних
        this._validateExpenseData(expenseData);
        
        // 2. Перевірка користувача
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error(`Користувача #${userId} не знайдено`);
        }
        
        // 3. Збереження витрати
        const expense = await this.expenseRepo.create({
            ...expenseData,
            userId,
            createdAt: new Date()
        });
        
        console.log(`[FACADE] Витрата #${expense.id} збережена`);
        
        // 4. Відправка нотифікації (якщо велика сума)
        if (expense.amount > 1000) {
            await this._sendNotification(user, expense, 'created');
        }
        
        // 5. Оновлення статистики
        this._updateStats(expense, 'created');
        
        // 6. Сповіщення підписників через Observer
        this.eventSubject.notify(expense.id, 'created', {
            amount: expense.amount,
            currency: expense.currency,
            description: expense.description,
            category: expense.category,
            userId: userId
        });
        
        return expense;
    }

    /**
     * FACADE METHOD: Отримати витрати користувача з сортуванням
     * 
     * @param {number} userId - ID користувача
     * @param {Object} options - Опції (sortBy, filter, limit)
     * @returns {Array} - Відсортовані витрати
     */
    async getUserExpenses(userId, options = {}) {
        console.log(`[FACADE] Отримання витрат користувача #${userId}`);
        
        // 1. Отримати витрати з репозиторію
        let expenses = await this.expenseRepo.findByUserId(userId);
        
        // 2. Застосувати фільтр (якщо є)
        if (options.filter) {
            expenses = this._applyFilter(expenses, options.filter);
        }
        
        // 3. Застосувати сортування через Strategy
        if (options.sortBy) {
            const strategy = SortStrategyFactory.create(options.sortBy);
            const expenseList = new ExpenseList(strategy);
            expenseList.addExpenses(expenses);
            expenses = expenseList.getSorted();
        }
        
        // 4. Обмежити кількість (якщо потрібно)
        if (options.limit) {
            expenses = expenses.slice(0, options.limit);
        }
        
        console.log(`[FACADE] Повернуто ${expenses.length} витрат`);
        return expenses;
    }

    /**
     * FACADE METHOD: Оновити витрату
     * 
     * @param {number} expenseId - ID витрати
     * @param {number} userId - ID користувача (для перевірки прав)
     * @param {Object} updates - Оновлення
     * @returns {Object} - Оновлена витрата
     */
    async updateExpense(expenseId, userId, updates) {
        console.log(`[FACADE] Оновлення витрати #${expenseId}`);
        
        // 1. Перевірка існування та прав доступу
        const expense = await this.expenseRepo.findById(expenseId);
        if (!expense) {
            throw new Error(`Витрату #${expenseId} не знайдено`);
        }
        if (expense.userId !== userId) {
            throw new Error(`Немає прав для редагування витрати #${expenseId}`);
        }
        
        // 2. Валідація оновлень
        if (updates.amount !== undefined) {
            this._validateAmount(updates.amount);
        }
        
        // 3. Оновлення в БД
        const updatedExpense = await this.expenseRepo.update(expenseId, {
            ...updates,
            updatedAt: new Date()
        });
        
        // 4. Оновлення статистики
        this._updateStats(updatedExpense, 'updated', expense);
        
        // 5. Сповіщення підписників
        this.eventSubject.notify(expenseId, 'updated', {
            oldAmount: expense.amount,
            newAmount: updatedExpense.amount,
            changes: updates
        });
        
        return updatedExpense;
    }

    /**
     * FACADE METHOD: Видалити витрату
     * 
     * @param {number} expenseId - ID витрати
     * @param {number} userId - ID користувача
     * @returns {boolean} - Успішність операції
     */
    async deleteExpense(expenseId, userId) {
        console.log(`[FACADE] Видалення витрати #${expenseId}`);
        
        // 1. Перевірка прав
        const expense = await this.expenseRepo.findById(expenseId);
        if (!expense) {
            throw new Error(`Витрату #${expenseId} не знайдено`);
        }
        if (expense.userId !== userId) {
            throw new Error(`Немає прав для видалення витрати #${expenseId}`);
        }
        
        // 2. Видалення з БД
        await this.expenseRepo.delete(expenseId);
        
        // 3. Оновлення статистики
        this._updateStats(expense, 'deleted');
        
        // 4. Сповіщення підписників
        this.eventSubject.notify(expenseId, 'deleted', {
            amount: expense.amount,
            category: expense.category
        });
        
        return true;
    }

    /**
     * FACADE METHOD: Отримати звіт по витратах
     * 
     * @param {number} userId - ID користувача
     * @param {Object} options - Опції звіту (period, groupBy)
     * @returns {Object} - Звіт
     */
    async generateReport(userId, options = {}) {
        console.log(`[FACADE] Генерація звіту для користувача #${userId}`);
        
        // 1. Отримати витрати
        const expenses = await this.expenseRepo.findByUserId(userId);
        
        // 2. Фільтрувати за періодом
        let filteredExpenses = expenses;
        if (options.period) {
            filteredExpenses = this._filterByPeriod(expenses, options.period);
        }
        
        // 3. Розрахувати статистику
        const report = {
            userId,
            period: options.period || 'all',
            totalExpenses: filteredExpenses.length,
            totalAmount: filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0),
            byCategory: {},
            averageAmount: 0,
            maxExpense: null,
            minExpense: null
        };
        
        // Групування за категоріями
        filteredExpenses.forEach(expense => {
            const category = expense.category || 'Без категорії';
            if (!report.byCategory[category]) {
                report.byCategory[category] = {
                    count: 0,
                    total: 0,
                    expenses: []
                };
            }
            report.byCategory[category].count++;
            report.byCategory[category].total += parseFloat(expense.amount);
            report.byCategory[category].expenses.push(expense);
        });
        
        // Додаткова статистика
        if (filteredExpenses.length > 0) {
            report.averageAmount = report.totalAmount / filteredExpenses.length;
            report.maxExpense = filteredExpenses.reduce((max, e) => 
                parseFloat(e.amount) > parseFloat(max.amount) ? e : max
            );
            report.minExpense = filteredExpenses.reduce((min, e) => 
                parseFloat(e.amount) < parseFloat(min.amount) ? e : min
            );
        }
        
        console.log(`[FACADE] Звіт згенеровано: ${report.totalExpenses} витрат, сума ${report.totalAmount}`);
        return report;
    }

    /**
     * Отримати поточну статистику
     */
    getStats() {
        return { ...this.stats };
    }

    // ============ ПРИВАТНІ МЕТОДИ ============

    _validateExpenseData(data) {
        if (!data.amount || data.amount <= 0) {
            throw new Error('Сума витрати має бути більше 0');
        }
        if (!data.description || data.description.trim().length < 3) {
            throw new Error('Опис витрати має містити мінімум 3 символи');
        }
        if (data.description.length > 200) {
            throw new Error('Опис витрати занадто довгий (максимум 200 символів)');
        }
    }

    _validateAmount(amount) {
        if (typeof amount !== 'number' || amount <= 0) {
            throw new Error('Некоректна сума витрати');
        }
    }

    async _sendNotification(user, expense, action) {
        if (this.notificationService) {
            const message = `Витрата ${expense.amount} ${expense.currency || 'UAH'} - ${expense.description}`;
            await this.notificationService.send(user.email, message);
            console.log(`[FACADE] Нотифікацію відправлено на ${user.email}`);
        }
    }

    _updateStats(expense, action, oldExpense = null) {
        if (action === 'created') {
            this.stats.totalExpenses++;
            this.stats.totalAmount += parseFloat(expense.amount);
            this._incrementCategory(expense.category);
        } else if (action === 'deleted') {
            this.stats.totalExpenses--;
            this.stats.totalAmount -= parseFloat(expense.amount);
            this._decrementCategory(expense.category);
        } else if (action === 'updated' && oldExpense) {
            this.stats.totalAmount -= parseFloat(oldExpense.amount);
            this.stats.totalAmount += parseFloat(expense.amount);
        }
    }

    _incrementCategory(category) {
        const cat = category || 'Без категорії';
        this.stats.byCategory[cat] = (this.stats.byCategory[cat] || 0) + 1;
    }

    _decrementCategory(category) {
        const cat = category || 'Без категорії';
        if (this.stats.byCategory[cat]) {
            this.stats.byCategory[cat]--;
        }
    }

    _applyFilter(expenses, filter) {
        return expenses.filter(expense => {
            if (filter.category && expense.category !== filter.category) {
                return false;
            }
            if (filter.minAmount && parseFloat(expense.amount) < filter.minAmount) {
                return false;
            }
            if (filter.maxAmount && parseFloat(expense.amount) > filter.maxAmount) {
                return false;
            }
            return true;
        });
    }

    _filterByPeriod(expenses, period) {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return expenses;
        }

        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date || expense.createdAt);
            return expenseDate >= startDate;
        });
    }
}

module.exports = ExpenseFacade;
