export function formatDate(dateValue) {
  if (!dateValue) return '';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.valueOf())) return dateValue;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function normalizeCategory(rawCategory = '') {
  if (!rawCategory) return 'Reports';
  const value = rawCategory.toLowerCase();
  if (value.includes('environment') || value.includes('climate')) return 'Environment';
  if (value.includes('polity') || value.includes('governance')) return 'Polity';
  if (value.includes('economy')) return 'Economy';
  if (value.includes('international') || value === 'ir') return 'IR';
  if (value.includes('science') || value.includes('tech')) return 'Science';
  if (value.includes('report')) return 'Reports';
  return rawCategory;
}
