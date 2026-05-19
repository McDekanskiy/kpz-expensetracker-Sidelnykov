const { AppConfig } = require('../src/core/config');

test('AppConfig is singleton', () => {
  const first = new AppConfig();
  const second = new AppConfig();
  expect(first).toBe(second);
});
