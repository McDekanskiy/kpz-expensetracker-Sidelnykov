/**
 * Observer Pattern Implementation for Expense Tracker
 * 
 * Патерн Observer дозволяє підписникам автоматично отримувати
 * сповіщення про зміни у витратах
 */

/**
 * Базовий інтерфейс для всіх спостерігачів
 */
class ExpenseObserver {
    /**
     * Метод, який викликається при зміні витрати
     * @param {number} expenseId - ID витрати
     * @param {string} event - Тип події (created, updated, deleted)
     * @param {Object} data - Дані події
     */
    onExpenseUpdated(expenseId, event, data) {
        throw new Error('Method onExpenseUpdated() must be implemented');
    }
}

/**
 * Subject - об'єкт за яким спостерігають
 */
class ExpenseSubject {
    constructor() {
        this._observers = [];
    }

    /**
     * Підписати спостерігача
     * @param {ExpenseObserver} observer 
     */
    subscribe(observer) {
        if (!(observer instanceof ExpenseObserver)) {
            throw new Error('Observer must extend ExpenseObserver class');
        }
        this._observers.push(observer);
        console.log(`[Observer] ${observer.constructor.name} підписався на події витрат`);
    }

    /**
     * Відписати спостерігача
     * @param {ExpenseObserver} observer 
     */
    unsubscribe(observer) {
        const index = this._observers.indexOf(observer);
        if (index > -1) {
            this._observers.splice(index, 1);
            console.log(`[Observer] ${observer.constructor.name} відписався від подій`);
        }
    }

    /**
     * Сповістити всіх підписників про подію
     * @param {number} expenseId 
     * @param {string} event 
     * @param {Object} data 
     */
    notify(expenseId, event, data = {}) {
        console.log(`[Subject] Сповіщення про подію: ${event} для витрати #${expenseId}`);
        this._observers.forEach(observer => {
            try {
                observer.onExpenseUpdated(expenseId, event, data);
            } catch (error) {
                console.error(`[Observer] Помилка в ${observer.constructor.name}:`, error.message);
            }
        });
    }
}

/**
 * Конкретний спостерігач: Логування активності
 */
class ActivityLogObserver extends ExpenseObserver {
    constructor() {
        super();
        this.log = [];
    }

    onExpenseUpdated(expenseId, event, data) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            expenseId,
            event,
            data,
            message: this._formatMessage(expenseId, event, data)
        };
        this.log.push(entry);
        console.log(`[LOG] ${entry.message}`);
    }

    _formatMessage(expenseId, event, data) {
        switch (event) {
            case 'created':
                return `Витрата #${expenseId} створена: ${data.amount} ${data.currency || 'UAH'} - ${data.description}`;
            case 'updated':
                return `Витрата #${expenseId} оновлена`;
            case 'deleted':
                return `Витрата #${expenseId} видалена`;
            default:
                return `Витрата #${expenseId}: ${event}`;
        }
    }

    getLog() {
        return this.log;
    }

    clearLog() {
        this.log = [];
    }
}

/**
 * Конкретний спостерігач: Статистика витрат
 */
class StatisticsObserver extends ExpenseObserver {
    constructor() {
        super();
        this.stats = {
            created: 0,
            updated: 0,
            deleted: 0,
            totalAmount: 0
        };
    }

    onExpenseUpdated(expenseId, event, data) {
        if (event === 'created') {
            this.stats.created++;
            if (data.amount) {
                this.stats.totalAmount += parseFloat(data.amount);
            }
        } else if (event === 'updated') {
            this.stats.updated++;
        } else if (event === 'deleted') {
            this.stats.deleted++;
            if (data.amount) {
                this.stats.totalAmount -= parseFloat(data.amount);
            }
        }
        console.log(`[STATS] Створено: ${this.stats.created}, Оновлено: ${this.stats.updated}, Видалено: ${this.stats.deleted}, Сума: ${this.stats.totalAmount.toFixed(2)}`);
    }

    getStats() {
        return { ...this.stats };
    }

    resetStats() {
        this.stats = {
            created: 0,
            updated: 0,
            deleted: 0,
            totalAmount: 0
        };
    }
}

/**
 * Конкретний спостерігач: Email нотифікації
 */
class EmailNotificationObserver extends ExpenseObserver {
    constructor(emailService) {
        super();
        this.emailService = emailService;
    }

    onExpenseUpdated(expenseId, event, data) {
        if (event === 'created' && data.amount > 1000) {
            const message = `Увага! Створено велику витрату #${expenseId}: ${data.amount} ${data.currency || 'UAH'}`;
            console.log(`[EMAIL] Відправка email: ${message}`);
            // У реальному проєкті тут був би виклик emailService
            // this.emailService.send(data.userEmail, 'Велика витрата', message);
        }
    }
}

/**
 * Конкретний спостерігач: Budget Alert
 */
class BudgetAlertObserver extends ExpenseObserver {
    constructor(budgetLimit = 5000) {
        super();
        this.budgetLimit = budgetLimit;
        this.currentTotal = 0;
    }

    onExpenseUpdated(expenseId, event, data) {
        if (event === 'created' && data.amount) {
            this.currentTotal += parseFloat(data.amount);
            const percentage = (this.currentTotal / this.budgetLimit) * 100;
            
            if (percentage >= 90) {
                console.log(`[BUDGET ALERT] ⚠️ КРИТИЧНО! Використано ${percentage.toFixed(1)}% бюджету (${this.currentTotal}/${this.budgetLimit})`);
            } else if (percentage >= 75) {
                console.log(`[BUDGET ALERT] ⚠️ Попередження! Використано ${percentage.toFixed(1)}% бюджету`);
            }
        } else if (event === 'deleted' && data.amount) {
            this.currentTotal -= parseFloat(data.amount);
        }
    }

    setBudgetLimit(limit) {
        this.budgetLimit = limit;
    }

    getCurrentTotal() {
        return this.currentTotal;
    }
}

module.exports = {
    ExpenseObserver,
    ExpenseSubject,
    ActivityLogObserver,
    StatisticsObserver,
    EmailNotificationObserver,
    BudgetAlertObserver
};
