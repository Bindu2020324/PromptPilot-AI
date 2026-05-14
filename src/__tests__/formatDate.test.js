import { formatDate } from '../utils/formatDate';

describe('formatDate', () => {
  it('formats an ISO timestamp to a readable date', () => {
    const isoDate = new Date(Date.UTC(2024, 0, 1, 12, 0, 0)).toISOString();
    expect(formatDate(isoDate)).toBe('Jan 1, 2024');
  });

  it('returns an empty string for invalid or empty values', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('invalid-date')).toBe('');
  });
});
