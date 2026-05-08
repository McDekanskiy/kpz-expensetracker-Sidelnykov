/**
 * Custom Exception Hierarchy for Expense Tracker
 * ПР-10: Обробка помилок, логування та валідація даних
 */

/**
 * Base class for all application errors
 * Allows catching ANY application error: catch (error) { if (error instanceof AppError) ... }
 */
class AppError extends Error {
  constructor(message, code = 'APP_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      timestamp: this.timestamp,
      name: this.name
    };
  }
}

// ============================================================================
// Validation Errors Group
// ============================================================================

/**
 * Input data failed validation
 */
class ValidationError extends AppError {
  constructor(field, message) {
    super(`Field '${field}': ${message}`, 'VALIDATION_ERROR');
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field
    };
  }
}

// ============================================================================
// Business Logic Errors Group
// ============================================================================

/**
 * Business rule violation
 */
class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, code);
  }
}

/**
 * Expense not found in database
 */
class ExpenseNotFoundError extends BusinessError {
  constructor(expenseId) {
    super(`Expense #${expenseId} not found`, 'EXPENSE_NOT_FOUND');
    this.expenseId = expenseId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      expenseId: this.expenseId
    };
  }
}

/**
 * Category not found in database
 */
class CategoryNotFoundError extends BusinessError {
  constructor(categoryId) {
    super(`Category #${categoryId} not found`, 'CATEGORY_NOT_FOUND');
    this.categoryId = categoryId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      categoryId: this.categoryId
    };
  }
}

/**
 * User not found in database
 */
class UserNotFoundError extends BusinessError {
  constructor(userId) {
    super(`User #${userId} not found`, 'USER_NOT_FOUND');
    this.userId = userId;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      userId: this.userId
    };
  }
}

/**
 * Insufficient permissions to perform operation
 */
class ForbiddenError extends BusinessError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 'FORBIDDEN');
  }
}

/**
 * Invalid amount for expense (negative or zero)
 */
class InvalidAmountError extends BusinessError {
  constructor(amount) {
    super(`Invalid amount: ${amount}. Amount must be positive`, 'INVALID_AMOUNT');
    this.amount = amount;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      amount: this.amount
    };
  }
}

// ============================================================================
// Infrastructure Errors Group
// ============================================================================

/**
 * External dependencies unavailable
 */
class InfrastructureError extends AppError {
  constructor(message, code = 'INFRASTRUCTURE_ERROR') {
    super(message, code);
  }
}

/**
 * Database operation failed
 */
class DatabaseError extends InfrastructureError {
  constructor(operation, detail) {
    super(`Database: operation '${operation}' failed: ${detail}`, 'DB_ERROR');
    this.operation = operation;
    this.detail = detail;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      detail: this.detail
    };
  }
}

/**
 * Authentication failed
 */
class AuthenticationError extends InfrastructureError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
  }
}

/**
 * External API call failed
 */
class ExternalServiceError extends InfrastructureError {
  constructor(service, message) {
    super(`External service '${service}' error: ${message}`, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Base
  AppError,
  
  // Validation
  ValidationError,
  
  // Business Logic
  BusinessError,
  ExpenseNotFoundError,
  CategoryNotFoundError,
  UserNotFoundError,
  ForbiddenError,
  InvalidAmountError,
  
  // Infrastructure
  InfrastructureError,
  DatabaseError,
  AuthenticationError,
  ExternalServiceError
};
