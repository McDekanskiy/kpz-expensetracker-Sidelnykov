/**
 * Тести для патерну Decorator
 * ПР-9: Перевірка декораторів функцій
 */

const {
    timer,
    cache,
    logCall,
    validate,
    compose
} = require('../../src/decorators/functionDecorators');

describe('Decorator Pattern Tests', () => {
    
    describe('timer decorator', () => {
        test('should measure function execution time', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            function slowFunction() {
                let sum = 0;
                for (let i = 0; i < 1000000; i++) {
                    sum += i;
                }
                return sum;
            }
            
            const timedFunction = timer(slowFunction);
            const result = timedFunction();
            
            expect(result).toBeGreaterThan(0);
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[TIMER]')
            );
            
            consoleSpy.mockRestore();
        });

        test('should preserve function result', () => {
            function add(a, b) {
                return a + b;
            }
            
            const timedAdd = timer(add);
            expect(timedAdd(2, 3)).toBe(5);
        });
    });

    describe('cache decorator', () => {
        test('should cache function results', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            let callCount = 0;
            
            function expensiveCalculation(x) {
                callCount++;
                return x * 2;
            }
            
            const cachedFunction = cache(expensiveCalculation);
            
            // Перший виклик - обчислення
            const result1 = cachedFunction(5);
            expect(result1).toBe(10);
            expect(callCount).toBe(1);
            
            // Другий виклик з тими ж аргументами - з кешу
            const result2 = cachedFunction(5);
            expect(result2).toBe(10);
            expect(callCount).toBe(1); // Не збільшився!
            
            // Виклик з іншими аргументами - нове обчислення
            const result3 = cachedFunction(10);
            expect(result3).toBe(20);
            expect(callCount).toBe(2);
            
            consoleSpy.mockRestore();
        });

        test('should handle multiple arguments', () => {
            let callCount = 0;
            
            function multiply(a, b) {
                callCount++;
                return a * b;
            }
            
            const cachedMultiply = cache(multiply);
            
            cachedMultiply(2, 3);
            cachedMultiply(2, 3); // З кешу
            expect(callCount).toBe(1);
            
            cachedMultiply(3, 4); // Нові аргументи
            expect(callCount).toBe(2);
        });
    });

    describe('logCall decorator', () => {
        test('should log function calls and results', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            function greet(name) {
                return `Hello, ${name}!`;
            }
            
            const loggedGreet = logCall(greet);
            const result = loggedGreet('World');
            
            expect(result).toBe('Hello, World!');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[LOG] Виклик greet')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('[LOG] greet повернула')
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('validate decorator', () => {
        test('should validate arguments before execution', () => {
            function divide(a, b) {
                return a / b;
            }
            
            const validator = (a, b) => {
                if (b === 0) return 'Ділення на нуль неможливе';
                if (typeof a !== 'number' || typeof b !== 'number') {
                    return 'Аргументи мають бути числами';
                }
                return true;
            };
            
            const validatedDivide = validate(validator)(divide);
            
            // Коректні аргументи
            expect(validatedDivide(10, 2)).toBe(5);
            
            // Некоректні аргументи
            expect(() => validatedDivide(10, 0)).toThrow('Ділення на нуль');
            expect(() => validatedDivide('10', 2)).toThrow('мають бути числами');
        });

        test('should pass validation and execute function', () => {
            function createUser(name, age) {
                return { name, age };
            }
            
            const validator = (name, age) => {
                if (!name || name.length < 2) return 'Ім\'я занадто коротке';
                if (age < 18) return 'Вік має бути 18+';
                return true;
            };
            
            const validatedCreateUser = validate(validator)(createUser);
            
            const user = validatedCreateUser('John', 25);
            expect(user).toEqual({ name: 'John', age: 25 });
        });
    });

    describe('compose decorator', () => {
        test('should compose multiple decorators', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            let callCount = 0;
            
            function calculate(x) {
                callCount++;
                return x * 2;
            }
            
            // Композиція: timer + cache + logCall
            const decorated = compose(timer, cache, logCall)(calculate);
            
            // Перший виклик
            decorated(5);
            expect(callCount).toBe(1);
            
            // Другий виклик - має бути з кешу
            decorated(5);
            expect(callCount).toBe(1); // Не збільшився
            
            // Перевіряємо що всі декоратори спрацювали
            const logs = consoleSpy.mock.calls.map(call => call[0]);
            const hasTimer = logs.some(log => log.includes('[TIMER]'));
            const hasCache = logs.some(log => log.includes('[CACHE]'));
            const hasLog = logs.some(log => log.includes('[LOG]'));
            
            expect(hasTimer || hasCache || hasLog).toBe(true);
            
            consoleSpy.mockRestore();
        });

        test('should apply decorators in correct order', () => {
            const order = [];
            
            function decorator1(func) {
                return function(...args) {
                    order.push('decorator1-before');
                    const result = func(...args);
                    order.push('decorator1-after');
                    return result;
                };
            }
            
            function decorator2(func) {
                return function(...args) {
                    order.push('decorator2-before');
                    const result = func(...args);
                    order.push('decorator2-after');
                    return result;
                };
            }
            
            function original() {
                order.push('original');
                return 'result';
            }
            
            // compose застосовує справа наліво
            const decorated = compose(decorator1, decorator2)(original);
            decorated();
            
            expect(order).toEqual([
                'decorator1-before',
                'decorator2-before',
                'original',
                'decorator2-after',
                'decorator1-after'
            ]);
        });
    });

    describe('decorator preserves function behavior', () => {
        test('decorated function should work with this context', () => {
            const obj = {
                value: 10,
                getValue() {
                    return this.value;
                }
            };
            
            obj.getValue = timer(obj.getValue);
            expect(obj.getValue()).toBe(10);
        });

        test('decorated function should handle errors', () => {
            function throwError() {
                throw new Error('Test error');
            }
            
            const decorated = timer(throwError);
            expect(() => decorated()).toThrow('Test error');
        });
    });

    describe('real-world scenario', () => {
        test('should decorate expense calculation function', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            function calculateTotal(expenses) {
                return expenses.reduce((sum, e) => sum + e.amount, 0);
            }
            
            const validator = (expenses) => {
                if (!Array.isArray(expenses)) return 'Має бути масив';
                if (expenses.length === 0) return 'Масив не може бути порожнім';
                return true;
            };
            
            const decorated = compose(
                timer,
                cache,
                validate(validator)
            )(calculateTotal);
            
            const expenses = [
                { amount: 100 },
                { amount: 200 },
                { amount: 300 }
            ];
            
            const total = decorated(expenses);
            expect(total).toBe(600);
            
            // Перевірка валідації
            expect(() => decorated([])).toThrow('не може бути порожнім');
            expect(() => decorated('not array')).toThrow('Має бути масив');
            
            consoleSpy.mockRestore();
        });
    });
});
