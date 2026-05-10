# Code Review Analysis - ПР-11

## Аналіз "брудного" коду (JavaScript адаптація)

### Код для рев'ю: taskServiceBad.js

```javascript
function doStuff(x, y, z, a, b, c) {
    let data = [];
    for (let i = 0; i < x.length; i++) {
        if (x[i] != null) {
            if (x[i].status == 1) {
                data.push(x[i]);
            } else if (x[i].status == 2) {
                if (x[i].priority > 5) {
                    data.push(x[i]);
                }
            }
        }
    }
    let result = [];
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (y == true) {
            item.price = item.price * 0.85;
        } else if (y == false) {
            if (item.price > 500) {
                item.price = item.price * 0.95;
            }
        }
        result.push(item);
    }
    try {
        const fs = require('fs');
        fs.appendFileSync('log.txt', JSON.stringify(result));
    } catch (e) {
        // silent fail
    }
    return result;
}

class Manager {
    constructor() {
        const sqlite3 = require('sqlite3');
        this.db = new sqlite3.Database('tasks.db');
    }

    doTask(id, name, desc, prio, dead, uid, cat, tags, att, noti) {
        this.db.get("SELECT * FROM tasks WHERE id=" + id, (err, row) => {
            if (row != null) {
                this.db.run("UPDATE tasks SET name='" + name + "' WHERE id=" + id);
            }
            this.db.run("INSERT INTO logs VALUES (?,?,?)", [id, name, "updated"]);
        });
        return true;
    }
}
```

## Знайдені проблеми (Code Smells)

| Рядок(и) | Проблема | Пояснення та рішення |
|----------|----------|---------------------|
| 1 | **Unclear Function Name** | `doStuff` - абсолютно незрозуміла назва. Що робить функція? **Рішення:** Перейменувати на `filterAndApplyDiscounts` або `processTasksWithDiscounts` |
| 1 | **Long Parameter List** | 6 параметрів (x, y, z, a, b, c) - незрозумілі однолітерні назви. **Рішення:** Використати об'єкт параметрів або зменшити кількість, давши зрозумілі назви: `tasks`, `isVip`, тощо |
| 3-4 | **Magic Numbers** | Числа 1, 2, 5 без пояснення. Що означає `status == 1`? **Рішення:** Створити константи: `const STATUS_ACTIVE = 1; const STATUS_PENDING = 2; const PRIORITY_THRESHOLD = 5;` |
| 3, 14 | **Anti-pattern: Manual Loop** | `for (let i = 0; i < x.length; i++)` - можна використати сучасні методи масивів. **Рішення:** Використати `filter()`, `map()`, `forEach()` |
| 4 | **Loose Equality** | `x[i] != null` - використання `!=` замість `!==`. **Рішення:** Використати strict equality: `x[i] !== null` |
| 5, 7 | **Loose Equality** | `status == 1` - використання `==` замість `===`. **Рішення:** Завжди використовувати `===` |
| 17-22 | **Magic Numbers** | 0.85, 0.95, 500 - незрозумілі значення знижок. **Рішення:** Константи: `const VIP_DISCOUNT = 0.15; const BULK_DISCOUNT = 0.05; const BULK_THRESHOLD = 500;` |
| 17 | **Redundant Boolean Comparison** | `if (y == true)` - зайве порівняння. **Рішення:** Просто `if (y)` |
| 25-29 | **Silent Exception Handling** | Порожній catch block - помилка зникає без сліду. **Рішення:** Логувати помилку: `console.error('Failed to write log:', e)` або використати logger |
| 26 | **Synchronous File Operation** | `appendFileSync` блокує event loop. **Рішення:** Використати асинхронну версію `fs.promises.appendFile()` |
| 34 | **Import Inside Constructor** | `require('sqlite3')` всередині конструктора. **Рішення:** Імпорти на початку файлу |
| 39 | **SQL Injection** | `"SELECT * FROM tasks WHERE id=" + id` - критична вразливість безпеки! **Рішення:** Використати параметризовані запити: `"SELECT * FROM tasks WHERE id=?"` |
| 41 | **SQL Injection** | `"UPDATE tasks SET name='" + name + "'"` - ще одна SQL injection. **Рішення:** Параметризований запит |
| 38 | **Long Parameter List** | 10 параметрів у `doTask` - неможливо запам'ятати порядок. **Рішення:** Використати об'єкт: `doTask({ id, name, desc, ... })` |
| 40 | **Loose Equality** | `row != null` - використання `!=`. **Рішення:** `row !== null` |
| 38 | **Unclear Function Name** | `doTask` - що саме робить з task? **Рішення:** `updateTaskName` або більш конкретна назва |
| 39-44 | **Callback Hell** | Вкладені callback без обробки помилок. **Рішення:** Використати async/await або Promises |
| 44 | **Premature Return** | `return true` виконується до завершення async операцій. **Рішення:** Повернути Promise |

## Підсумок

**Всього знайдено: 17 проблем**

### Критичні проблеми (Security):
- **SQL Injection** (2 місця) - може призвести до витоку даних або видалення БД
- **Synchronous File I/O** - блокує event loop

### Серйозні проблеми (Maintainability):
- Silent exception handling - втрата помилок
- Callback hell без обробки помилок
- Premature return у async функції

### Середні проблеми (Code Quality):
- Незрозумілі назви функцій та параметрів
- Loose equality (`==` замість `===`)
- Magic numbers
- Застарілий стиль циклів замість функціональних методів

### Рекомендації:
1. **Негайно виправити SQL Injection** - це критична вразливість безпеки
2. Використати async/await замість callbacks
3. Додати proper exception handling з логуванням
4. Використати константи замість magic numbers
5. Використати сучасні методи масивів (filter, map, reduce)
6. Завжди використовувати strict equality (`===`)
