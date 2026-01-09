// lib/validation.js
// Input validation utilities with helpful error messages

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {string|null} error - Error message if invalid
 * @property {string|null} suggestion - Helpful suggestion to fix the error
 */

/**
 * Email validation
 * @param {string} email
 * @returns {ValidationResult}
 */
export function validateEmail(email) {
  if (!email || email.trim() === '') {
    return {
      valid: false,
      error: 'Email is required',
      suggestion: 'Enter your email address to continue',
    };
  }

  const trimmed = email.trim().toLowerCase();
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Please enter a valid email address',
      suggestion: 'Email should be in format: name@example.com',
    };
  }

  // Common typo detection
  const commonTypos = {
    '@gmial.com': '@gmail.com',
    '@gmal.com': '@gmail.com',
    '@gamil.com': '@gmail.com',
    '@gmail.co': '@gmail.com',
    '@yahooo.com': '@yahoo.com',
    '@yaho.com': '@yahoo.com',
    '@hotmal.com': '@hotmail.com',
    '@hotmai.com': '@hotmail.com',
    '@outloo.com': '@outlook.com',
  };

  for (const [typo, correction] of Object.entries(commonTypos)) {
    if (trimmed.includes(typo)) {
      return {
        valid: false,
        error: `Did you mean ${trimmed.replace(typo, correction)}?`,
        suggestion: `Common typo detected. Try: ${trimmed.replace(typo, correction)}`,
      };
    }
  }

  return { valid: true, error: null, suggestion: null };
}

/**
 * Entry name validation
 * @param {string} name
 * @param {Object} options
 * @returns {ValidationResult}
 */
export function validateEntryName(name, options = {}) {
  const { minLength = 2, maxLength = 50, existingNames = [] } = options;

  if (!name || name.trim() === '') {
    return {
      valid: false,
      error: 'Entry name is required',
      suggestion: 'Give your entry a name (e.g., your name or nickname)',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < minLength) {
    return {
      valid: false,
      error: `Name must be at least ${minLength} characters`,
      suggestion: `Add a few more characters to your name`,
    };
  }

  if (trimmed.length > maxLength) {
    return {
      valid: false,
      error: `Name must be ${maxLength} characters or less`,
      suggestion: `Try shortening your name (currently ${trimmed.length} characters)`,
    };
  }

  // Check for duplicates (case-insensitive)
  const normalizedExisting = existingNames.map(n => n.toLowerCase().trim());
  if (normalizedExisting.includes(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: 'This name is already taken in this pool',
      suggestion: 'Try adding your last initial or a number',
    };
  }

  // Check for inappropriate content (basic)
  const inappropriate = ['admin', 'test', 'null', 'undefined'];
  if (inappropriate.includes(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: 'Please use a real name',
      suggestion: 'Enter your actual name or a nickname',
    };
  }

  return { valid: true, error: null, suggestion: null };
}

/**
 * Pool name validation
 * @param {string} name
 * @returns {ValidationResult}
 */
export function validatePoolName(name) {
  if (!name || name.trim() === '') {
    return {
      valid: false,
      error: 'Pool name is required',
      suggestion: 'Give your pool a memorable name',
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: 'Pool name must be at least 3 characters',
      suggestion: 'Try a more descriptive name',
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'Pool name is too long',
      suggestion: `Keep it under 100 characters (currently ${trimmed.length})`,
    };
  }

  return { valid: true, error: null, suggestion: null };
}

/**
 * Validate picks completeness
 * @param {Object} picks - User's picks
 * @param {Array} categories - Available categories
 * @param {Array} matchups - Available matchups
 * @returns {ValidationResult}
 */
export function validatePicksComplete(picks, categories = [], matchups = []) {
  const errors = [];
  
  // Check category picks
  const categoryPicks = picks.categories || {};
  const missingCategories = categories.filter(cat => !categoryPicks[cat.id]);
  
  if (missingCategories.length > 0) {
    errors.push({
      type: 'categories',
      count: missingCategories.length,
      items: missingCategories.map(c => c.name),
    });
  }

  // Check bracket picks
  const bracketPicks = picks.bracket || {};
  const missingMatchups = matchups.filter(m => !bracketPicks[m.id]);
  
  if (missingMatchups.length > 0) {
    errors.push({
      type: 'matchups',
      count: missingMatchups.length,
      items: missingMatchups.map(m => `Match ${m.bracket_position}`),
    });
  }

  if (errors.length > 0) {
    const totalMissing = errors.reduce((sum, e) => sum + e.count, 0);
    return {
      valid: false,
      error: `${totalMissing} pick${totalMissing !== 1 ? 's' : ''} missing`,
      suggestion: 'Complete all selections before submitting',
      details: errors,
    };
  }

  return { valid: true, error: null, suggestion: null };
}

/**
 * Validate form data object
 * @param {Object} data - Form data
 * @param {Object} schema - Validation schema
 * @returns {Object} { valid: boolean, errors: Object }
 */
export function validateForm(data, schema) {
  const errors = {};
  let valid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Required check
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rules.requiredMessage || `${field} is required`;
      valid = false;
      continue;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      continue;
    }

    // Custom validator
    if (rules.validator) {
      const result = rules.validator(value, data);
      if (!result.valid) {
        errors[field] = result.error;
        valid = false;
        continue;
      }
    }

    // Min length
    if (rules.minLength && typeof value === 'string' && value.trim().length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `Must be at least ${rules.minLength} characters`;
      valid = false;
      continue;
    }

    // Max length
    if (rules.maxLength && typeof value === 'string' && value.trim().length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `Must be ${rules.maxLength} characters or less`;
      valid = false;
      continue;
    }

    // Pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || 'Invalid format';
      valid = false;
    }
  }

  return { valid, errors };
}

/**
 * Sanitize user input
 * @param {string} input
 * @returns {string}
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .slice(0, 1000);       // Reasonable max length
}

/**
 * Sanitize email specifically
 * @param {string} email
 * @returns {string}
 */
export function sanitizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export default {
  validateEmail,
  validateEntryName,
  validatePoolName,
  validatePicksComplete,
  validateForm,
  sanitizeInput,
  sanitizeEmail,
};
