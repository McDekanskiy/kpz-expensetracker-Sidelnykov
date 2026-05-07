/**
 * AppConfig - Singleton патерн для конфігурації застосунку
 * 
 * Забезпечує єдину точку доступу до конфігурації застосунку.
 * Завантажує змінні середовища один раз при ініціалізації.
 * 
 * @example
 * const config = require('./core/config');
 * console.log(config.PORT); // 3000
 * console.log(config.DATABASE_URL);
 */

class AppConfig {
  /**
   * Приватне статичне поле для зберігання єдиного екземпляра
   * @private
   */
  static #instance = null;

  /**
   * Прапорець для відстеження процесу ініціалізації (Thread-safe)
   * @private
   */
  static #isInitializing = false;

  /**
   * Promise для синхронізації async ініціалізації
   * @private
   */
  static #initPromise = null;

  /**
   * Приватний конструктор - запобігає створенню екземплярів ззовні
   * @private
   */
  constructor() {
    if (AppConfig.#instance) {
      throw new Error(
        'AppConfig є Singleton. Використовуйте AppConfig.getInstance() або require("./core/config")'
      );
    }

    // Завантажити змінні середовища
    this.#loadConfig();
    
    // Валідувати обов'язкові параметри
    this.#validate();

    AppConfig.#instance = this;
  }

  /**
   * Завантажити конфігурацію з process.env
   * @private
   */
  #loadConfig() {
    // Основні налаштування
    this.PORT = parseInt(process.env.PORT, 10) || 3000;
    this.NODE_ENV = process.env.NODE_ENV || 'development';
    
    // База даних
    this.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/expense_tracker';
    
    // JWT
    this.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    
    // Логування
    this.LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';
    
    // Нотифікації
    this.NOTIFICATION_CHANNEL = process.env.NOTIFICATION_CHANNEL || 'console';
    
    // Прапорець для дебагу
    this.DEBUG = this.NODE_ENV === 'development';

    // Позначити як завантажену
    this._loaded = true;
  }

  /**
   * Валідувати обов'язкові параметри конфігурації
   * @private
   * @throws {Error} Якщо відсутні критичні параметри
   */
  #validate() {
    const requiredInProduction = ['JWT_SECRET', 'DATABASE_URL'];
    
    if (this.NODE_ENV === 'production') {
      for (const param of requiredInProduction) {
        if (!process.env[param]) {
          console.warn(`[Config Warning] ${param} не встановлено в production середовищі`);
        }
      }

      // У production не можна використовувати дефолтний секрет
      if (this.JWT_SECRET === 'dev-secret-key-change-in-production') {
        throw new Error('JWT_SECRET повинен бути встановлений у production середовищі');
      }
    }
  }

  /**
   * Отримати єдиний екземпляр конфігурації (синхронний метод)
   * @returns {AppConfig} Екземпляр конфігурації
   */
  static getInstance() {
    if (!AppConfig.#instance) {
      AppConfig.#instance = new AppConfig();
    }
    return AppConfig.#instance;
  }

  /**
   * Отримати єдиний екземпляр конфігурації (async метод для Thread-safety)
   * Запобігає race condition при одночасних викликах
   * 
   * @returns {Promise<AppConfig>} Promise з екземпляром конфігурації
   * @example
   * const config = await AppConfig.getInstanceAsync();
   */
  static async getInstanceAsync() {
    // Якщо екземпляр вже створений - повернути його
    if (AppConfig.#instance) {
      return AppConfig.#instance;
    }

    // Якщо вже йде ініціалізація - дочекатися її завершення
    if (AppConfig.#isInitializing) {
      return AppConfig.#initPromise;
    }

    // Почати ініціалізацію
    AppConfig.#isInitializing = true;
    AppConfig.#initPromise = Promise.resolve().then(() => {
      if (!AppConfig.#instance) {
        AppConfig.#instance = new AppConfig();
      }
      AppConfig.#isInitializing = false;
      return AppConfig.#instance;
    });

    return AppConfig.#initPromise;
  }

  /**
   * Перевірити, чи конфігурація завантажена
   * @returns {boolean}
   */
  isLoaded() {
    return this._loaded === true;
  }

  /**
   * Отримати всі параметри конфігурації як об'єкт
   * @returns {Object} Об'єкт з параметрами конфігурації
   */
  toObject() {
    return {
      PORT: this.PORT,
      NODE_ENV: this.NODE_ENV,
      DATABASE_URL: this.DATABASE_URL,
      JWT_SECRET: '***hidden***', // Не показувати секрет
      JWT_EXPIRES_IN: this.JWT_EXPIRES_IN,
      LOG_LEVEL: this.LOG_LEVEL,
      NOTIFICATION_CHANNEL: this.NOTIFICATION_CHANNEL,
      DEBUG: this.DEBUG,
    };
  }

  /**
   * Строкове представлення конфігурації
   * @returns {string}
   */
  toString() {
    return `AppConfig(env=${this.NODE_ENV}, port=${this.PORT}, debug=${this.DEBUG})`;
  }

  /**
   * Для дебагу - вивести конфігурацію в консоль
   */
  print() {
    console.log('='.repeat(50));
    console.log('APPLICATION CONFIGURATION');
    console.log('='.repeat(50));
    console.log(`Environment:     ${this.NODE_ENV}`);
    console.log(`Port:            ${this.PORT}`);
    console.log(`Database:        ${this.DATABASE_URL}`);
    console.log(`JWT Expires:     ${this.JWT_EXPIRES_IN}`);
    console.log(`Log Level:       ${this.LOG_LEVEL}`);
    console.log(`Notifications:   ${this.NOTIFICATION_CHANNEL}`);
    console.log(`Debug Mode:      ${this.DEBUG}`);
    console.log('='.repeat(50));
  }
}

// Експортувати єдиний екземпляр (не клас)
// Це гарантує, що при require() завжди повертається той самий об'єкт
module.exports = AppConfig.getInstance();

// Також експортувати клас для тестування
module.exports.AppConfig = AppConfig;
