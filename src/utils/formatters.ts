export function formatCompactCount(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e7) return `${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString('en-IN');
}

export function formatIndianCrores(amountCr: number): string {
  if (!Number.isFinite(amountCr)) return '₹0 Cr';
  if (amountCr >= 1e5) {
    return `₹${(amountCr / 1e5).toFixed(2)} L Cr`;
  }
  return `₹${Math.round(amountCr).toLocaleString('en-IN')} Cr`;
}

export function formatExactCurrency(inr: number): string {
  if (!Number.isFinite(inr)) return '₹0';
  return `₹${Math.round(inr).toLocaleString('en-IN')}`;
}

export function formatSignedPercent(val: number | null): string {
  if (val == null || !Number.isFinite(val)) return 'Baseline';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}
