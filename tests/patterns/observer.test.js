/**
 * Тести для патерну Observer
 * ПР-9: Перевірка системи подій витрат
 */

const {
    ExpenseSubject,
    ExpenseObserver,
    ActivityLogObserver,
    StatisticsObserver,
    BudgetAlertObserver
} = require('../../src/observers/expenseObserver');

describe('Observer Pattern Tests', () => {
    let subject;
    let activityLog;
    let statistics;
    let budgetAlert;

    beforeEach(() => {
        subject = new ExpenseSubject();
        activityLog = new ActivityLogObserver();
        statistics = new StatisticsObserver();
        budgetAlert = new BudgetAlertObserver(1000);
    });

    test('should subscribe observers to subject', () => {
        expect(subject._observers.length).toBe(0);
        
        subject.subscribe(activityLog);
        expect(subject._observers.length).toBe(1);
        
        subject.subscribe(statistics);
        expect(subject._observers.length).toBe(2);
    });

    test('should unsubscribe observers from subject', () => {
        subject.subscribe(activityLog);
        subject.subscribe(statistics);
        expect(subject._observers.length).toBe(2);
        
        subject.unsubscribe(activityLog);
        expect(subject._observers.length).toBe(1);
    });

    test('should notify all observers when event occurs', () => {
        const spy1 = jest.spyOn(activityLog, 'onExpenseUpdated');
        const spy2 = jest.spyOn(statistics, 'onExpenseUpdated');
        
        subject.subscribe(activityLog);
        subject.subscribe(statistics);
        
        subject.notify(1, 'created', { amount: 500, description: 'Test' });
        
        expect(spy1).toHaveBeenCalledWith(1, 'created', expect.any(Object));
        expect(spy2).toHaveBeenCalledWith(1, 'created', expect.any(Object));
    });

    test('ActivityLogObserver should log events', () => {
        subject.subscribe(activityLog);
        
        subject.notify(1, 'created', { 
            amount: 500, 
            currency: 'UAH',
            description: 'Test expense' 
        });
        
        expect(activityLog.log.length).toBe(1);
        expect(activityLog.log[0].expenseId).toBe(1);
        expect(activityLog.log[0].event).toBe('created');
    });

    test('StatisticsObserver should track statistics', () => {
        subject.subscribe(statistics);
        
        subject.notify(1, 'created', { amount: 500 });
        subject.notify(2, 'created', { amount: 300 });
        subject.notify(1, 'updated', {});
        
        const stats = statistics.getStats();
        expect(stats.created).toBe(2);
        expect(stats.updated).toBe(1);
        expect(stats.totalAmount).toBe(800);
    });

    test('BudgetAlertObserver should track budget', () => {
        subject.subscribe(budgetAlert);
        
        subject.notify(1, 'created', { amount: 600 });
        expect(budgetAlert.getCurrentTotal()).toBe(600);
        
        subject.notify(2, 'created', { amount: 300 });
        expect(budgetAlert.getCurrentTotal()).toBe(900);
        
        subject.notify(1, 'deleted', { amount: 600 });
        expect(budgetAlert.getCurrentTotal()).toBe(300);
    });

    test('should throw error if non-observer is subscribed', () => {
        const notAnObserver = { someMethod: () => {} };
        
        expect(() => {
            subject.subscribe(notAnObserver);
        }).toThrow();
    });

    test('ActivityLogObserver should clear log', () => {
        subject.subscribe(activityLog);
        subject.notify(1, 'created', { amount: 500 });
        
        expect(activityLog.log.length).toBe(1);
        activityLog.clearLog();
        expect(activityLog.log.length).toBe(0);
    });

    test('StatisticsObserver should reset stats', () => {
        subject.subscribe(statistics);
        subject.notify(1, 'created', { amount: 500 });
        
        let stats = statistics.getStats();
        expect(stats.created).toBe(1);
        
        statistics.resetStats();
        stats = statistics.getStats();
        expect(stats.created).toBe(0);
        expect(stats.totalAmount).toBe(0);
    });
});
