/**
 * NotificationFactory - Factory Method патерн для системи нотифікацій
 * 
 * Створює різні типи нотифікаторів залежно від каналу комунікації.
 * Підтримує розширення через метод register() без зміни коду фабрики.
 * 
 * @example
 * const { NotificationFactory } = require('./services/notificationFactory');
 * const notifier = NotificationFactory.create('email');
 * await notifier.notifyExpenseCreated('user@example.com', expense);
 */

const config = require('../core/config');

/**
 * Базовий абстрактний клас для всіх нотифікаторів
 * Визначає загальний інтерфейс для відправки повідомлень
 */
class BaseNotifier {
  /**
   * Абстрактний метод для відправки повідомлення
   * Має бути реалізований у дочірніх класах
   * 
   * @param {string} recipient - Отримувач (email, chat_id, тощо)
   * @param {string} message - Текст повідомлення
   * @returns {Promise<boolean>} true якщо відправлено успішно
   * @throws {Error} Якщо метод не реалізований
   */
  async send(recipient, message) {
    throw new Error('Метод send() має бути реалізований у дочірньому класі');
  }

  /**
   * Шаблонний метод: нотифікація про створення витрати
   * @param {string} recipient - Отримувач
   * @param {Object} expense - Об'єкт витрати
   * @returns {Promise<boolean>}
   */
  async notifyExpenseCreated(recipient, expense) {
    const message = this.#formatExpenseCreated(expense);
    return this.send(recipient, message);
  }

  /**
   * Шаблонний метод: нотифікація про оновлення витрати
   * @param {string} recipient - Отримувач
   * @param {Object} expense - Об'єкт витрати
   * @returns {Promise<boolean>}
   */
  async notifyExpenseUpdated(recipient, expense) {
    const message = this.#formatExpenseUpdated(expense);
    return this.send(recipient, message);
  }

  /**
   * Шаблонний метод: нотифікація про видалення витрати
   * @param {string} recipient - Отримувач
   * @param {Object} expense - Об'єкт витрати
   * @returns {Promise<boolean>}
   */
  async notifyExpenseDeleted(recipient, expense) {
    const message = `Витрату видалено: ${expense.amount} грн (${expense.description || 'без опису'})`;
    return this.send(recipient, message);
  }

  /**
   * Шаблонний метод: нотифікація про перевищення бюджету
   * @param {string} recipient - Отримувач
   * @param {Object} budget - Об'єкт бюджету
   * @returns {Promise<boolean>}
   */
  async notifyBudgetExceeded(recipient, budget) {
    const message = `⚠️ УВАГА! Перевищено бюджет: ${budget.spent} / ${budget.limit} грн`;
    return this.send(recipient, message);
  }

  /**
   * Форматувати повідомлення про створення витрати
   * @private
   */
  #formatExpenseCreated(expense) {
    const amount = expense.amount || 0;
    const description = expense.description || 'без опису';
    const date = expense.date ? new Date(expense.date).toLocaleDateString('uk-UA') : 'сьогодні';
    
    return `✅ Витрата створена:\n` +
           `💰 Сума: ${amount} грн\n` +
           `📝 Опис: ${description}\n` +
           `📅 Дата: ${date}`;
  }

  /**
   * Форматувати повідомлення про оновлення витрати
   * @private
   */
  #formatExpenseUpdated(expense) {
    const amount = expense.amount || 0;
    const description = expense.description || 'без опису';
    
    return `🔄 Витрата оновлена:\n` +
           `💰 Сума: ${amount} грн\n` +
           `📝 Опис: ${description}`;
  }
}

/**
 * Email нотифікатор - відправляє повідомлення на email
 */
class EmailNotifier extends BaseNotifier {
  async send(recipient, message) {
    // У реальному проєкті тут була б інтеграція з SMTP або SendGrid
    if (config.DEBUG) {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL NOTIFICATION');
      console.log('='.repeat(60));
      console.log(`To: ${recipient}`);
      console.log(`Message:\n${message}`);
      console.log('='.repeat(60) + '\n');
    }
    
    // Симуляція відправки
    return true;
  }
}

/**
 * Telegram нотифікатор - відправляє повідомлення в Telegram
 */
class TelegramNotifier extends BaseNotifier {
  async send(recipient, message) {
    // У реальному проєкті тут була б інтеграція з Telegram Bot API
    if (config.DEBUG) {
      console.log('\n' + '='.repeat(60));
      console.log('📱 TELEGRAM NOTIFICATION');
      console.log('='.repeat(60));
      console.log(`Chat ID: ${recipient}`);
      console.log(`Message:\n${message}`);
      console.log('='.repeat(60) + '\n');
    }
    
    // Симуляція відправки
    return true;
  }
}

/**
 * Console нотифікатор - виводить повідомлення в консоль
 * Корисний для розробки та тестування
 */
class ConsoleNotifier extends BaseNotifier {
  async send(recipient, message) {
    console.log('\n' + '='.repeat(60));
    console.log('🖥️  CONSOLE NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`Recipient: ${recipient}`);
    console.log(`Message:\n${message}`);
    console.log('='.repeat(60) + '\n');
    
    return true;
  }
}

/**
 * Фабрика для створення нотифікаторів
 * Реалізує Factory Method патерн з можливістю розширення
 */
class NotificationFactory {
  /**
   * Реєстр доступних нотифікаторів
   * @private
   */
  static #registry = {
    email: EmailNotifier,
    telegram: TelegramNotifier,
    console: ConsoleNotifier,
  };

  /**
   * Створити нотифікатор за типом каналу
   * 
   * @param {string} channel - Тип каналу (email, telegram, console)
   * @returns {BaseNotifier} Екземпляр нотифікатора
   * @throws {Error} Якщо канал невідомий
   * 
   * @example
   * const notifier = NotificationFactory.create('email');
   * await notifier.send('user@example.com', 'Hello!');
   */
  static create(channel) {
    const channelLower = channel.toLowerCase();
    const NotifierClass = this.#registry[channelLower];

    if (!NotifierClass) {
      const available = Object.keys(this.#registry).join(', ');
      throw new Error(
        `Невідомий канал нотифікацій: '${channel}'. ` +
        `Доступні канали: ${available}`
      );
    }

    return new NotifierClass();
  }

  /**
   * Зареєструвати новий тип нотифікатора
   * Дозволяє розширювати фабрику без зміни її коду (принцип OCP)
   * 
   * @param {string} name - Назва каналу
   * @param {typeof BaseNotifier} notifierClass - Клас нотифікатора
   * @throws {Error} Якщо клас не успадковує BaseNotifier
   * 
   * @example
   * class SlackNotifier extends BaseNotifier {
   *   async send(recipient, message) {
   *     // Slack API integration
   *   }
   * }
   * NotificationFactory.register('slack', SlackNotifier);
   */
  static register(name, notifierClass) {
    // Перевірити, що клас успадковує BaseNotifier
    if (!(notifierClass.prototype instanceof BaseNotifier)) {
      throw new Error(
        `Клас ${notifierClass.name} має успадковувати BaseNotifier`
      );
    }

    const nameLower = name.toLowerCase();
    
    if (this.#registry[nameLower]) {
      console.warn(`[NotificationFactory] Перезапис існуючого каналу: ${name}`);
    }

    this.#registry[nameLower] = notifierClass;
    console.log(`[NotificationFactory] Зареєстровано новий канал: ${name}`);
  }

  /**
   * Отримати список доступних каналів
   * @returns {string[]} Масив назв каналів
   */
  static getAvailableChannels() {
    return Object.keys(this.#registry);
  }

  /**
   * Перевірити, чи канал зареєстрований
   * @param {string} channel - Назва каналу
   * @returns {boolean}
   */
  static isChannelAvailable(channel) {
    return channel.toLowerCase() in this.#registry;
  }
}

// Експорт
module.exports = {
  NotificationFactory,
  BaseNotifier,
  EmailNotifier,
  TelegramNotifier,
  ConsoleNotifier,
};
