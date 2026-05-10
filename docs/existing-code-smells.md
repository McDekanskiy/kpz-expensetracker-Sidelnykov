# Аналіз існуючого коду проєкту - Code Smells

## Знайдені Code Smells у файлі user_manager.js

### Code Smell #1: Weak Email Validation

**Файл:** `src/refactored/user_manager.js`  
**Рядки:** 13-15

**Проблема:**
```javascript
function validateEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.length > 3;
}
```

**Чому це проблема:**
- Занадто проста валідація email
- Пропускає невалідні email типу: `a@b`, `@@@@`, `test@`
- Не перевіряє формат домену
- Не перевіряє наявність крапки після @

**Рішення:**
```javascript
function validateEmail(email) {
  if (typeof email !== 'string') return false;
  
  // RFC 5322 compliant regex (спрощена версія)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length >= 5 && email.length <= 254;
}
```

**Категорія:** Security / Data Validation  
**Серйозність:** Medium

---

### Code Smell #2: Weak Password Validation

**Файл:** `src/refactored/user_manager.js`  
**Рядки:** 22-24

**Проблема:**
```javascript
function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}
```

**Чому це проблема:**
- Перевіряє тільки довжину
- Не вимагає різних типів символів (цифри, великі літери, спецсимволи)
- Пропускає слабкі паролі типу: `aaaaaaaa`, `12345678`
- Не відповідає сучасним стандартам безпеки (OWASP)

**Рішення:**
```javascript
function validatePassword(password) {
  if (typeof password !== 'string') return false;
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength &&
         hasUpperCase &&
         hasLowerCase &&
         hasNumbers &&
         hasSpecialChar;
}

// Або повернути детальну інформацію про помилки
function validatePasswordDetailed(password) {
  const errors = [];
  
  if (typeof password !== 'string') {
    errors.push('Password must be a string');
    return { valid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
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
```

**Категорія:** Security / Authentication  
**Серйозність:** High

---

### Code Smell #3: Insecure Password Hashing

**Файл:** `src/refactored/user_manager.js`  
**Рядки:** 132-133

**Проблема:**
```javascript
// Хешування пароля (у реальному проєкті — bcrypt)
const passwordHash = `hashed_${password}`;
```

**Чому це проблема:**
- Це НЕ справжнє хешування - просто конкатенація рядків
- Паролі зберігаються фактично у відкритому вигляді
- Критична вразливість безпеки
- Коментар каже "у реальному проєкті", але це має бути реалізовано

**Рішення:**
```javascript
const bcrypt = require('bcrypt');

// У класі або модулі
const SALT_ROUNDS = 10; // Константа для bcrypt

async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new Error('Failed to hash password: ' + error.message);
  }
}

async function verifyPassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Failed to verify password: ' + error.message);
  }
}

// У методі register:
async register(email, password, name) {
  // ... валідація ...
  
  // Справжнє хешування
  const passwordHash = await hashPassword(password);
  
  // ... збереження ...
}
```

**Категорія:** Security / Critical  
**Серйозність:** Critical

---

### Code Smell #4: Console.log замість Logger

**Файл:** `src/refactored/user_manager.js`  
**Рядки:** 76, 77, 82, 83, 94, 100

**Проблема:**
```javascript
console.log(`[EmailService] Відправка welcome-листа до ${userEmail}`);
console.log(`Тема: Ласкаво просимо, ${userName}!`);
```

**Чому це проблема:**
- `console.log` не підходить для production
- Немає рівнів логування (DEBUG, INFO, ERROR)
- Неможливо фільтрувати або направляти логи
- Немає структурованого формату
- Важко інтегрувати з системами моніторингу

**Рішення:**
```javascript
const { getLogger } = require('../core/logging');
const logger = getLogger('EmailService');

class EmailService {
  sendWelcome(userEmail, userName) {
    logger.info('Sending welcome email', { 
      recipient: userEmail, 
      userName 
    });
    
    // У реальному проєкті тут буде nodemailer
    // await this.mailer.send({ ... });
    
    logger.debug('Welcome email sent successfully', { 
      recipient: userEmail 
    });
  }

  sendPasswordReset(userEmail, resetToken) {
    logger.info('Sending password reset email', { 
      recipient: userEmail 
    });
    
    // Не логуємо токен у production!
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Reset token generated', { token: resetToken });
    }
  }
}
```

**Категорія:** Maintainability / Logging  
**Серйозність:** Medium

---

### Code Smell #5: Missing Error Handling

**Файл:** `src/refactored/user_manager.js`  
**Рядки:** 117-145

**Проблема:**
```javascript
async register(email, password, name) {
  // ... валідація ...
  
  const user = await this.userRepository.save(email, passwordHash, name);
  
  // Ці методи можуть впасти, але помилки не обробляються
  this.emailService.sendWelcome(email, name);
  this.reportService.generateNewUserReport({ email, name });
  
  return user;
}
```

**Чому це проблема:**
- Якщо `sendWelcome` або `generateNewUserReport` кинуть помилку, вся реєстрація впаде
- Користувач створений у БД, але отримає помилку
- Немає обробки часткових збоїв
- Email та звіти - не критичні операції, не повинні ламати реєстрацію

**Рішення:**
```javascript
async register(email, password, name) {
  const logger = getLogger('UserService');
  
  // Валідація
  if (!validateEmail(email)) {
    throw new ValidationError('email', 'Некоректний формат email');
  }
  if (!validatePassword(password)) {
    throw new ValidationError('password', `Пароль повинен містити мінімум ${MIN_PASSWORD_LENGTH} символів`);
  }

  // Перевірка унікальності
  const existing = await this.userRepository.findByEmail(email);
  if (existing) {
    throw new BusinessError('Email вже використовується', 'EMAIL_EXISTS');
  }

  // Хешування
  const passwordHash = await hashPassword(password);

  // Збереження (критична операція)
  let user;
  try {
    user = await this.userRepository.save(email, passwordHash, name);
    logger.info('User registered successfully', { userId: user.id, email });
  } catch (error) {
    logger.error('Failed to save user', { email, error: error.message });
    throw new DatabaseError('save', error.message);
  }

  // Email (некритична операція - не ламаємо реєстрацію)
  try {
    await this.emailService.sendWelcome(email, name);
  } catch (error) {
    logger.warning('Failed to send welcome email', { 
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
    logger.warning('Failed to generate user report', { 
      userId: user.id, 
      error: error.message 
    });
    // Не кидаємо помилку
  }

  return user;
}
```

**Категорія:** Error Handling / Reliability  
**Серйозність:** High

---

## Підсумок

### Статистика знайдених Code Smells:

| Категорія | Кількість | Серйозність |
|-----------|-----------|-------------|
| Security | 3 | 1 Critical, 2 High/Medium |
| Maintainability | 1 | Medium |
| Error Handling | 1 | High |
| **Всього** | **5** | **1 Critical, 2 High, 2 Medium** |

### Пріоритети виправлення:

1. **🔴 Critical:** Insecure Password Hashing - виправити негайно
2. **🟠 High:** Weak Password Validation - виправити у наступному релізі
3. **🟠 High:** Missing Error Handling - виправити у наступному релізі
4. **🟡 Medium:** Weak Email Validation - виправити коли буде час
5. **🟡 Medium:** Console.log замість Logger - виправити коли буде час

### Рекомендації:

1. Встановити `bcrypt` та реалізувати справжнє хешування паролів
2. Покращити валідацію email та паролів
3. Додати proper error handling для некритичних операцій
4. Замінити `console.log` на структуроване логування
5. Додати unit tests для всіх валідаторів
6. Провести security audit перед production deployment
