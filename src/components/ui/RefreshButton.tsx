'use client';

import { clsx } from 'clsx';

interface RefreshButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export default function RefreshButton({ onClick, isLoading }: RefreshButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Refresh data"
    >
      <svg
        className={clsx('h-5 w-5', isLoading && 'animate-spin')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}
