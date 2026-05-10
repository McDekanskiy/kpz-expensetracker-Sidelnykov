// ============================================
// src/refactored/user_manager_improved.js
// Покращена версія після code review
// Виправлені всі знайдені code smells
// ============================================

const bcrypt = require('bcrypt');
const { getLogger } = require('../core/logging');
const { ValidationError, BusinessError, DatabaseError } = require('../exceptions');

const logger = getLogger('UserManager');

// ─── Константи ─────────────────────────────
const MIN_PASSWORD_LENGTH = 8;
const MAX_EMAIL_LENGTH = 254;
const MIN_EMAIL_LENGTH = 5;
const DEFAULT_ROLE = 'user';
const SALT_ROUNDS = 10;

// ─── Покращена валідація Email (Code Smell #1 виправлено) ────
/**
 * Валідація email за RFC 5322 (спрощена версія)
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    return false;
  }

  // Перевірка довжини
  if (email.length < MIN_EMAIL_LENGTH || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }

  // RFC 5322 compliant regex (спрощена версія)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ─── Покращена валідація пароля (Code Smell #2 виправлено) ────
/**
 * Валідація пароля з детальною інформацією про помилки
 * Вимоги: мінімум 8 символів, великі/малі літери, цифри, спецсимволи
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePasswordDetailed(password) {
  const errors = [];

  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return { valid: false, errors };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Проста валідація пароля (для зворотної сумісності)
 * @param {string} password
 * @returns {boolean}
 */
function validatePassword(password) {
  return validatePasswordDetailed(password).valid;
}

// ─── Справжнє хешування паролів (Code Smell #3 виправлено) ────
/**
 * Хешує пароль за допомогою bcrypt
 * @param {string} password - Пароль у відкритому вигляді
 * @returns {Promise<string>} Хешований пароль
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', { error: error.message });
    throw new Error('Failed to hash password: ' + error.message);
  }
}

/**
 * Перевіряє пароль проти хешу
 * @param {string} password - Пароль у відкритому вигляді
 * @param {string} hash - Хешований пароль з БД
 * @returns {Promise<boolean>} true якщо пароль правильний
 */
async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    logger.error('Failed to verify password', { error: error.message });
    throw new Error('Failed to verify password: ' + error.message);
  }
}

// ─── UserRepository (без змін - вже добре) ────
class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async save(email, passwordHash, name) {
    try {
      return await this.db.run(
        'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
        [email, passwordHash, name, DEFAULT_ROLE]
      );
    } catch (error) {
      throw new DatabaseError('save', error.message);
    }
  }

  async update(userId, data) {
    const { email, name } = data;
    try {
      return await this.db.run(
        'UPDATE users SET email = ?, name = ? WHERE id = ?',
        [email, name, userId]
      );
    } catch (error) {
      throw new DatabaseError('update', error.message);
    }
  }

  async delete(userId) {
    try {
      return await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      throw new DatabaseError('delete', error.message);
    }
  }

  async getAll() {
    try {
      return await this.db.all('SELECT id, email, name, role, created_at FROM users');
    } catch (error) {
      throw new DatabaseError('getAll', error.message);
    }
  }

  async findByEmail(email) {
    try {
      return await this.db.get('SELECT * FROM users WHERE email = ?', [email]);
    } catch (error) {
      throw new DatabaseError('findByEmail', error.message);
    }
  }

  async exists(userId) {
    try {
      const result = await this.db.get('SELECT 1 FROM users WHERE id = ?', [userId]);
      return !!result;
    } catch (error) {
      throw new DatabaseError('exists', error.message);
    }
  }
}

// ─── EmailService з логуванням (Code Smell #4 виправлено) ────
class EmailService {
  constructor() {
    this.logger = getLogger('EmailService');
  }

  async sendWelcome(userEmail, userName) {
    this.logger.info('Sending welcome email', {
      recipient: userEmail,
      userName
    });

    try {
      // У реальному проєкті тут буде nodemailer
      // await this.mailer.send({ ... });

      this.logger.debug('Welcome email sent successfully', {
        recipient: userEmail
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send welcome email', {
        recipient: userEmail,
        error: error.message
      });
      throw error;
    }
  }

  async sendPasswordReset(userEmail, resetToken) {
    this.logger.info('Sending password reset email', {
      recipient: userEmail
    });

    try {
      // У реальному проєкті тут буде nodemailer
      // await this.mailer.send({ ... });

      // Не логуємо токен у production!
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('Reset token generated', { token: resetToken });
      }

      this.logger.debug('Password reset email sent successfully', {
        recipient: userEmail
      });

      return true;
    } catch (error) {
      this.logger.error('Failed to send password reset email', {
        recipient: userEmail,
        error: error.message
      });
      throw error;
    }
  }
}

// ─── ReportService з логуванням (Code Smell #4 виправлено) ────
class ReportService {
  constructor() {
    this.logger = getLogger('ReportService');
  }

  generateNewUserReport(user) {
    this.logger.info('Generating new user report', {
      email: user.email,
      timestamp: new Date().toISOString()
    });

    const report = {
      type: 'NEW_USER',
      email: user.email,
      name: user.name,
      timestamp: new Date().toISOString()
    };

    this.logger.debug('User report generated', { report });
    return report;
  }

  generateUserListReport(users) {
    this.logger.info('Generating user list report', {
      userCount: users.length
    });

    const report = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role
    }));

    this.logger.debug('User list report generated', {
      userCount: report.length
    });

    return report;
  }
}

// ─── UserService з покращеною обробкою помилок (Code Smell #5 виправлено) ────
class UserService {
  constructor(userRepository, emailService, reportService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
    this.reportService = reportService;
    this.logger = getLogger('UserService');
  }

  async register(email, password, name) {
    this.logger.info('Starting user registration', { email, name });

    // Валідація email
    if (!validateEmail(email)) {
      this.logger.warning('Invalid email format', { email });
      throw new ValidationError('email', 'Некоректний формат email');
    }

    // Валідація пароля з детальними помилками
    const passwordValidation = validatePasswordDetailed(password);
    if (!passwordValidation.valid) {
      this.logger.warning('Password validation failed', {
        errors: passwordValidation.errors
      });
      throw new ValidationError('password', passwordValidation.errors.join('; '));
    }

    // Перевірка унікальності email
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      this.logger.warning('Email already exists', { email });
      throw new BusinessError('Email вже використовується', 'EMAIL_EXISTS');
    }

    // Хешування пароля (справжнє bcrypt)
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
    } catch (error) {
      this.logger.error('Failed to hash password', { error: error.message });
      throw error;
    }

    // Збереження користувача (критична операція)
    let user;
    try {
      user = await this.userRepository.save(email, passwordHash, name);
      this.logger.info('User registered successfully', {
        userId: user.id,
        email
      });
    } catch (error) {
      this.logger.error('Failed to save user', {
        email,
        error: error.message
      });
      throw error;
    }

    // Email (некритична операція - не ламаємо реєстрацію)
    try {
      await this.emailService.sendWelcome(email, name);
    } catch (error) {
      this.logger.warning('Failed to send welcome email', {
        userId: user.id,
        email,
        error: error.message
      });
      // Не кидаємо помилку - користувач вже створений
    }

    // Звіт (некритична операція)
    try {
      this.reportService.generateNewUserReport({ email, name });
    } catch (error) {
      this.logger.warning('Failed to generate user report', {
        userId: user.id,
        error: error.message
      });
      // Не кидаємо помилку
    }

    return user;
  }

  async update(userId, data) {
    this.logger.info('Updating user', { userId, data });

    // Валідація email якщо він змінюється
    if (data.email && !validateEmail(data.email)) {
      this.logger.warning('Invalid email format', { email: data.email });
      throw new ValidationError('email', 'Некоректний формат email');
    }

    try {
      const result = await this.userRepository.update(userId, data);
      this.logger.info('User updated successfully', { userId });
      return result;
    } catch (error) {
      this.logger.error('Failed to update user', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async delete(userId) {
    this.logger.info('Deleting user', { userId });

    try {
      const result = await this.userRepository.delete(userId);
      this.logger.info('User deleted successfully', { userId });
      return result;
    } catch (error) {
      this.logger.error('Failed to delete user', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  async getAll() {
    this.logger.info('Fetching all users');

    try {
      const users = await this.userRepository.getAll();
      this.logger.info('Users fetched successfully', { count: users.length });
      return users;
    } catch (error) {
      this.logger.error('Failed to fetch users', { error: error.message });
      throw error;
    }
  }

  /**
   * Аутентифікація користувача
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} Користувач якщо аутентифікація успішна
   */
  async authenticate(email, password) {
    this.logger.info('Authenticating user', { email });

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warning('User not found', { email });
      throw new BusinessError('Невірний email або пароль', 'INVALID_CREDENTIALS');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      this.logger.warning('Invalid password', { email });
      throw new BusinessError('Невірний email або пароль', 'INVALID_CREDENTIALS');
    }

    this.logger.info('User authenticated successfully', {
      userId: user.id,
      email
    });

    // Не повертаємо password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

// ─── Експорт ───────────────────────────────
module.exports = {
  validateEmail,
  validatePassword,
  validatePasswordDetailed,
  hashPassword,
  verifyPassword,
  UserRepository,
  EmailService,
  ReportService,
  UserService,
  // Константи для тестування
  MIN_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
  MIN_EMAIL_LENGTH,
  SALT_ROUNDS
};
