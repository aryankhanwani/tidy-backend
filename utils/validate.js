/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid (min 6 characters)
 */
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
const isValidRole = (role) => {
  return role === 'owner' || role === 'housekeeper';
};

/**
 * Validate required fields
 * @param {Object} data - Object to validate
 * @param {Array<string>} fields - Required fields
 * @returns {Object} { isValid: boolean, message?: string }
 */
const validateRequiredFields = (data, fields) => {
  for (const field of fields) {
    if (!data[field] || data[field].trim() === '') {
      return {
        isValid: false,
        message: `${field} is required`
      };
    }
  }
  return { isValid: true };
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidRole,
  validateRequiredFields
};

