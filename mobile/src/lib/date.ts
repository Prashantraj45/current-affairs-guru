export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
export function todayIST(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600000);
  return ist.toISOString().split('T')[0];
}
