import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiSearch, FiUser, FiLogOut } from 'react-icons/fi';
import { isAuthenticated, getUserType, logout } from '../utils/auth';

function Navbar({ onSearch }) { 
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  // auth status
  const loggedIn = isAuthenticated();
  const userType = getUserType();
  
    // search functionality
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  // logout
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // profile navigation
  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/my-profile');
    } else {
      navigate('/login');
    }
  };
  
  return (
    <header className="bg-dark-800 border-b border-dark-700 py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left Side - Logo (always goes to home) */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-xl font-bold text-dark-50 flex items-center">
            <span className="text-primary-500 mr-1">&lt;/&gt;</span> Versatile
          </Link>
          
          {/* Center - Navigation Links (conditional based on login/role) */}
          <nav className="hidden md:flex space-x-6">
              {loggedIn ? ( // If logged in, show dashboard/messages links
                <>
                  {userType === 'player' && (
                    <Link to="/dashboard" className={`${location.pathname === '/dashboard' ? 'text-dark-50' : 'text-dark-100'} hover:text-primary-500`}>Player Dashboard</Link>
                  )}
                  {userType === 'org' && (
                    <Link to="/org-dashboard" className={`${location.pathname === '/org-dashboard' ? 'text-dark-50' : 'text-dark-100'} hover:text-primary-500`}>Org Dashboard</Link>
                  )}
                  {userType === 'player' && ( // Only show Gigs link if userType is 'player'
                    <Link to="/gigs" className={`${location.pathname.startsWith('/gigs') ? 'text-dark-50' : 'text-dark-100'} hover:text-primary-500`}>Gigs</Link> 
                  )}
                  <Link to="/messages" className={`${location.pathname === '/messages' ? 'text-dark-50' : 'text-dark-100'} hover:text-primary-500`}>Messages</Link>
                  <Link to="/wallet" className={`${location.pathname === '/wallet' ? 'text-dark-50' : 'text-dark-100'} hover:text-primary-500`}>Wallet</Link>
                </>
              ) : ( // If NOT logged in, show no central links (as per your request)
                <>
                  {/* No central links when not logged in */}
                </>
              )}
          </nav>
        </div>
        
        {/* Right Side - Search, User Icon, Auth/Logout Buttons */}
        <div className="flex items-center space-x-4">
          
          {loggedIn ? ( // Show search, user icon and logout if logged in
            <>
              <div className="relative hidden md:block">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-dark-700 text-dark-100 px-4 py-2 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-300" />
              </div>
              <button 
                onClick={handleProfileClick} 
                className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 cursor-pointer hover:bg-primary-600 transition-colors"
                title="View Profile"
              >
                <FiUser />
              </button>
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-full bg-dark-700 text-dark-100 hover:bg-dark-600 transition-colors"
                title="Logout"
              >
                <FiLogOut />
              </button>
            </>
          ) : ( // Show login/signup if not logged in
            <>
              {/* Search bar removed when not logged in */}
              <Link 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-dark-100 hover:text-dark-50 transition-colors"
              >
                  Log In
              </Link>
              <Link 
                  to="/signup" 
                  className="px-4 py-2 text-sm font-medium text-dark-950 bg-primary-500 hover:bg-primary-600 rounded-md transition-colors shadow-sm"
              >
                  Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;