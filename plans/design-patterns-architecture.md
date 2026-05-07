# Архітектурна діаграма породжуючих патернів

## Загальна структура системи

```mermaid
graph TB
    subgraph "Application Layer"
        APP[index.js - Application Entry Point]
    end
    
    subgraph "Singleton Pattern"
        CONFIG[AppConfig Singleton]
        ENV[.env variables]
        ENV --> CONFIG
    end
    
    subgraph "Controller Layer"
        CTRL[ExpenseController]
    end
    
    subgraph "Builder Pattern"
        BUILDER[ExpenseBuilder]
        BUILDER_DESC[.description]
        BUILDER_TAG[.tag]
        BUILDER_PAY[.paymentMethod]
        BUILDER_BUILD[.build]
        
        BUILDER --> BUILDER_DESC
        BUILDER_DESC --> BUILDER_TAG
        BUILDER_TAG --> BUILDER_PAY
        BUILDER_PAY --> BUILDER_BUILD
    end
    
    subgraph "Service Layer"
        SVC[ExpenseService]
    end
    
    subgraph "Factory Method Pattern"
        FACTORY[NotificationFactory]
        BASE[BaseNotifier]
        EMAIL[EmailNotifier]
        TELEGRAM[TelegramNotifier]
        CONSOLE[ConsoleNotifier]
        
        FACTORY -->|create| BASE
        BASE --> EMAIL
        BASE --> TELEGRAM
        BASE --> CONSOLE
    end
    
    subgraph "Repository Layer"
        REPO[ExpenseRepository]
    end
    
    subgraph "Database"
        DB[(PostgreSQL)]
    end
    
    APP --> CONFIG
    APP --> CTRL
    CTRL --> BUILDER
    BUILDER_BUILD --> SVC
    SVC --> REPO
    REPO --> DB
    SVC --> FACTORY
    CONFIG -.config.-> FACTORY
    
    style CONFIG fill:#ff9999
    style FACTORY fill:#99ccff
    style BUILDER fill:#99ff99
    style APP fill:#ffeb99
```

## Потік створення витрати з патернами

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Builder
    participant Service
    participant Factory
    participant Notifier
    participant Repository
    participant DB
    participant Config

    Client->>Controller: POST /expenses {amount, categoryId, ...}
    
    Note over Controller,Builder: Builder Pattern
    Controller->>Builder: new ExpenseBuilder(userId, categoryId, amount)
    Controller->>Builder: .description(text)
    Controller->>Builder: .paymentMethod(method)
    Controller->>Builder: .tag(tag)
    Controller->>Builder: .build()
    Builder-->>Controller: expense object
    
    Controller->>Service: create(expense)
    Service->>Repository: save(expense)
    Repository->>DB: INSERT INTO expenses
    DB-->>Repository: expense record
    Repository-->>Service: saved expense
    
    Note over Service,Notifier: Factory Method Pattern
    Service->>Config: get NOTIFICATION_CHANNEL
    Config-->>Service: channel type
    Service->>Factory: create(channel)
    Factory-->>Service: notifier instance
    Service->>Notifier: notifyExpenseCreated(user, expense)
    Notifier-->>Service: notification sent
    
    Service-->>Controller: expense + notification status
    Controller-->>Client: 201 Created {expense}
```

## Діаграма класів

```mermaid
classDiagram
    class AppConfig {
        -instance: AppConfig
        +PORT: number
        +NODE_ENV: string
        +DATABASE_URL: string
        +JWT_SECRET: string
        +NOTIFICATION_CHANNEL: string
        +getInstance() AppConfig
    }
    
    class ExpenseBuilder {
        -expense: Object
        +constructor(userId, categoryId, amount)
        +description(text) ExpenseBuilder
        +date(date) ExpenseBuilder
        +tag(tagName) ExpenseBuilder
        +paymentMethod(method) ExpenseBuilder
        +recurring(isRecurring) ExpenseBuilder
        +build() Expense
    }
    
    class NotificationFactory {
        -registry: Map
        +create(channel) BaseNotifier
        +register(name, notifierClass) void
    }
    
    class BaseNotifier {
        <<abstract>>
        +send(recipient, message) boolean
        +notifyExpenseCreated(recipient, expense) boolean
        +notifyExpenseUpdated(recipient, expense) boolean
        +notifyBudgetExceeded(recipient, budget) boolean
    }
    
    class EmailNotifier {
        +send(recipient, message) boolean
    }
    
    class TelegramNotifier {
        +send(recipient, message) boolean
    }
    
    class ConsoleNotifier {
        +send(recipient, message) boolean
    }
    
    class ExpenseService {
        -expenseRepository: ExpenseRepository
        +create(expense) Expense
        +update(id, expense) Expense
        +delete(id) boolean
        +getAll(userId, filters) Expense[]
    }
    
    BaseNotifier <|-- EmailNotifier
    BaseNotifier <|-- TelegramNotifier
    BaseNotifier <|-- ConsoleNotifier
    NotificationFactory ..> BaseNotifier : creates
    ExpenseService --> NotificationFactory : uses
    ExpenseService --> AppConfig : uses
    ExpenseBuilder ..> Expense : builds
```

## Патерни та принципи SOLID

### Singleton - AppConfig
**Принципи:**
- **Single Responsibility**: Управління конфігурацією
- **Open/Closed**: Закритий для модифікації, відкритий для розширення через змінні середовища

**Переваги:**
- Єдина точка доступу
- Контрольоване створення екземпляра
- Глобальний доступ без глобальних змінних

### Factory Method - NotificationFactory
**Принципи:**
- **Open/Closed**: Нові нотифікатори через register()
- **Dependency Inversion**: Залежність від абстракції BaseNotifier
- **Liskov Substitution**: Всі нотифікатори взаємозамінні

**Переваги:**
- Інкапсуляція логіки створення
- Легке тестування через мокування
- Розширюваність без зміни коду

### Builder - ExpenseBuilder
**Принципи:**
- **Single Responsibility**: Тільки створення об'єктів
- **Interface Segregation**: Fluent interface для зручності

**Переваги:**
- Читабельний код
- Валідація на кожному кроці
- Гнучкість у порядку параметрів

## Сценарії використання

### Сценарій 1: Створення витрати з нотифікацією
```javascript
// 1. Отримати конфігурацію (Singleton)
const config = require('./core/config');

// 2. Створити витрату (Builder)
const expense = new ExpenseBuilder(userId, categoryId, 150.50)
  .description('Покупка продуктів')
  .paymentMethod('card')
  .tag('groceries')
  .build();

// 3. Зберегти та відправити нотифікацію (Factory)
const saved = await expenseService.create(expense);
// Всередині create():
//   - Зберігає в БД
//   - Створює нотифікатор через Factory
//   - Відправляє повідомлення
```

### Сценарій 2: Додавання нового каналу нотифікацій
```javascript
// Створити новий нотифікатор
class SlackNotifier extends BaseNotifier {
  send(recipient, message) {
    // Slack API integration
    console.log(`[SLACK] ${recipient}: ${message}`);
    return true;
  }
}

// Зареєструвати без зміни фабрики (OCP)
NotificationFactory.register('slack', SlackNotifier);

// Використовувати
const notifier = NotificationFactory.create('slack');
notifier.send('#expenses', 'Нова витрата створена');
```

### Сценарій 3: Різні конфігурації для різних середовищ
```javascript
// Development
NOTIFICATION_CHANNEL=console npm run dev

// Production
NOTIFICATION_CHANNEL=email npm start

// Testing
NOTIFICATION_CHANNEL=console npm test
```

## Тестування патернів

### Unit тести
```javascript
// Singleton
test('AppConfig returns same instance', () => {
  const config1 = require('./core/config');
  const config2 = require('./core/config');
  expect(config1).toBe(config2);
});

// Factory
test('Factory creates correct notifier', () => {
  const notifier = NotificationFactory.create('email');
  expect(notifier).toBeInstanceOf(EmailNotifier);
});

// Builder
test('Builder creates valid expense', () => {
  const expense = new ExpenseBuilder(1, 5, 100)
    .description('Test')
    .build();
  expect(expense.amount).toBe(100);
  expect(expense.description).toBe('Test');
});
```

### Integration тести
```javascript
test('ExpenseService sends notification on create', async () => {
  const mockNotifier = jest.fn();
  NotificationFactory.register('mock', mockNotifier);
  
  const expense = await expenseService.create({...});
  
  expect(mockNotifier).toHaveBeenCalled();
});
```

## Метрики успіху

- ✅ Код відповідає принципам SOLID
- ✅ Покриття тестами > 80%
- ✅ Всі патерни інтегровані в проект
- ✅ Демо-скрипт працює без помилок
- ✅ Документація оновлена
- ✅ Pull Request створений та змержений

---

**Дата створення:** 2026-05-07  
**Автор:** Sidelnykov  
**Проект:** kpz-expensetracker
