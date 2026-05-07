# Пояснення: Чому це НЕ Singleton?

## Завдання 8.1 - Додаткове завдання B

### Питання

Поясніть письмово (3-5 речень): чому наступний код НЕ є Singleton, хоча виглядає схоже?

```javascript
class Config {
  static data = {};  // змінна класу — спільна для всіх екземплярів

  set(key, value) {
    Config.data[key] = value;
  }
}

const c1 = new Config();
const c2 = new Config();
console.log(c1 === c2);  // False — це різні об'єкти, хоча data спільна
```

---

## Відповідь

### Коротке пояснення

Цей код **НЕ є Singleton**, тому що він дозволяє створювати **необмежену кількість екземплярів** класу `Config`. Хоча статична змінна `data` є спільною для всіх екземплярів, самі об'єкти `c1` та `c2` є **різними об'єктами в пам'яті** (`c1 !== c2`). Singleton патерн вимагає, щоб існував **тільки один екземпляр** класу, а тут ми можемо створити скільки завгодно екземплярів через `new Config()`.

---

## Детальне пояснення

### 1. Що таке Singleton?

**Singleton** — це породжуючий патерн проектування, який гарантує, що клас має **тільки один екземпляр**, і надає глобальну точку доступу до цього екземпляра.

**Ключові характеристики Singleton:**
- ✅ Тільки один екземпляр класу
- ✅ Приватний конструктор (або контроль створення)
- ✅ Статичний метод для отримання екземпляра
- ✅ Всі виклики повертають той самий об'єкт

### 2. Чому наведений код НЕ є Singleton?

#### Проблема 1: Необмежена кількість екземплярів

```javascript
const c1 = new Config();
const c2 = new Config();
const c3 = new Config();
// ... можна створити скільки завгодно

console.log(c1 === c2);  // false - різні об'єкти!
console.log(c2 === c3);  // false - різні об'єкти!
```

У Singleton має бути **тільки один екземпляр**:

```javascript
const config1 = AppConfig.getInstance();
const config2 = AppConfig.getInstance();

console.log(config1 === config2);  // true - той самий об'єкт!
```

#### Проблема 2: Відсутність контролю створення

Конструктор є **публічним**, тому будь-хто може створити новий екземпляр:

```javascript
// ❌ Не Singleton - публічний конструктор
class Config {
  constructor() {
    // Нічого не заважає створити новий екземпляр
  }
}

// ✅ Singleton - приватний конструктор
class AppConfig {
  static #instance = null;

  constructor() {
    if (AppConfig.#instance) {
      throw new Error('Використовуйте getInstance()');
    }
    AppConfig.#instance = this;
  }
}
```

#### Проблема 3: Спільна змінна ≠ Singleton

Статична змінна `data` є спільною для всіх екземплярів, але це **не робить клас Singleton**:

```javascript
class Config {
  static data = {};  // Спільна змінна

  set(key, value) {
    Config.data[key] = value;
  }
}

const c1 = new Config();
const c2 = new Config();

c1.set('name', 'John');
console.log(Config.data);  // { name: 'John' } - спільна змінна

// Але c1 та c2 - це різні об'єкти!
console.log(c1 === c2);  // false
```

Це схоже на **спільне сховище даних**, але не на Singleton.

---

## Порівняння: Не-Singleton vs Singleton

### ❌ Не-Singleton (наведений приклад)

```javascript
class Config {
  static data = {};

  set(key, value) {
    Config.data[key] = value;
  }

  get(key) {
    return Config.data[key];
  }
}

// Можна створити багато екземплярів
const c1 = new Config();
const c2 = new Config();
const c3 = new Config();

console.log(c1 === c2);  // false - різні об'єкти
console.log(c2 === c3);  // false - різні об'єкти

// Але data спільна
c1.set('x', 10);
console.log(c2.get('x'));  // 10 - спільна змінна
```

**Проблеми:**
- Можна створити необмежену кількість екземплярів
- Марнування пам'яті (кожен екземпляр займає місце)
- Немає гарантії єдиного екземпляра
- Плутанина: здається, що це Singleton, але це не так

### ✅ Правильний Singleton

```javascript
class AppConfig {
  static #instance = null;

  constructor() {
    if (AppConfig.#instance) {
      throw new Error('Використовуйте getInstance()');
    }
    this.data = {};
    AppConfig.#instance = this;
  }

  static getInstance() {
    if (!AppConfig.#instance) {
      AppConfig.#instance = new AppConfig();
    }
    return AppConfig.#instance;
  }

  set(key, value) {
    this.data[key] = value;
  }

  get(key) {
    return this.data[key];
  }
}

// Завжди той самий екземпляр
const c1 = AppConfig.getInstance();
const c2 = AppConfig.getInstance();
const c3 = AppConfig.getInstance();

console.log(c1 === c2);  // true - той самий об'єкт
console.log(c2 === c3);  // true - той самий об'єкт

// Спроба створити через new викине помилку
try {
  const c4 = new AppConfig();
} catch (error) {
  console.log(error.message);  // "Використовуйте getInstance()"
}
```

**Переваги:**
- ✅ Гарантовано один екземпляр
- ✅ Контрольоване створення
- ✅ Економія пам'яті
- ✅ Передбачувана поведінка

---

## Візуальне порівняння

### Не-Singleton (спільна змінна)

```
┌─────────────────────────────────────┐
│         Config.data (static)        │
│         { name: 'John' }            │
└─────────────────────────────────────┘
           ↑         ↑         ↑
           │         │         │
      ┌────┴───┐ ┌───┴────┐ ┌──┴─────┐
      │   c1   │ │   c2   │ │   c3   │
      │ (obj1) │ │ (obj2) │ │ (obj3) │
      └────────┘ └────────┘ └────────┘
      
      c1 !== c2 !== c3  ❌
      Різні об'єкти, спільна змінна
```

### Singleton

```
      ┌─────────────────────────────┐
      │      AppConfig Instance     │
      │      { data: {...} }        │
      └─────────────────────────────┘
           ↑         ↑         ↑
           │         │         │
          c1        c2        c3
          
      c1 === c2 === c3  ✅
      Той самий об'єкт
```

---

## Коли використовувати кожен підхід?

### Спільна статична змінна (не Singleton)

**Використовуйте, коли:**
- Потрібно спільне сховище даних між екземплярами
- Екземпляри мають різну поведінку або стан
- Не критично, скільки екземплярів створено

**Приклад:**
```javascript
class User {
  static allUsers = [];  // Спільний список всіх користувачів

  constructor(name) {
    this.name = name;
    User.allUsers.push(this);
  }
}

const user1 = new User('John');
const user2 = new User('Jane');
console.log(User.allUsers.length);  // 2
```

### Singleton

**Використовуйте, коли:**
- Потрібен **тільки один екземпляр** (конфігурація, логер, з'єднання з БД)
- Глобальна точка доступу
- Контроль над створенням екземпляра
- Ліниве завантаження (lazy initialization)

**Приклад:**
```javascript
class DatabaseConnection {
  static #instance = null;

  constructor() {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    this.connection = this.connect();
    DatabaseConnection.#instance = this;
  }

  connect() {
    // Підключення до БД (дороге)
    return { connected: true };
  }
}
```

---

## Висновок

Наведений код **НЕ є Singleton**, тому що:

1. **Дозволяє створювати необмежену кількість екземплярів** через `new Config()`
2. **Кожен виклик `new Config()` створює новий об'єкт** в пам'яті
3. **`c1 !== c2`** — це різні об'єкти, хоча вони мають доступ до спільної статичної змінної
4. **Відсутній контроль створення** — немає приватного конструктора або методу `getInstance()`
5. **Спільна статична змінна** — це лише спільне сховище даних, а не Singleton патерн

**Singleton вимагає:**
- ✅ Тільки один екземпляр класу
- ✅ Контроль створення (приватний конструктор)
- ✅ Статичний метод `getInstance()`
- ✅ Всі виклики повертають той самий об'єкт

---

**Дата:** 2026-05-07  
**Автор:** Sidelnykov  
**Проект:** kpz-expensetracker
