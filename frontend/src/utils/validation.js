// frontend/src/utils/validation.js
// Client-side validation utilities for forms

/**
 * Validates booking form data
 * @param {Object} formData - The form data to validate
 * @returns {Object} - Object with validation errors (empty if valid)
 */
export const validateBookingForm = (formData) => {
  const errors = {};
  
  // Required fields validation
  if (!formData.guest_id) {
    errors.guest_id = 'Guest selection is required';
  }
  
  // Room validation - different for individual vs group bookings
  if (formData.is_group_booking) {
    // For group bookings, require room type and quantity
    if (!formData.room_type_id) {
      errors.room_type_id = 'Room type selection is required';
    }
    if (!formData.room_quantity || formData.room_quantity < 1) {
      errors.room_quantity = 'Number of rooms must be at least 1';
    }
  } else {
    // For individual bookings, require specific room
    if (!formData.room_id) {
      errors.room_id = 'Room selection is required';
    }
  }
  
  if (!formData.check_in_date) {
    errors.check_in_date = 'Check-in date is required';
  }
  
  if (!formData.check_out_date) {
    errors.check_out_date = 'Check-out date is required';
  }
  
  if (!formData.booked_rate || formData.booked_rate <= 0) {
    errors.booked_rate = 'Booking rate must be positive';
  }
  
  // Date validation
  if (formData.check_in_date && formData.check_out_date) {
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    
    if (checkOut <= checkIn) {
      errors.dates = 'Check-out date must be after check-in date';
    }
    
    // Check if dates are in the past (except for existing bookings)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      errors.check_in_date = 'Check-in date cannot be in the past';
    }
  }
  
  // Tax rate validation
  if (formData.tax_rate_percent !== undefined) {
    if (formData.tax_rate_percent < 0 || formData.tax_rate_percent > 100) {
      errors.tax_rate_percent = 'Tax rate must be between 0 and 100%';
    }
  }
  
  // Advance payment validation
  if (formData.advance_payment !== undefined) {
    if (formData.advance_payment < 0) {
      errors.advance_payment = 'Advance payment cannot be negative';
    }
    
    // Check if advance payment is at least 10% of total
    if (formData.booked_rate && formData.advance_payment > 0) {
      const minimumAdvance = formData.booked_rate * 0.1;
      if (formData.advance_payment < minimumAdvance) {
        errors.advance_payment = `Advance payment must be at least 10% ($${minimumAdvance.toFixed(2)})`;
      }
    }
  }
  
  return errors;
};

/**
 * Validates guest form data
 * @param {Object} formData - The guest form data to validate
 * @returns {Object} - Object with validation errors (empty if valid)
 */
export const validateGuestForm = (formData) => {
  const errors = {};
  
  // Required fields
  if (!formData.full_name || formData.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  }
  
  // Email validation
  if (formData.email) {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
  }
  
  // Phone validation
  if (formData.phone) {
    const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
  }
  
  // Date of birth validation
  if (formData.date_of_birth) {
    const birthDate = new Date(formData.date_of_birth);
    const today = new Date();
    
    if (birthDate > today) {
      errors.date_of_birth = 'Date of birth cannot be in the future';
    }
    
    // Check if person is at least 18 years old
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 18) {
      errors.date_of_birth = 'Guest must be at least 18 years old';
    }
  }
  
  return errors;
};

/**
 * Validates payment form data
 * @param {Object} formData - The payment form data to validate
 * @returns {Object} - Object with validation errors (empty if valid)
 */
export const validatePaymentForm = (formData) => {
  const errors = {};
  
  if (!formData.amount || formData.amount <= 0) {
    errors.amount = 'Payment amount must be positive';
  }
  
  if (!formData.method) {
    errors.method = 'Payment method is required';
  }
  
  // Payment reference validation for certain methods
  if (formData.method === 'Card' || formData.method === 'Online') {
    if (!formData.payment_reference || formData.payment_reference.trim().length < 3) {
      errors.payment_reference = 'Payment reference is required for card/online payments';
    }
  }
  
  return errors;
};

/**
 * Validates room form data
 * @param {Object} formData - The room form data to validate
 * @returns {Object} - Object with validation errors (empty if valid)
 */
export const validateRoomForm = (formData) => {
  const errors = {};
  
  if (!formData.room_number || formData.room_number.trim().length < 1) {
    errors.room_number = 'Room number is required';
  }
  
  if (!formData.room_type_id) {
    errors.room_type_id = 'Room type is required';
  }
  
  if (!formData.branch_id) {
    errors.branch_id = 'Branch is required';
  }
  
  return errors;
};

/**
 * Generic form validation helper
 * @param {Object} formData - The form data to validate
 * @param {Object} rules - Validation rules object
 * @returns {Object} - Object with validation errors (empty if valid)
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rule.required;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return;
    
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.minLength;
      return;
    }
    
    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.maxLength;
      return;
    }
    
    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.pattern;
      return;
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, formData);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return errors;
};

/**
 * Formats validation errors for display
 * @param {Object} errors - Validation errors object
 * @returns {Array} - Array of formatted error messages
 */
export const formatValidationErrors = (errors) => {
  return Object.values(errors).filter(error => error && error.trim() !== '');
};

/**
 * Checks if form has any validation errors
 * @param {Object} errors - Validation errors object
 * @returns {Boolean} - True if form has errors
 */
export const hasValidationErrors = (errors) => {
  return Object.keys(errors).length > 0;
};
