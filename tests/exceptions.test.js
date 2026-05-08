/**
 * Tests for Custom Exception Hierarchy
 * ПР-10: Testing error handling
 */

const {
  AppError,
  ValidationError,
  BusinessError,
  ExpenseNotFoundError,
  CategoryNotFoundError,
  UserNotFoundError,
  ForbiddenError,
  InvalidAmountError,
  InfrastructureError,
  DatabaseError,
  AuthenticationError,
  ExternalServiceError
} = require('../src/exceptions');

// Test helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testValidationError() {
  console.log('Testing ValidationError...');
  
  const error = new ValidationError('email', 'Invalid email format');
  
  assert(error instanceof ValidationError, 'Should be instance of ValidationError');
  assert(error instanceof AppError, 'Should be instance of AppError');
  assert(error instanceof Error, 'Should be instance of Error');
  assert(error.field === 'email', 'Should have field property');
  assert(error.code === 'VALIDATION_ERROR', 'Should have correct code');
  assert(error.message.includes('email'), 'Message should include field name');
  
  const json = error.toJSON();
  assert(json.error === 'VALIDATION_ERROR', 'JSON should have error code');
  assert(json.field === 'email', 'JSON should have field');
  assert(json.message, 'JSON should have message');
  
  console.log('✓ ValidationError tests passed');
}

function testExpenseNotFoundError() {
  console.log('Testing ExpenseNotFoundError...');
  
  const error = new ExpenseNotFoundError(123);
  
  assert(error instanceof ExpenseNotFoundError, 'Should be instance of ExpenseNotFoundError');
  assert(error instanceof BusinessError, 'Should be instance of BusinessError');
  assert(error instanceof AppError, 'Should be instance of AppError');
  assert(error.expenseId === 123, 'Should have expenseId property');
  assert(error.code === 'EXPENSE_NOT_FOUND', 'Should have correct code');
  assert(error.message.includes('123'), 'Message should include expense ID');
  
  const json = error.toJSON();
  assert(json.expenseId === 123, 'JSON should have expenseId');
  
  console.log('✓ ExpenseNotFoundError tests passed');
}

function testCategoryNotFoundError() {
  console.log('Testing CategoryNotFoundError...');
  
  const error = new CategoryNotFoundError(5);
  
  assert(error instanceof CategoryNotFoundError, 'Should be instance of CategoryNotFoundError');
  assert(error instanceof BusinessError, 'Should be instance of BusinessError');
  assert(error.categoryId === 5, 'Should have categoryId property');
  assert(error.code === 'CATEGORY_NOT_FOUND', 'Should have correct code');
  
  console.log('✓ CategoryNotFoundError tests passed');
}

function testUserNotFoundError() {
  console.log('Testing UserNotFoundError...');
  
  const error = new UserNotFoundError(42);
  
  assert(error instanceof UserNotFoundError, 'Should be instance of UserNotFoundError');
  assert(error.userId === 42, 'Should have userId property');
  assert(error.code === 'USER_NOT_FOUND', 'Should have correct code');
  
  console.log('✓ UserNotFoundError tests passed');
}

function testForbiddenError() {
  console.log('Testing ForbiddenError...');
  
  const error = new ForbiddenError('Cannot access this resource');
  
  assert(error instanceof ForbiddenError, 'Should be instance of ForbiddenError');
  assert(error instanceof BusinessError, 'Should be instance of BusinessError');
  assert(error.code === 'FORBIDDEN', 'Should have correct code');
  assert(error.message === 'Cannot access this resource', 'Should have custom message');
  
  console.log('✓ ForbiddenError tests passed');
}

function testInvalidAmountError() {
  console.log('Testing InvalidAmountError...');
  
  const error = new InvalidAmountError(-50);
  
  assert(error instanceof InvalidAmountError, 'Should be instance of InvalidAmountError');
  assert(error instanceof BusinessError, 'Should be instance of BusinessError');
  assert(error.amount === -50, 'Should have amount property');
  assert(error.code === 'INVALID_AMOUNT', 'Should have correct code');
  assert(error.message.includes('-50'), 'Message should include amount');
  
  const json = error.toJSON();
  assert(json.amount === -50, 'JSON should have amount');
  
  console.log('✓ InvalidAmountError tests passed');
}

function testDatabaseError() {
  console.log('Testing DatabaseError...');
  
  const error = new DatabaseError('insert', 'Connection timeout');
  
  assert(error instanceof DatabaseError, 'Should be instance of DatabaseError');
  assert(error instanceof InfrastructureError, 'Should be instance of InfrastructureError');
  assert(error instanceof AppError, 'Should be instance of AppError');
  assert(error.operation === 'insert', 'Should have operation property');
  assert(error.detail === 'Connection timeout', 'Should have detail property');
  assert(error.code === 'DB_ERROR', 'Should have correct code');
  
  const json = error.toJSON();
  assert(json.operation === 'insert', 'JSON should have operation');
  assert(json.detail === 'Connection timeout', 'JSON should have detail');
  
  console.log('✓ DatabaseError tests passed');
}

function testAuthenticationError() {
  console.log('Testing AuthenticationError...');
  
  const error = new AuthenticationError('Invalid token');
  
  assert(error instanceof AuthenticationError, 'Should be instance of AuthenticationError');
  assert(error instanceof InfrastructureError, 'Should be instance of InfrastructureError');
  assert(error.code === 'AUTH_ERROR', 'Should have correct code');
  
  console.log('✓ AuthenticationError tests passed');
}

function testExternalServiceError() {
  console.log('Testing ExternalServiceError...');
  
  const error = new ExternalServiceError('PaymentAPI', 'Service unavailable');
  
  assert(error instanceof ExternalServiceError, 'Should be instance of ExternalServiceError');
  assert(error instanceof InfrastructureError, 'Should be instance of InfrastructureError');
  assert(error.service === 'PaymentAPI', 'Should have service property');
  assert(error.code === 'EXTERNAL_SERVICE_ERROR', 'Should have correct code');
  
  const json = error.toJSON();
  assert(json.service === 'PaymentAPI', 'JSON should have service');
  
  console.log('✓ ExternalServiceError tests passed');
}

function testErrorHierarchy() {
  console.log('Testing error hierarchy...');
  
  const validationError = new ValidationError('field', 'message');
  const businessError = new ExpenseNotFoundError(1);
  const infraError = new DatabaseError('op', 'detail');
  
  // All should be instances of AppError
  assert(validationError instanceof AppError, 'ValidationError should extend AppError');
  assert(businessError instanceof AppError, 'BusinessError should extend AppError');
  assert(infraError instanceof AppError, 'InfrastructureError should extend AppError');
  
  // Can catch all app errors
  try {
    throw new ExpenseNotFoundError(999);
  } catch (error) {
    assert(error instanceof AppError, 'Should be catchable as AppError');
    assert(error instanceof BusinessError, 'Should be catchable as BusinessError');
  }
  
  console.log('✓ Error hierarchy tests passed');
}

function testErrorJSON() {
  console.log('Testing error JSON serialization...');
  
  const error = new ExpenseNotFoundError(456);
  const json = error.toJSON();
  
  assert(typeof json === 'object', 'toJSON should return object');
  assert(json.error, 'JSON should have error code');
  assert(json.message, 'JSON should have message');
  assert(json.timestamp, 'JSON should have timestamp');
  assert(json.name, 'JSON should have name');
  assert(json.expenseId === 456, 'JSON should have custom properties');
  
  console.log('✓ Error JSON serialization tests passed');
}

function testErrorTimestamp() {
  console.log('Testing error timestamp...');
  
  const error = new AppError('Test error');
  
  assert(error.timestamp, 'Error should have timestamp');
  assert(typeof error.timestamp === 'string', 'Timestamp should be string');
  assert(error.timestamp.includes('T'), 'Timestamp should be ISO format');
  
  console.log('✓ Error timestamp tests passed');
}

// Run all tests
function runAllTests() {
  console.log('='.repeat(50));
  console.log('Running Exception Tests');
  console.log('='.repeat(50));
  console.log();

  try {
    testValidationError();
    testExpenseNotFoundError();
    testCategoryNotFoundError();
    testUserNotFoundError();
    testForbiddenError();
    testInvalidAmountError();
    testDatabaseError();
    testAuthenticationError();
    testExternalServiceError();
    testErrorHierarchy();
    testErrorJSON();
    testErrorTimestamp();
    
    console.log();
    console.log('='.repeat(50));
    console.log('✓ All tests passed!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error();
    console.error('='.repeat(50));
    console.error('✗ Test failed:', error.message);
    console.error('='.repeat(50));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
