/**
 * Expense Service with Error Handling and Logging
 * ПР-10: Demonstrates proper error handling, logging, and validation
 */

const { getLogger } = require('../core/logging');
const ExpenseValidator = require('../validators/expenseValidator');
const {
  ExpenseNotFoundError,
  CategoryNotFoundError,
  UserNotFoundError,
  ForbiddenError,
  DatabaseError
} = require('../exceptions');

const logger = getLogger('ExpenseService');

/**
 * Service for managing expenses with comprehensive error handling
 */
class ExpenseService {
  constructor(expenseRepository, userRepository, categoryRepository) {
    this.expenseRepository = expenseRepository;
    this.userRepository = userRepository;
    this.categoryRepository = categoryRepository;
    logger.info('ExpenseService initialized');
  }

  /**
   * Create a new expense
   * @param {Object} data - Expense data
   * @returns {Promise<Object>} Created expense
   */
  async createExpense(data) {
    logger.info('Creating new expense', { userId: data.userId, category: data.category });
    
    try {
      // Step 1: Validate input data
      logger.debug('Validating expense data', { data });
      const validatedData = ExpenseValidator.validateCreate(data);
      
      // Step 2: Verify user exists
      logger.debug('Verifying user exists', { userId: validatedData.userId });
      const userExists = await this.userRepository.exists(validatedData.userId);
      if (!userExists) {
        logger.warning('User not found', { userId: validatedData.userId });
        throw new UserNotFoundError(validatedData.userId);
      }

      // Step 3: Create expense in database
      logger.debug('Saving expense to database');
      const expense = await this.expenseRepository.create(validatedData);
      
      logger.info('Expense created successfully', { 
        expenseId: expense.id, 
        amount: expense.amount,
        category: expense.category 
      });
      
      return expense;

    } catch (error) {
      // Log error with context
      if (error.name === 'ValidationError' || error.name === 'InvalidAmountError') {
        logger.warning('Validation failed', { error: error.message, field: error.field });
        throw error;
      } else if (error.name === 'UserNotFoundError') {
        throw error;
      } else {
        logger.error('Failed to create expense', { error: error.message, stack: error.stack });
        throw new DatabaseError('create', error.message);
      }
    }
  }

  /**
   * Get expense by ID
   * @param {number} expenseId - Expense ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<Object>} Expense
   */
  async getExpenseById(expenseId, userId) {
    logger.info('Fetching expense', { expenseId, userId });

    try {
      const expense = await this.expenseRepository.findById(expenseId);
      
      if (!expense) {
        logger.warning('Expense not found', { expenseId });
        throw new ExpenseNotFoundError(expenseId);
      }

      // Check authorization
      if (expense.userId !== userId) {
        logger.warning('Unauthorized access attempt', { 
          expenseId, 
          requestedBy: userId, 
          ownedBy: expense.userId 
        });
        throw new ForbiddenError('You can only access your own expenses');
      }

      logger.debug('Expense retrieved successfully', { expenseId });
      return expense;

    } catch (error) {
      if (error.name === 'ExpenseNotFoundError' || error.name === 'ForbiddenError') {
        throw error;
      }
      logger.error('Failed to fetch expense', { expenseId, error: error.message });
      throw new DatabaseError('findById', error.message);
    }
  }

  /**
   * Get all expenses for a user
   * @param {number} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of expenses
   */
  async getUserExpenses(userId, filters = {}) {
    logger.info('Fetching user expenses', { userId, filters });

    try {
      // Validate query parameters
      const validatedFilters = ExpenseValidator.validateQuery(filters);
      
      logger.debug('Querying database', { userId, filters: validatedFilters });
      const expenses = await this.expenseRepository.findByUserId(userId, validatedFilters);
      
      if (expenses.length === 0) {
        logger.info('No expenses found for user', { userId });
      } else {
        logger.info('Expenses retrieved', { userId, count: expenses.length });
      }

      return expenses;

    } catch (error) {
      if (error.name === 'ValidationError') {
        logger.warning('Invalid query parameters', { error: error.message });
        throw error;
      }
      logger.error('Failed to fetch user expenses', { userId, error: error.message });
      throw new DatabaseError('findByUserId', error.message);
    }
  }

  /**
   * Update expense
   * @param {number} expenseId - Expense ID
   * @param {number} userId - User ID (for authorization)
   * @param {Object} data - Update data
   * @returns {Promise<Object>} Updated expense
   */
  async updateExpense(expenseId, userId, data) {
    logger.info('Updating expense', { expenseId, userId });

    try {
      // Step 1: Validate update data
      logger.debug('Validating update data', { data });
      const validatedData = ExpenseValidator.validateUpdate(data);

      // Step 2: Check expense exists and user owns it
      const expense = await this.getExpenseById(expenseId, userId);

      // Step 3: Update in database
      logger.debug('Updating expense in database', { expenseId, changes: validatedData });
      const updated = await this.expenseRepository.update(expenseId, validatedData);

      logger.info('Expense updated successfully', { 
        expenseId, 
        updatedFields: Object.keys(validatedData) 
      });

      return updated;

    } catch (error) {
      if (error.name === 'ValidationError' || 
          error.name === 'ExpenseNotFoundError' || 
          error.name === 'ForbiddenError') {
        throw error;
      }
      logger.error('Failed to update expense', { expenseId, error: error.message });
      throw new DatabaseError('update', error.message);
    }
  }

  /**
   * Delete expense
   * @param {number} expenseId - Expense ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  async deleteExpense(expenseId, userId) {
    logger.info('Deleting expense', { expenseId, userId });

    try {
      // Check expense exists and user owns it
      await this.getExpenseById(expenseId, userId);

      // Delete from database
      logger.debug('Deleting expense from database', { expenseId });
      await this.expenseRepository.delete(expenseId);

      logger.info('Expense deleted successfully', { expenseId });
      return true;

    } catch (error) {
      if (error.name === 'ExpenseNotFoundError' || error.name === 'ForbiddenError') {
        throw error;
      }
      logger.error('Failed to delete expense', { expenseId, error: error.message });
      throw new DatabaseError('delete', error.message);
    }
  }

  /**
   * Get expense statistics for user
   * @param {number} userId - User ID
   * @param {Object} filters - Date range filters
   * @returns {Promise<Object>} Statistics
   */
  async getExpenseStatistics(userId, filters = {}) {
    logger.info('Calculating expense statistics', { userId, filters });

    try {
      const expenses = await this.getUserExpenses(userId, filters);

      const stats = {
        total: expenses.length,
        totalAmount: 0,
        byCategory: {},
        averageAmount: 0
      };

      expenses.forEach(expense => {
        stats.totalAmount += expense.amount;
        stats.byCategory[expense.category] = (stats.byCategory[expense.category] || 0) + expense.amount;
      });

      stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0;

      logger.info('Statistics calculated', { 
        userId, 
        totalExpenses: stats.total, 
        totalAmount: stats.totalAmount 
      });

      return stats;

    } catch (error) {
      logger.error('Failed to calculate statistics', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = ExpenseService;
