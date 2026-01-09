import type { SQLiteDatabase } from 'expo-sqlite';
import { generateId } from '../utils/id';
import { now } from '../utils/date';
import type {
  Account,
  AccountWithBalance,
  Transaction,
  CreateAccountInput,
  CreateTransactionInput,
  TransactionFilter,
} from '../types';

interface AccountRow {
  id: string;
  name: string;
  type: 'internal' | 'external';
  currency: string;
  created_at: number;
  archived: number;
}

interface TransactionRow {
  id: string;
  date: number;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  tags: string;
  note: string | null;
  created_at: number;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    createdAt: row.created_at,
    archived: row.archived === 1,
  };
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    fromAccountId: row.from_account_id,
    toAccountId: row.to_account_id,
    amount: row.amount,
    tags: JSON.parse(row.tags),
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function createAccount(
  db: SQLiteDatabase,
  input: CreateAccountInput
): Promise<Account> {
  const id = generateId();
  const createdAt = now();
  const currency = input.currency ?? 'USD';

  await db.runAsync(
    `INSERT INTO accounts (id, name, type, currency, created_at, archived)
     VALUES (?, ?, ?, ?, ?, 0)`,
    id,
    input.name,
    input.type,
    currency,
    createdAt
  );

  return {
    id,
    name: input.name,
    type: input.type,
    currency,
    createdAt,
    archived: false,
  };
}

export async function getAccount(
  db: SQLiteDatabase,
  id: string
): Promise<Account | null> {
  const row = await db.getFirstAsync<AccountRow>(
    'SELECT * FROM accounts WHERE id = ?',
    id
  );
  return row ? rowToAccount(row) : null;
}

export async function getAllAccounts(
  db: SQLiteDatabase,
  includeArchived: boolean = false
): Promise<Account[]> {
  const query = includeArchived
    ? 'SELECT * FROM accounts ORDER BY name'
    : 'SELECT * FROM accounts WHERE archived = 0 ORDER BY name';

  const rows = await db.getAllAsync<AccountRow>(query);
  return rows.map(rowToAccount);
}

export async function getAccountsByType(
  db: SQLiteDatabase,
  type: 'internal' | 'external',
  includeArchived: boolean = false
): Promise<Account[]> {
  const query = includeArchived
    ? 'SELECT * FROM accounts WHERE type = ? ORDER BY name'
    : 'SELECT * FROM accounts WHERE type = ? AND archived = 0 ORDER BY name';

  const rows = await db.getAllAsync<AccountRow>(query, type);
  return rows.map(rowToAccount);
}

export async function archiveAccount(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('UPDATE accounts SET archived = 1 WHERE id = ?', id);
}

export async function unarchiveAccount(
  db: SQLiteDatabase,
  id: string
): Promise<void> {
  await db.runAsync('UPDATE accounts SET archived = 0 WHERE id = ?', id);
}

export async function getAccountBalance(
  db: SQLiteDatabase,
  accountId: string
): Promise<number> {
  const result = await db.getFirstAsync<{ balance: number }>(
    `SELECT
      COALESCE(SUM(CASE WHEN to_account_id = ? THEN amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN from_account_id = ? THEN amount ELSE 0 END), 0) as balance
     FROM transactions`,
    accountId,
    accountId
  );
  return result?.balance ?? 0;
}

export async function getAccountsWithBalances(
  db: SQLiteDatabase,
  includeArchived: boolean = false
): Promise<AccountWithBalance[]> {
  const accounts = await getAllAccounts(db, includeArchived);
  const accountsWithBalances: AccountWithBalance[] = [];

  for (const account of accounts) {
    const balance = await getAccountBalance(db, account.id);
    accountsWithBalances.push({ ...account, balance });
  }

  return accountsWithBalances;
}

export async function getNetWorth(db: SQLiteDatabase): Promise<number> {
  const result = await db.getFirstAsync<{ net_worth: number }>(
    `SELECT
      COALESCE(SUM(
        CASE WHEN a.type = 'internal' THEN
          (SELECT COALESCE(SUM(CASE WHEN to_account_id = a.id THEN amount ELSE -amount END), 0)
           FROM transactions WHERE from_account_id = a.id OR to_account_id = a.id)
        ELSE 0 END
      ), 0) as net_worth
     FROM accounts a
     WHERE a.archived = 0`
  );
  return result?.net_worth ?? 0;
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: CreateTransactionInput
): Promise<Transaction> {
  const id = generateId();
  const createdAt = now();
  const tags = input.tags ?? [];
  const note = input.note ?? null;

  await db.runAsync(
    `INSERT INTO transactions (id, date, from_account_id, to_account_id, amount, tags, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.date,
    input.fromAccountId,
    input.toAccountId,
    input.amount,
    JSON.stringify(tags),
    note,
    createdAt
  );

  return {
    id,
    date: input.date,
    fromAccountId: input.fromAccountId,
    toAccountId: input.toAccountId,
    amount: input.amount,
    tags,
    note,
    createdAt,
  };
}

export async function getTransaction(
  db: SQLiteDatabase,
  id: string
): Promise<Transaction | null> {
  const row = await db.getFirstAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE id = ?',
    id
  );
  return row ? rowToTransaction(row) : null;
}

export async function getTransactions(
  db: SQLiteDatabase,
  filter: TransactionFilter = {}
): Promise<Transaction[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.accountId) {
    conditions.push('(from_account_id = ? OR to_account_id = ?)');
    params.push(filter.accountId, filter.accountId);
  }

  if (filter.startDate !== undefined) {
    conditions.push('date >= ?');
    params.push(filter.startDate);
  }

  if (filter.endDate !== undefined) {
    conditions.push('date <= ?');
    params.push(filter.endDate);
  }

  let query = 'SELECT * FROM transactions';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY date DESC, created_at DESC';

  if (filter.limit !== undefined) {
    query += ' LIMIT ?';
    params.push(filter.limit);
  }

  if (filter.offset !== undefined) {
    query += ' OFFSET ?';
    params.push(filter.offset);
  }

  const rows = await db.getAllAsync<TransactionRow>(query, ...params);
  return rows.map(rowToTransaction);
}

export async function getRecentTransactions(
  db: SQLiteDatabase,
  limit: number = 10
): Promise<Transaction[]> {
  return getTransactions(db, { limit });
}

export async function reverseTransaction(
  db: SQLiteDatabase,
  transactionId: string,
  note?: string
): Promise<Transaction> {
  const original = await getTransaction(db, transactionId);
  if (!original) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  return createTransaction(db, {
    date: now(),
    fromAccountId: original.toAccountId,
    toAccountId: original.fromAccountId,
    amount: original.amount,
    tags: original.tags,
    note: note ?? `Reversal of transaction ${transactionId}`,
  });
}
