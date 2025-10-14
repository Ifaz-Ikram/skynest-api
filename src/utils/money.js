/**
 * Money formatting utilities
 * Always use numeric math, then format to 2 decimals
 */

/**
 * Format a number to 2 decimal places
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount with 2 decimals
 */
function formatMoney(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return Number(amount).toFixed(2);
}

/**
 * Parse money string/number to a safe numeric value
 * @param {string|number} value
 * @returns {number}
 */
function parseMoney(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Add two money values safely
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function addMoney(a, b) {
  return parseMoney(a) + parseMoney(b);
}

/**
 * Subtract money values safely
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function subtractMoney(a, b) {
  return parseMoney(a) - parseMoney(b);
}

/**
 * Multiply money by a factor
 * @param {number} amount
 * @param {number} factor
 * @returns {number}
 */
function multiplyMoney(amount, factor) {
  return parseMoney(amount) * parseMoney(factor);
}

module.exports = {
  formatMoney,
  parseMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
};
