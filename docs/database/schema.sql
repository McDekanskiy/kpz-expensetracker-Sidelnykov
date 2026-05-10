-- ============================================
-- Expense Tracker — схема бази даних
-- SQLite 3
-- ============================================

-- Таблиця користувачів
CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Таблиця категорій витрат
CREATE TABLE categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

-- Таблиця витрат
CREATE TABLE expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    category_id INTEGER,
    amount      REAL    NOT NULL CHECK (amount > 0),
    description TEXT,
    date        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Таблиця місячних бюджетів
CREATE TABLE budgets (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    amount     REAL    NOT NULL CHECK (amount > 0),
    month      INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year       INTEGER NOT NULL CHECK (year >= 2000),
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, month, year)
);

-- ============================================
-- Індекси для прискорення частих запитів
-- ============================================

CREATE INDEX idx_expenses_user_id     ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_date        ON expenses(date);
CREATE INDEX idx_categories_user_id   ON categories(user_id);
CREATE UNIQUE INDEX idx_users_email   ON users(email);
