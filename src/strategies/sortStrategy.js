/**
 * Strategy Pattern Implementation for Expense Tracker
 * 
 * Патерн Strategy дозволяє змінювати алгоритм сортування витрат
 * без зміни коду, що його використовує
 */

/**
 * Базовий інтерфейс для всіх стратегій сортування
 */
class SortStrategy {
    /**
     * Сортувати масив витрат
     * @param {Array} expenses - Масив витрат
     * @returns {Array} - Відсортований масив
     */
    sort(expenses) {
        throw new Error('Method sort() must be implemented');
    }

    /**
     * Назва стратегії для відображення
     */
    getName() {
        return this.constructor.name;
    }
}

/**
 * Стратегія: Сортування за датою (найновіші спочатку)
 */
class SortByDateStrategy extends SortStrategy {
    sort(expenses) {
        return [...expenses].sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt);
            const dateB = new Date(b.date || b.createdAt);
            return dateB - dateA; // Найновіші спочатку
        });
    }

    getName() {
        return 'За датою (найновіші спочатку)';
    }
}

/**
 * Стратегія: Сортування за сумою (від більшої до меншої)
 */
class SortByAmountStrategy extends SortStrategy {
    constructor(ascending = false) {
        super();
        this.ascending = ascending;
    }

    sort(expenses) {
        return [...expenses].sort((a, b) => {
            const amountA = parseFloat(a.amount) || 0;
            const amountB = parseFloat(b.amount) || 0;
            return this.ascending ? amountA - amountB : amountB - amountA;
        });
    }

    getName() {
        return this.ascending 
            ? 'За сумою (від меншої до більшої)' 
            : 'За сумою (від більшої до меншої)';
    }
}

/**
 * Стратегія: Сортування за категорією (алфавітно)
 */
class SortByCategoryStrategy extends SortStrategy {
    sort(expenses) {
        return [...expenses].sort((a, b) => {
            const categoryA = (a.category || '').toLowerCase();
            const categoryB = (b.category || '').toLowerCase();
            return categoryA.localeCompare(categoryB);
        });
    }

    getName() {
        return 'За категорією (алфавітно)';
    }
}

/**
 * Стратегія: Сортування за описом (алфавітно)
 */
class SortByDescriptionStrategy extends SortStrategy {
    sort(expenses) {
        return [...expenses].sort((a, b) => {
            const descA = (a.description || '').toLowerCase();
            const descB = (b.description || '').toLowerCase();
            return descA.localeCompare(descB);
        });
    }

    getName() {
        return 'За описом (алфавітно)';
    }
}

/**
 * Стратегія: Комбінована - спочатку за категорією, потім за сумою
 */
class SortByCategoryAndAmountStrategy extends SortStrategy {
    sort(expenses) {
        return [...expenses].sort((a, b) => {
            // Спочатку порівнюємо категорії
            const categoryA = (a.category || '').toLowerCase();
            const categoryB = (b.category || '').toLowerCase();
            const categoryCompare = categoryA.localeCompare(categoryB);
            
            if (categoryCompare !== 0) {
                return categoryCompare;
            }
            
            // Якщо категорії однакові, порівнюємо суми
            const amountA = parseFloat(a.amount) || 0;
            const amountB = parseFloat(b.amount) || 0;
            return amountB - amountA; // Більші суми спочатку
        });
    }

    getName() {
        return 'За категорією, потім за сумою';
    }
}

/**
 * Контекст - клас що використовує стратегію
 */
class ExpenseList {
    constructor(strategy = null) {
        this._strategy = strategy || new SortByDateStrategy();
        this._expenses = [];
    }

    /**
     * Встановити нову стратегію сортування
     * @param {SortStrategy} strategy 
     */
    setStrategy(strategy) {
        if (!(strategy instanceof SortStrategy)) {
            throw new Error('Strategy must extend SortStrategy class');
        }
        this._strategy = strategy;
        console.log(`[Strategy] Змінено стратегію на: ${strategy.getName()}`);
    }

    /**
     * Додати витрату до списку
     * @param {Object} expense 
     */
    addExpense(expense) {
        this._expenses.push(expense);
    }

    /**
     * Додати кілька витрат
     * @param {Array} expenses 
     */
    addExpenses(expenses) {
        this._expenses.push(...expenses);
    }

    /**
     * Отримати відсортований список витрат
     * @returns {Array}
     */
    getSorted() {
        return this._strategy.sort(this._expenses);
    }

    /**
     * Отримати невідсортований список
     * @returns {Array}
     */
    getAll() {
        return [...this._expenses];
    }

    /**
     * Очистити список
     */
    clear() {
        this._expenses = [];
    }

    /**
     * Кількість витрат
     */
    count() {
        return this._expenses.length;
    }
}

/**
 * Фабрика стратегій - для зручного створення
 */
class SortStrategyFactory {
    static strategies = {
        'date': SortByDateStrategy,
        'amount': SortByAmountStrategy,
        'amount-asc': () => new SortByAmountStrategy(true),
        'category': SortByCategoryStrategy,
        'description': SortByDescriptionStrategy,
        'category-amount': SortByCategoryAndAmountStrategy
    };

    /**
     * Створити стратегію за назвою
     * @param {string} name - Назва стратегії
     * @returns {SortStrategy}
     */
    static create(name) {
        const StrategyClass = this.strategies[name.toLowerCase()];
        
        if (!StrategyClass) {
            const available = Object.keys(this.strategies).join(', ');
            throw new Error(
                `Невідома стратегія '${name}'. Доступні: ${available}`
            );
        }

        // Якщо це функція, викликаємо її, інакше створюємо екземпляр класу
        return typeof StrategyClass === 'function' && StrategyClass.prototype instanceof SortStrategy
            ? new StrategyClass()
            : StrategyClass();
    }

    /**
     * Отримати список доступних стратегій
     * @returns {Array<string>}
     */
    static getAvailable() {
        return Object.keys(this.strategies);
    }
}

module.exports = {
    SortStrategy,
    SortByDateStrategy,
    SortByAmountStrategy,
    SortByCategoryStrategy,
    SortByDescriptionStrategy,
    SortByCategoryAndAmountStrategy,
    ExpenseList,
    SortStrategyFactory
};
