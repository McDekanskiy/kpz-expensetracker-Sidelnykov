/**
 * ExpenseBuilder - Builder патерн для створення об'єктів витрат
 * 
 * Спрощує створення складних об'єктів витрат з валідацією та значеннями за замовчуванням.
 * Використовує Fluent Interface для зручного ланцюжка викликів.
 * 
 * @example
 * const expense = new ExpenseBuilder(userId, categoryId, 150.50)
 *   .description('Покупка продуктів')
 *   .paymentMethod('card')
 *   .tag('groceries')
 *   .build();
 */

/**
 * Константи для валідації
 */
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 1000000;
const ALLOWED_PAYMENT_METHODS = ['cash', 'card', 'crypto'];
const ALLOWED_STATUSES = ['pending', 'completed', 'cancelled'];

/**
 * Builder для створення об'єктів витрат
 */
class ExpenseBuilder {
  /**
   * Створити новий builder для витрати
   * 
   * @param {number} userId - ID користувача (обов'язковий)
   * @param {number} categoryId - ID категорії (обов'язковий)
   * @param {number} amount - Сума витрати (обов'язковий)
   * @throws {Error} Якщо обов'язкові параметри відсутні або невалідні
   */
  constructor(userId, categoryId, amount) {
    // Валідація обов'язкових параметрів
    this.#validateRequired(userId, categoryId, amount);

    // Ініціалізувати об'єкт витрати з дефолтними значеннями
    this.expense = {
      userId: userId,
      categoryId: categoryId,
      amount: amount,
      description: '',
      date: new Date(),
      tags: [],
      paymentMethod: 'cash',
      status: 'completed',
      isRecurring: false,
      attachments: [],
      metadata: {},
    };
  }

  /**
   * Валідувати обов'язкові параметри
   * @private
   */
  #validateRequired(userId, categoryId, amount) {
    if (!userId || typeof userId !== 'number') {
      throw new Error('userId є обов\'язковим і має бути числом');
    }

    if (!categoryId || typeof categoryId !== 'number') {
      throw new Error('categoryId є обов\'язковим і має бути числом');
    }

    if (typeof amount !== 'number') {
      throw new Error('amount має бути числом');
    }

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw new Error(
        `Сума витрати має бути між ${MIN_AMOUNT} та ${MAX_AMOUNT} грн. ` +
        `Отримано: ${amount}`
      );
    }
  }

  /**
   * Встановити опис витрати
   * @param {string} text - Опис витрати
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  description(text) {
    if (typeof text !== 'string') {
      throw new Error('Опис має бути рядком');
    }
    this.expense.description = text.trim();
    return this;
  }

  /**
   * Встановити дату витрати
   * @param {Date|string} date - Дата витрати
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   * @throws {Error} Якщо дата в майбутньому
   */
  date(date) {
    const expenseDate = date instanceof Date ? date : new Date(date);

    if (isNaN(expenseDate.getTime())) {
      throw new Error('Невалідна дата');
    }

    if (expenseDate > new Date()) {
      throw new Error('Дата витрати не може бути в майбутньому');
    }

    this.expense.date = expenseDate;
    return this;
  }

  /**
   * Додати тег до витрати
   * @param {string} tagName - Назва тегу
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  tag(tagName) {
    if (typeof tagName !== 'string' || !tagName.trim()) {
      throw new Error('Тег має бути непорожнім рядком');
    }

    const normalizedTag = tagName.trim().toLowerCase();
    
    // Уникнути дублікатів
    if (!this.expense.tags.includes(normalizedTag)) {
      this.expense.tags.push(normalizedTag);
    }

    return this;
  }

  /**
   * Встановити масив тегів
   * @param {string[]} tagArray - Масив тегів
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  tags(tagArray) {
    if (!Array.isArray(tagArray)) {
      throw new Error('tags має бути масивом');
    }

    tagArray.forEach(tag => this.tag(tag));
    return this;
  }

  /**
   * Встановити метод оплати
   * @param {string} method - Метод оплати (cash, card, crypto)
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   * @throws {Error} Якщо метод невалідний
   */
  paymentMethod(method) {
    const methodLower = method.toLowerCase();

    if (!ALLOWED_PAYMENT_METHODS.includes(methodLower)) {
      throw new Error(
        `Метод оплати '${method}' неприпустимий. ` +
        `Дозволені: ${ALLOWED_PAYMENT_METHODS.join(', ')}`
      );
    }

    this.expense.paymentMethod = methodLower;
    return this;
  }

  /**
   * Встановити статус витрати
   * @param {string} status - Статус (pending, completed, cancelled)
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  status(status) {
    const statusLower = status.toLowerCase();

    if (!ALLOWED_STATUSES.includes(statusLower)) {
      throw new Error(
        `Статус '${status}' неприпустимий. ` +
        `Дозволені: ${ALLOWED_STATUSES.join(', ')}`
      );
    }

    this.expense.status = statusLower;
    return this;
  }

  /**
   * Встановити, чи витрата повторювана
   * @param {boolean} isRecurring - Чи витрата повторювана
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  recurring(isRecurring = true) {
    if (typeof isRecurring !== 'boolean') {
      throw new Error('isRecurring має бути boolean');
    }
    this.expense.isRecurring = isRecurring;
    return this;
  }

  /**
   * Додати вкладення (посилання на файл)
   * @param {string} attachmentUrl - URL вкладення
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  attachment(attachmentUrl) {
    if (typeof attachmentUrl !== 'string' || !attachmentUrl.trim()) {
      throw new Error('URL вкладення має бути непорожнім рядком');
    }

    this.expense.attachments.push(attachmentUrl.trim());
    return this;
  }

  /**
   * Встановити масив вкладень
   * @param {string[]} attachmentArray - Масив URL вкладень
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  attachments(attachmentArray) {
    if (!Array.isArray(attachmentArray)) {
      throw new Error('attachments має бути масивом');
    }

    attachmentArray.forEach(url => this.attachment(url));
    return this;
  }

  /**
   * Додати метадані до витрати
   * @param {string} key - Ключ метаданих
   * @param {any} value - Значення метаданих
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  meta(key, value) {
    if (typeof key !== 'string' || !key.trim()) {
      throw new Error('Ключ метаданих має бути непорожнім рядком');
    }

    this.expense.metadata[key] = value;
    return this;
  }

  /**
   * Встановити об'єкт метаданих
   * @param {Object} metaObject - Об'єкт метаданих
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  metadata(metaObject) {
    if (typeof metaObject !== 'object' || metaObject === null) {
      throw new Error('metadata має бути об\'єктом');
    }

    this.expense.metadata = { ...this.expense.metadata, ...metaObject };
    return this;
  }

  /**
   * Побудувати фінальний об'єкт витрати
   * Повертає копію об'єкта, щоб запобігти модифікації
   * 
   * @returns {Object} Готовий об'єкт витрати
   */
  build() {
    // Фінальна валідація перед побудовою
    this.#validateBeforeBuild();

    // Повернути глибоку копію, щоб запобігти модифікації
    return {
      userId: this.expense.userId,
      categoryId: this.expense.categoryId,
      amount: this.expense.amount,
      description: this.expense.description,
      date: new Date(this.expense.date),
      tags: [...this.expense.tags],
      paymentMethod: this.expense.paymentMethod,
      status: this.expense.status,
      isRecurring: this.expense.isRecurring,
      attachments: [...this.expense.attachments],
      metadata: { ...this.expense.metadata },
    };
  }

  /**
   * Валідація перед побудовою
   * @private
   */
  #validateBeforeBuild() {
    // Можна додати додаткові перевірки
    if (this.expense.isRecurring && !this.expense.description) {
      console.warn('[ExpenseBuilder] Повторювана витрата без опису');
    }

    if (this.expense.amount > 10000 && this.expense.paymentMethod === 'cash') {
      console.warn('[ExpenseBuilder] Велика сума готівкою: ' + this.expense.amount);
    }
  }

  /**
   * Отримати поточний стан витрати (для дебагу)
   * @returns {Object} Поточний стан
   */
  preview() {
    return { ...this.expense };
  }

  /**
   * Скинути builder до початкового стану
   * @returns {ExpenseBuilder} this для ланцюжка викликів
   */
  reset() {
    const { userId, categoryId, amount } = this.expense;
    this.expense = {
      userId,
      categoryId,
      amount,
      description: '',
      date: new Date(),
      tags: [],
      paymentMethod: 'cash',
      status: 'completed',
      isRecurring: false,
      attachments: [],
      metadata: {},
    };
    return this;
  }
}

/**
 * Допоміжна функція для швидкого створення простої витрати
 * @param {number} userId - ID користувача
 * @param {number} categoryId - ID категорії
 * @param {number} amount - Сума
 * @param {string} description - Опис
 * @returns {Object} Об'єкт витрати
 */
function createSimpleExpense(userId, categoryId, amount, description = '') {
  return new ExpenseBuilder(userId, categoryId, amount)
    .description(description)
    .build();
}

// Експорт
module.exports = {
  ExpenseBuilder,
  createSimpleExpense,
  // Експортувати константи для тестування
  MIN_AMOUNT,
  MAX_AMOUNT,
  ALLOWED_PAYMENT_METHODS,
  ALLOWED_STATUSES,
};
