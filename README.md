# kpz-expensetracker-Sidelnykov
# Expense Tracker

## Опис
Expense Tracker — це REST API для обліку особистих та командних витрат.
Застосунок дозволяє створювати категорії витрат, додавати транзакції та
переглядати аналітику і звіти за обраний період.

## Технології
- Мова програмування: Node.js 20
- Фреймворк: Express.js
- База даних: PostgreSQL
- ORM: Prisma
- Автентифікація: JWT (jsonwebtoken)
- Валідація: Zod
- Тестування: Jest + Supertest

## Структура проєкту

```
kpz-expensetracker/
├── src/
│   ├── routes/          # Маршрути Express (auth, expenses, categories)
│   ├── controllers/     # Логіка обробки запитів
│   ├── middleware/      # Автентифікація, валідація, помилки
│   ├── models/          # Схеми Prisma / моделі даних
│   └── index.js         # Точка входу застосунку
├── tests/               # Unit та integration тести
├── docs/
│   └── architecture.md  # Архітектурний опис системи
├── prisma/
│   └── schema.prisma    # Схема бази даних
├── .env.example         # Приклад змінних середовища
├── .gitignore
├── package.json
└── README.md
```

## Як запустити (буде доповнено)

```bash
# Встановити залежності
npm install

# Налаштувати змінні середовища
cp .env.example .env

# Запустити сервер у режимі розробки
npm run dev
```
