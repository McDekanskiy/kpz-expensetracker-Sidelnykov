class ReportQueryBuilder {
  constructor() {
    this.query = {};
  }

  from(date) { this.query.from = date; return this; }
  to(date) { this.query.to = date; return this; }
  category(name) { this.query.category = name; return this; }
  user(userId) { this.query.userId = userId; return this; }
  build() { return { ...this.query }; }
}

module.exports = { ReportQueryBuilder };
