/**
 * Main application entry point
 * Expense Tracker API Server
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');
const { getLogger } = require('./core/logging');
const { setupSwagger } = require('./swagger');

const logger = getLogger('app');
const expensesRouter = require('./routes/expenses');
const categoriesRouter = require('./routes/categories');
const reportsRouter = require('./routes/reports');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip, userAgent: req.get('user-agent') });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: process.env.NODE_ENV || 'development' });
});

app.use('/api/auth', authRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/reports', reportsRouter);

// Swagger / OpenAPI documentation. Must be before 404 handler.
setupSwagger(app);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found`, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 Expense Tracker API started on port ${PORT}`, { environment: process.env.NODE_ENV || 'development', nodeVersion: process.version });
  });
}

module.exports = app;
