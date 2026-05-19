/**
 * Тести для ExpenseBuilder - Builder патерн
 */

const {
  ExpenseBuilder,
  createSimpleExpense,
  MIN_AMOUNT,
  MAX_AMOUNT,
  ALLOWED_PAYMENT_METHODS,
  ALLOWED_STATUSES,
} = require('../../src/models/expenseBuilder');

describe('ExpenseBuilder - Builder Pattern', () => {
  
  describe('Constructor validation', () => {
    test('створює builder з валідними параметрами', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(builder).toBeInstanceOf(ExpenseBuilder);
      expect(builder.expense).toBeDefined();
    });

    test('викидає помилку без userId', () => {
      expect(() => {
        new ExpenseBuilder(null, 5, 100);
      }).toThrow('userId є обов\'язковим');
    });

    test('викидає помилку без categoryId', () => {
      expect(() => {
        new ExpenseBuilder(1, null, 100);
      }).toThrow('categoryId є обов\'язковим');
    });

    test('викидає помилку з невалідною сумою', () => {
      expect(() => {
        new ExpenseBuilder(1, 5, 'invalid');
      }).toThrow('amount має бути числом');
    });

    test('викидає помилку якщо сума менша за мінімум', () => {
      expect(() => {
        new ExpenseBuilder(1, 5, 0);
      }).toThrow('має бути між');
    });

    test('викидає помилку якщо сума більша за максимум', () => {
      expect(() => {
        new ExpenseBuilder(1, 5, 2000000);
      }).toThrow('має бути між');
    });

    test('приймає мінімальну валідну суму', () => {
      const builder = new ExpenseBuilder(1, 5, MIN_AMOUNT);
      expect(builder.expense.amount).toBe(MIN_AMOUNT);
    });

    test('приймає максимальну валідну суму', () => {
      const builder = new ExpenseBuilder(1, 5, MAX_AMOUNT);
      expect(builder.expense.amount).toBe(MAX_AMOUNT);
    });
  });

  describe('Default values', () => {
    test('встановлює дефолтні значення', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      const expense = builder.expense;

      expect(expense.description).toBe('');
      expect(expense.date).toBeInstanceOf(Date);
      expect(expense.tags).toEqual([]);
      expect(expense.paymentMethod).toBe('cash');
      expect(expense.status).toBe('completed');
      expect(expense.isRecurring).toBe(false);
      expect(expense.attachments).toEqual([]);
      expect(expense.metadata).toEqual({});
    });
  });

  describe('Fluent interface', () => {
    test('всі методи повертають this', () => {
      const builder = new ExpenseBuilder(1, 5, 100);

      expect(builder.description('test')).toBe(builder);
      expect(builder.tag('food')).toBe(builder);
      expect(builder.paymentMethod('card')).toBe(builder);
      expect(builder.recurring(true)).toBe(builder);
    });

    test('дозволяє ланцюжок викликів', () => {
      const expense = new ExpenseBuilder(1, 5, 150.50)
        .description('Покупка продуктів')
        .paymentMethod('card')
        .tag('groceries')
        .tag('food')
        .recurring(false)
        .build();

      expect(expense.description).toBe('Покупка продуктів');
      expect(expense.paymentMethod).toBe('card');
      expect(expense.tags).toContain('groceries');
      expect(expense.tags).toContain('food');
      expect(expense.isRecurring).toBe(false);
    });
  });

  describe('description() method', () => {
    test('встановлює опис', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .description('Тестовий опис')
        .build();

      expect(expense.description).toBe('Тестовий опис');
    });

    test('обрізає пробіли', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .description('  Опис з пробілами  ')
        .build();

      expect(expense.description).toBe('Опис з пробілами');
    });

    test('викидає помилку для не-рядка', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.description(123);
      }).toThrow('Опис має бути рядком');
    });
  });

  describe('date() method', () => {
    test('встановлює дату з Date об\'єкта', () => {
      const testDate = new Date('2024-01-15');
      const expense = new ExpenseBuilder(1, 5, 100)
        .date(testDate)
        .build();

      expect(expense.date.toDateString()).toBe(testDate.toDateString());
    });

    test('встановлює дату з рядка', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .date('2024-01-15')
        .build();

      expect(expense.date).toBeInstanceOf(Date);
    });

    test('викидає помилку для дати в майбутньому', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.date(futureDate);
      }).toThrow('не може бути в майбутньому');
    });

    test('викидає помилку для невалідної дати', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.date('invalid-date');
      }).toThrow('Невалідна дата');
    });

    test('приймає сьогоднішню дату', () => {
      const today = new Date();
      const expense = new ExpenseBuilder(1, 5, 100)
        .date(today)
        .build();

      expect(expense.date.toDateString()).toBe(today.toDateString());
    });
  });

  describe('tag() method', () => {
    test('додає тег', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tag('food')
        .build();

      expect(expense.tags).toContain('food');
    });

    test('додає кілька тегів', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tag('food')
        .tag('groceries')
        .tag('supermarket')
        .build();

      expect(expense.tags).toHaveLength(3);
      expect(expense.tags).toContain('food');
      expect(expense.tags).toContain('groceries');
      expect(expense.tags).toContain('supermarket');
    });

    test('нормалізує теги до lowercase', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tag('FOOD')
        .tag('Food')
        .build();

      expect(expense.tags).toContain('food');
    });

    test('уникає дублікатів', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tag('food')
        .tag('food')
        .tag('FOOD')
        .build();

      expect(expense.tags).toHaveLength(1);
      expect(expense.tags[0]).toBe('food');
    });

    test('обрізає пробіли', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tag('  food  ')
        .build();

      expect(expense.tags[0]).toBe('food');
    });

    test('викидає помилку для порожнього тегу', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.tag('');
      }).toThrow('непорожнім рядком');
    });
  });

  describe('tags() method', () => {
    test('встановлює масив тегів', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .tags(['food', 'groceries', 'supermarket'])
        .build();

      expect(expense.tags).toHaveLength(3);
    });

    test('викидає помилку для не-масиву', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.tags('not-an-array');
      }).toThrow('має бути масивом');
    });
  });

  describe('paymentMethod() method', () => {
    test('встановлює валідний метод оплати', () => {
      ALLOWED_PAYMENT_METHODS.forEach(method => {
        const expense = new ExpenseBuilder(1, 5, 100)
          .paymentMethod(method)
          .build();

        expect(expense.paymentMethod).toBe(method);
      });
    });

    test('не чутливий до регістру', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .paymentMethod('CARD')
        .build();

      expect(expense.paymentMethod).toBe('card');
    });

    test('викидає помилку для невалідного методу', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.paymentMethod('bitcoin');
      }).toThrow('неприпустимий');
    });
  });

  describe('status() method', () => {
    test('встановлює валідний статус', () => {
      ALLOWED_STATUSES.forEach(status => {
        const expense = new ExpenseBuilder(1, 5, 100)
          .status(status)
          .build();

        expect(expense.status).toBe(status);
      });
    });

    test('викидає помилку для невалідного статусу', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.status('invalid');
      }).toThrow('неприпустимий');
    });
  });

  describe('recurring() method', () => {
    test('встановлює isRecurring в true', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .recurring(true)
        .build();

      expect(expense.isRecurring).toBe(true);
    });

    test('встановлює isRecurring в false', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .recurring(false)
        .build();

      expect(expense.isRecurring).toBe(false);
    });

    test('дефолтне значення true', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .recurring()
        .build();

      expect(expense.isRecurring).toBe(true);
    });

    test('викидає помилку для не-boolean', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      expect(() => {
        builder.recurring('yes');
      }).toThrow('має бути boolean');
    });
  });

  describe('attachment() and attachments() methods', () => {
    test('додає вкладення', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .attachment('https://example.com/receipt.pdf')
        .build();

      expect(expense.attachments).toHaveLength(1);
      expect(expense.attachments[0]).toBe('https://example.com/receipt.pdf');
    });

    test('додає кілька вкладень', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .attachment('url1.pdf')
        .attachment('url2.jpg')
        .build();

      expect(expense.attachments).toHaveLength(2);
    });

    test('встановлює масив вкладень', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .attachments(['url1.pdf', 'url2.jpg', 'url3.png'])
        .build();

      expect(expense.attachments).toHaveLength(3);
    });
  });

  describe('meta() and metadata() methods', () => {
    test('додає метадані', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .meta('location', 'Kyiv')
        .meta('store', 'Silpo')
        .build();

      expect(expense.metadata.location).toBe('Kyiv');
      expect(expense.metadata.store).toBe('Silpo');
    });

    test('встановлює об\'єкт метаданих', () => {
      const expense = new ExpenseBuilder(1, 5, 100)
        .metadata({ location: 'Kyiv', store: 'Silpo' })
        .build();

      expect(expense.metadata.location).toBe('Kyiv');
      expect(expense.metadata.store).toBe('Silpo');
    });
  });

  describe('build() method', () => {
    test('повертає об\'єкт витрати', () => {
      const expense = new ExpenseBuilder(1, 5, 100).build();

      expect(expense).toHaveProperty('userId');
      expect(expense).toHaveProperty('categoryId');
      expect(expense).toHaveProperty('amount');
      expect(expense).toHaveProperty('description');
      expect(expense).toHaveProperty('date');
      expect(expense).toHaveProperty('tags');
      expect(expense).toHaveProperty('paymentMethod');
      expect(expense).toHaveProperty('status');
      expect(expense).toHaveProperty('isRecurring');
      expect(expense).toHaveProperty('attachments');
      expect(expense).toHaveProperty('metadata');
    });

    test('повертає копію, а не посилання', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      const expense1 = builder.build();
      const expense2 = builder.build();

      expect(expense1).not.toBe(expense2);
      expect(expense1).toEqual(expense2);
    });

    test('зміна побудованого об\'єкта не впливає на builder', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      const expense = builder.build();

      expense.amount = 999;
      expense.tags.push('modified');

      const expense2 = builder.build();
      expect(expense2.amount).toBe(100);
      expect(expense2.tags).toHaveLength(0);
    });
  });

  describe('preview() method', () => {
    test('повертає поточний стан', () => {
      const builder = new ExpenseBuilder(1, 5, 100)
        .description('Test')
        .tag('food');

      const preview = builder.preview();

      expect(preview.description).toBe('Test');
      expect(preview.tags).toContain('food');
    });
  });

  describe('reset() method', () => {
    test('скидає builder до початкового стану', () => {
      const builder = new ExpenseBuilder(1, 5, 100)
        .description('Test')
        .tag('food')
        .paymentMethod('card');

      builder.reset();

      const expense = builder.build();
      expect(expense.description).toBe('');
      expect(expense.tags).toHaveLength(0);
      expect(expense.paymentMethod).toBe('cash');
    });

    test('зберігає обов\'язкові параметри', () => {
      const builder = new ExpenseBuilder(1, 5, 100);
      builder.reset();

      const expense = builder.build();
      expect(expense.userId).toBe(1);
      expect(expense.categoryId).toBe(5);
      expect(expense.amount).toBe(100);
    });
  });

  describe('Validation warnings', () => {
    let warnSpy;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    test('попереджає про повторювану витрату без опису', () => {
      new ExpenseBuilder(1, 5, 100)
        .recurring(true)
        .build();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('без опису')
      );
    });

    test('попереджає про велику суму готівкою', () => {
      new ExpenseBuilder(1, 5, 15000)
        .paymentMethod('cash')
        .build();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Велика сума готівкою')
      );
    });
  });

  describe('Complex expense creation', () => {
    test('створює складну витрату з усіма параметрами', () => {
      const expense = new ExpenseBuilder(1, 5, 250.75)
        .description('Покупка продуктів у супермаркеті Сільпо')
        .date(new Date('2024-01-15'))
        .tags(['groceries', 'food', 'supermarket'])
        .paymentMethod('card')
        .status('completed')
        .recurring(false)
        .attachments(['receipt1.pdf', 'receipt2.jpg'])
        .metadata({ location: 'Kyiv', store: 'Silpo', cashier: '5' })
        .build();

      expect(expense.userId).toBe(1);
      expect(expense.categoryId).toBe(5);
      expect(expense.amount).toBe(250.75);
      expect(expense.description).toContain('Сільпо');
      expect(expense.tags).toHaveLength(3);
      expect(expense.paymentMethod).toBe('card');
      expect(expense.attachments).toHaveLength(2);
      expect(expense.metadata.location).toBe('Kyiv');
    });
  });
});

describe('createSimpleExpense helper', () => {
  test('створює просту витрату', () => {
    const expense = createSimpleExpense(1, 5, 100, 'Test expense');

    expect(expense.userId).toBe(1);
    expect(expense.categoryId).toBe(5);
    expect(expense.amount).toBe(100);
    expect(expense.description).toBe('Test expense');
  });

  test('працює без опису', () => {
    const expense = createSimpleExpense(1, 5, 100);

    expect(expense.description).toBe('');
  });
});
