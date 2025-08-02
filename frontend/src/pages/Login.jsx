import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getUserType } from "../utils/auth";
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
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
  }, [navigate]); // Dependency on navigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Sanitize inputs
    const sanitizedFormData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(sanitizedFormData),
        credentials: 'same-origin' // Enhance CSRF protection
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Invalid credentials. Please check your email and password.');
      }

      const data = await response.json();
      
      // Validate token format before storing
      if (!data.access_token || typeof data.access_token !== 'string') {
        throw new Error('Invalid response from server');
      }

      try {
        const base64Url = data.access_token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decodedToken = JSON.parse(jsonPayload);
        
        if (!decodedToken.user_type || !['player', 'org'].includes(decodedToken.user_type)) {
          throw new Error('Invalid user type in token');
        }

        if (!secureStorage.setItem('access_token', data.access_token)) {
          throw new Error('Failed to store access token');
        }
        if (!secureStorage.setItem('user_type', decodedToken.user_type)) {
          secureStorage.removeItem('access_token');
          throw new Error('Failed to store user type');
        }
      } catch (jwtError) {
        console.error("Error decoding JWT:", jwtError);
        secureStorage.removeItem('access_token');
        secureStorage.removeItem('user_type');
        throw new Error("Login successful, but failed to process user data. Please try again.");
      }

      console.log("Login successful, token received:", data.access_token);

      const userType = secureStorage.getItem('user_type');
      if (userType === 'player') {
        navigate('/dashboard');
      } else if (userType === 'org') {
        navigate('/org-dashboard');
      } else {
        navigate('/');
      }

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-950 rounded-lg shadow-lg p-8 border border-dark-800">
          <h2 className="text-2xl font-bold text-dark-50 text-center mb-6">Welcome back!</h2>
          <p className="text-dark-200 text-center mb-8">
            We're so excited to see you again!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-500/30"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-dark-200">
                  PASSWORD
                </label>
                <Link to="/signup" className="text-xs text-primary-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-800 rounded text-dark-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-500/30"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded text-dark-950 font-medium ${
                isLoading ? 'bg-primary-500/60 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
              } transition-colors shadow-sm`}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className="text-sm text-dark-200 mt-4 text-center">
            Need an account?{" "}
            <Link to="/signup" className="text-primary-500 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-dark-300">
            By logging in, you agree to our{" "}
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

export default Login;