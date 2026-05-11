/**
 * ПР-12: Асинхронний сервіс для роботи з витратами
 * Демонструє async/await, паралельні запити та фонові задачі
 */

const { simulateDbQuery } = require('./asyncDemo');

/**
 * Асинхронний сервіс для витрат
 */
class AsyncExpenseService {
    constructor(logger = console) {
        this.logger = logger;
        this.backgroundTasks = [];
    }

    /**
     * Отримати витрату з повною інформацією (категорія, користувач)
     * ОПТИМІЗОВАНО: паралельні запити
     */
    async getExpenseWithDetails(expenseId) {
        this.logger.info(`[AsyncExpenseService] Завантаження expense #${expenseId}`);
        const startTime = Date.now();

        try {
            // Паралельне завантаження всіх пов'язаних даних
            const [expense, category, user, tags] = await Promise.all([
                this.getExpense(expenseId),
                this.getCategory(expenseId),
                this.getUser(expenseId),
                this.getTags(expenseId)
            ]);

            const elapsed = Date.now() - startTime;
            this.logger.info(`[AsyncExpenseService] Завантажено за ${elapsed}ms`);

            return {
                ...expense,
                category,
                user,
                tags,
                _metadata: {
                    loadTime: elapsed,
                    loadedAt: new Date().toISOString()
                }
            };
        } catch (error) {
            this.logger.error(`[AsyncExpenseService] Помилка: ${error.message}`);
            throw error;
        }
    }

    /**
     * Отримати кілька витрат паралельно
     */
    async getMultipleExpenses(expenseIds) {
        this.logger.info(`[AsyncExpenseService] Завантаження ${expenseIds.length} витрат`);
        const startTime = Date.now();

        // Promise.allSettled - не падає якщо одна з витрат не знайдена
        const results = await Promise.allSettled(
            expenseIds.map(id => this.getExpenseWithDetails(id))
        );

        const successful = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        const failed = results
            .filter(r => r.status === 'rejected')
            .map((r, index) => ({
                id: expenseIds[index],
                error: r.reason.message
            }));

        const elapsed = Date.now() - startTime;
        this.logger.info(
            `[AsyncExpenseService] Завантажено ${successful.length}/${expenseIds.length} за ${elapsed}ms`
        );

        return { successful, failed, totalTime: elapsed };
    }

    /**
     * Створити витрату з фоновими задачами
     */
    async createExpense(expenseData, options = {}) {
        this.logger.info('[AsyncExpenseService] Створення нової витрати');

        // Валідація
        this.validateExpenseData(expenseData);

        // Основна операція - швидка
        const expense = await this.saveExpense(expenseData);

        // Фонові задачі - не чекаємо їх завершення
        if (options.sendNotification !== false) {
            this.scheduleBackgroundTask(() => 
                this.sendNotification(expense)
            );
        }

        if (options.updateStatistics !== false) {
            this.scheduleBackgroundTask(() => 
                this.updateUserStatistics(expense.userId)
            );
        }

        if (options.checkBudget !== false) {
            this.scheduleBackgroundTask(() => 
                this.checkBudgetLimits(expense.userId, expense.categoryId)
            );
        }

        this.logger.info(`[AsyncExpenseService] Витрата створена: #${expense.id}`);
        this.logger.info(`[AsyncExpenseService] Заплановано ${this.backgroundTasks.length} фонових задач`);

        return expense;
    }

    /**
     * Пакетне створення витрат
     */
    async createMultipleExpenses(expensesData) {
        this.logger.info(`[AsyncExpenseService] Пакетне створення ${expensesData.length} витрат`);
        const startTime = Date.now();

        const results = await Promise.allSettled(
            expensesData.map(data => this.createExpense(data, { 
                sendNotification: false // Відключаємо для пакетної операції
            }))
        );

        const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
        const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

        const elapsed = Date.now() - startTime;
        this.logger.info(
            `[AsyncExpenseService] Створено ${successful.length}/${expensesData.length} за ${elapsed}ms`
        );

        // Одне повідомлення для всіх
        if (successful.length > 0) {
            this.scheduleBackgroundTask(() => 
                this.sendBatchNotification(successful)
            );
        }

        return { successful, failed, totalTime: elapsed };
    }

    /**
     * Отримати звіт з агрегованими даними
     */
    async generateReport(userId, startDate, endDate) {
        this.logger.info(`[AsyncExpenseService] Генерація звіту для user #${userId}`);
        const startTime = Date.now();

        // Паралельне завантаження різних метрик
        const [expenses, totalByCategory, totalByMonth, budgetStatus] = await Promise.all([
            this.getExpensesByDateRange(userId, startDate, endDate),
            this.getTotalByCategory(userId, startDate, endDate),
            this.getTotalByMonth(userId, startDate, endDate),
            this.getBudgetStatus(userId)
        ]);

        const elapsed = Date.now() - startTime;

        return {
            userId,
            period: { startDate, endDate },
            expenses,
            totalByCategory,
            totalByMonth,
            budgetStatus,
            summary: {
                totalExpenses: expenses.length,
                totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
                generatedAt: new Date().toISOString(),
                generationTime: elapsed
            }
        };
    }

    // ============ Приватні методи (імітація БД операцій) ============

    async getExpense(id) {
        return await simulateDbQuery('expenses', id, 100);
    }

    async getCategory(id) {
        return await simulateDbQuery('categories', id, 80);
    }

    async getUser(id) {
        return await simulateDbQuery('users', id, 90);
    }

    async getTags(id) {
        return await simulateDbQuery('tags', id, 60);
    }

    async saveExpense(data) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
            id: Math.floor(Math.random() * 10000),
            ...data,
            createdAt: new Date().toISOString()
        };
    }

    async getExpensesByDateRange(userId, startDate, endDate) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return [
            { id: 1, amount: 100, category: 'Food' },
            { id: 2, amount: 50, category: 'Transport' }
        ];
    }

    async getTotalByCategory(userId, startDate, endDate) {
        await new Promise(resolve => setTimeout(resolve, 150));
        return {
            'Food': 100,
            'Transport': 50
        };
    }

    async getTotalByMonth(userId, startDate, endDate) {
        await new Promise(resolve => setTimeout(resolve, 120));
        return {
            '2026-05': 150
        };
    }

    async getBudgetStatus(userId) {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
            limit: 1000,
            spent: 150,
            remaining: 850
        };
    }

    validateExpenseData(data) {
        if (!data.amount || data.amount <= 0) {
            throw new Error('Сума витрати має бути більше 0');
        }
        if (!data.categoryId) {
            throw new Error('Категорія обов\'язкова');
        }
        if (!data.userId) {
            throw new Error('Користувач обов\'язковий');
        }
    }

    // ============ Фонові задачі ============

    scheduleBackgroundTask(taskFn) {
        const task = {
            id: this.backgroundTasks.length + 1,
            fn: taskFn,
            status: 'pending',
            scheduledAt: new Date().toISOString()
        };

        this.backgroundTasks.push(task);

        // Виконуємо асинхронно, не чекаючи
        setImmediate(async () => {
            try {
                task.status = 'running';
                await taskFn();
                task.status = 'completed';
                task.completedAt = new Date().toISOString();
            } catch (error) {
                task.status = 'failed';
                task.error = error.message;
                this.logger.error(`[BackgroundTask #${task.id}] Помилка: ${error.message}`);
            }
        });

        return task.id;
    }

    async sendNotification(expense) {
        this.logger.info(`[BackgroundTask] Відправка повідомлення про витрату #${expense.id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.logger.info(`[BackgroundTask] Повідомлення відправлено`);
    }

    async sendBatchNotification(expenses) {
        this.logger.info(`[BackgroundTask] Відправка пакетного повідомлення про ${expenses.length} витрат`);
        await new Promise(resolve => setTimeout(resolve, 300));
        this.logger.info(`[BackgroundTask] Пакетне повідомлення відправлено`);
    }

    async updateUserStatistics(userId) {
        this.logger.info(`[BackgroundTask] Оновлення статистики для user #${userId}`);
        await new Promise(resolve => setTimeout(resolve, 400));
        this.logger.info(`[BackgroundTask] Статистика оновлена`);
    }

    async checkBudgetLimits(userId, categoryId) {
        this.logger.info(`[BackgroundTask] Перевірка бюджету для user #${userId}, category #${categoryId}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        this.logger.info(`[BackgroundTask] Бюджет перевірено`);
    }

    getBackgroundTasksStatus() {
        return {
            total: this.backgroundTasks.length,
            pending: this.backgroundTasks.filter(t => t.status === 'pending').length,
            running: this.backgroundTasks.filter(t => t.status === 'running').length,
            completed: this.backgroundTasks.filter(t => t.status === 'completed').length,
            failed: this.backgroundTasks.filter(t => t.status === 'failed').length,
            tasks: this.backgroundTasks
        };
    }

    async waitForBackgroundTasks(timeoutMs = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const status = this.getBackgroundTasksStatus();
            if (status.pending === 0 && status.running === 0) {
                return status;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('Timeout: фонові задачі не завершились');
    }
}

module.exports = AsyncExpenseService;
