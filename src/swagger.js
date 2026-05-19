const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Expense Tracker API',
    version: '1.0.0',
    description: 'OpenAPI-документація REST API для обліку особистих витрат'
  },
  servers: [{ url: 'http://localhost:8000', description: 'Локальний сервер' }],
  tags: [
    { name: 'Auth', description: 'Реєстрація та авторизація' },
    { name: 'Expenses', description: 'Операції з витратами' },
    { name: 'Categories', description: 'Категорії витрат' },
    { name: 'Reports', description: 'Звіти та аналітика' }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Перевірка працездатності сервера',
        responses: { 200: { description: 'Сервер працює' } }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Реєстрація користувача',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: { 201: { description: 'Користувача створено' }, 400: { description: 'Помилка валідації' } }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Авторизація користувача',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { 200: { description: 'Успішний вхід' }, 400: { description: 'Невірний email або пароль' } }
      }
    },
    '/api/expenses': {
      get: { tags: ['Expenses'], summary: 'Отримати список витрат', responses: { 200: { description: 'Список витрат отримано' } } },
      post: {
        tags: ['Expenses'],
        summary: 'Створити нову витрату',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExpenseCreate' } } } },
        responses: { 201: { description: 'Витрату створено' }, 400: { description: 'Помилка валідації' } }
      }
    },
    '/api/expenses/{id}': {
      get: { tags: ['Expenses'], summary: 'Отримати витрату за ID', parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: { description: 'Витрату знайдено' }, 404: { description: 'Витрату не знайдено' } } },
      put: { tags: ['Expenses'], summary: 'Оновити витрату за ID', parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: { description: 'Витрату оновлено' }, 404: { description: 'Витрату не знайдено' } } },
      delete: { tags: ['Expenses'], summary: 'Видалити витрату за ID', parameters: [{ $ref: '#/components/parameters/IdParam' }], responses: { 200: { description: 'Витрату видалено' }, 404: { description: 'Витрату не знайдено' } } }
    },
    '/api/categories': {
      get: { tags: ['Categories'], summary: 'Отримати список категорій', responses: { 200: { description: 'Список категорій отримано' } } }
    },
    '/api/reports': {
      get: { tags: ['Reports'], summary: 'Отримати звіт за витратами', responses: { 200: { description: 'Звіт сформовано' } } }
    }
  },
  components: {
    parameters: {
      IdParam: { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    },
    schemas: {
      RegisterRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', example: 'user@example.com' }, password: { type: 'string', example: 'secret123' }, name: { type: 'string', example: 'Denys' } } },
      LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
      ExpenseCreate: { type: 'object', required: ['amount', 'category', 'date'], properties: { amount: { type: 'number', example: 250.5 }, category: { type: 'string', example: 'Food' }, description: { type: 'string', example: 'Lunch' }, date: { type: 'string', format: 'date', example: '2026-05-19' } } }
    }
  }
};

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/openapi.json', (req, res) => res.json(swaggerSpec));
}

module.exports = { setupSwagger, swaggerSpec };
