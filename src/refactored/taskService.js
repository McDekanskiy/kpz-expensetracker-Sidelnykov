// ============================================
// ЧИСТИЙ КОД (ПІСЛЯ РЕФАКТОРИНГУ)
// Виправлені всі проблеми з code review
// ============================================

const fs = require('fs').promises;
const logger = require('../core/logging');

// Константи замість magic numbers
const TaskStatus = {
    ACTIVE: 1,
    PENDING: 2,
    COMPLETED: 3,
    CANCELLED: 4
};

const PRIORITY_THRESHOLD = 5;
const VIP_DISCOUNT_RATE = 0.15;
const BULK_DISCOUNT_RATE = 0.05;
const BULK_ORDER_THRESHOLD = 500;

/**
 * Фільтрує задачі за статусом та пріоритетом, застосовує знижки
 * @param {Object} options - Параметри обробки
 * @param {Array} options.tasks - Масив задач для обробки
 * @param {boolean} options.isVipCustomer - Чи є клієнт VIP
 * @returns {Array} Відфільтровані задачі зі застосованими знижками
 */
function filterAndApplyDiscounts({ tasks, isVipCustomer }) {
    // Валідація вхідних даних
    if (!Array.isArray(tasks)) {
        throw new TypeError('tasks must be an array');
    }

    // Крок 1: Фільтрація задач (Extract Function)
    const filteredTasks = filterTasksByStatusAndPriority(tasks);

    // Крок 2: Застосування знижок (Extract Function)
    const tasksWithDiscounts = applyDiscounts(filteredTasks, isVipCustomer);

    // Крок 3: Логування (async, не блокує)
    logTasksAsync(tasksWithDiscounts).catch(err => {
        logger.error('Failed to log tasks:', err);
    });

    return tasksWithDiscounts;
}

/**
 * Фільтрує задачі за статусом та пріоритетом
 * @param {Array} tasks - Масив задач
 * @returns {Array} Відфільтровані задачі
 */
function filterTasksByStatusAndPriority(tasks) {
    return tasks.filter(task => {
        // Пропускаємо null/undefined
        if (task === null || task === undefined) {
            return false;
        }

        // Активні задачі - всі
        if (task.status === TaskStatus.ACTIVE) {
            return true;
        }

        // Pending задачі - тільки з високим пріоритетом
        if (task.status === TaskStatus.PENDING && task.priority > PRIORITY_THRESHOLD) {
            return true;
        }

        return false;
    });
}

/**
 * Застосовує знижки до задач
 * @param {Array} tasks - Масив задач
 * @param {boolean} isVipCustomer - Чи є клієнт VIP
 * @returns {Array} Задачі зі застосованими знижками
 */
function applyDiscounts(tasks, isVipCustomer) {
    return tasks.map(task => {
        // Створюємо копію щоб не мутувати оригінал
        const taskCopy = { ...task };

        if (isVipCustomer) {
            // VIP знижка
            taskCopy.price = calculateDiscountedPrice(task.price, VIP_DISCOUNT_RATE);
            taskCopy.discountApplied = 'VIP';
        } else if (task.price > BULK_ORDER_THRESHOLD) {
            // Знижка на великі замовлення
            taskCopy.price = calculateDiscountedPrice(task.price, BULK_DISCOUNT_RATE);
            taskCopy.discountApplied = 'BULK';
        } else {
            taskCopy.discountApplied = 'NONE';
        }

        return taskCopy;
    });
}

/**
 * Розраховує ціну зі знижкою
 * @param {number} price - Оригінальна ціна
 * @param {number} discountRate - Відсоток знижки (0.15 = 15%)
 * @returns {number} Ціна зі знижкою
 */
function calculateDiscountedPrice(price, discountRate) {
    return price * (1 - discountRate);
}

/**
 * Асинхронно логує задачі у файл
 * @param {Array} tasks - Задачі для логування
 */
async function logTasksAsync(tasks) {
    try {
        const logData = JSON.stringify(tasks, null, 2) + '\n';
        await fs.appendFile('logs/tasks.log', logData);
        logger.debug(`Logged ${tasks.length} tasks`);
    } catch (error) {
        // Не кидаємо помилку, тільки логуємо
        logger.error('Failed to write task log:', error);
    }
}

// ============================================
// TaskManager з виправленими SQL injection
// ============================================

class TaskManager {
    constructor(database) {
        if (!database) {
            throw new Error('Database instance is required');
        }
        this.db = database;
    }

    /**
     * Оновлює назву задачі та логує операцію
     * @param {Object} taskData - Дані задачі
     * @returns {Promise<boolean>} Результат операції
     */
    async updateTaskName(taskData) {
        const { id, name, userId } = taskData;

        // Валідація
        if (!id || !name) {
            throw new Error('Task id and name are required');
        }

        try {
            // Перевіряємо чи існує задача (параметризований запит)
            const task = await this.getTaskById(id);

            if (task) {
                // Оновлюємо назву (параметризований запит - безпечно!)
                await this.db.run(
                    'UPDATE tasks SET name = ?, updated_at = ? WHERE id = ?',
                    [name, new Date().toISOString(), id]
                );

                // Логуємо операцію
                await this.logTaskOperation(id, name, 'updated', userId);

                logger.info(`Task ${id} updated successfully`);
                return true;
            } else {
                logger.warn(`Task ${id} not found`);
                return false;
            }
        } catch (error) {
            logger.error(`Failed to update task ${id}:`, error);
            throw error;
        }
    }

    /**
     * Отримує задачу за ID (безпечний запит)
     * @param {number} id - ID задачі
     * @returns {Promise<Object|null>} Задача або null
     */
    async getTaskById(id) {
        return new Promise((resolve, reject) => {
            // Параметризований запит - захист від SQL injection
            this.db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Логує операцію з задачею
     * @param {number} taskId - ID задачі
     * @param {string} taskName - Назва задачі
     * @param {string} operation - Тип операції
     * @param {number} userId - ID користувача
     * @returns {Promise<void>}
     */
    async logTaskOperation(taskId, taskName, operation, userId) {
        return new Promise((resolve, reject) => {
            // Параметризований запит
            this.db.run(
                'INSERT INTO logs (task_id, task_name, operation, user_id, created_at) VALUES (?, ?, ?, ?, ?)',
                [taskId, taskName, operation, userId, new Date().toISOString()],
                (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
}

module.exports = {
    filterAndApplyDiscounts,
    filterTasksByStatusAndPriority,
    applyDiscounts,
    calculateDiscountedPrice,
    TaskManager,
    TaskStatus,
    // Експортуємо константи для тестування
    PRIORITY_THRESHOLD,
    VIP_DISCOUNT_RATE,
    BULK_DISCOUNT_RATE,
    BULK_ORDER_THRESHOLD
};
