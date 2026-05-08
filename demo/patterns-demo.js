/**
 * Демонстрація поведінкових та структурних патернів
 * ПР-9: Observer, Strategy, Decorator, Facade
 * 
 * Запуск: node demo/patterns-demo.js
 */

console.log('='.repeat(60));
console.log('ПАТЕРНИ ПРОЕКТУВАННЯ — ДЕМОНСТРАЦІЯ ПР-9');
console.log('Observer, Strategy, Decorator, Facade');
console.log('='.repeat(60));

// ============================================================
// 1. OBSERVER PATTERN - Підписка на події
// ============================================================
console.log('\n--- 1. Observer Pattern: Система подій витрат ---\n');

const {
    ExpenseSubject,
    ActivityLogObserver,
    StatisticsObserver,
    EmailNotificationObserver,
    BudgetAlertObserver
} = require('../src/observers/expenseObserver');

// Створюємо Subject (об'єкт за яким спостерігають)
const expenseEvents = new ExpenseSubject();

// Створюємо спостерігачів
const activityLog = new ActivityLogObserver();
const statistics = new StatisticsObserver();
const emailNotifier = new EmailNotificationObserver();
const budgetAlert = new BudgetAlertObserver(3000); // Бюджет 3000 UAH

// Підписуємо спостерігачів
expenseEvents.subscribe(activityLog);
expenseEvents.subscribe(statistics);
expenseEvents.subscribe(emailNotifier);
expenseEvents.subscribe(budgetAlert);

console.log('\n📢 Створюємо витрати та спостерігаємо за подіями:\n');

// Генеруємо події
expenseEvents.notify(1, 'created', {
    amount: 500,
    currency: 'UAH',
    description: 'Продукти в супермаркеті',
    category: 'Їжа'
});

expenseEvents.notify(2, 'created', {
    amount: 1500,
    currency: 'UAH',
    description: 'Новий ноутбук',
    category: 'Техніка'
});

expenseEvents.notify(3, 'created', {
    amount: 800,
    currency: 'UAH',
    description: 'Оплата комунальних послуг',
    category: 'Комунальні'
});

expenseEvents.notify(2, 'updated', {
    oldAmount: 1500,
    newAmount: 1400
});

console.log('\n📊 Фінальна статистика:');
console.log(statistics.getStats());

// ============================================================
// 2. STRATEGY PATTERN - Різні алгоритми сортування
// ============================================================
console.log('\n\n--- 2. Strategy Pattern: Сортування витрат ---\n');

const {
    ExpenseList,
    SortByDateStrategy,
    SortByAmountStrategy,
    SortByCategoryStrategy,
    SortStrategyFactory
} = require('../src/strategies/sortStrategy');

// Тестові дані
const expenses = [
    { id: 1, amount: 500, category: 'Їжа', description: 'Продукти', date: '2026-05-01' },
    { id: 2, amount: 1500, category: 'Техніка', description: 'Ноутбук', date: '2026-05-05' },
    { id: 3, amount: 300, category: 'Транспорт', description: 'Таксі', date: '2026-05-03' },
    { id: 4, amount: 800, category: 'Комунальні', description: 'Електрика', date: '2026-05-07' },
    { id: 5, amount: 200, category: 'Їжа', description: 'Кафе', date: '2026-05-02' }
];

// Створюємо список витрат
const expenseList = new ExpenseList();
expenseList.addExpenses(expenses);

console.log('📋 Оригінальний список витрат:');
expenses.forEach(e => console.log(`  #${e.id}: ${e.amount} UAH - ${e.description} (${e.category})`));

// Сортування за датою
console.log('\n🔄 Сортування за датою (найновіші спочатку):');
expenseList.setStrategy(new SortByDateStrategy());
const sortedByDate = expenseList.getSorted();
sortedByDate.slice(0, 3).forEach(e => console.log(`  ${e.date}: ${e.description} - ${e.amount} UAH`));

// Сортування за сумою
console.log('\n💰 Сортування за сумою (від більшої до меншої):');
expenseList.setStrategy(new SortByAmountStrategy());
const sortedByAmount = expenseList.getSorted();
sortedByAmount.slice(0, 3).forEach(e => console.log(`  ${e.amount} UAH - ${e.description}`));

// Сортування за категорією
console.log('\n📁 Сортування за категорією (алфавітно):');
expenseList.setStrategy(new SortByCategoryStrategy());
const sortedByCategory = expenseList.getSorted();
sortedByCategory.forEach(e => console.log(`  [${e.category}] ${e.description} - ${e.amount} UAH`));

// Використання фабрики стратегій
console.log('\n🏭 Використання SortStrategyFactory:');
const strategy = SortStrategyFactory.create('amount');
expenseList.setStrategy(strategy);
console.log(`Доступні стратегії: ${SortStrategyFactory.getAvailable().join(', ')}`);

// ============================================================
// 3. DECORATOR PATTERN - Розширення функціональності
// ============================================================
console.log('\n\n--- 3. Decorator Pattern: Кешування та логування ---\n');

const {
    timer,
    cache,
    logCall,
    compose
} = require('../src/decorators/functionDecorators');

// Функція для декорування
function calculateExpenseTotal(expenses) {
    // Імітація складних обчислень
    let total = 0;
    for (let i = 0; i < 1000000; i++) {
        total = expenses.reduce((sum, e) => sum + e.amount, 0);
    }
    return total;
}

console.log('🎨 Декоруємо функцію calculateExpenseTotal:\n');

// Застосування декораторів окремо
const timedCalculate = timer(calculateExpenseTotal);
const cachedCalculate = cache(calculateExpenseTotal);

console.log('⏱️  З декоратором timer:');
timedCalculate(expenses);

console.log('\n💾 З декоратором cache (перший виклик):');
cachedCalculate(expenses);

console.log('\n💾 З декоратором cache (другий виклик - з кешу):');
cachedCalculate(expenses);

// Композиція декораторів
console.log('\n🎭 Композиція декораторів (timer + cache + logCall):');
const fullyDecorated = compose(timer, cache, logCall)(calculateExpenseTotal);
fullyDecorated(expenses);

// Приклад з валідацією
console.log('\n✅ Декоратор з валідацією:');
const { validate } = require('../src/decorators/functionDecorators');

function addExpense(amount, description) {
    return { amount, description, id: Date.now() };
}

const validatedAddExpense = validate((amount, description) => {
    if (amount <= 0) return 'Сума має бути більше 0';
    if (!description || description.length < 3) return 'Опис занадто короткий';
    return true;
})(addExpense);

try {
    console.log('Спроба додати коректну витрату:');
    const expense = validatedAddExpense(100, 'Тестова витрата');
    console.log('✓ Витрата створена:', expense);
} catch (error) {
    console.error('✗ Помилка:', error.message);
}

try {
    console.log('\nСпроба додати некоректну витрату (сума = 0):');
    validatedAddExpense(0, 'Некоректна');
} catch (error) {
    console.error('✗ Помилка:', error.message);
}

// ============================================================
// 4. FACADE PATTERN - Спрощений інтерфейс
// ============================================================
console.log('\n\n--- 4. Facade Pattern: Спрощення складних операцій ---\n');

const ExpenseFacade = require('../src/facades/expenseFacade');

// Мок-репозиторії та сервіси
const mockExpenseRepo = {
    expenses: [],
    nextId: 1,
    
    async create(data) {
        const expense = { ...data, id: this.nextId++ };
        this.expenses.push(expense);
        return expense;
    },
    
    async findById(id) {
        return this.expenses.find(e => e.id === id);
    },
    
    async findByUserId(userId) {
        return this.expenses.filter(e => e.userId === userId);
    },
    
    async update(id, updates) {
        const expense = await this.findById(id);
        if (expense) {
            Object.assign(expense, updates);
        }
        return expense;
    },
    
    async delete(id) {
        const index = this.expenses.findIndex(e => e.id === id);
        if (index > -1) {
            this.expenses.splice(index, 1);
        }
    }
};

const mockUserRepo = {
    async findById(id) {
        return { id, email: `user${id}@example.com`, name: `User ${id}` };
    }
};

const mockNotificationService = {
    async send(email, message) {
        console.log(`  📧 Email відправлено на ${email}: ${message}`);
    }
};

// Створюємо Facade
const facade = new ExpenseFacade(mockExpenseRepo, mockUserRepo, mockNotificationService);

// Підписуємо спостерігачів до Facade
const facadeStats = new StatisticsObserver();
facade.subscribeToEvents(facadeStats);

console.log('🏢 ExpenseFacade створено та налаштовано\n');

// Демонстрація роботи Facade
(async () => {
    try {
        console.log('1️⃣  Створення витрати через Facade (одна функція - багато операцій):');
        const expense1 = await facade.createExpenseForUser(1, {
            amount: 1200,
            currency: 'UAH',
            description: 'Оплата за інтернет',
            category: 'Комунальні'
        });
        console.log(`   ✓ Витрата #${expense1.id} створена\n`);

        console.log('2️⃣  Створення ще кількох витрат:');
        await facade.createExpenseForUser(1, {
            amount: 450,
            currency: 'UAH',
            description: 'Продукти в магазині',
            category: 'Їжа'
        });
        
        await facade.createExpenseForUser(1, {
            amount: 2500,
            currency: 'UAH',
            description: 'Новий телефон',
            category: 'Техніка'
        });
        console.log('   ✓ Витрати створені\n');

        console.log('3️⃣  Отримання витрат з сортуванням:');
        const userExpenses = await facade.getUserExpenses(1, {
            sortBy: 'amount',
            limit: 5
        });
        console.log(`   Знайдено ${userExpenses.length} витрат:`);
        userExpenses.forEach(e => {
            console.log(`   - ${e.amount} UAH: ${e.description}`);
        });

        console.log('\n4️⃣  Генерація звіту:');
        const report = await facade.generateReport(1);
        console.log(`   📊 Всього витрат: ${report.totalExpenses}`);
        console.log(`   💰 Загальна сума: ${report.totalAmount.toFixed(2)} UAH`);
        console.log(`   📈 Середня витрата: ${report.averageAmount.toFixed(2)} UAH`);
        console.log(`   📁 Категорії:`, Object.keys(report.byCategory).join(', '));

        console.log('\n5️⃣  Статистика з Observer:');
        console.log('   ', facadeStats.getStats());

        console.log('\n6️⃣  Оновлення витрати:');
        await facade.updateExpense(1, 1, { amount: 1300 });
        console.log('   ✓ Витрата оновлена');

        console.log('\n7️⃣  Видалення витрати:');
        await facade.deleteExpense(2, 1);
        console.log('   ✓ Витрата видалена');

        console.log('\n📊 Фінальна статистика Facade:');
        console.log('   ', facade.getStats());

    } catch (error) {
        console.error('❌ Помилка:', error.message);
    }

    // Підсумок
    console.log('\n' + '='.repeat(60));
    console.log('✅ ДЕМОНСТРАЦІЯ ЗАВЕРШЕНА');
    console.log('='.repeat(60));
    console.log('\nРеалізовані патерни:');
    console.log('  ✓ Observer - система подій з 4 спостерігачами');
    console.log('  ✓ Strategy - 5 стратегій сортування + фабрика');
    console.log('  ✓ Decorator - 10+ декораторів для функцій');
    console.log('  ✓ Facade - спрощений інтерфейс до складної підсистеми');
    console.log('\n💡 Всі патерни працюють разом у ExpenseFacade!');
    console.log('='.repeat(60) + '\n');
})();
