import { isValidToken, secureStorage, sanitizeInput } from './security';

// Get user type with validation
export const getUserType = () => {
  const token = secureStorage.getItem('access_token');
  const userType = secureStorage.getItem('user_type');
  
  if (!token || !isValidToken(token)) {
    logout(); // Clear invalid session
    return null;
  }
  
  return sanitizeInput(userType);
};

// Check authentication with token validation
export const isAuthenticated = () => {
  const token = secureStorage.getItem('access_token');
  if (!token || !isValidToken(token)) {
    logout(); // Clear invalid session
    return false;
  }
  return true;
};

// Secure logout with full cleanup
export const logout = () => {
  // Clear all sensitive data
  secureStorage.clear();
  
  // Clear any additional stored data
  localStorage.removeItem('lastPath');
  localStorage.removeItem('searchHistory');
  
  // Clear any sensitive cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  // Clear any other stored data that might be sensitive
  localStorage.removeItem('lastPath');
  localStorage.removeItem('searchHistory');
};