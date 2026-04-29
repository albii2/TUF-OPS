export function formatCurrency(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return `$${value.toLocaleString()}`;
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return '—';
  return value;
}
