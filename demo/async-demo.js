/**
 * ПР-12: Демонстрація асинхронного програмування
 * Показує переваги async/await, паралельного виконання та фонових задач
 */

const {
    benchmark,
    loadMultipleExpensesWithErrorHandling,
    demonstrateTimeout,
    demonstrateRetry
} = require('../src/services/asyncDemo');

const AsyncExpenseService = require('../src/services/asyncExpenseService');

// Кольорове форматування для консолі
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m'
};

function printHeader(text) {
    console.log('\n' + colors.bright + colors.cyan + '='.repeat(70));
    console.log(text);
    console.log('='.repeat(70) + colors.reset + '\n');
}

function printSection(text) {
    console.log(colors.bright + colors.blue + '\n📋 ' + text + colors.reset);
    console.log(colors.blue + '─'.repeat(70) + colors.reset);
}

function printSuccess(text) {
    console.log(colors.green + '✅ ' + text + colors.reset);
}

function printWarning(text) {
    console.log(colors.yellow + '⚠️  ' + text + colors.reset);
}

function printError(text) {
    console.log(colors.red + '❌ ' + text + colors.reset);
}

function printInfo(text) {
    console.log(colors.cyan + 'ℹ️  ' + text + colors.reset);
}

async function demonstrateAsyncExpenseService() {
    printSection('ЧАСТИНА 1: AsyncExpenseService - Паралельне завантаження');

    const service = new AsyncExpenseService();

    // 1. Завантаження однієї витрати з деталями
    console.log('\n1️⃣  Завантаження витрати з повною інформацією:');
    const expense = await service.getExpenseWithDetails(1);
    printSuccess(`Завантажено за ${expense._metadata.loadTime}ms`);
    printInfo(`Включає: expense, category, user, tags`);

    // 2. Завантаження кількох витрат паралельно
    console.log('\n2️⃣  Паралельне завантаження 5 витрат:');
    const multiple = await service.getMultipleExpenses([1, 2, 3, 4, 5]);
    printSuccess(`Завантажено ${multiple.successful.length} витрат за ${multiple.totalTime}ms`);
    printInfo(`Середній час на витрату: ${Math.round(multiple.totalTime / multiple.successful.length)}ms`);

    // 3. Створення витрати з фоновими задачами
    console.log('\n3️⃣  Створення витрати з фоновими задачами:');
    const newExpense = await service.createExpense({
        amount: 250.50,
        categoryId: 1,
        userId: 1,
        description: 'Обід у ресторані'
    });
    printSuccess(`Витрата створена: #${newExpense.id}`);
    
    const bgStatus = service.getBackgroundTasksStatus();
    printInfo(`Фонових задач заплановано: ${bgStatus.total}`);
    printInfo(`Статус: pending=${bgStatus.pending}, running=${bgStatus.running}, completed=${bgStatus.completed}`);

    // Чекаємо завершення фонових задач
    console.log('\n⏳ Очікування завершення фонових задач...');
    await service.waitForBackgroundTasks(3000);
    const finalStatus = service.getBackgroundTasksStatus();
    printSuccess(`Всі фонові задачі завершено: ${finalStatus.completed}/${finalStatus.total}`);

    // 4. Пакетне створення витрат
    console.log('\n4️⃣  Пакетне створення 10 витрат:');
    const batchData = Array.from({ length: 10 }, (_, i) => ({
        amount: (i + 1) * 50,
        categoryId: (i % 3) + 1,
        userId: 1,
        description: `Витрата #${i + 1}`
    }));

    const batchResult = await service.createMultipleExpenses(batchData);
    printSuccess(`Створено ${batchResult.successful.length} витрат за ${batchResult.totalTime}ms`);
    printInfo(`Середній час на витрату: ${Math.round(batchResult.totalTime / batchResult.successful.length)}ms`);

    // 5. Генерація звіту
    console.log('\n5️⃣  Генерація звіту з агрегованими даними:');
    const report = await service.generateReport(1, '2026-05-01', '2026-05-31');
    printSuccess(`Звіт згенеровано за ${report.summary.generationTime}ms`);
    printInfo(`Витрат у звіті: ${report.summary.totalExpenses}`);
    printInfo(`Загальна сума: ${report.summary.totalAmount}`);
}

async function demonstratePerformanceComparison() {
    printSection('ЧАСТИНА 2: Порівняння продуктивності');

    console.log('Порівнюємо послідовне та паралельне виконання...\n');
    const results = await benchmark();

    console.log('\n📊 АНАЛІЗ РЕЗУЛЬТАТІВ:');
    console.log('─'.repeat(70));
    
    if (results.speedup >= 2) {
        printSuccess(`Відмінне прискорення: ${results.speedup.toFixed(2)}x`);
    } else if (results.speedup >= 1.5) {
        printSuccess(`Хороше прискорення: ${results.speedup.toFixed(2)}x`);
    } else {
        printWarning(`Помірне прискорення: ${results.speedup.toFixed(2)}x`);
    }

    const timeSaved = results.slowTime - results.fastTime;
    const percentSaved = Math.round((1 - results.fastTime / results.slowTime) * 100);
    printInfo(`Економія часу: ${timeSaved}ms (${percentSaved}%)`);
    
    console.log('\n💡 ВИСНОВОК:');
    console.log('   Паралельне виконання значно швидше для I/O операцій');
    console.log('   (запити до БД, API, файлової системи)');
}

async function demonstrateErrorHandling() {
    printSection('ЧАСТИНА 3: Обробка помилок у паралельних запитах');

    console.log('Завантаження витрат, де одна не існує (ID=999)...\n');
    const result = await loadMultipleExpensesWithErrorHandling([1, 2, 999, 3, 4]);

    console.log('\n📊 РЕЗУЛЬТАТИ:');
    printSuccess(`Успішно завантажено: ${result.successful.length}`);
    printError(`Помилок: ${result.failed.length}`);
    
    console.log('\n💡 ВИСНОВОК:');
    console.log('   Promise.allSettled дозволяє обробити всі результати,');
    console.log('   навіть якщо деякі операції завершились помилкою');
}

async function demonstrateAdvancedFeatures() {
    printSection('ЧАСТИНА 4: Додаткові можливості');

    // Таймаути
    console.log('\n1️⃣  Таймаути для async операцій:');
    await demonstrateTimeout();

    // Retry механізм
    console.log('\n2️⃣  Retry механізм з exponential backoff:');
    await demonstrateRetry();
}

function printSummary() {
    printHeader('ПІДСУМОК ПР-12: АСИНХРОННЕ ПРОГРАМУВАННЯ');

    console.log('✅ Реалізовано:');
    console.log('   • Порівняння sequential vs parallel виконання');
    console.log('   • AsyncExpenseService з паралельними запитами');
    console.log('   • Фонові задачі (background tasks)');
    console.log('   • Обробка помилок через Promise.allSettled');
    console.log('   • Таймаути для async операцій');
    console.log('   • Retry механізм з exponential backoff');
    console.log('   • Пакетні операції');
    console.log('   • Генерація звітів з агрегованими даними');

    console.log('\n📈 Переваги async/await:');
    console.log('   • Прискорення I/O операцій у 2-3 рази');
    console.log('   • Кращий user experience (швидша відповідь)');
    console.log('   • Ефективне використання ресурсів');
    console.log('   • Можливість обробки багатьох запитів одночасно');

    console.log('\n🎓 Навички отримані:');
    console.log('   • Розуміння Event Loop та async/await');
    console.log('   • Promise.all vs Promise.allSettled');
    console.log('   • Фонові задачі без блокування');
    console.log('   • Proper error handling в async коді');
    console.log('   • Оптимізація продуктивності');

    console.log('\n' + colors.bright + colors.green);
    console.log('🎉 Практична робота 12 виконана успішно!');
    console.log(colors.reset);
}

// Головна функція
async function main() {
    try {
        printHeader('ПР-12: ДЕМОНСТРАЦІЯ АСИНХРОННОГО ПРОГРАМУВАННЯ');
        
        await demonstratePerformanceComparison();
        await demonstrateAsyncExpenseService();
        await demonstrateErrorHandling();
        await demonstrateAdvancedFeatures();
        
        printSummary();

    } catch (error) {
        console.error('\n' + colors.red + '❌ Помилка:', error.message + colors.reset);
        console.error(error.stack);
        process.exit(1);
    }
}

// Запуск
if (require.main === module) {
    main();
}

module.exports = { main };
