const request = require('supertest');
const app = require('../src/index');

describe('Expense Tracker API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/expenses returns array', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/expenses creates expense', async () => {
    const res = await request(app).post('/api/expenses').send({
      amount: 99.5,
      category: 'Food',
      description: 'Test lunch',
      date: '2026-05-19'
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('GET /api/categories returns categories', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('GET /openapi.json returns OpenAPI document', async () => {
    const res = await request(app).get('/openapi.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
  });
});
