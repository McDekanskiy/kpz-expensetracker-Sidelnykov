#!/usr/bin/env node

/**
 * Демонстрація породжуючих патернів проектування
 *
 * Цей скрипт демонструє роботу трьох патернів:
 * 1. Singleton - AppConfig
 * 2. Factory Method - NotificationFactory
 * 3. Builder - ExpenseBuilder
 *
 * Запуск: node demo/patterns-demo.js
 */

// Обгорнути весь код в async функцію для підтримки await
(async function main() {

console.log('\n' + '='.repeat(70));
console.log('  ДЕМОНСТРАЦІЯ ПОРОДЖУЮЧИХ ПАТЕРНІВ ПРОЕКТУВАННЯ');
console.log('  Expense Tracker Project');
console.log('='.repeat(70) + '\n');

// ============================================================================
// 1. SINGLETON PATTERN - AppConfig
// ============================================================================

console.log('📌 ПАТЕРН 1: SINGLETON - Конфігурація застосунку');
console.log('-'.repeat(70));

const config1 = require('../src/core/config');
const config2 = require('../src/core/config');
const { AppConfig } = require('../src/core/config');
const config3 = AppConfig.getInstance();

console.log('✓ Завантажено конфігурацію трьома способами:');
console.log('  - config1 = require("../src/core/config")');
console.log('  - config2 = require("../src/core/config")');
console.log('  - config3 = AppConfig.getInstance()');

console.log('\n✓ Перевірка Singleton:');
console.log(`  config1 === config2: ${config1 === config2}`);
console.log(`  config2 === config3: ${config2 === config3}`);
console.log(`  config1 === config3: ${config1 === config3}`);

console.log('\n✓ Параметри конфігурації:');
console.log(`  PORT:                 ${config1.PORT}`);
console.log(`  NODE_ENV:             ${config1.NODE_ENV}`);
console.log(`  DATABASE_URL:         ${config1.DATABASE_URL}`);
console.log(`  NOTIFICATION_CHANNEL: ${config1.NOTIFICATION_CHANNEL}`);
console.log(`  DEBUG:                ${config1.DEBUG}`);
console.log(`  LOG_LEVEL:            ${config1.LOG_LEVEL}`);

console.log('\n✓ Демонстрація Thread-safe async getInstance:');
(async () => {
  const asyncConfig1 = await AppConfig.getInstanceAsync();
  const asyncConfig2 = await AppConfig.getInstanceAsync();
  console.log(`  asyncConfig1 === asyncConfig2: ${asyncConfig1 === asyncConfig2}`);
  console.log(`  asyncConfig1 === config1: ${asyncConfig1 === config1}`);
})();

console.log('\n' + '='.repeat(70) + '\n');

// ============================================================================
// 2. FACTORY METHOD PATTERN - NotificationFactory
// ============================================================================

console.log('📌 ПАТЕРН 2: FACTORY METHOD - Система нотифікацій');
console.log('-'.repeat(70));

const { NotificationFactory, BaseNotifier } = require('../src/services/notificationFactory');

console.log('✓ Доступні канали нотифікацій:');
const channels = NotificationFactory.getAvailableChannels();
console.log(`  ${channels.join(', ')}`);

console.log('\n✓ Створення нотифікаторів через фабрику:');

// Email нотифікатор
console.log('\n  1️⃣  Email Notifier:');
const emailNotifier = NotificationFactory.create('email');
console.log(`     Тип: ${emailNotifier.constructor.name}`);
console.log(`     Успадковує BaseNotifier: ${emailNotifier instanceof BaseNotifier}`);

// Telegram нотифікатор
console.log('\n  2️⃣  Telegram Notifier:');
const telegramNotifier = NotificationFactory.create('telegram');
console.log(`     Тип: ${telegramNotifier.constructor.name}`);
console.log(`     Успадковує BaseNotifier: ${telegramNotifier instanceof BaseNotifier}`);

// Console нотифікатор
console.log('\n  3️⃣  Console Notifier:');
const consoleNotifier = NotificationFactory.create('console');
console.log(`     Тип: ${consoleNotifier.constructor.name}`);
console.log(`     Успадковує BaseNotifier: ${consoleNotifier instanceof BaseNotifier}`);

console.log('\n✓ Відправка тестових нотифікацій:');

// Тестова витрата для нотифікацій
const testExpense = {
  amount: 150.50,
  description: 'Покупка продуктів у супермаркеті',
  date: new Date(),
};

console.log('\n  📧 Email нотифікація:');
await emailNotifier.notifyExpenseCreated('user@example.com', testExpense);

console.log('\n  📱 Telegram нотифікація:');
await telegramNotifier.notifyExpenseCreated('123456789', testExpense);

console.log('\n  🖥️  Console нотифікація:');
await consoleNotifier.notifyExpenseCreated('test-user', testExpense);

// Демонстрація розширення через register()
console.log('\n✓ Розширення фабрики через register() (OCP принцип):');

class SlackNotifier extends BaseNotifier {
  async send(recipient, message) {
    console.log('\n' + '='.repeat(60));
    console.log('💬 SLACK NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`Channel: ${recipient}`);
    console.log(`Message:\n${message}`);
    console.log('='.repeat(60) + '\n');
    return true;
  }
}

NotificationFactory.register('slack', SlackNotifier);
console.log('  ✓ Зареєстровано новий канал: Slack');

const slackNotifier = NotificationFactory.create('slack');
console.log(`  ✓ Створено Slack нотифікатор: ${slackNotifier.constructor.name}`);

console.log('\n  💬 Slack нотифікація:');
await slackNotifier.notifyExpenseCreated('#expenses', testExpense);

console.log('✓ Оновлений список каналів:');
console.log(`  ${NotificationFactory.getAvailableChannels().join(', ')}`);

console.log('\n' + '='.repeat(70) + '\n');

// ============================================================================
// 3. BUILDER PATTERN - ExpenseBuilder
// ============================================================================

console.log('📌 ПАТЕРН 3: BUILDER - Конструктор витрат');
console.log('-'.repeat(70));

const { ExpenseBuilder, createSimpleExpense } = require('../src/models/expenseBuilder');

console.log('✓ Створення простої витрати:');
const simpleExpense = createSimpleExpense(1, 5, 50, 'Кава в кафе');
console.log('  const expense = createSimpleExpense(1, 5, 50, "Кава в кафе");');
console.log(`  Результат: ${JSON.stringify(simpleExpense, null, 2).split('\n').slice(0, 5).join('\n  ')}`);

console.log('\n✓ Створення складної витрати через Builder (Fluent Interface):');
console.log(`
  const expense = new ExpenseBuilder(1, 5, 250.75)
    .description('Покупка продуктів у супермаркеті Сільпо')
    .date(new Date('2024-01-15'))
    .tag('groceries')
    .tag('food')
    .tag('supermarket')
    .paymentMethod('card')
    .status('completed')
    .recurring(false)
    .attachment('receipt.pdf')
    .meta('location', 'Kyiv')
    .meta('store', 'Silpo')
    .build();
`);

const complexExpense = new ExpenseBuilder(1, 5, 250.75)
  .description('Покупка продуктів у супермаркеті Сільпо')
  .date(new Date('2024-01-15'))
  .tag('groceries')
  .tag('food')
  .tag('supermarket')
  .paymentMethod('card')
  .status('completed')
  .recurring(false)
  .attachment('receipt.pdf')
  .meta('location', 'Kyiv')
  .meta('store', 'Silpo')
  .build();

console.log('✓ Результат:');
console.log(JSON.stringify(complexExpense, null, 2));

console.log('\n✓ Валідація Builder:');

// Демонстрація валідації
console.log('\n  1️⃣  Валідація суми:');
try {
  new ExpenseBuilder(1, 5, -10);
} catch (error) {
  console.log(`     ❌ Помилка: ${error.message}`);
}

console.log('\n  2️⃣  Валідація дати:');
try {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  new ExpenseBuilder(1, 5, 100).date(futureDate);
} catch (error) {
  console.log(`     ❌ Помилка: ${error.message}`);
}

console.log('\n  3️⃣  Валідація методу оплати:');
try {
  new ExpenseBuilder(1, 5, 100).paymentMethod('bitcoin');
} catch (error) {
  console.log(`     ❌ Помилка: ${error.message}`);
}

console.log('\n✓ Переваги Builder:');
console.log('  ✓ Читабельний код (як природна мова)');
console.log('  ✓ Валідація на кожному кроці');
console.log('  ✓ Гнучкість у порядку параметрів');
console.log('  ✓ Значення за замовчуванням');
console.log('  ✓ Immutability (build() повертає копію)');

console.log('\n' + '='.repeat(70) + '\n');

// ============================================================================
// ІНТЕГРАЦІЯ ПАТЕРНІВ
// ============================================================================

console.log('📌 ІНТЕГРАЦІЯ ВСІХ ТРЬОХ ПАТЕРНІВ');
console.log('-'.repeat(70));

console.log('\n✓ Реальний сценарій: Створення витрати з нотифікацією\n');

// 1. Отримати конфігурацію (Singleton)
const config = require('../src/core/config');
console.log(`1️⃣  Отримано конфігурацію (Singleton)`);
console.log(`   Канал нотифікацій: ${config.NOTIFICATION_CHANNEL}`);

// 2. Створити витрату (Builder)
const newExpense = new ExpenseBuilder(1, 5, 350.00)
  .description('Оплата інтернету')
  .paymentMethod('card')
  .tag('utilities')
  .tag('internet')
  .build();

console.log(`\n2️⃣  Створено витрату (Builder)`);
console.log(`   Сума: ${newExpense.amount} грн`);
console.log(`   Опис: ${newExpense.description}`);
console.log(`   Теги: ${newExpense.tags.join(', ')}`);

// 3. Відправити нотифікацію (Factory Method)
const notifier = NotificationFactory.create(config.NOTIFICATION_CHANNEL);
console.log(`\n3️⃣  Створено нотифікатор (Factory Method)`);
console.log(`   Тип: ${notifier.constructor.name}`);

console.log(`\n4️⃣  Відправка нотифікації:`);
await notifier.notifyExpenseCreated('user@example.com', newExpense);

console.log('\n' + '='.repeat(70) + '\n');

// ============================================================================
// ПІДСУМОК
// ============================================================================

console.log('📊 ПІДСУМОК');
console.log('-'.repeat(70));

console.log(`
✅ SINGLETON (AppConfig)
   • Єдиний екземпляр конфігурації
   • Thread-safe реалізація
   • Централізований доступ до налаштувань

✅ FACTORY METHOD (NotificationFactory)
   • Створення різних типів нотифікаторів
   • Розширюваність через register()
   • Відповідність принципу OCP

✅ BUILDER (ExpenseBuilder)
   • Зручне створення складних об'єктів
   • Fluent Interface
   • Валідація на кожному кроці

🎯 Всі патерни успішно реалізовані та інтегровані!
`);

console.log('='.repeat(70));
console.log('  ДЕМОНСТРАЦІЯ ЗАВЕРШЕНА');
console.log('='.repeat(70) + '\n');

})().catch(error => {
  console.error('Помилка виконання демо-скрипту:', error);
  process.exit(1);
});
