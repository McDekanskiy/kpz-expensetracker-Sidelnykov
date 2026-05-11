/**
 * ПР-12: Асинхронне програмування
 * Демонстрація різниці між послідовним та паралельним виконанням
 */

/**
 * Імітація асинхронного запиту до БД
 * @param {string} table - назва таблиці
 * @param {number} id - ID запису
 * @param {number} delay - затримка в мілісекундах
 * @returns {Promise<Object>}
 */
async function simulateDbQuery(table, id, delay = 200) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                table,
                id,
                data: `Дані з ${table}[${id}]`,
                timestamp: new Date().toISOString()
            });
        }, delay);
    });
}

/**
 * ПОВІЛЬНА версія: послідовні запити
 * Кожен запит чекає завершення попереднього
 */
async function loadExpenseWithDetailsSLOW(expenseId) {
    console.log(`[SLOW] Завантаження expense #${expenseId}...`);
    const startTime = Date.now();

    // Послідовне виконання - кожен await блокує наступний
    const expense = await simulateDbQuery('expenses', expenseId, 300);
    const category = await simulateDbQuery('categories', expense.id, 200);
    const user = await simulateDbQuery('users', expense.id, 150);

    const elapsed = Date.now() - startTime;
    console.log(`[SLOW] Завершено за ${elapsed}ms`);

    return {
        expense,
        category,
        user,
        loadTime: elapsed
    };
}

/**
 * ШВИДКА версія: паралельні запити через Promise.all
 * Всі запити виконуються одночасно
 */
async function loadExpenseWithDetailsFAST(expenseId) {
    console.log(`[FAST] Завантаження expense #${expenseId}...`);
    const startTime = Date.now();

    // Паралельне виконання - всі запити стартують одночасно
    const [expense, category, user] = await Promise.all([
        simulateDbQuery('expenses', expenseId, 300),
        simulateDbQuery('categories', expenseId, 200),
        simulateDbQuery('users', expenseId, 150)
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`[FAST] Завершено за ${elapsed}ms`);

    return {
        expense,
        category,
        user,
        loadTime: elapsed
    };
}

/**
 * Benchmark: порівняння продуктивності
 */
async function benchmark() {
    console.log('\n' + '='.repeat(60));
    console.log('BENCHMARK: Sequential vs Parallel');
    console.log('='.repeat(60) + '\n');

    // Тест 1: Послідовне виконання
    const slowResult = await loadExpenseWithDetailsSLOW(1);
    const slowTime = slowResult.loadTime;

    console.log('');

    // Тест 2: Паралельне виконання
    const fastResult = await loadExpenseWithDetailsFAST(1);
    const fastTime = fastResult.loadTime;

    // Результати
    console.log('\n' + '='.repeat(60));
    console.log('РЕЗУЛЬТАТИ:');
    console.log('='.repeat(60));
    console.log(`Послідовно (SLOW):  ${slowTime}ms`);
    console.log(`Паралельно (FAST):  ${fastTime}ms`);
    console.log(`Прискорення:        ${(slowTime / fastTime).toFixed(2)}x`);
    console.log(`Економія часу:      ${slowTime - fastTime}ms (${Math.round((1 - fastTime / slowTime) * 100)}%)`);
    console.log('='.repeat(60) + '\n');

    return {
        slowTime,
        fastTime,
        speedup: slowTime / fastTime
    };
}

/**
 * Обробка помилок у паралельних запитах
 * Демонструє як обробляти помилки без втрати інших результатів
 */
async function loadMultipleExpensesWithErrorHandling(expenseIds) {
    console.log('\n' + '='.repeat(60));
    console.log('ОБРОБКА ПОМИЛОК У ПАРАЛЕЛЬНИХ ЗАПИТАХ');
    console.log('='.repeat(60) + '\n');

    const results = await Promise.allSettled(
        expenseIds.map(async (id) => {
            if (id === 999) {
                throw new Error(`Expense #${id} не знайдено`);
            }
            return await simulateDbQuery('expenses', id, 100);
        })
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successful.push(result.value);
            console.log(`✅ Expense #${expenseIds[index]}: успішно`);
        } else {
            failed.push({ id: expenseIds[index], error: result.reason.message });
            console.log(`❌ Expense #${expenseIds[index]}: ${result.reason.message}`);
        }
    });

    console.log(`\nУспішно: ${successful.length}, Помилок: ${failed.length}`);

    return { successful, failed };
}

/**
 * Таймаут для async операцій
 */
async function withTimeout(promise, timeoutMs) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout після ${timeoutMs}ms`)), timeoutMs)
        )
    ]);
}

/**
 * Демонстрація таймауту
 */
async function demonstrateTimeout() {
    console.log('\n' + '='.repeat(60));
    console.log('ДЕМОНСТРАЦІЯ ТАЙМАУТУ');
    console.log('='.repeat(60) + '\n');

    try {
        console.log('Спроба 1: Швидкий запит (100ms) з таймаутом 200ms...');
        const result1 = await withTimeout(
            simulateDbQuery('expenses', 1, 100),
            200
        );
        console.log('✅ Успішно:', result1.data);
    } catch (error) {
        console.log('❌ Помилка:', error.message);
    }

    try {
        console.log('\nСпроба 2: Повільний запит (500ms) з таймаутом 200ms...');
        const result2 = await withTimeout(
            simulateDbQuery('expenses', 2, 500),
            200
        );
        console.log('✅ Успішно:', result2.data);
    } catch (error) {
        console.log('❌ Помилка:', error.message);
    }
}

/**
 * Retry механізм з exponential backoff
 */
async function withRetry(fn, maxAttempts = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`  Спроба ${attempt}/${maxAttempts}...`);
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`  ❌ Помилка: ${error.message}. Повтор через ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Демонстрація retry механізму
 */
async function demonstrateRetry() {
    console.log('\n' + '='.repeat(60));
    console.log('ДЕМОНСТРАЦІЯ RETRY МЕХАНІЗМУ');
    console.log('='.repeat(60) + '\n');

    let attemptCount = 0;
    const unreliableOperation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
            throw new Error('Тимчасова помилка з\'єднання');
        }
        return await simulateDbQuery('expenses', 1, 50);
    };

    try {
        console.log('Виконання ненадійної операції з retry...');
        const result = await withRetry(unreliableOperation, 3, 500);
        console.log('✅ Успішно після', attemptCount, 'спроб:', result.data);
    } catch (error) {
        console.log('❌ Не вдалося після всіх спроб:', error.message);
    }
}

// Експорт функцій
module.exports = {
    simulateDbQuery,
    loadExpenseWithDetailsSLOW,
    loadExpenseWithDetailsFAST,
    benchmark,
    loadMultipleExpensesWithErrorHandling,
    withTimeout,
    withRetry,
    demonstrateTimeout,
    demonstrateRetry
};

// Запуск демонстрації якщо файл виконується напряму
if (require.main === module) {
    (async () => {
        try {
            await benchmark();
            await loadMultipleExpensesWithErrorHandling([1, 2, 999, 3, 4]);
            await demonstrateTimeout();
            await demonstrateRetry();
        } catch (error) {
            console.error('Помилка:', error);
        }
    })();
}
