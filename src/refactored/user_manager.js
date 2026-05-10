// ============================================
// src/refactored/user_manager.js
// Рефакторинг за принципами SOLID + DRY
// Expense Tracker — Node.js
// ============================================

// ─── Утилітарна функція валідації (DRY) ────
/**
 * Валідація email — єдине місце, без дублювань (DRY)
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.length > 3;
}

/**
 * Валідація пароля — єдине місце (DRY)
 * @param {string} password
 * @returns {boolean}
 */
function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

// ─── Константи (без Magic Numbers) ─────────
const MIN_PASSWORD_LENGTH = 8; // замість числа 8 напряму в коді
const DEFAULT_ROLE = 'user';

// ─── UserRepository (SRP + DIP) ────────────
/**
 * Відповідає ТІЛЬКИ за збереження даних у БД.
 * Залежність (db) передається ззовні — DIP.
 */
class UserRepository {
  constructor(db) {
    this.db = db; // залежність передається через конструктор (DIP)
  }

  save(email, passwordHash, name) {
    return this.db.run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, DEFAULT_ROLE]
    );
  }

  update(userId, data) {
    const { email, name } = data;
    return this.db.run(
      'UPDATE users SET email = ?, name = ? WHERE id = ?',
      [email, name, userId]
    );
  }

  delete(userId) {
    return this.db.run('DELETE FROM users WHERE id = ?', [userId]);
  }

  getAll() {
    return this.db.all('SELECT id, email, name, role, created_at FROM users');
  }

  findByEmail(email) {
    return this.db.get('SELECT * FROM users WHERE email = ?', [email]);
  }
}

// ─── EmailService (SRP) ────────────────────
/**
 * Відповідає ТІЛЬКИ за відправку email-повідомлень.
 * Нічого не знає про базу даних або бізнес-логіку.
 */
class EmailService {
  sendWelcome(userEmail, userName) {
    // У реальному проєкті тут буде nodemailer
    console.log(`[EmailService] Відправка welcome-листа до ${userEmail}`);
    console.log(`Тема: Ласкаво просимо, ${userName}!`);
  }

  sendPasswordReset(userEmail, resetToken) {
    console.log(`[EmailService] Відправка reset-листа до ${userEmail}`);
    console.log(`Токен: ${resetToken}`);
  }
}

// ─── ReportService (SRP) ───────────────────
/**
 * Відповідає ТІЛЬКИ за генерацію звітів.
 * Нічого не знає про email або базу даних.
 */
class ReportService {
  generateNewUserReport(user) {
    const report = `[ReportService] Новий користувач: ${user.email} (${new Date().toISOString()})`;
    console.log(report);
    return report;
  }

  generateUserListReport(users) {
    return users.map(u => `${u.id}: ${u.email} — ${u.name}`).join('\n');
  }
}

// ─── UserService (SRP + DIP) ───────────────
/**
 * Бізнес-логіка: координує роботу репозиторію,
 * email-сервісу та звітів.
 * Залежності передаються через конструктор (DIP) —
 * легко замінити на mock у тестах.
 */
class UserService {
  constructor(userRepository, emailService, reportService) {
    this.userRepository = userRepository; // DIP
    this.emailService = emailService;     // DIP
    this.reportService = reportService;   // DIP
  }

  async register(email, password, name) {
    // Валідація (DRY — використовуємо спільні функції)
    if (!validateEmail(email)) {
      throw new Error('Некоректний формат email');
    }
    if (!validatePassword(password)) {
      throw new Error(`Пароль повинен містити мінімум ${MIN_PASSWORD_LENGTH} символів`);
    }

    // Перевірка унікальності email
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email вже використовується');
    }

    // Хешування пароля (у реальному проєкті — bcrypt)
    const passwordHash = `hashed_${password}`;

    // Збереження
    const user = await this.userRepository.save(email, passwordHash, name);

    // Надсилання email (SRP: EmailService відповідає за це)
    this.emailService.sendWelcome(email, name);

    // Генерація звіту (SRP: ReportService відповідає за це)
    this.reportService.generateNewUserReport({ email, name });

    return user;
  }

  async update(userId, data) {
    // Валідація (DRY — та сама функція)
    if (data.email && !validateEmail(data.email)) {
      throw new Error('Некоректний формат email');
    }
    return this.userRepository.update(userId, data);
  }

  async delete(userId) {
    return this.userRepository.delete(userId);
  }

  async getAll() {
    return this.userRepository.getAll();
  }
}

// ─── Експорт ───────────────────────────────
module.exports = {
  validateEmail,
  validatePassword,
  UserRepository,
  EmailService,
  ReportService,
  UserService,
};