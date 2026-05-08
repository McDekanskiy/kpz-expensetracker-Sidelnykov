/**
 * Demo Script for ПР-10: Error Handling, Logging, and Validation
 * Demonstrates all implemented features
 */

const { setupLogging, getLogger } = require('../src/core/logging');
const ExpenseValidator = require('../src/validators/expenseValidator');
const {
  ValidationError,
  ExpenseNotFoundError,
  InvalidAmountError,
  DatabaseError
} = require('../src/exceptions');

// Initialize logging
console.log('='.repeat(70));
console.log('ПР-10: ДЕМОНСТРАЦІЯ ОБРОБКИ ПОМИЛОК, ЛОГУВАННЯ ТА ВАЛІДАЦІЇ');
console.log('='.repeat(70));
console.log();

// Setup logging in TEXT format for demo
setupLogging({ level: 'DEBUG', jsonFormat: false });

const logger = getLogger('Demo');

// ============================================================================
// DEMO 1: Logging at Different Levels
// ============================================================================
function demoLogging() {
  console.log('\n--- DEMO 1: Logging at Different Levels ---\n');
  
  logger.debug('This is a DEBUG message - detailed diagnostic info');
  logger.info('This is an INFO message - normal operation confirmed');
  logger.warning('This is a WARNING message - unexpected but handled', { 
    slowQuery: true, 
    duration: '2500ms' 
  });
  logger.error('This is an ERROR message - operation failed', { 
    operation: 'database_query',
    reason: 'timeout' 
  });
  logger.critical('This is a CRITICAL message - system failure!');
}

// ============================================================================
// DEMO 2: Exception Hierarchy
// ============================================================================
function demoExceptions() {
  console.log('\n--- DEMO 2: Custom Exception Hierarchy ---\n');
  
  // ValidationError
  try {
    throw new ValidationError('email', 'Invalid email format');
  } catch (error) {
    logger.error('Caught ValidationError', { 
      code: error.code, 
      field: error.field,
      message: error.message 
    });
    console.log('  JSON:', JSON.stringify(error.toJSON(), null, 2));
  }
  
  console.log();
  
  // ExpenseNotFoundError
  try {
    throw new ExpenseNotFoundError(12345);
  } catch (error) {
    logger.error('Caught ExpenseNotFoundError', { 
      code: error.code,
      expenseId: error.expenseId 
    });
    console.log('  JSON:', JSON.stringify(error.toJSON(), null, 2));
  }
  
  console.log();
  
  // InvalidAmountError
  try {
    throw new InvalidAmountError(-100);
  } catch (error) {
    logger.error('Caught InvalidAmountError', { 
      code: error.code,
      amount: error.amount 
    });
  }
  
  console.log();
  
  // DatabaseError
  try {
    throw new DatabaseError('insert', 'Connection timeout after 30s');
  } catch (error) {
    logger.error('Caught DatabaseError', { 
      code: error.code,
      operation: error.operation,
      detail: error.detail 
    });
  }
}

// ============================================================================
// DEMO 3: Validation - Success Cases
// ============================================================================
function demoValidationSuccess() {
  console.log('\n--- DEMO 3: Validation - Success Cases ---\n');
  
  const validExpense = {
    amount: 150.50,
    description: 'Grocery shopping at supermarket',
    category: 'food',
    date: '2026-05-08',
    userId: 1
  };
  
  logger.info('Validating expense data', { data: validExpense });
  
  try {
    const sanitized = ExpenseValidator.validateCreate(validExpense);
    logger.info('✓ Validation passed!', { sanitized });
    console.log('  Sanitized data:', JSON.stringify(sanitized, null, 2));
  } catch (error) {
    logger.error('Validation failed', { error: error.message });
  }
}

// ============================================================================
// DEMO 4: Validation - Error Cases
// ============================================================================
function demoValidationErrors() {
  console.log('\n--- DEMO 4: Validation - Error Cases ---\n');
  
  const testCases = [
    {
      name: 'Missing amount',
      data: { description: 'Test', category: 'food', userId: 1 }
    },
    {
      name: 'Negative amount',
      data: { amount: -50, description: 'Test', category: 'food', userId: 1 }
    },
    {
      name: 'Description too short',
      data: { amount: 100, description: 'Hi', category: 'food', userId: 1 }
    },
    {
      name: 'Invalid category',
      data: { amount: 100, description: 'Test expense', category: 'invalid_category', userId: 1 }
    },
    {
      name: 'Future date',
      data: { amount: 100, description: 'Test expense', category: 'food', date: '2027-12-31', userId: 1 }
    },
    {
      name: 'Missing userId',
      data: { amount: 100, description: 'Test expense', category: 'food' }
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n  Test ${index + 1}: ${testCase.name}`);
    try {
      ExpenseValidator.validateCreate(testCase.data);
      logger.info('Validation passed (unexpected)');
    } catch (error) {
      if (error instanceof ValidationError || error instanceof InvalidAmountError) {
        logger.warning('✓ Validation correctly rejected', { 
          field: error.field,
          code: error.code,
          message: error.message 
        });
      } else {
        logger.error('Unexpected error', { error: error.message });
      }
    }
  });
}

// ============================================================================
// DEMO 5: Update Validation
// ============================================================================
function demoUpdateValidation() {
  console.log('\n--- DEMO 5: Update Validation ---\n');
  
  const updateData = {
    amount: 200.00,
    description: 'Updated description'
  };
  
  logger.info('Validating update data', { data: updateData });
  
  try {
    const sanitized = ExpenseValidator.validateUpdate(updateData);
    logger.info('✓ Update validation passed!', { sanitized });
    console.log('  Sanitized data:', JSON.stringify(sanitized, null, 2));
  } catch (error) {
    logger.error('Update validation failed', { error: error.message });
  }
}

// ============================================================================
// DEMO 6: Query Parameter Validation
// ============================================================================
function demoQueryValidation() {
  console.log('\n--- DEMO 6: Query Parameter Validation ---\n');
  
  const queryParams = {
    category: 'food',
    startDate: '2026-01-01',
    endDate: '2026-05-08',
    limit: 10,
    offset: 0
  };
  
  logger.info('Validating query parameters', { params: queryParams });
  
  try {
    const sanitized = ExpenseValidator.validateQuery(queryParams);
    logger.info('✓ Query validation passed!', { sanitized });
    console.log('  Sanitized params:', JSON.stringify(sanitized, null, 2));
  } catch (error) {
    logger.error('Query validation failed', { error: error.message });
  }
}

// ============================================================================
// DEMO 7: Simulated Service Operation with Error Handling
// ============================================================================
function demoServiceOperation() {
  console.log('\n--- DEMO 7: Simulated Service Operation ---\n');
  
  const serviceLogger = getLogger('ExpenseService');
  
  // Simulate creating an expense
  serviceLogger.info('Creating new expense', { userId: 1, category: 'food' });
  serviceLogger.debug('Validating expense data');
  
  try {
    const data = {
      amount: 75.25,
      description: 'Lunch at restaurant',
      category: 'food',
      userId: 1
    };
    
    const validated = ExpenseValidator.validateCreate(data);
    serviceLogger.debug('Validation successful', { validated });
    
    serviceLogger.debug('Checking user exists', { userId: 1 });
    // Simulate user check
    const userExists = true;
    
    if (!userExists) {
      throw new Error('User not found');
    }
    
    serviceLogger.debug('Saving to database');
    // Simulate database save
    const expense = { id: 101, ...validated, createdAt: new Date().toISOString() };
    
    serviceLogger.info('Expense created successfully', { 
      expenseId: expense.id,
      amount: expense.amount,
      category: expense.category 
    });
    
    console.log('  Created expense:', JSON.stringify(expense, null, 2));
    
  } catch (error) {
    serviceLogger.error('Failed to create expense', { 
      error: error.message,
      stack: error.stack 
    });
  }
}

// ============================================================================
// DEMO 8: JSON Logging Format
// ============================================================================
function demoJSONLogging() {
  console.log('\n--- DEMO 8: JSON Logging Format ---\n');
  console.log('Switching to JSON format...\n');
  
  // Create logger with JSON format
  const jsonLogger = getLogger('JSONDemo');
  jsonLogger.jsonFormat = true;
  jsonLogger.minLevel = 0; // DEBUG
  
  jsonLogger.info('This is JSON formatted log', { 
    userId: 42,
    action: 'create_expense',
    amount: 100.50 
  });
  
  jsonLogger.error('Error in JSON format', { 
    error: new Error('Sample error'),
    context: { operation: 'database_query' }
  });
  
  console.log('\nJSON logs are ideal for production monitoring systems like:');
  console.log('  - Grafana');
  console.log('  - Datadog');
  console.log('  - ELK Stack (Elasticsearch, Logstash, Kibana)');
  console.log('  - AWS CloudWatch');
}

// ============================================================================
// Run All Demos
// ============================================================================
function runAllDemos() {
  try {
    demoLogging();
    demoExceptions();
    demoValidationSuccess();
    demoValidationErrors();
    demoUpdateValidation();
    demoQueryValidation();
    demoServiceOperation();
    demoJSONLogging();
    
    console.log('\n' + '='.repeat(70));
    console.log('✓ ДЕМОНСТРАЦІЯ ЗАВЕРШЕНА УСПІШНО!');
    console.log('='.repeat(70));
    console.log('\nРеалізовано:');
    console.log('  ✓ Ієрархія власних виключень (12+ класів)');
    console.log('  ✓ Структуроване логування (TEXT та JSON формати)');
    console.log('  ✓ Валідація даних (create, update, query)');
    console.log('  ✓ Обробка помилок у сервісах');
    console.log('  ✓ Тести для виключень (12 тестів)');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('\n✗ Demo failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllDemos();
}

module.exports = { runAllDemos };
