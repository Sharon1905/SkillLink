// Security utility functions

// Validate JWT token format and expiration
export const isValidToken = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return payload && payload.exp && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input.replace(/[<>]/g, '').trim();
};

// Mask sensitive data for logging
export const maskSensitiveData = (data, fields = ['password', 'token', 'email']) => {
  const masked = { ...data };
  fields.forEach(field => {
    if (field in masked) {
      masked[field] = '***';
    }
  });
  return masked;
};

// Safe JSON parse
export const safeJSONParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Failed to parse JSON safely');
    return null;
  }
};

// Generate a secure error message
export const generateSafeError = (error, isProduction = true) => {
  if (isProduction) {
    return 'An error occurred. Please try again later.';
  }
  return error.message || 'Unknown error occurred';
};

// Secure session storage operations
export const secureStorage = {
  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('Failed to set item in session storage');
      return false;
    }
  },
  
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error('Failed to get item from session storage');
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Failed to remove item from session storage');
      return false;
    }
  },
  
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (e) {
      console.error('Failed to clear session storage');
      return false;
    }
  }
};
