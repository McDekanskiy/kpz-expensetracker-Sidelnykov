/**
 * Singleton configuration object for PR-8 demonstration.
 */
class AppConfig {
  static instance = null;

  constructor() {
    if (AppConfig.instance) {
      return AppConfig.instance;
    }

    this.port = Number(process.env.PORT || 8000);
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
    this.loadedAt = new Date().toISOString();

    AppConfig.instance = this;
  }
}

function getConfig() {
  return new AppConfig();
}

module.exports = { AppConfig, getConfig };
