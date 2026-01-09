import type { AccountType, Transaction } from '@/types';

export type TransactionCategory = 'income' | 'expense' | 'transfer';

/**
 * Categorizes a transaction based on the account types involved.
 *
 * - Income: money flows from external to internal (entering the system)
 * - Expense: money flows from internal to external (leaving the system)
 * - Transfer: money flows between internal accounts (no net effect)
 */
export function categorizeTransaction(
  fromAccountType: AccountType,
  toAccountType: AccountType
): TransactionCategory {
  if (fromAccountType === 'external' && toAccountType === 'internal') {
    return 'income';
  }
  if (fromAccountType === 'internal' && toAccountType === 'external') {
    return 'expense';
  }
  return 'transfer';
}

interface AccountTypeResolver {
  get(accountId: string): { type: AccountType } | undefined;
}

/**
 * Calculates income and expense totals from a list of transactions.
 * Internal transfers are excluded from both totals.
 */
export function calculateIncomeAndExpenses(
  transactions: Transaction[],
  accountResolver: AccountTypeResolver
): { income: number; expenses: number } {
  let income = 0;
  let expenses = 0;

  for (const t of transactions) {
    const fromAccount = accountResolver.get(t.fromAccountId);
    const toAccount = accountResolver.get(t.toAccountId);

    if (!fromAccount || !toAccount) continue;

    const category = categorizeTransaction(fromAccount.type, toAccount.type);

    if (category === 'income') {
      income += t.amount;
    } else if (category === 'expense') {
      expenses += t.amount;
    }
  }

  return { income, expenses };
}

export type TransactionPerspective = 'from' | 'to' | 'neutral';

/**
 * Determines the display perspective for a transaction from the entity's viewpoint.
 *
 * For internal accounts: based on whether money flows in or out of that account.
 * For external accounts: based on whether the transaction is income or expense
 * for the entity (not the external party).
 */
export function getTransactionPerspective(
  currentAccountId: string,
  currentAccountType: AccountType,
  fromAccountId: string,
  fromAccountType: AccountType,
  toAccountType: AccountType
): TransactionPerspective {
  if (currentAccountType === 'internal') {
    if (toAccountType === 'internal' && fromAccountId !== currentAccountId) {
      return 'to';
    }
    if (fromAccountId === currentAccountId) {
      return 'from';
    }
    return 'to';
  }

  // External account: show perspective based on entity's income/expense
  const category = categorizeTransaction(fromAccountType, toAccountType);
  if (category === 'income') {
    return 'to'; // Green: entity received money
  }
  if (category === 'expense') {
    return 'from'; // Red: entity spent money
  }
  return 'neutral';
}

/**
 * Converts an account balance to the entity's perspective.
 *
 * For internal accounts: balance represents money owned (unchanged).
 * For external accounts: balance is inverted to show the entity's
 * relationship - positive means entity received money from this source,
 * negative means entity spent money at this destination.
 */
export function toEntityBalance(balance: number, accountType: AccountType): number {
  return accountType === 'external' ? -balance : balance;
}
