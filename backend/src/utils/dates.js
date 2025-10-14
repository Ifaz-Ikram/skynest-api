/**
 * Date utilities
 * All dates should be in ISO 8601 format
 */

/**
 * Format a date to ISO 8601 (YYYY-MM-DD)
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Format a datetime to ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string}
 */
function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate number of nights between check-in and check-out
 * @param {string|Date} checkIn
 * @param {string|Date} checkOut
 * @returns {number} whole days
 */
function calculateNights(checkIn, checkOut) {
  const d1 = new Date(checkIn);
  const d2 = new Date(checkOut);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diff = d2.getTime() - d1.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Add days to a date
 * @param {string|Date} date
 * @param {number} days
 * @returns {string} ISO date
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Get date range for last N days
 * @param {number} days
 * @returns {{from: string, to: string}}
 */
function getLastNDays(days) {
  const to = getToday();
  const from = addDays(to, -days);
  return { from, to };
}

/**
 * Get date range for next N days
 * @param {number} days
 * @returns {{from: string, to: string}}
 */
function getNextNDays(days) {
  const from = getToday();
  const to = addDays(from, days);
  return { from, to };
}

module.exports = {
  formatDate,
  formatDateTime,
  getToday,
  calculateNights,
  addDays,
  getLastNDays,
  getNextNDays,
};
