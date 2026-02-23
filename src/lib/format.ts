const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'always',
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getProfitColor(value: number): string {
  if (value > 0) return 'text-red-500';
  if (value < 0) return 'text-blue-500';
  return 'text-gray-500';
}

export function getProfitBgColor(value: number): string {
  if (value > 0) return 'bg-red-50 dark:bg-red-950';
  if (value < 0) return 'bg-blue-50 dark:bg-blue-950';
  return 'bg-gray-50 dark:bg-gray-800';
}
