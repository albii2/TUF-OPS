export function formatCurrency(value) {
    if (typeof value !== 'number' || Number.isNaN(value))
        return '—';
    return value.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}
export function formatDate(value) {
    if (!value)
        return '—';
    return value;
}
//# sourceMappingURL=format.js.map