# Ledger

A personal finance system built on first principles.

## Philosophy

All of finance reduces to two primitives:

**Account** – a node where value can exist. A bank, a wallet, cash, a credit card, a brokerage, an employer, a grocery store. Internal accounts hold your money. External accounts represent the outside world. The distinction is perspective, not structure.

**Transaction** – an edge. Value moves from one account to another. Always a from, always a to. Amount is always positive; direction is encoded in the relationship. The same event looks different depending on whose books you read.

Everything else is derived:
- Balance is the sum of inflows minus outflows
- Net worth is the sum of internal account balances
- Reports are queries over transactions
- Budgets are constraints on queries
- Categories are tags, not structure

The system is append-only. Transactions are immutable. Mistakes are corrected with new transactions, not edits. History is truth.

## Primitives

### Entity

The actor who owns accounts and initiates transactions. For now, a single user. Later, multiple users, organizations, anonymous actors. The primitive exists but remains simple until needed.

### Account

```
id            TEXT PRIMARY KEY (uuid)
name          TEXT
type          TEXT ('internal' | 'external')
currency      TEXT (default 'USD')
created_at    INTEGER (unix timestamp ms)
archived      INTEGER (0 | 1, default 0)
```

Types:
- `internal` – accounts you own (checking, savings, cash, brokerage)
- `external` – the other side (employer, grocery store, landlord, amazon)

Archived accounts are hidden from default views but preserved for history.

### Transaction

```
id              TEXT PRIMARY KEY (uuid)
date            INTEGER (unix timestamp ms)
from_account_id TEXT (foreign key → accounts.id)
to_account_id   TEXT (foreign key → accounts.id)
amount          INTEGER (cents, always positive)
tags            TEXT (JSON array of strings)
note            TEXT (optional)
created_at      INTEGER (unix timestamp ms)
```

Amount is stored in smallest currency unit (cents) to avoid floating point errors. Always positive. Direction is determined by from/to.

Derived computations:
- `balance(account) = sum(amount where to_account = account) - sum(amount where from_account = account)`
- `net_worth = sum(balance(account) where type = 'internal')`

## Technical Stack

**Framework:** Expo (React Native) + TypeScript
- Single codebase for iOS, Android, Web
- Expo SDK for device APIs and build tooling
- TypeScript for type safety as complexity grows

**Database:** SQLite via expo-sqlite
- Local-first, no server dependency
- Works across all platforms
- Fast enough for hundreds of thousands of transactions
- Portable when sync is added later

**State Management:** Keep it simple
- React Context for global state if needed
- Local component state where possible
- SQLite is the source of truth, not memory

## Data Principles

1. **Append-only** – Never update or delete transactions. Add corrections.
2. **Derived balances** – Never store balances. Always compute from transactions.
3. **Integers for money** – Store cents, not dollars. Avoid floating point.
4. **UTC timestamps** – Store all times as unix milliseconds in UTC. Format for display.
5. **UUIDs for IDs** – No auto-increment. Enables future sync without conflicts.

## MVP Features (v0.1)

### Must Have
- [ ] Create account (name, type, currency)
- [ ] Archive account
- [ ] Add transaction (date, from, to, amount, tags, note)
- [ ] List accounts with current balances
- [ ] List transactions (filterable by account, date range)
- [ ] Dashboard: net worth, recent transactions

### Should Have
- [ ] Edit transaction (creates reversal + new transaction)
- [ ] Search transactions by note/tag
- [ ] Spending by tag for date range
- [ ] Income vs expense summary

### Won't Have Yet
- Budgets
- Recurring transactions
- Multi-currency conversion
- Sync / cloud backup
- Multiple entities
- Charts and visualizations
- Import from bank

## UX Principles

1. **Fast entry** – Adding a transaction should take seconds, not minutes
2. **Sensible defaults** – Today's date, last used accounts, suggested tags
3. **No friction** – Don't force categorization. Tags are optional.
4. **Glanceable** – Dashboard shows what matters without tapping
5. **Offline first** – Everything works without network

## File Structure

```
/app                  # Expo Router screens
  /(tabs)             # Tab navigation
    /index.tsx        # Dashboard
    /accounts.tsx     # Account list
    /transactions.tsx # Transaction list
  /account/[id].tsx   # Account detail
  /transaction/new.tsx
  /transaction/[id].tsx

/components           # Reusable UI components
  /AccountCard.tsx
  /TransactionRow.tsx
  /AmountInput.tsx
  /TagInput.tsx

/db                   # Database layer
  /schema.ts          # Table definitions
  /queries.ts         # Typed query functions
  /migrations.ts      # Schema migrations

/hooks                # Custom React hooks
  /useAccounts.ts
  /useTransactions.ts
  /useBalance.ts

/types                # TypeScript types
  /index.ts

/utils                # Helpers
  /money.ts           # Formatting, conversion
  /date.ts            # Date formatting
  /id.ts              # UUID generation
```

## Database Indexes

```sql
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_from ON transactions(from_account_id);
CREATE INDEX idx_transactions_to ON transactions(to_account_id);
```

## Future Considerations

Decisions made now should not block these later:

1. **Multi-entity** – Entity table, foreign key on accounts. Single user for now but schema can expand.

2. **Sync** – UUIDs enable conflict-free merging. Append-only log enables sync by exchanging transactions after a timestamp.

3. **Multi-currency** – Currency on account. Transactions between different currencies will need exchange rate at time of transaction.

4. **Decentralization** – If transactions were signed by entity keys, the log becomes verifiable. Not building this now, but not preventing it.

5. **Shared accounts** – An account could have multiple entity owners. A transaction could require multiple signatures.

## Non-Goals

- Not a bank. No actual money movement.
- Not a trading platform. No market data.
- Not an accounting system. No formal double-entry with debits/credits.
- Not a bill pay service. No scheduled payments.

This is a ledger. It records what happened. That's it.

## Success Criteria

v0.1 is successful when:
- I use it daily for 2 weeks
- I can answer "where did my money go this month" in under 10 seconds
- I trust it more than checking my bank app
- Adding a transaction feels faster than forgetting to

---

Built by necessity. Designed from primitives. Owned by the user.