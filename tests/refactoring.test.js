/**
 * Тести для рефакторингу - ПР-11
 * Перевіряємо що рефакторинг не змінив поведінку
 */

const {
    filterAndApplyDiscounts,
    filterTasksByStatusAndPriority,
    applyDiscounts,
    calculateDiscountedPrice,
    TaskStatus,
    PRIORITY_THRESHOLD,
    VIP_DISCOUNT_RATE,
    BULK_DISCOUNT_RATE,
    BULK_ORDER_THRESHOLD
} = require('../src/refactored/taskService');

// Простий test runner
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${name}`);
    } catch (error) {
        testsFailed++;
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertArrayLength(array, expectedLength, message) {
    if (array.length !== expectedLength) {
        throw new Error(message || `Expected array length ${expectedLength}, got ${array.length}`);
    }
}

function assertCloseTo(actual, expected, tolerance = 0.01, message) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

console.log('='.repeat(60));
console.log('ТЕСТИ РЕФАКТОРИНГУ - ПР-11');
console.log('='.repeat(60));
console.log();

// ============================================
// Тести фільтрації
// ============================================

console.log('📋 Тести фільтрації задач:\n');

test('Фільтрує активні задачі', () => {
    const tasks = [
        { id: 1, status: TaskStatus.ACTIVE, priority: 3 },
        { id: 2, status: TaskStatus.PENDING, priority: 2 }
    ];
    const result = filterTasksByStatusAndPriority(tasks);
    assertArrayLength(result, 1, 'Має бути 1 активна задача');
    assertEqual(result[0].id, 1, 'Має бути задача з id=1');
});

test('Фільтрує pending задачі з високим пріоритетом', () => {
    const tasks = [
        { id: 1, status: TaskStatus.PENDING, priority: 7 },
        { id: 2, status: TaskStatus.PENDING, priority: 3 }
    ];
    const result = filterTasksByStatusAndPriority(tasks);
    assertArrayLength(result, 1, 'Має бути 1 pending задача з priority > 5');
    assertEqual(result[0].id, 1, 'Має бути задача з id=1');
});

test('Пропускає null та undefined', () => {
    const tasks = [
        { id: 1, status: TaskStatus.ACTIVE, priority: 3 },
        null,
        undefined,
        { id: 2, status: TaskStatus.ACTIVE, priority: 5 }
    ];
    const result = filterTasksByStatusAndPriority(tasks);
    assertArrayLength(result, 2, 'Має бути 2 задачі (null/undefined пропущені)');
});

test('Повертає порожній масив для порожнього вводу', () => {
    const result = filterTasksByStatusAndPriority([]);
    assertArrayLength(result, 0, 'Має бути порожній масив');
});

// ============================================
// Тести знижок
// ============================================

console.log('\n📋 Тести застосування знижок:\n');

test('Застосовує VIP знижку 15%', () => {
    const tasks = [{ id: 1, price: 100 }];
    const result = applyDiscounts(tasks, true);
    assertCloseTo(result[0].price, 85, 0.01, 'VIP знижка: 100 * 0.85 = 85');
    assertEqual(result[0].discountApplied, 'VIP', 'Має бути позначка VIP');
});

test('Застосовує bulk знижку 5% для замовлень >500', () => {
    const tasks = [{ id: 1, price: 600 }];
    const result = applyDiscounts(tasks, false);
    assertCloseTo(result[0].price, 570, 0.01, 'Bulk знижка: 600 * 0.95 = 570');
    assertEqual(result[0].discountApplied, 'BULK', 'Має бути позначка BULK');
});

test('Не застосовує знижку для звичайних замовлень <500', () => {
    const tasks = [{ id: 1, price: 300 }];
    const result = applyDiscounts(tasks, false);
    assertCloseTo(result[0].price, 300, 0.01, 'Без знижки: 300');
    assertEqual(result[0].discountApplied, 'NONE', 'Має бути позначка NONE');
});

test('VIP знижка має пріоритет над bulk', () => {
    const tasks = [{ id: 1, price: 600 }];
    const result = applyDiscounts(tasks, true);
    assertCloseTo(result[0].price, 510, 0.01, 'VIP знижка: 600 * 0.85 = 510');
    assertEqual(result[0].discountApplied, 'VIP', 'VIP має пріоритет');
});

test('Не мутує оригінальні об\'єкти', () => {
    const tasks = [{ id: 1, price: 100 }];
    const originalPrice = tasks[0].price;
    applyDiscounts(tasks, true);
    assertEqual(tasks[0].price, originalPrice, 'Оригінальна ціна не змінена');
});

// ============================================
// Тести розрахунку знижки
// ============================================

console.log('\n📋 Тести розрахунку знижки:\n');

test('Розраховує знижку 15% правильно', () => {
    const result = calculateDiscountedPrice(100, 0.15);
    assertCloseTo(result, 85, 0.01, '100 - 15% = 85');
});

test('Розраховує знижку 5% правильно', () => {
    const result = calculateDiscountedPrice(600, 0.05);
    assertCloseTo(result, 570, 0.01, '600 - 5% = 570');
});

test('Розраховує знижку 0% правильно', () => {
    const result = calculateDiscountedPrice(300, 0);
    assertCloseTo(result, 300, 0.01, '300 - 0% = 300');
});

// ============================================
// Інтеграційні тести
// ============================================

console.log('\n📋 Інтеграційні тести:\n');

test('Повний процес для VIP клієнта', () => {
    const tasks = [
        { id: 1, status: TaskStatus.ACTIVE, priority: 3, price: 100 },
        { id: 2, status: TaskStatus.PENDING, priority: 7, price: 600 },
        { id: 3, status: TaskStatus.PENDING, priority: 2, price: 200 }
    ];
    
    const result = filterAndApplyDiscounts({ tasks, isVipCustomer: true });
    
    assertArrayLength(result, 2, 'Має бути 2 задачі після фільтрації');
    assertCloseTo(result[0].price, 85, 0.01, 'Перша задача: 100 * 0.85');
    assertCloseTo(result[1].price, 510, 0.01, 'Друга задача: 600 * 0.85');
});

test('Повний процес для звичайного клієнта', () => {
    const tasks = [
        { id: 1, status: TaskStatus.ACTIVE, priority: 3, price: 100 },
        { id: 2, status: TaskStatus.PENDING, priority: 7, price: 600 },
        { id: 3, status: TaskStatus.ACTIVE, priority: 2, price: 300 }
    ];
    
    const result = filterAndApplyDiscounts({ tasks, isVipCustomer: false });
    
    assertArrayLength(result, 3, 'Має бути 3 задачі після фільтрації');
    assertCloseTo(result[0].price, 100, 0.01, 'Перша: без знижки');
    assertCloseTo(result[1].price, 570, 0.01, 'Друга: 600 * 0.95');
    assertCloseTo(result[2].price, 300, 0.01, 'Третя: без знижки');
});

test('Обробляє порожній масив', () => {
    const result = filterAndApplyDiscounts({ tasks: [], isVipCustomer: true });
    assertArrayLength(result, 0, 'Має бути порожній масив');
});

test('Кидає помилку для невалідного вводу', () => {
    try {
        filterAndApplyDiscounts({ tasks: 'not an array', isVipCustomer: true });
        throw new Error('Має кинути TypeError');
    } catch (error) {
        if (error.name !== 'TypeError') {
            throw error;
        }
    }
});

// ============================================
// Тести констант
// ============================================

console.log('\n📋 Тести констант:\n');

test('Константи мають правильні значення', () => {
    assertEqual(TaskStatus.ACTIVE, 1, 'ACTIVE = 1');
    assertEqual(TaskStatus.PENDING, 2, 'PENDING = 2');
    assertEqual(PRIORITY_THRESHOLD, 5, 'PRIORITY_THRESHOLD = 5');
    assertEqual(VIP_DISCOUNT_RATE, 0.15, 'VIP_DISCOUNT_RATE = 0.15');
    assertEqual(BULK_DISCOUNT_RATE, 0.05, 'BULK_DISCOUNT_RATE = 0.05');
    assertEqual(BULK_ORDER_THRESHOLD, 500, 'BULK_ORDER_THRESHOLD = 500');
});

// ============================================
// Результати
// ============================================

console.log('\n' + '='.repeat(60));
console.log('РЕЗУЛЬТАТИ ТЕСТУВАННЯ');
console.log('='.repeat(60));
console.log();
console.log(`Всього тестів:   ${testsRun}`);
console.log(`✅ Пройдено:     ${testsPassed}`);
console.log(`❌ Провалено:    ${testsFailed}`);
console.log();

if (testsFailed === 0) {
    console.log('🎉 Всі тести пройдено успішно!');
    console.log('✅ Рефакторинг не змінив поведінку коду');
} else {
    console.log('⚠️  Деякі тести провалились');
    console.log('❌ Потрібно виправити помилки');
    process.exit(1);
}

console.log();
console.log('='.repeat(60));
