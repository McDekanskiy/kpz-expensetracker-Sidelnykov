/**
 * Expense Validator
 * ПР-10: Валідація вхідних даних для витрат
 */

const { ValidationError, InvalidAmountError } = require('../exceptions');

/**
 * Validator for expense data
 * Throws ValidationError on first found error
 */
class ExpenseValidator {
  // Allowed values
  static ALLOWED_CATEGORIES = ['food', 'transport', 'entertainment', 'utilities', 'healthcare', 'other'];
  static MAX_DESCRIPTION_LENGTH = 500;
  static MIN_DESCRIPTION_LENGTH = 3;
  static MAX_AMOUNT = 1000000; // Maximum amount: 1,000,000
  static MIN_AMOUNT = 0.01;    // Minimum amount: 0.01

  /**
   * Validate data for creating expense
   * @param {Object} data - Expense data to validate
   * @returns {Object} - Sanitized data
   * @throws {ValidationError} - If validation fails
   */
  static validateCreate(data) {
    const errors = [];

    // Validate amount (required)
    if (data.amount === undefined || data.amount === null) {
      errors.push({ field: 'amount', message: 'Amount is required' });
    } else if (typeof data.amount !== 'number') {
      errors.push({ field: 'amount', message: 'Amount must be a number' });
    } else if (data.amount <= 0) {
      throw new InvalidAmountError(data.amount);
    } else if (data.amount < this.MIN_AMOUNT) {
      errors.push({ field: 'amount', message: `Amount must be at least ${this.MIN_AMOUNT}` });
    } else if (data.amount > this.MAX_AMOUNT) {
      errors.push({ field: 'amount', message: `Amount cannot exceed ${this.MAX_AMOUNT}` });
    }

    // Validate description (required)
    if (!data.description) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else if (typeof data.description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else {
      const trimmed = data.description.trim();
      if (trimmed.length < this.MIN_DESCRIPTION_LENGTH) {
        errors.push({ 
          field: 'description', 
          message: `Description must be at least ${this.MIN_DESCRIPTION_LENGTH} characters` 
        });
      } else if (trimmed.length > this.MAX_DESCRIPTION_LENGTH) {
        errors.push({ 
          field: 'description', 
          message: `Description cannot exceed ${this.MAX_DESCRIPTION_LENGTH} characters` 
        });
      }
    }

    // Validate category (required)
    if (!data.category) {
      errors.push({ field: 'category', message: 'Category is required' });
    } else if (!this.ALLOWED_CATEGORIES.includes(data.category)) {
      errors.push({ 
        field: 'category', 
        message: `Category must be one of: ${this.ALLOWED_CATEGORIES.join(', ')}` 
      });
    }

    // Validate date (optional, defaults to today)
    if (data.date) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format. Use ISO 8601 (YYYY-MM-DD)' });
      } else if (date > new Date()) {
        errors.push({ field: 'date', message: 'Date cannot be in the future' });
      }
    }

    // Validate userId (required)
    if (!data.userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else if (typeof data.userId !== 'number' || data.userId <= 0) {
      errors.push({ field: 'userId', message: 'User ID must be a positive number' });
    }

    // If there are errors, throw the first one
    if (errors.length > 0) {
      const firstError = errors[0];
      throw new ValidationError(firstError.field, firstError.message);
    }

    // Return sanitized data
    return {
      amount: parseFloat(data.amount.toFixed(2)), // Round to 2 decimal places
      description: data.description.trim(),
      category: data.category,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      userId: data.userId
    };
  }

  /**
   * Validate data for updating expense
   * @param {Object} data - Expense data to validate
   * @returns {Object} - Sanitized data
   * @throws {ValidationError} - If validation fails
   */
  static validateUpdate(data) {
    const errors = [];
    const sanitized = {};

    // Amount (optional for update)
    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number') {
        errors.push({ field: 'amount', message: 'Amount must be a number' });
      } else if (data.amount <= 0) {
        throw new InvalidAmountError(data.amount);
      } else if (data.amount < this.MIN_AMOUNT || data.amount > this.MAX_AMOUNT) {
        errors.push({ 
          field: 'amount', 
          message: `Amount must be between ${this.MIN_AMOUNT} and ${this.MAX_AMOUNT}` 
        });
      } else {
        sanitized.amount = parseFloat(data.amount.toFixed(2));
      }
    }

    // Description (optional for update)
    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push({ field: 'description', message: 'Description must be a string' });
      } else {
        const trimmed = data.description.trim();
        if (trimmed.length < this.MIN_DESCRIPTION_LENGTH || trimmed.length > this.MAX_DESCRIPTION_LENGTH) {
          errors.push({ 
            field: 'description', 
            message: `Description must be between ${this.MIN_DESCRIPTION_LENGTH} and ${this.MAX_DESCRIPTION_LENGTH} characters` 
          });
        } else {
          sanitized.description = trimmed;
        }
      }
    }

    // Category (optional for update)
    if (data.category !== undefined) {
      if (!this.ALLOWED_CATEGORIES.includes(data.category)) {
        errors.push({ 
          field: 'category', 
          message: `Category must be one of: ${this.ALLOWED_CATEGORIES.join(', ')}` 
        });
      } else {
        sanitized.category = data.category;
      }
    }

    // Date (optional for update)
    if (data.date !== undefined) {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'date', message: 'Invalid date format' });
      } else if (date > new Date()) {
        errors.push({ field: 'date', message: 'Date cannot be in the future' });
      } else {
        sanitized.date = date.toISOString().split('T')[0];
      }
    }

    // If there are errors, throw the first one
    if (errors.length > 0) {
      const firstError = errors[0];
      throw new ValidationError(firstError.field, firstError.message);
    }

    // Must have at least one field to update
    if (Object.keys(sanitized).length === 0) {
      throw new ValidationError('data', 'At least one field must be provided for update');
    }

    return sanitized;
  }

  /**
   * Validate query parameters for filtering expenses
   * @param {Object} params - Query parameters
   * @returns {Object} - Sanitized parameters
   */
  static validateQuery(params) {
    const sanitized = {};

    // Category filter
    if (params.category) {
      if (!this.ALLOWED_CATEGORIES.includes(params.category)) {
        throw new ValidationError('category', `Invalid category: ${params.category}`);
      }
      sanitized.category = params.category;
    }

    // Date range filters
    if (params.startDate) {
      const date = new Date(params.startDate);
      if (isNaN(date.getTime())) {
        throw new ValidationError('startDate', 'Invalid start date format');
      }
      sanitized.startDate = date.toISOString().split('T')[0];
    }

    if (params.endDate) {
      const date = new Date(params.endDate);
      if (isNaN(date.getTime())) {
        throw new ValidationError('endDate', 'Invalid end date format');
      }
      sanitized.endDate = date.toISOString().split('T')[0];
    }

    // Pagination
    if (params.limit) {
      const limit = parseInt(params.limit);
      if (isNaN(limit) || limit <= 0 || limit > 100) {
        throw new ValidationError('limit', 'Limit must be between 1 and 100');
      }
      sanitized.limit = limit;
    }

    if (params.offset) {
      const offset = parseInt(params.offset);
      if (isNaN(offset) || offset < 0) {
        throw new ValidationError('offset', 'Offset must be a non-negative number');
      }
      sanitized.offset = offset;
    }

    return sanitized;
  }
}

module.exports = ExpenseValidator;
