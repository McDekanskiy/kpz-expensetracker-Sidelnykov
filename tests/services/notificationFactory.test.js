/**
 * Тести для NotificationFactory - Factory Method патерн
 */

const {
  NotificationFactory,
  BaseNotifier,
  EmailNotifier,
  TelegramNotifier,
  ConsoleNotifier,
} = require('../../src/services/notificationFactory');

describe('NotificationFactory - Factory Method Pattern', () => {
  
  describe('Factory creation', () => {
    test('create() створює EmailNotifier', () => {
      const notifier = NotificationFactory.create('email');
      expect(notifier).toBeInstanceOf(EmailNotifier);
      expect(notifier).toBeInstanceOf(BaseNotifier);
    });

    test('create() створює TelegramNotifier', () => {
      const notifier = NotificationFactory.create('telegram');
      expect(notifier).toBeInstanceOf(TelegramNotifier);
      expect(notifier).toBeInstanceOf(BaseNotifier);
    });

    test('create() створює ConsoleNotifier', () => {
      const notifier = NotificationFactory.create('console');
      expect(notifier).toBeInstanceOf(ConsoleNotifier);
      expect(notifier).toBeInstanceOf(BaseNotifier);
    });

    test('create() не чутливий до регістру', () => {
      const notifier1 = NotificationFactory.create('EMAIL');
      const notifier2 = NotificationFactory.create('Email');
      const notifier3 = NotificationFactory.create('email');
      
      expect(notifier1).toBeInstanceOf(EmailNotifier);
      expect(notifier2).toBeInstanceOf(EmailNotifier);
      expect(notifier3).toBeInstanceOf(EmailNotifier);
    });

    test('create() викидає помилку для невідомого каналу', () => {
      expect(() => {
        NotificationFactory.create('sms');
      }).toThrow('Невідомий канал нотифікацій');
    });

    test('помилка містить список доступних каналів', () => {
      try {
        NotificationFactory.create('unknown');
      } catch (error) {
        expect(error.message).toContain('email');
        expect(error.message).toContain('telegram');
        expect(error.message).toContain('console');
      }
    });
  });

  describe('BaseNotifier interface', () => {
    test('BaseNotifier.send() викидає помилку (абстрактний метод)', async () => {
      const notifier = new BaseNotifier();
      
      await expect(
        notifier.send('test@example.com', 'Test message')
      ).rejects.toThrow('має бути реалізований');
    });

    test('всі нотифікатори мають метод send()', () => {
      const notifiers = [
        NotificationFactory.create('email'),
        NotificationFactory.create('telegram'),
        NotificationFactory.create('console'),
      ];

      notifiers.forEach(notifier => {
        expect(typeof notifier.send).toBe('function');
      });
    });

    test('всі нотифікатори мають шаблонні методи', () => {
      const notifier = NotificationFactory.create('console');
      
      expect(typeof notifier.notifyExpenseCreated).toBe('function');
      expect(typeof notifier.notifyExpenseUpdated).toBe('function');
      expect(typeof notifier.notifyExpenseDeleted).toBe('function');
      expect(typeof notifier.notifyBudgetExceeded).toBe('function');
    });
  });

  describe('Notifier functionality', () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('EmailNotifier.send() виконується успішно', async () => {
      const notifier = NotificationFactory.create('email');
      const result = await notifier.send('user@example.com', 'Test message');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('TelegramNotifier.send() виконується успішно', async () => {
      const notifier = NotificationFactory.create('telegram');
      const result = await notifier.send('123456789', 'Test message');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('ConsoleNotifier.send() виконується успішно', async () => {
      const notifier = NotificationFactory.create('console');
      const result = await notifier.send('user', 'Test message');
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Template methods', () => {
    let notifier;
    let consoleSpy;

    beforeEach(() => {
      notifier = NotificationFactory.create('console');
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test('notifyExpenseCreated() форматує та відправляє повідомлення', async () => {
      const expense = {
        amount: 150.50,
        description: 'Покупка продуктів',
        date: new Date('2024-01-15'),
      };

      const result = await notifier.notifyExpenseCreated('user@example.com', expense);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      // Перевірити, що повідомлення містить дані витрати
      const output = consoleSpy.mock.calls.join('\n');
      expect(output).toContain('150.5');
      expect(output).toContain('Покупка продуктів');
    });

    test('notifyExpenseUpdated() форматує та відправляє повідомлення', async () => {
      const expense = {
        amount: 200,
        description: 'Оновлена витрата',
      };

      const result = await notifier.notifyExpenseUpdated('user@example.com', expense);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('notifyExpenseDeleted() відправляє повідомлення', async () => {
      const expense = {
        amount: 100,
        description: 'Видалена витрата',
      };

      const result = await notifier.notifyExpenseDeleted('user@example.com', expense);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('notifyBudgetExceeded() відправляє попередження', async () => {
      const budget = {
        limit: 1000,
        spent: 1200,
      };

      const result = await notifier.notifyBudgetExceeded('user@example.com', budget);
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();
      
      const output = consoleSpy.mock.calls.join('\n');
      expect(output).toContain('1200');
      expect(output).toContain('1000');
    });
  });

  describe('Factory extensibility - register()', () => {
    // Створити тестовий нотифікатор
    class TestNotifier extends BaseNotifier {
      async send(recipient, message) {
        return true;
      }
    }

    class InvalidNotifier {
      async send(recipient, message) {
        return true;
      }
    }

    test('register() додає новий тип нотифікатора', () => {
      NotificationFactory.register('test', TestNotifier);
      
      const notifier = NotificationFactory.create('test');
      expect(notifier).toBeInstanceOf(TestNotifier);
    });

    test('register() не чутливий до регістру', () => {
      NotificationFactory.register('TEST2', TestNotifier);
      
      const notifier = NotificationFactory.create('test2');
      expect(notifier).toBeInstanceOf(TestNotifier);
    });

    test('register() викидає помилку для класу, що не успадковує BaseNotifier', () => {
      expect(() => {
        NotificationFactory.register('invalid', InvalidNotifier);
      }).toThrow('має успадковувати BaseNotifier');
    });

    test('register() попереджає про перезапис існуючого каналу', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      NotificationFactory.register('email', TestNotifier);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Перезапис існуючого каналу')
      );
      
      warnSpy.mockRestore();
      logSpy.mockRestore();
    });

    test('зареєстрований нотифікатор працює коректно', async () => {
      class SlackNotifier extends BaseNotifier {
        async send(recipient, message) {
          return `Sent to ${recipient}: ${message}`;
        }
      }

      NotificationFactory.register('slack', SlackNotifier);
      
      const notifier = NotificationFactory.create('slack');
      const result = await notifier.send('#channel', 'Hello Slack!');
      
      expect(result).toContain('Sent to #channel');
    });
  });

  describe('Utility methods', () => {
    test('getAvailableChannels() повертає список каналів', () => {
      const channels = NotificationFactory.getAvailableChannels();
      
      expect(Array.isArray(channels)).toBe(true);
      expect(channels).toContain('email');
      expect(channels).toContain('telegram');
      expect(channels).toContain('console');
    });

    test('isChannelAvailable() перевіряє існування каналу', () => {
      expect(NotificationFactory.isChannelAvailable('email')).toBe(true);
      expect(NotificationFactory.isChannelAvailable('telegram')).toBe(true);
      expect(NotificationFactory.isChannelAvailable('sms')).toBe(false);
    });

    test('isChannelAvailable() не чутливий до регістру', () => {
      expect(NotificationFactory.isChannelAvailable('EMAIL')).toBe(true);
      expect(NotificationFactory.isChannelAvailable('Email')).toBe(true);
    });
  });

  describe('Polymorphism', () => {
    test('всі нотифікатори взаємозамінні', async () => {
      const channels = ['email', 'telegram', 'console'];
      const expense = { amount: 100, description: 'Test' };

      for (const channel of channels) {
        const notifier = NotificationFactory.create(channel);
        
        // Всі мають однаковий інтерфейс
        const result = await notifier.notifyExpenseCreated('recipient', expense);
        expect(result).toBe(true);
      }
    });
  });
});

// Інтеграційний тест
describe('NotificationFactory Integration', () => {
  test('приклад використання в реальному коді', async () => {
    // Отримати канал з конфігурації
    const config = require('../../src/core/config');
    const channel = config.NOTIFICATION_CHANNEL || 'console';
    
    // Створити нотифікатор
    const notifier = NotificationFactory.create(channel);
    
    // Відправити нотифікацію
    const expense = {
      amount: 250.75,
      description: 'Тестова витрата',
      date: new Date(),
    };
    
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const result = await notifier.notifyExpenseCreated('user@example.com', expense);
    consoleSpy.mockRestore();
    
    expect(result).toBe(true);
  });
});
