/**
 * Parse a date string in ISO format (YYYY-MM-DD) to a Date object
 * without timezone conversion. This ensures the date is interpreted
 * in the user's local timezone, not UTC.
 *
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @returns Date object representing midnight of that date in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    return new Date(NaN);
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date(NaN);
  }

  // Validate month and day ranges
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return new Date(NaN);
  }

  // Create date in local timezone (month is 0-indexed in Date constructor)
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 * in the user's local timezone
 *
 * @param date - Date object
 * @returns Date string in format "YYYY-MM-DD"
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Validate that a date string is in correct ISO format
 *
 * @param dateString - Date string to validate
 * @returns true if valid ISO date format
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const [year, month, day] = dateString.split('-').map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  return true;
}
