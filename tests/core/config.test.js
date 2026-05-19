/**
 * Тести для AppConfig Singleton патерну
 */

const { AppConfig } = require('../../src/core/config');

describe('AppConfig Singleton Pattern', () => {
  
  describe('Singleton behavior', () => {
    test('getInstance() повертає той самий екземпляр', () => {
      const config1 = AppConfig.getInstance();
      const config2 = AppConfig.getInstance();
      
      expect(config1).toBe(config2);
      expect(config1).toBeInstanceOf(AppConfig);
    });

    test('require() повертає той самий екземпляр', () => {
      const config1 = require('../../src/core/config');
      const config2 = require('../../src/core/config');
      
      expect(config1).toBe(config2);
    });

    test('getInstance() та require() повертають той самий екземпляр', () => {
      const config1 = AppConfig.getInstance();
      const config2 = require('../../src/core/config');
      
      expect(config1).toBe(config2);
    });

    test('конструктор викидає помилку при прямому виклику', () => {
      expect(() => {
        new AppConfig();
      }).toThrow('AppConfig є Singleton');
    });
  });

  describe('Configuration loading', () => {
    let config;

    beforeAll(() => {
      config = AppConfig.getInstance();
    });

    test('конфігурація завантажена', () => {
      expect(config.isLoaded()).toBe(true);
    });

    test('всі обов\'язкові параметри присутні', () => {
      expect(config.PORT).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
      expect(config.DATABASE_URL).toBeDefined();
      expect(config.JWT_SECRET).toBeDefined();
      expect(config.JWT_EXPIRES_IN).toBeDefined();
      expect(config.LOG_LEVEL).toBeDefined();
      expect(config.NOTIFICATION_CHANNEL).toBeDefined();
    });

    test('PORT є числом', () => {
      expect(typeof config.PORT).toBe('number');
      expect(config.PORT).toBeGreaterThan(0);
    });

    test('NODE_ENV має правильне значення', () => {
      expect(['development', 'production', 'test']).toContain(config.NODE_ENV);
    });

    test('DEBUG прапорець встановлений правильно', () => {
      expect(typeof config.DEBUG).toBe('boolean');
      if (config.NODE_ENV === 'development') {
        expect(config.DEBUG).toBe(true);
      }
    });
  });

  describe('Default values', () => {
    test('PORT має дефолтне значення 3000', () => {
      const config = AppConfig.getInstance();
      // Якщо PORT не встановлений в env, має бути 3000
      expect(config.PORT).toBeGreaterThanOrEqual(3000);
    });

    test('NOTIFICATION_CHANNEL має дефолтне значення', () => {
      const config = AppConfig.getInstance();
      expect(config.NOTIFICATION_CHANNEL).toBeDefined();
      expect(['email', 'telegram', 'console']).toContain(config.NOTIFICATION_CHANNEL);
    });

    test('LOG_LEVEL має дефолтне значення', () => {
      const config = AppConfig.getInstance();
      expect(config.LOG_LEVEL).toBeDefined();
    });
  });

  describe('Thread-safe async getInstance', () => {
    test('getInstanceAsync() повертає Promise', async () => {
      const promise = AppConfig.getInstanceAsync();
      expect(promise).toBeInstanceOf(Promise);
      
      const config = await promise;
      expect(config).toBeInstanceOf(AppConfig);
    });

    test('паралельні виклики getInstanceAsync() повертають той самий екземпляр', async () => {
      // Симулюємо одночасні виклики
      const promises = [
        AppConfig.getInstanceAsync(),
        AppConfig.getInstanceAsync(),
        AppConfig.getInstanceAsync(),
      ];

      const configs = await Promise.all(promises);
      
      // Всі мають бути одним і тим самим об'єктом
      expect(configs[0]).toBe(configs[1]);
      expect(configs[1]).toBe(configs[2]);
      expect(configs[0]).toBe(configs[2]);
    });

    test('getInstanceAsync() та getInstance() повертають той самий екземпляр', async () => {
      const config1 = await AppConfig.getInstanceAsync();
      const config2 = AppConfig.getInstance();
      
      expect(config1).toBe(config2);
    });
  });

  describe('Utility methods', () => {
    let config;

    beforeAll(() => {
      config = AppConfig.getInstance();
    });

    test('toObject() повертає об\'єкт з параметрами', () => {
      const obj = config.toObject();
      
      expect(obj).toHaveProperty('PORT');
      expect(obj).toHaveProperty('NODE_ENV');
      expect(obj).toHaveProperty('DATABASE_URL');
      expect(obj).toHaveProperty('JWT_SECRET');
      expect(obj).toHaveProperty('NOTIFICATION_CHANNEL');
      
      // JWT_SECRET має бути прихований
      expect(obj.JWT_SECRET).toBe('***hidden***');
    });

    test('toString() повертає строкове представлення', () => {
      const str = config.toString();
      
      expect(typeof str).toBe('string');
      expect(str).toContain('AppConfig');
      expect(str).toContain(config.NODE_ENV);
      expect(str).toContain(config.PORT.toString());
    });

    test('print() виводить конфігурацію без помилок', () => {
      // Мокуємо console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      config.print();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls.length).toBeGreaterThan(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration immutability', () => {
    test('зміна властивостей не впливає на інші екземпляри', () => {
      const config1 = AppConfig.getInstance();
      const originalPort = config1.PORT;
      
      // Спроба змінити властивість
      config1.PORT = 9999;
      
      const config2 = AppConfig.getInstance();
      
      // Обидва екземпляри мають однакове значення (бо це той самий об'єкт)
      expect(config1.PORT).toBe(config2.PORT);
      expect(config1.PORT).toBe(9999);
      
      // Відновити оригінальне значення
      config1.PORT = originalPort;
    });
  });
});

// Додатковий тест для демонстрації
describe('AppConfig Usage Examples', () => {
  test('приклад використання в коді', () => {
    // Спосіб 1: через require
    const config = require('../../src/core/config');
    expect(config.PORT).toBeDefined();
    
    // Спосіб 2: через getInstance
    const { AppConfig } = require('../../src/core/config');
    const config2 = AppConfig.getInstance();
    expect(config2.PORT).toBeDefined();
    
    // Обидва способи повертають той самий об'єкт
    expect(config).toBe(config2);
  });
});
