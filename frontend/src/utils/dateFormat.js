/**
 * Date formatting utilities
 * Display: DD.MM (year hidden but stored)
 * Storage: Full ISO date
 */

/**
 * Format ISO date to DD.MM display
 * @param {string} isoDate - ISO date string (e.g., "2024-12-05T12:00:00")
 * @returns {string} - Formatted date (e.g., "05.12")
 */
export const formatDateShort = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

/**
 * Format ISO date to DD.MM.YYYY (full date)
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date (e.g., "05.12.2024")
 */
export const formatDateFull = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

/**
 * Parse DD.MM input to ISO date (uses current year)
 * @param {string} shortDate - Date in DD.MM format
 * @returns {string} - ISO date string
 */
export const parseShortDate = (shortDate) => {
  if (!shortDate || !shortDate.includes('.')) return null;

  const parts = shortDate.split('.');
  if (parts.length !== 2) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
  const year = new Date().getFullYear();

  if (isNaN(day) || isNaN(month) || day < 1 || day > 31 || month < 0 || month > 11) {
    return null;
  }

  const date = new Date(year, month, day, 12, 0, 0);
  return date.toISOString();
};

/**
 * Format ISO date to YYYY-MM-DD (for date inputs)
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date (e.g., "2024-12-05")
 */
export const formatDateInput = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate).toISOString().split('T')[0];
};

/**
 * Get today's date in ISO format
 * @returns {string} - ISO date string
 */
export const getTodayISO = () => {
  const today = new Date();
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
  return localDate.toISOString();
};
