# Expense Tracker

Expense Tracker — навчальний REST API для обліку особистих витрат. Проєкт підготовлено для оформлення звіту з дисципліни «Конструювання програмного забезпечення».

## Технології

- Node.js
- Express.js
- Swagger / OpenAPI
- Jest + Supertest
- Docker / docker-compose
- GitHub Actions
- Prisma schema як опис моделі БД

## Структура

```text
src/
├── controllers/
├── routes/
├── services/
├── repositories/
├── middleware/
├── core/
├── factories/
├── builders/
├── events/
├── strategies/
├── decorators/
├── facades/
├── async/
├── swagger.js
└── index.js
```

## Запуск

```bash
npm install
npm start
```

Сервер запускається на:

```text
http://localhost:8000
```

Swagger / OpenAPI:

```text
http://localhost:8000/api-docs
```

Health check:

```text
http://localhost:8000/health
```

## Тести

```bash
npm test
```

## Docker

```bash
docker build -t expense-tracker:local .
docker run -p 8000:8000 expense-tracker:local
```

Або:

```bash
docker-compose up --build
```

## Файли для звіту

- `docs/adr/001-architecture-style.md` — ADR для ПР-4.
- `src/swagger.js` — Swagger / OpenAPI для ПР-5.
- `docs/database/schema.sql` — SQL-схема БД для ПР-6.
- `docs/database/er-diagram.mmd` — ER-діаграма у Mermaid.
- `docs/report-assets/` — готові рисунки для вставки у звіт.
