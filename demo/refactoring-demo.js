/**
 * Демонстрація рефакторингу - ПР-11
 * Порівняння "брудного" та "чистого" коду
 */

console.log('='.repeat(60));
console.log('ДЕМОНСТРАЦІЯ РЕФАКТОРИНГУ - ПР-11');
console.log('='.repeat(60));

// ============================================
// ЧАСТИНА 1: Демонстрація проблем у брудному коді
// ============================================

console.log('\n📋 ЧАСТИНА 1: Проблеми у брудному коді\n');

const badCode = require('./src/before_refactoring/taskServiceBad');

// Приклад 1: Незрозумілі параметри
console.log('❌ Проблема 1: Незрозумілі параметри');
console.log('   doStuff(x, y, z, a, b, c) - що це означає?');

// Приклад 2: Magic numbers
console.log('\n❌ Проблема 2: Magic numbers');
console.log('   if (x[i].status == 1) - що означає 1?');
console.log('   item.price * 0.85 - чому саме 0.85?');

// Приклад 3: SQL Injection
console.log('\n❌ Проблема 3: SQL Injection (КРИТИЧНО!)');
console.log('   "SELECT * FROM tasks WHERE id=" + id');
console.log('   Атакуючий може передати: "1 OR 1=1; DROP TABLE tasks;"');

// ============================================
// ЧАСТИНА 2: Демонстрація чистого коду
// ============================================

console.log('\n\n📋 ЧАСТИНА 2: Рефакторений код\n');

const {
    filterAndApplyDiscounts,
    TaskStatus,
    VIP_DISCOUNT_RATE,
    BULK_DISCOUNT_RATE
} = require('./src/refactored/taskService');

// Тестові дані
const testTasks = [
    { id: 1, status: TaskStatus.ACTIVE, priority: 3, price: 100, name: 'Task 1' },
    { id: 2, status: TaskStatus.PENDING, priority: 7, price: 600, name: 'Task 2' },
    { id: 3, status: TaskStatus.ACTIVE, priority: 2, price: 300, name: 'Task 3' },
    { id: 4, status: TaskStatus.PENDING, priority: 4, price: 200, name: 'Task 4' },
    null, // Перевірка на null
];

console.log('✅ Переваги рефакторингу:\n');

// Приклад 1: Зрозумілі параметри
console.log('1️⃣  Зрозумілі назви функцій та параметрів:');
console.log('   filterAndApplyDiscounts({ tasks, isVipCustomer })');

// Приклад 2: Константи замість magic numbers
console.log('\n2️⃣  Константи замість magic numbers:');
console.log(`   TaskStatus.ACTIVE = ${TaskStatus.ACTIVE}`);
console.log(`   VIP_DISCOUNT_RATE = ${VIP_DISCOUNT_RATE} (15%)`);
console.log(`   BULK_DISCOUNT_RATE = ${BULK_DISCOUNT_RATE} (5%)`);

// Приклад 3: Функціональний підхід
console.log('\n3️⃣  Сучасні методи масивів замість циклів:');
console.log('   tasks.filter(...).map(...)');

// Демонстрація роботи
console.log('\n\n📊 ДЕМОНСТРАЦІЯ РОБОТИ:\n');

console.log('Вхідні дані (5 задач, включаючи null):');
testTasks.forEach((task, i) => {
    if (task) {
        console.log(`  ${i + 1}. ${task.name}: status=${task.status}, priority=${task.priority}, price=$${task.price}`);
    } else {
        console.log(`  ${i + 1}. null (буде відфільтровано)`);
    }
});

// Тест 1: VIP клієнт
console.log('\n--- Тест 1: VIP клієнт (знижка 15%) ---');
const vipResult = filterAndApplyDiscounts({
    tasks: testTasks,
    isVipCustomer: true
});

console.log(`Результат: ${vipResult.length} задач після фільтрації`);
vipResult.forEach(task => {
    const discount = task.discountApplied;
    console.log(`  ✓ ${task.name}: $${task.price.toFixed(2)} (${discount} discount)`);
});

// Тест 2: Звичайний клієнт
console.log('\n--- Тест 2: Звичайний клієнт (знижка 5% на >$500) ---');
const regularResult = filterAndApplyDiscounts({
    tasks: testTasks,
    isVipCustomer: false
});

console.log(`Результат: ${regularResult.length} задач після фільтрації`);
regularResult.forEach(task => {
    const discount = task.discountApplied;
    console.log(`  ✓ ${task.name}: $${task.price.toFixed(2)} (${discount} discount)`);
});

// ============================================
// ЧАСТИНА 3: Порівняння безпеки
// ============================================

console.log('\n\n📋 ЧАСТИНА 3: Безпека SQL запитів\n');

console.log('❌ НЕБЕЗПЕЧНО (SQL Injection):');
console.log('   const query = "SELECT * FROM tasks WHERE id=" + userId;');
console.log('   Якщо userId = "1 OR 1=1", отримаємо всі записи!');

console.log('\n✅ БЕЗПЕЧНО (Параметризовані запити):');
console.log('   const query = "SELECT * FROM tasks WHERE id = ?";');
console.log('   db.get(query, [userId])');
console.log('   Параметри екрануються автоматично!');

// ============================================
// ЧАСТИНА 4: Метрики покращення
// ============================================

console.log('\n\n📊 МЕТРИКИ ПОКРАЩЕННЯ:\n');

const metrics = {
    'Читабельність': { before: '2/10', after: '9/10', improvement: '+350%' },
    'Підтримуваність': { before: '3/10', after: '9/10', improvement: '+200%' },
    'Безпека': { before: '1/10 (SQL Injection!)', after: '10/10', improvement: '+900%' },
    'Тестованість': { before: '2/10', after: '9/10', improvement: '+350%' },
    'Рядків коду': { before: '56', after: '220', improvement: 'Більше, але якісніше' }
};

console.log('┌─────────────────────┬──────────────┬──────────────┬──────────────┐');
console.log('│ Метрика             │ До           │ Після        │ Покращення   │');
console.log('├─────────────────────┼──────────────┼──────────────┼──────────────┤');

Object.entries(metrics).forEach(([metric, values]) => {
    const m = metric.padEnd(19);
    const b = values.before.padEnd(12);
    const a = values.after.padEnd(12);
    const i = values.improvement.padEnd(12);
    console.log(`│ ${m} │ ${b} │ ${a} │ ${i} │`);
});

console.log('└─────────────────────┴──────────────┴──────────────┴──────────────┘');

// ============================================
// ВИСНОВКИ
// ============================================

console.log('\n\n📝 ВИСНОВКИ:\n');

const conclusions = [
    '✅ Виправлено критичну вразливість SQL Injection',
    '✅ Замінено magic numbers на зрозумілі константи',
    '✅ Розбито великі функції на малі, зрозумілі частини',
    '✅ Додано JSDoc документацію',
    '✅ Використано сучасні методи масивів (filter, map)',
    '✅ Додано proper error handling з логуванням',
    '✅ Код став тестованим (можна легко писати unit tests)',
    '✅ Покращено читабельність та підтримуваність'
];

conclusions.forEach(conclusion => console.log(conclusion));

console.log('\n' + '='.repeat(60));
console.log('Рефакторинг завершено успішно! 🎉');
console.log('='.repeat(60) + '\n');
