/**
 * Decorator Pattern Implementation for Expense Tracker
 * 
 * Патерн Decorator дозволяє динамічно додавати нову поведінку
 * до функцій без зміни їх коду
 */

/**
 * Decorator: Вимірювання часу виконання функції
 * @param {Function} func - Функція для декорування
 * @returns {Function} - Декорована функція
 */
function timer(func) {
    return function(...args) {
        const start = performance.now();
        const result = func.apply(this, args);
        const elapsed = performance.now() - start;
        console.log(`[TIMER] ${func.name || 'anonymous'}() виконувалась ${elapsed.toFixed(2)} мс`);
        return result;
    };
}

/**
 * Decorator: Async версія таймера
 * @param {Function} func - Async функція
 * @returns {Function} - Декорована async функція
 */
function asyncTimer(func) {
    return async function(...args) {
        const start = performance.now();
        const result = await func.apply(this, args);
        const elapsed = performance.now() - start;
        console.log(`[TIMER] ${func.name || 'anonymous'}() виконувалась ${elapsed.toFixed(2)} мс`);
        return result;
    };
}

/**
 * Decorator: Кешування результатів функції
 * @param {Function} func - Функція для кешування
 * @returns {Function} - Декорована функція з кешем
 */
function cache(func) {
    const _cache = new Map();
    
    return function(...args) {
        const key = JSON.stringify(args);
        
        if (_cache.has(key)) {
            console.log(`[CACHE] Результат з кешу для ${func.name}(${key})`);
            return _cache.get(key);
        }
        
        console.log(`[CACHE] Обчислення для ${func.name}(${key})`);
        const result = func.apply(this, args);
        _cache.set(key, result);
        return result;
    };
}

/**
 * Decorator: Кешування з TTL (Time To Live)
 * @param {number} ttlMs - Час життя кешу в мілісекундах
 * @returns {Function} - Декоратор
 */
function cacheWithTTL(ttlMs = 60000) {
    return function(func) {
        const _cache = new Map();
        
        return function(...args) {
            const key = JSON.stringify(args);
            const now = Date.now();
            
            if (_cache.has(key)) {
                const { value, timestamp } = _cache.get(key);
                if (now - timestamp < ttlMs) {
                    console.log(`[CACHE TTL] З кешу (${Math.round((ttlMs - (now - timestamp)) / 1000)}с до закінчення)`);
                    return value;
                }
                console.log(`[CACHE TTL] Кеш застарів, оновлення...`);
            }
            
            const result = func.apply(this, args);
            _cache.set(key, { value: result, timestamp: now });
            return result;
        };
    };
}

/**
 * Decorator: Логування викликів функції
 * @param {Function} func - Функція для логування
 * @returns {Function} - Декорована функція
 */
function logCall(func) {
    return function(...args) {
        console.log(`[LOG] Виклик ${func.name}(${JSON.stringify(args).slice(0, 100)})`);
        const result = func.apply(this, args);
        console.log(`[LOG] ${func.name} повернула:`, typeof result === 'object' ? JSON.stringify(result).slice(0, 100) : result);
        return result;
    };
}

/**
 * Decorator: Async логування
 * @param {Function} func - Async функція
 * @returns {Function} - Декорована функція
 */
function asyncLogCall(func) {
    return async function(...args) {
        console.log(`[LOG] Виклик ${func.name}(${JSON.stringify(args).slice(0, 100)})`);
        try {
            const result = await func.apply(this, args);
            console.log(`[LOG] ${func.name} повернула:`, typeof result === 'object' ? JSON.stringify(result).slice(0, 100) : result);
            return result;
        } catch (error) {
            console.error(`[LOG] ${func.name} викинула помилку:`, error.message);
            throw error;
        }
    };
}

/**
 * Decorator: Повторні спроби при помилці
 * @param {number} maxAttempts - Максимальна кількість спроб
 * @param {number} delayMs - Затримка між спробами
 * @returns {Function} - Декоратор
 */
function retry(maxAttempts = 3, delayMs = 1000) {
    return function(func) {
        return async function(...args) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    console.log(`[RETRY] Спроба ${attempt}/${maxAttempts} для ${func.name}`);
                    return await func.apply(this, args);
                } catch (error) {
                    lastError = error;
                    console.error(`[RETRY] Спроба ${attempt} не вдалась:`, error.message);
                    
                    if (attempt < maxAttempts) {
                        console.log(`[RETRY] Очікування ${delayMs}мс перед наступною спробою...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                }
            }
            
            console.error(`[RETRY] Всі ${maxAttempts} спроби не вдались`);
            throw lastError;
        };
    };
}

/**
 * Decorator: Валідація аргументів
 * @param {Function} validator - Функція валідації
 * @returns {Function} - Декоратор
 */
function validate(validator) {
    return function(func) {
        return function(...args) {
            const validationResult = validator(...args);
            if (validationResult !== true) {
                throw new Error(`[VALIDATE] Валідація не пройдена: ${validationResult}`);
            }
            return func.apply(this, args);
        };
    };
}

/**
 * Decorator: Обмеження частоти викликів (throttle)
 * @param {number} limitMs - Мінімальний інтервал між викликами
 * @returns {Function} - Декоратор
 */
function throttle(limitMs) {
    return function(func) {
        let lastCall = 0;
        
        return function(...args) {
            const now = Date.now();
            if (now - lastCall < limitMs) {
                console.log(`[THROTTLE] Виклик проігноровано (занадто часто)`);
                return;
            }
            lastCall = now;
            return func.apply(this, args);
        };
    };
}

/**
 * Decorator: Відкладений виклик (debounce)
 * @param {number} delayMs - Затримка перед викликом
 * @returns {Function} - Декоратор
 */
function debounce(delayMs) {
    return function(func) {
        let timeoutId;
        
        return function(...args) {
            clearTimeout(timeoutId);
            console.log(`[DEBOUNCE] Відкладено виклик ${func.name} на ${delayMs}мс`);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delayMs);
        };
    };
}

/**
 * Композиція декораторів - застосувати кілька декораторів одразу
 * @param  {...Function} decorators - Декоратори (застосовуються справа наліво)
 * @returns {Function} - Композитний декоратор
 */
function compose(...decorators) {
    return function(func) {
        return decorators.reduceRight((decorated, decorator) => {
            return decorator(decorated);
        }, func);
    };
}

/**
 * Приклад використання композиції:
 * const decoratedFunc = compose(timer, cache, logCall)(myFunction);
 */

module.exports = {
    timer,
    asyncTimer,
    cache,
    cacheWithTTL,
    logCall,
    asyncLogCall,
    retry,
    validate,
    throttle,
    debounce,
    compose
};
