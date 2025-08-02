import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';
import { FiPlus, FiDollarSign, FiClock, FiAward, FiUsers, FiCheckCircle, FiCalendar, FiExternalLink, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Add the useLocation hook
  const [activeTab, setActiveTab] = useState('looking-for-work');
  
  const [playerData, setPlayerData] = useState(null);
  const [playerApplications, setPlayerApplications] = useState([]); // State for player's applications
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);
  const [refreshtrigger, setRefreshTrigger] = useState(0); // State to trigger re-fetching data

  // Remove navigation state user override, always fetch latest from backend

  // --- Functions to fetch data from backend ---
  const fetchPlayerData = async (token) => {
    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return null;
      }

      if (!token || !isValidToken(token)) {
        navigate('/login');
        return null;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch player data');
      }

      const data = await response.json();
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data received from server');
      }

      // Sanitize user data
      const sanitizedData = {
        ...data,
        username: sanitizeInput(data.username),
        email: sanitizeInput(data.email),
        bio: sanitizeInput(data.bio || ''),
        location: sanitizeInput(data.location || ''),
        games: Array.isArray(data.games) ? data.games.map(g => sanitizeInput(g)) : [],
        socials: Object.entries(data.socials || {}).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: sanitizeInput(value)
        }), {})
      };

      setPlayerData(sanitizedData);
      return sanitizedData;
    } catch (err) {
      setErrorData(generateSafeError(err));
      setPlayerData(null);
      return null;
    }
  };

  const fetchPlayerApplications = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/my_applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error fetching applications: ${response.status} ${errorDetail.detail || response.statusText}`);
      }
      const applicationsData = await response.json();
      
      const applicationsWithDetails = await Promise.all(applicationsData.map(async (app) => {
        // Here, 'app' should already have 'id', 'gig' and 'player' nested from backend's get_my_applications
        // We just need to ensure the nested gig and player objects are fully hydrated.
        let gigDetails = app.gig || null;
        let creatorDetails = app.creator || null;

                // Skip applications with invalid gig references entirely
        if (!app.gig_id || app.gig_id.length !== 24) {
          console.warn(`Skipping application ${app.id} with invalid gig_id: ${app.gig_id}`);
          return null; // This will be filtered out later
        }

        // Skip known invalid gig IDs
        if (app.gig_id === '688b3ac53d3e3da1f1e2eccc') {
          console.warn(`Skipping application with known invalid gig_id: ${app.gig_id}`);
          return null; // This will be filtered out later
        }

        // If gigDetails weren't fully attached by backend, fetch them here
        if (!gigDetails?.title && !app._gigFetchAttempted && !app._gigFetchFailed) {
          try {
            const gigResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${app.gig_id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (gigResponse.ok) {
              gigDetails = await gigResponse.json();
              if (gigDetails.creator_id && !creatorDetails?.username) {
                const creatorResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orgs/${gigDetails.creator_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (creatorResponse.ok) {
                    creatorDetails = await creatorResponse.json();
                }
              }
            } else {
              console.warn(`Could not fetch gig details for application ${app.id}: ${gigResponse.status}`);
              app._gigFetchFailed = true; // Mark as failed to prevent retries
              return null; // Skip this application entirely
            }
          } catch (gigError) {
            console.error(`Error fetching gig details for application ${app.id}:`, gigError);
            app._gigFetchFailed = true; // Mark as failed to prevent retries
            return null; // Skip this application entirely
          }
        }

        return {
          ...app,
          gig: gigDetails, // Attach the full gig object
          creator: creatorDetails // Attach the full creator object
        };
      }));

      // Filter out null applications (invalid gig references)
      const validApplications = applicationsWithDetails.filter(app => app !== null);
      setPlayerApplications(validApplications);
    } catch (error) {
      console.error("Failed to fetch player applications:", error);
      setPlayerApplications([]);
    }
  };

  // --- Handle Delete Application ---
  const handleDeleteApplication = async (appId) => {
    if (window.confirm("Are you sure you want to withdraw this application?")) {
      const token = secureStorage.getItem('access_token');
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${appId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          throw new Error(errorDetail.detail || `Failed to withdraw application: ${response.status}`);
        }
        // Remove the application from the state directly for immediate UI update
        setPlayerApplications(prevApps => prevApps.filter(app => app._id !== appId));
        alert("Application withdrawn successfully!");
      } catch (error) {
        console.error("Error withdrawing application:", error);
        alert(error.message || "Failed to withdraw application.");
      }
    }
  };

  // --- Handle View Application (navigate to new details page) ---
  const handleViewApplicationDetails = (appId) => {
    navigate(`/application-details/${appId}`); // Navigate to new details page
  };




  // --- Fetch data on component mount and on refreshtrigger change ---
  // Validate and sanitize any data before display
  const sanitizeUserData = (data) => {
    if (!data) return null;
    // Remove sensitive fields
    const { password, hashed_password, token, ...safeData } = data;
    return safeData;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      setErrorData(null);
      
      // Verify authentication and user type
      const token = secureStorage.getItem('access_token');
      const userType = getUserType();
      if (!isAuthenticated() || !token || !isValidToken(token)) {
        setErrorData("You are not authorized to view this dashboard.");
        setLoadingData(false);
        navigate('/login');
        return;
      }
      // Always fetch latest user data from backend
      const pData = await fetchPlayerData(token);
      if (pData) {
        await fetchPlayerApplications(token);
      }
      setLoadingData(false);
    };
    loadData();
  }, [navigate, refreshtrigger]);

  useEffect(() => {
    if (location.state?.profileUpdated) {
      setRefreshTrigger(prev => prev + 1);
      navigate(location.pathname, { replace: true, state: {} }); // Clear state
    }
  }, [location.state?.profileUpdated, navigate, location.pathname]);


  if (loadingData) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-100 flex items-center justify-center">
        Loading player dashboard...
      </div>
    );
  }

  if (errorData || !playerData) {
    return (
      <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
        Error: {errorData || "Player data not found. Please try logging in again."}
      </div>
    );
  }

  

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* User Profile */}
        <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 text-2xl font-bold">
                {playerData.profile_picture_url ? (
                  <img src={playerData.profile_picture_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  playerData.username ? playerData.username.substring(0, 2).toUpperCase() : '?'
                )}
                {/* Status indicator (hardcoded for now) */}
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-dark-50">{playerData.username}</h1>
                <p className="text-primary-500 font-medium">{playerData.user_type ? playerData.user_type.charAt(0).toUpperCase() + playerData.user_type.slice(1) : ''}</p>
                <div className="flex items-center gap-2 mt-1">
                  {playerData.games && playerData.games.map((game, index) => (
                    <span key={index} className="bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded">{game}</span>
                  ))}
                  {playerData.location && (
                    <span className="bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded">{playerData.location}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Stats - removed hardcoded stats, add your own backend stats here if needed */}
          </div>
          
          {/* Bio */}
          {playerData.bio && (
            <div className="mt-6 pt-6 border-t border-dark-700">
              <h2 className="text-lg font-bold text-dark-50 mb-2">About Me</h2>
              <p className="text-dark-200">{playerData.bio}</p>
            </div>
          )}

          {/* Socials */}
          {playerData.socials && Object.keys(playerData.socials).length > 0 && (
            <div className="mt-6 pt-6 border-t border-dark-700">
              <h2 className="text-lg font-bold text-dark-50 mb-2">Socials</h2>
              <div className="flex flex-wrap gap-3">
                {playerData.socials.twitter && <Link to={playerData.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center"><FiUsers className="mr-1" /> Twitter</Link>}
                {playerData.socials.discord && <span className="text-indigo-400 flex items-center"><FiUsers className="mr-1" /> Discord: {playerData.socials.discord}</span>}
                {playerData.socials.youtube && <Link to={playerData.socials.youtube} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline flex items-center"><FiUsers className="mr-1" /> YouTube</Link>}
                {playerData.socials.twitch && <Link to={playerData.socials.twitch} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline flex items-center"><FiUsers className="mr-1" /> Twitch</Link>}
                {playerData.socials.spotify && <Link to={playerData.socials.spotify} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline flex items-center"><FiUsers className="mr-1" /> Spotify</Link>}
              </div>
            </div>
          )}

        </div>
        
        {/* Tabs - Hardcoded for now, but structure to be dynamic */}
        <div className="border-b border-dark-700 mb-6">
          <div className="flex space-x-6">
            <button 
              onClick={() => setActiveTab('looking-for-work')} 
              className={`py-3 px-1 relative ${activeTab === 'looking-for-work' ? 'text-primary-500' : 'text-dark-200'}`}
            >
              My Applications
              {activeTab === 'looking-for-work' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('active-gigs')} 
              className={`py-3 px-1 relative ${activeTab === 'active-gigs' ? 'text-primary-500' : 'text-dark-200'}`}
            >
              Active Gigs
              {activeTab === 'active-gigs' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"></span>
              )}
            </button>
            
            <button 
              onClick={() => setActiveTab('completed-gigs')} 
              className={`py-3 px-1 relative ${activeTab === 'completed-gigs' ? 'text-primary-500' : 'text-dark-200'}`}
            >
              Completed Gigs
              {activeTab === 'completed-gigs' && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Dynamic Content based on Tabs */}
        {activeTab === 'looking-for-work' && (
            <div className="mb-8">
                <h2 className="text-xl font-bold text-dark-50 mb-4">My Pending Applications</h2>
                <div className="space-y-4">
                    {playerApplications.filter(app => app.status === 'pending').length > 0 ? (
                        playerApplications.filter(app => app.status === 'pending').map(app => (
                            <div key={app._id} className="bg-dark-800 rounded-lg border border-dark-700 p-4 hover:border-primary-500/30 transition-all duration-300">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="bg-dark-700 p-3 rounded-md">
                                        <FiAward className="text-primary-500" size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-dark-50 font-bold">{app.gig?.title || 'Unknown Gig'}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {app.gig?.tags && app.gig.tags.length > 0 && (
                                                <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">{app.gig.tags[0]}</span>
                                            )}
                                            {app.creator?.username && (
                                                <span className="bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded">Org: {app.creator.username}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-dark-50 font-bold">Status: {app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span>
                                        <div className="flex items-center text-dark-300 text-sm">
                                            <FiCalendar className="mr-1" size={14} />
                                            <span>Applied: {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <button 
                                            onClick={() => handleViewApplicationDetails(app._id)} 
                                            className="bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md inline-flex items-center transition-colors"
                                        >
                                            View Details <FiEye className="ml-2" />
                                        </button>
                                        {app.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleDeleteApplication(app._id)} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-dark-50 py-2 px-4 rounded-md transition-colors flex items-center">
                                                    Withdraw <FiTrash2 className="ml-2" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-dark-800 rounded-lg p-8 text-center border border-dark-700">
                            <h3 className="text-xl font-bold text-dark-50 mb-2">No Pending Applications</h3>
                            <p className="text-dark-200 mb-4">You don't have any pending applications.</p>
                            <Link to="/gigs" className="bg-primary-500 hover:bg-primary-600 text-dark-50 py-2 px-6 rounded-md inline-flex items-center transition-colors">
                                <FiPlus className="mr-2" />
                                Browse Gigs
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'active-gigs' && (
            <div className="mb-8">
                <h2 className="text-xl font-bold text-dark-50 mb-4">Your Active Gigs</h2>
                <div className="space-y-4">
                    {playerApplications.filter(app => app.status === 'accepted').length > 0 ? (
                        playerApplications.filter(app => app.status === 'accepted').map(app => (
                            <div key={app._id} className="bg-dark-800 rounded-lg border border-dark-700 p-4 hover:border-green-500/30 transition-all duration-300">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="bg-green-500/20 p-3 rounded-md">
                                        <FiCheckCircle className="text-green-500" size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-dark-50 font-bold">{app.gig?.title || 'Unknown Gig'}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {app.gig?.tags && app.gig.tags.length > 0 && (
                                                <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">{app.gig.tags[0]}</span>
                                            )}
                                            {app.creator?.username && (
                                                <span className="bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded">Org: {app.creator.username}</span>
                                            )}
                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">Budget: ${app.gig?.budget || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-green-400 font-bold">Status: Accepted</span>
                                        <div className="flex items-center text-dark-300 text-sm">
                                            <FiCalendar className="mr-1" size={14} />
                                            <span>Accepted: {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <button 
                                            onClick={() => handleViewApplicationDetails(app._id)} 
                                            className="bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md inline-flex items-center transition-colors"
                                        >
                                            View Details <FiEye className="ml-2" />
                                        </button>
                                        {app.cashed_out ? (
                                            <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                                                Cashed Out
                                            </span>
                                        ) : (
                                                                                    <Link 
                                            to="/wallet"
                                            className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-dark-50 py-2 px-4 rounded-md transition-colors flex items-center"
                                        >
                                            View Wallet <FiDollarSign className="ml-2" />
                                        </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-dark-800 rounded-lg p-8 text-center border border-dark-700">
                            <h3 className="text-xl font-bold text-dark-50 mb-2">No Active Gigs</h3>
                            <p className="text-dark-200">Gigs where your application was accepted will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'completed-gigs' && (
            <div className="mb-8">
                <h2 className="text-xl font-bold text-dark-50 mb-4">Your Completed Gigs</h2>
                <div className="space-y-4">
                    {playerApplications.filter(app => app.gig?.status === 'completed').length > 0 ? (
                        playerApplications.filter(app => app.gig?.status === 'completed').map(app => (
                            <div key={app._id} className="bg-dark-800 rounded-lg border border-dark-700 p-4 hover:border-blue-500/30 transition-all duration-300">
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="bg-blue-500/20 p-3 rounded-md">
                                        <FiAward className="text-blue-500" size={24} />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-dark-50 font-bold">{app.gig?.title || 'Unknown Gig'}</h3>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {app.gig?.tags && app.gig.tags.length > 0 && (
                                                <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">{app.gig.tags[0]}</span>
                                            )}
                                            {app.creator?.username && (
                                                <span className="bg-dark-700 text-dark-200 text-xs px-2 py-1 rounded">Org: {app.creator.username}</span>
                                            )}
                                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">Payment: ${app.gig?.budget || 'N/A'}</span>
                                            <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded">Method: {app.gig?.method || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-blue-400 font-bold">Status: Completed</span>
                                        <div className="flex items-center text-dark-300 text-sm">
                                            <FiCalendar className="mr-1" size={14} />
                                            <span>Completed: {app.gig?.updated_at ? new Date(app.gig.updated_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3 md:mt-0">
                                        <button 
                                            onClick={() => handleViewApplicationDetails(app._id)} 
                                            className="bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md inline-flex items-center transition-colors"
                                        >
                                            View Details <FiEye className="ml-2" />
                                        </button>
                                        <Link 
                                            to="/wallet"
                                            className="bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-dark-50 py-2 px-4 rounded-md transition-colors flex items-center"
                                        >
                                            View Wallet <FiDollarSign className="ml-2" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-dark-800 rounded-lg p-8 text-center border border-dark-700">
                            <h3 className="text-xl font-bold text-dark-50 mb-2">No Completed Gigs</h3>
                            <p className="text-dark-200">Successfully finished gigs will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;