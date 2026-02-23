'use client';

import { clsx } from 'clsx';

interface AccountOption {
  id: string;
  label: string;
  hasError?: boolean;
}

interface AccountSelectorProps {
  accounts: AccountOption[];
  selectedId: string;
  onChange: (id: string) => void;
}

export default function AccountSelector({ accounts, selectedId, onChange }: AccountSelectorProps) {
  if (accounts.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {accounts.map((account) => (
        <button
          key={account.id}
          onClick={() => onChange(account.id)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            selectedId === account.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
            account.hasError && 'opacity-50'
          )}
        >
          {account.label}
          {account.hasError && ' ⚠'}
        </button>
      ))}
    </div>
  );
}
