/**
 * Тести для патерну Strategy
 * ПР-9: Перевірка стратегій сортування витрат
 */

const {
    SortByDateStrategy,
    SortByAmountStrategy,
    SortByCategoryStrategy,
    SortByDescriptionStrategy,
    SortByCategoryAndAmountStrategy,
    ExpenseList,
    SortStrategyFactory
} = require('../../src/strategies/sortStrategy');

describe('Strategy Pattern Tests', () => {
    const testExpenses = [
        { id: 1, amount: 500, category: 'Їжа', description: 'Продукти', date: '2026-05-01' },
        { id: 2, amount: 1500, category: 'Техніка', description: 'Ноутбук', date: '2026-05-05' },
        { id: 3, amount: 300, category: 'Транспорт', description: 'Таксі', date: '2026-05-03' },
        { id: 4, amount: 800, category: 'Комунальні', description: 'Електрика', date: '2026-05-07' },
        { id: 5, amount: 200, category: 'Їжа', description: 'Кафе', date: '2026-05-02' }
    ];

    describe('SortByDateStrategy', () => {
        test('should sort expenses by date (newest first)', () => {
            const strategy = new SortByDateStrategy();
            const sorted = strategy.sort(testExpenses);
            
            expect(sorted[0].id).toBe(4); // 2026-05-07
            expect(sorted[1].id).toBe(2); // 2026-05-05
            expect(sorted[4].id).toBe(1); // 2026-05-01
        });

        test('should not modify original array', () => {
            const strategy = new SortByDateStrategy();
            const original = [...testExpenses];
            strategy.sort(testExpenses);
            
            expect(testExpenses).toEqual(original);
        });
    });

    describe('SortByAmountStrategy', () => {
        test('should sort by amount descending by default', () => {
            const strategy = new SortByAmountStrategy();
            const sorted = strategy.sort(testExpenses);
            
            expect(sorted[0].amount).toBe(1500);
            expect(sorted[1].amount).toBe(800);
            expect(sorted[4].amount).toBe(200);
        });

        test('should sort by amount ascending when specified', () => {
            const strategy = new SortByAmountStrategy(true);
            const sorted = strategy.sort(testExpenses);
            
            expect(sorted[0].amount).toBe(200);
            expect(sorted[1].amount).toBe(300);
            expect(sorted[4].amount).toBe(1500);
        });
    });

    describe('SortByCategoryStrategy', () => {
        test('should sort expenses by category alphabetically', () => {
            const strategy = new SortByCategoryStrategy();
            const sorted = strategy.sort(testExpenses);
            
            expect(sorted[0].category).toBe('Їжа');
            expect(sorted[2].category).toBe('Комунальні');
            expect(sorted[4].category).toBe('Транспорт');
        });
    });

    describe('SortByDescriptionStrategy', () => {
        test('should sort expenses by description alphabetically', () => {
            const strategy = new SortByDescriptionStrategy();
            const sorted = strategy.sort(testExpenses);
            
            // Алфавітний порядок: Електрика, Кафе, Ноутбук, Продукти, Таксі
            expect(sorted[0].description).toBe('Електрика');
            expect(sorted[1].description).toBe('Кафе');
        });
    });

    describe('SortByCategoryAndAmountStrategy', () => {
        test('should sort by category first, then by amount', () => {
            const strategy = new SortByCategoryAndAmountStrategy();
            const sorted = strategy.sort(testExpenses);
            
            // Перші дві мають бути з категорії "Їжа", більша сума спочатку
            expect(sorted[0].category).toBe('Їжа');
            expect(sorted[1].category).toBe('Їжа');
            expect(sorted[0].amount).toBeGreaterThan(sorted[1].amount);
        });
    });

    describe('ExpenseList', () => {
        let expenseList;

        beforeEach(() => {
            expenseList = new ExpenseList();
            expenseList.addExpenses(testExpenses);
        });

        test('should add expenses to list', () => {
            expect(expenseList.count()).toBe(5);
        });

        test('should add single expense', () => {
            expenseList.addExpense({ id: 6, amount: 100 });
            expect(expenseList.count()).toBe(6);
        });

        test('should change strategy at runtime', () => {
            const strategy1 = new SortByAmountStrategy();
            const strategy2 = new SortByDateStrategy();
            
            expenseList.setStrategy(strategy1);
            const sorted1 = expenseList.getSorted();
            expect(sorted1[0].amount).toBe(1500);
            
            expenseList.setStrategy(strategy2);
            const sorted2 = expenseList.getSorted();
            expect(sorted2[0].id).toBe(4);
        });

        test('should return unsorted list with getAll', () => {
            const all = expenseList.getAll();
            expect(all).toEqual(testExpenses);
        });

        test('should clear list', () => {
            expenseList.clear();
            expect(expenseList.count()).toBe(0);
        });

        test('should throw error if strategy is not valid', () => {
            expect(() => {
                expenseList.setStrategy({ sort: () => {} });
            }).toThrow();
        });
    });

    describe('SortStrategyFactory', () => {
        test('should create strategy by name', () => {
            const strategy = SortStrategyFactory.create('date');
            expect(strategy).toBeInstanceOf(SortByDateStrategy);
        });

        test('should create amount strategy', () => {
            const strategy = SortStrategyFactory.create('amount');
            expect(strategy).toBeInstanceOf(SortByAmountStrategy);
        });

        test('should create ascending amount strategy', () => {
            const strategy = SortStrategyFactory.create('amount-asc');
            expect(strategy).toBeInstanceOf(SortByAmountStrategy);
        });

        test('should throw error for unknown strategy', () => {
            expect(() => {
                SortStrategyFactory.create('unknown');
            }).toThrow('Невідома стратегія');
        });

        test('should return list of available strategies', () => {
            const available = SortStrategyFactory.getAvailable();
            expect(available).toContain('date');
            expect(available).toContain('amount');
            expect(available).toContain('category');
        });
    });

    describe('Strategy getName', () => {
        test('each strategy should have descriptive name', () => {
            const dateStrategy = new SortByDateStrategy();
            const amountStrategy = new SortByAmountStrategy();
            const categoryStrategy = new SortByCategoryStrategy();
            
            expect(dateStrategy.getName()).toContain('датою');
            expect(amountStrategy.getName()).toContain('сумою');
            expect(categoryStrategy.getName()).toContain('категорією');
        });
    });
});
