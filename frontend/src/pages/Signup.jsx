import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getUserType } from "../utils/auth";
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    user_type: "player"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const userType = getUserType();
      if (userType === 'player') {
        navigate('/dashboard', { replace: true });
      } else if (userType === 'org') {
        navigate('/org-dashboard', { replace: true });
      }
    }
  }, [location.state, navigate]); // Added location.state to dependency array

  useEffect(() => {
    if (location.state && location.state.userType) {
      setFormData(prev => ({
        ...prev,
        user_type: location.state.userType
      }));
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    
    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase || !hasLowerCase) {
      return "Password must contain both uppercase and lowercase letters";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character (!@#$%^&*)";
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Validate username
    if (formData.username.length < 3 || formData.username.length > 30) {
      setError("Username must be between 3 and 30 characters");
      setIsLoading(false);
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      username: sanitizeInput(formData.username),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      user_type: ['player', 'org'].includes(formData.user_type) ? formData.user_type : 'player'
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(sanitizedData),
        credentials: 'same-origin' // Enhance CSRF protection
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await response.json();
      console.log("Registration successful:", data);

      navigate('/login');

    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-950 rounded-lg shadow-lg p-8 border border-dark-800">
          <h2 className="text-2xl font-bold text-dark-50 text-center mb-6">Create an account</h2>
          <p className="text-dark-200 text-center mb-8">
            Join the community and start your journey
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-dark-200 mb-1.5">
                USERNAME
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-dark-200 mb-1.5">
                EMAIL
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-dark-200 mb-1.5">
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-dark-200 mb-1.5">
                CONFIRM PASSWORD
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="user_type" className="block text-xs font-semibold text-dark-200 mb-1.5">
                ACCOUNT TYPE
              </label>
              <select
                id="user_type"
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
                required
              >
                <option value="player">Player</option>
                <option value="org">Organization</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded text-dark-950 font-medium ${
                isLoading ? 'bg-primary-500/60 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
              } transition-colors shadow-sm`}
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-dark-200 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-500 hover:underline font-medium">
              Log In
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-dark-300">
            By registering, you agree to our{" "}
            <a href="/terms" className="text-primary-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary-500 hover:underline">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;