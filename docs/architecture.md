# Архітектура Expense Tracker

Проєкт реалізовано як REST API на Node.js + Express.js з шаровою архітектурою та MVC-подібною структурою.

## Шари

1. **Presentation Layer** — маршрути та контролери (`src/routes`, `src/controllers`).
2. **Business Logic Layer** — сервіси (`src/services`).
3. **Data Access Layer** — репозиторії та ORM (`src/repositories`, `prisma`).
4. **Database Layer** — SQLite або PostgreSQL.

## Рішення щодо якості коду

- **SRP**: кожен клас або модуль має одну відповідальність.
- **OCP**: нові формати експорту додаються через Factory без зміни клієнтського коду.
- **DIP**: сервіси приймають залежності через конструктор.
- **DRY**: повторювана логіка винесена в сервіси та middleware.
- **KISS**: архітектура залишається простою, без надмірного використання мікросервісів.

## Рисунки для звіту

- `docs/report-assets/figure-3-1-layered-architecture.png`
- `docs/report-assets/figure-3-2-swagger-openapi.png`
- `docs/report-assets/figure-3-3-er-diagram.png`
