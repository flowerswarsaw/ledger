export const SCHEMA_VERSION = 1;

export const CREATE_ACCOUNTS_TABLE = `
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('internal', 'external')),
  currency TEXT DEFAULT 'USD',
  created_at INTEGER NOT NULL,
  archived INTEGER DEFAULT 0
)`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date INTEGER NOT NULL,
  from_account_id TEXT NOT NULL REFERENCES accounts(id),
  to_account_id TEXT NOT NULL REFERENCES accounts(id),
  amount INTEGER NOT NULL CHECK(amount > 0),
  tags TEXT DEFAULT '[]',
  note TEXT,
  created_at INTEGER NOT NULL
)`;

export const CREATE_TRANSACTIONS_DATE_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`;

export const CREATE_TRANSACTIONS_FROM_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_account_id)`;

export const CREATE_TRANSACTIONS_TO_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_account_id)`;

export const CREATE_SCHEMA_VERSION_TABLE = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY
)`;
