/**
 * Date utilities for MycoFlow
 * Centralized date formatting and calculation functions
 */

// ===== FORMATTING FUNCTIONS =====

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
 * Format ISO date to YYYY-MM-DD (for date inputs)
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date (e.g., "2024-12-05")
 */
export const formatDateInput = (isoDate) => {
  if (!isoDate) return '';
  return new Date(isoDate).toISOString().split('T')[0];
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
 * Get today's date in ISO format
 * @returns {string} - ISO date string
 */
export const getTodayISO = () => {
  const today = new Date();
  const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
  return localDate.toISOString();
};

// ===== CALCULATION FUNCTIONS =====

/**
 * Calculate days between start date and now
 * @param {string} startDate - ISO date string
 * @returns {number} - Number of days (0 if negative)
 */
export const calculateDays = (startDate) => {
  if (!startDate) return 0;

  const start = new Date(startDate);
  const now = new Date();

  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : 0;
};

/**
 * Calculate expected colonization date (spawn_dato_inok + baseline days)
 * @param {string} spawnDatoInok - Spawn inoculation date
 * @param {number} baselineDays - Baseline days for the strain (default 12)
 * @returns {string} - Expected date in YYYY-MM-DD format
 */
export const calculateExpectedColonization = (spawnDatoInok, baselineDays = 12) => {
  if (!spawnDatoInok) return null;

  const spawnDate = new Date(spawnDatoInok);
  const expectedDate = new Date(spawnDate);
  expectedDate.setDate(expectedDate.getDate() + baselineDays);

  return expectedDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

/**
 * Calculate auto-updated batch with current days
 * @param {object} batch - Batch object
 * @returns {object} - Batch with updated day counts
 */
export const calculateBatchDays = (batch) => {
  const updates = {
    ...batch,
    spawn_dager_ink: calculateDays(batch.spawn_dato_inok),
    bag_dager_ink: calculateDays(batch.bag_dato_inok)
  };

  // Auto-calculate forventet_kolon if spawn_dato_inok exists but forventet_kolon doesn't
  if (batch.spawn_dato_inok && !batch.bag_forventet_kolon) {
    updates.bag_forventet_kolon = calculateExpectedColonization(batch.spawn_dato_inok);
  }

  return updates;
};

/**
 * Calculate days for all batches
 * @param {array} batches - Array of batch objects
 * @returns {array} - Batches with updated day counts
 */
export const calculateAllBatchDays = (batches) => {
  return batches.map(calculateBatchDays);
};

/**
 * Check if a date is overdue (in the past)
 * @param {string} expectedDate - ISO date string
 * @returns {boolean} - True if date is in the past
 */
export const isOverdue = (expectedDate) => {
  if (!expectedDate) return false;
  return new Date(expectedDate) < new Date();
};
