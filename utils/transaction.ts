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
