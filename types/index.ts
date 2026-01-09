export type AccountType = 'internal' | 'external';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: number;
  archived: boolean;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface Transaction {
  id: string;
  date: number;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  tags: string[];
  note: string | null;
  createdAt: number;
}

export interface TransactionWithAccounts extends Transaction {
  fromAccount: Account;
  toAccount: Account;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency?: string;
}

export interface CreateTransactionInput {
  date: number;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  tags?: string[];
  note?: string;
}

export interface TransactionFilter {
  accountId?: string;
  startDate?: number;
  endDate?: number;
  tags?: string[];
  limit?: number;
  offset?: number;
}
