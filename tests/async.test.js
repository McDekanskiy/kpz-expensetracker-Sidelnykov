/**
 * ПР-12: Тести для асинхронних функцій
 * Перевірка коректності async/await, паралельного виконання та фонових задач
 */

const {
    simulateDbQuery,
    loadExpenseWithDetailsSLOW,
    loadExpenseWithDetailsFAST,
    loadMultipleExpensesWithErrorHandling,
    withTimeout,
    withRetry
} = require('../src/services/asyncDemo');

const AsyncExpenseService = require('../src/services/asyncExpenseService');

// Простий test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('\n' + '='.repeat(70));
        console.log('ТЕСТИ АСИНХРОННОГО ПРОГРАМУВАННЯ - ПР-12');
        console.log('='.repeat(70) + '\n');

        for (const { name, fn } of this.tests) {
            try {
                await fn();
                this.passed++;
                console.log(`✅ ${name}`);
            } catch (error) {
                this.failed++;
                console.log(`❌ ${name}`);
                console.log(`   Помилка: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('РЕЗУЛЬТАТИ ТЕСТУВАННЯ');
        console.log('='.repeat(70));
        console.log(`Всього тестів:   ${this.tests.length}`);
        console.log(`✅ Пройдено:     ${this.passed}`);
        console.log(`❌ Провалено:    ${this.failed}`);
        console.log('='.repeat(70) + '\n');

        if (this.failed === 0) {
            console.log('🎉 Всі тести пройдено успішно!\n');
        } else {
            console.log('⚠️  Деякі тести провалились\n');
            process.exit(1);
        }
    }
}

// Допоміжні функції для тестування
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertGreaterThan(actual, expected, message) {
    if (actual <= expected) {
        throw new Error(message || `Expected ${actual} > ${expected}`);
    }
}

function assertLessThan(actual, expected, message) {
    if (actual >= expected) {
        throw new Error(message || `Expected ${actual} < ${expected}`);
    }
}

// Створюємо test runner
const runner = new TestRunner();

// ============ Тести базових async функцій ============

runner.test('simulateDbQuery повертає правильну структуру', async () => {
    const result = await simulateDbQuery('expenses', 1, 50);
    assert(result.table === 'expenses', 'Неправильна таблиця');
    assert(result.id === 1, 'Неправильний ID');
    assert(result.data, 'Відсутні дані');
    assert(result.timestamp, 'Відсутній timestamp');
});

runner.test('simulateDbQuery виконується з правильною затримкою', async () => {
    const startTime = Date.now();
    await simulateDbQuery('expenses', 1, 100);
    const elapsed = Date.now() - startTime;
    assertGreaterThan(elapsed, 90, 'Затримка занадто мала');
    assertLessThan(elapsed, 150, 'Затримка занадто велика');
});

// ============ Тести послідовного vs паралельного виконання ============

runner.test('SLOW версія виконується послідовно', async () => {
    const startTime = Date.now();
    const result = await loadExpenseWithDetailsSLOW(1);
    const elapsed = Date.now() - startTime;
    
    assert(result.expense, 'Відсутній expense');
    assert(result.category, 'Відсутня category');
    assert(result.user, 'Відсутній user');
    
    // Послідовне виконання: 300 + 200 + 150 = 650ms
    assertGreaterThan(elapsed, 600, 'SLOW версія виконалась занадто швидко');
});

runner.test('FAST версія виконується паралельно', async () => {
    const startTime = Date.now();
    const result = await loadExpenseWithDetailsFAST(1);
    const elapsed = Date.now() - startTime;
    
    assert(result.expense, 'Відсутній expense');
    assert(result.category, 'Відсутня category');
    assert(result.user, 'Відсутній user');
    
    // Паралельне виконання: max(300, 200, 150) = 300ms
    assertLessThan(elapsed, 400, 'FAST версія виконалась занадто повільно');
});

runner.test('FAST версія швидша за SLOW мінімум у 1.5 рази', async () => {
    const startSlow = Date.now();
    await loadExpenseWithDetailsSLOW(1);
    const slowTime = Date.now() - startSlow;
    
    const startFast = Date.now();
    await loadExpenseWithDetailsFAST(1);
    const fastTime = Date.now() - startFast;
    
    const speedup = slowTime / fastTime;
    assertGreaterThan(speedup, 1.5, `Прискорення ${speedup.toFixed(2)}x недостатнє`);
});

// ============ Тести обробки помилок ============

runner.test('loadMultipleExpensesWithErrorHandling обробляє помилки', async () => {
    const result = await loadMultipleExpensesWithErrorHandling([1, 2, 999, 3]);
    
    assert(result.successful.length === 3, 'Неправильна кількість успішних');
    assert(result.failed.length === 1, 'Неправильна кількість помилок');
    assert(result.failed[0].id === 999, 'Неправильний ID помилки');
});

runner.test('withTimeout спрацьовує для швидких операцій', async () => {
    const result = await withTimeout(
        simulateDbQuery('expenses', 1, 50),
        200
    );
    assert(result.data, 'Операція не завершилась');
});

runner.test('withTimeout кидає помилку для повільних операцій', async () => {
    let errorThrown = false;
    try {
        await withTimeout(
            simulateDbQuery('expenses', 1, 500),
            100
        );
    } catch (error) {
        errorThrown = true;
        assert(error.message.includes('Timeout'), 'Неправильне повідомлення помилки');
    }
    assert(errorThrown, 'Timeout не спрацював');
});

// ============ Тести AsyncExpenseService ============

runner.test('AsyncExpenseService.getExpenseWithDetails завантажує всі дані', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const result = await service.getExpenseWithDetails(1);
    
    // Перевіряємо що всі поля присутні (розпаковані з окремих запитів)
    assert(result.table || result.data, 'Відсутні дані expense');
    assert(result.category, 'Відсутня category');
    assert(result.user, 'Відсутній user');
    assert(result.tags, 'Відсутні tags');
    assert(result._metadata, 'Відсутні metadata');
    assert(result._metadata.loadTime, 'Відсутній loadTime');
});

runner.test('AsyncExpenseService.getExpenseWithDetails виконується швидко', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const startTime = Date.now();
    await service.getExpenseWithDetails(1);
    const elapsed = Date.now() - startTime;
    
    // Паралельне виконання має бути швидшим за 200ms
    assertLessThan(elapsed, 250, 'Завантаження занадто повільне');
});

runner.test('AsyncExpenseService.getMultipleExpenses обробляє кілька витрат', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const result = await service.getMultipleExpenses([1, 2, 3]);
    
    assert(result.successful.length === 3, 'Неправильна кількість успішних');
    assert(result.failed.length === 0, 'Не має бути помилок');
    assert(result.totalTime, 'Відсутній totalTime');
});

runner.test('AsyncExpenseService.createExpense валідує дані', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    let errorThrown = false;
    
    try {
        await service.createExpense({});
    } catch (error) {
        errorThrown = true;
        assert(error.message.includes('більше 0'), 'Неправильна валідація');
    }
    
    assert(errorThrown, 'Валідація не спрацювала');
});

runner.test('AsyncExpenseService.createExpense створює витрату', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const expense = await service.createExpense({
        amount: 100,
        categoryId: 1,
        userId: 1,
        description: 'Test expense'
    });
    
    assert(expense.id, 'Відсутній ID');
    assert(expense.amount === 100, 'Неправильна сума');
    assert(expense.createdAt, 'Відсутня дата створення');
});

runner.test('AsyncExpenseService.createExpense запускає фонові задачі', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    await service.createExpense({
        amount: 100,
        categoryId: 1,
        userId: 1
    });
    
    const status = service.getBackgroundTasksStatus();
    assert(status.total === 3, 'Неправильна кількість фонових задач');
});

runner.test('AsyncExpenseService фонові задачі завершуються', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    await service.createExpense({
        amount: 100,
        categoryId: 1,
        userId: 1
    });
    
    // Чекаємо завершення фонових задач
    const status = await service.waitForBackgroundTasks(3000);
    assert(status.completed === 3, 'Не всі задачі завершились');
    assert(status.failed === 0, 'Є провалені задачі');
});

runner.test('AsyncExpenseService.createMultipleExpenses створює пакет', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const result = await service.createMultipleExpenses([
        { amount: 100, categoryId: 1, userId: 1 },
        { amount: 200, categoryId: 2, userId: 1 },
        { amount: 300, categoryId: 3, userId: 1 }
    ]);
    
    assert(result.successful.length === 3, 'Неправильна кількість створених');
    assert(result.failed.length === 0, 'Не має бути помилок');
});

runner.test('AsyncExpenseService.generateReport генерує звіт', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const report = await service.generateReport(1, '2026-05-01', '2026-05-31');
    
    assert(report.userId === 1, 'Неправильний userId');
    assert(report.expenses, 'Відсутні expenses');
    assert(report.totalByCategory, 'Відсутні totalByCategory');
    assert(report.totalByMonth, 'Відсутні totalByMonth');
    assert(report.budgetStatus, 'Відсутній budgetStatus');
    assert(report.summary, 'Відсутній summary');
});

runner.test('AsyncExpenseService.generateReport виконується швидко', async () => {
    const service = new AsyncExpenseService({ info: () => {}, error: () => {} });
    const startTime = Date.now();
    await service.generateReport(1, '2026-05-01', '2026-05-31');
    const elapsed = Date.now() - startTime;
    
    // Паралельне виконання має бути швидшим за 300ms
    assertLessThan(elapsed, 350, 'Генерація звіту занадто повільна');
});

// ============ Тести retry механізму ============

runner.test('withRetry успішно виконує операцію після кількох спроб', async () => {
    let attemptCount = 0;
    const unreliableOperation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
            throw new Error('Тимчасова помилка');
        }
        return { success: true };
    };
    
    const result = await withRetry(unreliableOperation, 3, 50);
    assert(result.success, 'Операція не виконалась');
    assertEqual(attemptCount, 2, 'Неправильна кількість спроб');
});

runner.test('withRetry кидає помилку після всіх спроб', async () => {
    const alwaysFailOperation = async () => {
        throw new Error('Постійна помилка');
    };
    
    let errorThrown = false;
    try {
        await withRetry(alwaysFailOperation, 2, 50);
    } catch (error) {
        errorThrown = true;
        assert(error.message.includes('Постійна помилка'), 'Неправильна помилка');
    }
    
    assert(errorThrown, 'Помилка не була кинута');
});

// Запуск всіх тестів
if (require.main === module) {
    runner.run().catch(console.error);
}

module.exports = runner;
