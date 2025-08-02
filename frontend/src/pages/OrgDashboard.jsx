import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiDollarSign, FiCheckCircle, FiClock, FiEye } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../utils/auth';

const OrgDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('posted');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for fetched data
  const [fetchedGigs, setFetchedGigs] = useState([]);
  const [fetchedApplications, setFetchedApplications] = useState([]);
  const [fetchedHiredPlayers, setFetchedHiredPlayers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State to explicitly trigger refresh

  // Sample organization data (replace with API fetched data later)
  const orgData = {
    name: 'Team Liquid', // This should eventually be fetched from /me endpoint for org
    avatar: 'TL', // This should eventually be derived from org's profile picture or name
    verified: true, // This might come from org data
    stats: {
      postedGigs: 0, // Will be updated by filteredPostedGigs.length
      activeGigs: 0, // Will be updated by filteredPostedGigs.filter
      totalHires: 0, // Placeholder for now, needs backend logic
      totalSpent: 0 // Placeholder for now, needs backend logic
    }
  };
  
  // --- Functions to fetch data from backend ---
  const fetchGigsForOrg = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/my_gigs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorDetail = await response.json();
        throw new Error(`Error fetching gigs: ${response.status} ${errorDetail.detail || response.statusText}`);
      }
      const data = await response.json();
      // Only log count in production
      console.log("Fetched gigs count:", Array.isArray(data) ? data.length : 0);
      const gigs = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
      
      // For each gig, fetch its applications count (only pending applications)
      const gigsWithApplications = await Promise.all(gigs.map(async (gig) => {
        try {
          const applicationsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applications/${gig.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (applicationsResponse.ok) {
            const applications = await applicationsResponse.json();
            // Only count pending applications
            const pendingApplications = applications.filter(app => app.status === 'pending');
            return { ...gig, applicants: pendingApplications.length };
          }
        } catch (error) {
          console.warn(`Could not fetch applications for gig ${gig.id}:`, error);
        }
        return { ...gig, applicants: 0 };
      }));
      
      setFetchedGigs(gigsWithApplications);
      return gigsWithApplications;
    } catch (error) {
      console.error("Failed to fetch gigs:", error);
      setErrorData(error.message || "Failed to load gigs.");
      setFetchedGigs([]);
      return [];
    }
  };

  const fetchApplicationsForOrg = async (token, gigsToFetchFor) => {
    if (!Array.isArray(gigsToFetchFor)) {
      console.warn("gigsToFetchFor is not an array, defaulting to empty.");
      gigsToFetchFor = [];
    }

    const allApplications = [];
    for (const gig of gigsToFetchFor) {
      if (!gig.id) {
        console.warn("Gig object missing 'id' for fetching applications:", gig);
        continue;
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/applications/${gig.id}`, { 
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const errorDetail = await response.json();
          console.warn(`Could not fetch applications for gig ${gig.id}: ${response.status} - ${errorDetail.detail || response.statusText}`);
          continue; // Skip to next gig if applications fetch fails
        }
        const applicationsForGig = await response.json();
        
        // For each application, fetch the associated gig details
        const applicationsWithGigDetails = await Promise.all(applicationsForGig.map(async (app) => {
            // Fetch gig details using app.gig_id
            let gigDetails = null;
            if (app.gig_id) {
                try {
                    const gigResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${app.gig_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (gigResponse.ok) {
                        gigDetails = await gigResponse.json();
                    } else {
                        console.warn(`Could not fetch gig details for application ${app.id}: ${gigResponse.status}`);
                    }
                } catch (gigError) {
                    console.error(`Error fetching gig details for application ${app.id}:`, gigError);
                }
            }
            // Backend's /applications/{gig_id} already returns 'player' object inside app
            return { ...app, gig: gigDetails }; // Add gig object to application
        }));
        allApplications.push(...applicationsWithGigDetails);

      } catch (error) {
        console.error(`Error fetching applications for gig ${gig.id}:`, error);
      }
    }
    // Only log count in production
    console.log("Fetched applications count:", allApplications.length);
    setFetchedApplications(allApplications);
  };
  
  // Validate JWT token format
  const isValidToken = (token) => {
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload && payload.exp && payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      setErrorData(null);
      const token = sessionStorage.getItem('access_token');
      const userType = getUserType();

      if (!token || !isValidToken(token) || userType !== 'org') {
        sessionStorage.clear(); // Clear any invalid session data
        setErrorData("Your session has expired. Please log in again.");
        setLoadingData(false);
        navigate('/login');
        return;
      }
      
      const orgGigs = await fetchGigsForOrg(token); 
      
      if (Array.isArray(orgGigs) && orgGigs.length > 0) {
        await fetchApplicationsForOrg(token, orgGigs);
      } else {
        setFetchedApplications([]);
      }
      
      setLoadingData(false);
    };

    loadData();
  }, [refreshTrigger]); 

  useEffect(() => {
    if (location.state?.gigPosted) {
      setRefreshTrigger(prev => prev + 1);
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location.state?.gigPosted, navigate, location.pathname]);


  // Handlers for button clicks
  const handlePostNewGig = () => {
    console.log("Navigating to create gig page");
    navigate('/create-gig');
  };

  const handleViewGigDetails = (gigId) => {
    console.log(`Viewing gig details for ID: ${gigId}`);
    navigate(`/gigs/${gigId}`);
  };

  const handleEditGig = (gigId) => {
    console.log(`Editing gig with ID: ${gigId}`);
    navigate(`/edit-gig/${gigId}`); // Navigate to an edit page
  };

  const handleDeleteGig = async (gigId) => { 
    if (window.confirm("Are you sure you want to delete this gig?")) {
      console.log(`Attempting to delete gig with ID: ${gigId}`);
      const token = sessionStorage.getItem('access_token');
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${gigId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          // Only show generic error message to user, log details for debugging
          console.error(`Failed to delete gig (${response.status}):`, errorDetail);
          throw new Error("Failed to delete gig. Please try again later.");
        }

        console.log("Gig deleted successfully");
        setRefreshTrigger(prev => prev + 1); // Trigger re-fetch of gigs
      } catch (error) {
        // Show generic error message to user
        alert("Failed to delete gig. Please try again later.");
      }
    }
  };

  const handleViewApplication = (event, appId) => {
    event.stopPropagation(); // Prevent event bubbling
    if (!appId) {
      console.error("No application ID provided");
      return;
    }
    console.log(`Viewing application with ID: ${appId}`);
    navigate(`/application-details/${appId}`);
  };

  const handleAcceptApplication = async (event, appId) => {
    event.stopPropagation(); // Prevent event bubbling
    if (!appId) {
      console.error("No application ID provided");
      return;
    }
    console.log(`Accepting application with ID: ${appId}`);
    
    const token = sessionStorage.getItem('access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${appId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.detail || `Failed to accept application (${response.status})`);
      }

      const result = await response.json();
      console.log('Application accepted successfully:', result);

      // Show success message
      alert('Application accepted successfully!');
      
      // Update the local state immediately to reflect the change
      setFetchedApplications(prev => 
        prev.map(app => 
          app._id === appId 
            ? { ...app, status: 'accepted' }
            : app
        )
      );
      
      // Also trigger a full refresh to ensure consistency
      setRefreshTrigger(prev => prev + 1);
      
      // Navigate back to dashboard to show updated state
      navigate('/org-dashboard', { replace: true });
    } catch (error) {
      console.error('Error accepting application:', error);
      alert(`Failed to accept application: ${error.message}`);
    }
  };

  const handleRejectApplication = async (event, appId) => {
    event.stopPropagation(); // Prevent event bubbling
    if (!appId) {
      console.error("No application ID provided");
      return;
    }
    console.log(`Rejecting application with ID: ${appId}`);
    
    const token = sessionStorage.getItem('access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${appId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.detail || `Failed to reject application (${response.status})`);
      }

      const result = await response.json();
      console.log('Application rejected successfully:', result);

      // Show success message
      alert('Application rejected successfully!');
      
      // Update the local state immediately to reflect the change
      setFetchedApplications(prev => 
        prev.map(app => 
          app._id === appId 
            ? { ...app, status: 'rejected' }
            : app
        )
      );
      
      // Also trigger a full refresh to ensure consistency
      setRefreshTrigger(prev => prev + 1);
      
      // Navigate back to dashboard to show updated state
      navigate('/org-dashboard', { replace: true });
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert(`Failed to reject application: ${error.message}`);
    }
  };

  const handleViewPlayer = (playerId) => {
    console.log(`Viewing player with ID: ${playerId}`);
    navigate(`/player/${playerId}`); // Navigate to player profile page
  };

  const handleCompleteGig = async (gigId) => {
    if (!gigId) {
      console.error("No gig ID provided");
      return;
    }
    console.log(`Completing gig with ID: ${gigId}`);
    
    const token = sessionStorage.getItem('access_token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${gigId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.detail || `Failed to complete gig (${response.status})`);
      }

      const result = await response.json();
      console.log('Gig completed successfully:', result);

      // Show success message
      alert('Gig marked as completed successfully!');
      
      // Refresh the gigs list
      setRefreshTrigger(prev => prev + 1);
      
      // Navigate back to dashboard to show updated state
      navigate('/org-dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing gig:', error);
      alert(`Failed to complete gig: ${error.message}`);
    }
  };
  
  // Sanitize search query and filter data
  const sanitizeSearchQuery = (query) => {
    return query.replace(/[<>]/g, '').toLowerCase().trim();
  };
  
  const safeSearchQuery = sanitizeSearchQuery(searchQuery);
  
  // Filter gigs by status and search query
  const filteredActiveGigs = Array.isArray(fetchedGigs) ? fetchedGigs.filter(gig => 
    gig.status === 'active' && (
      (gig.title || '').toLowerCase().includes(safeSearchQuery) ||
      (gig.tags && gig.tags.length > 0 && gig.tags[0].toLowerCase().includes(safeSearchQuery))
    )
  ) : [];
  
  const filteredAcceptedGigs = Array.isArray(fetchedGigs) ? fetchedGigs.filter(gig => 
    gig.status === 'accepted' && (
      (gig.title || '').toLowerCase().includes(safeSearchQuery) ||
      (gig.tags && gig.tags.length > 0 && gig.tags[0].toLowerCase().includes(safeSearchQuery))
    )
  ) : [];
  
  const filteredCompletedGigs = Array.isArray(fetchedGigs) ? fetchedGigs.filter(gig => 
    gig.status === 'completed' && (
      (gig.title || '').toLowerCase().includes(safeSearchQuery) ||
      (gig.tags && gig.tags.length > 0 && gig.tags[0].toLowerCase().includes(safeSearchQuery))
    )
  ) : [];
  
  // Filter applications by status and search query
  const filteredApplications = Array.isArray(fetchedApplications) ? fetchedApplications.filter(app => 
    app.status === 'pending' && (
      (app.player?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (app.gig?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  ) : [];
  
  // Filter accepted applications for the hired tab
  const filteredHiredPlayers = Array.isArray(fetchedApplications) ? fetchedApplications.filter(app => 
    app.status === 'accepted' && (
      (app.player?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (app.gig?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  ) : [];
  
  if (loadingData) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        Loading organization dashboard data...
      </div>
    );
  }

  if (errorData) {
    return (
      <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
        Error: {errorData}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Organization Header */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Organization Avatar */}
            <div className="w-16 h-16 rounded-md bg-primary-500 flex items-center justify-center text-dark-50 text-xl font-bold relative">
              {orgData.avatar}
              {orgData.verified && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <FiCheckCircle size={14} />
                </div>
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-dark-50">
                  {orgData.name}
                </h1>
                {orgData.verified && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                    Verified
                  </span>
                )}
              </div>
              
              <p className="text-dark-300 mt-1">
                Professional Esports Organization
              </p>
            </div>
            
            <div className="w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={handlePostNewGig}
                className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-4 py-2 rounded-md transition-colors w-full md:w-auto"
              >
                <FiPlus className="inline mr-2" />
                Post New Gig
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-500/20 p-2 rounded-md">
                  <FiPlus className="text-primary-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Active Gigs</p>
                  <p className="text-xl font-bold">{filteredActiveGigs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-md">
                  <FiClock className="text-green-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Accepted Gigs</p>
                  <p className="text-xl font-bold">{filteredAcceptedGigs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-md">
                  <FiUsers className="text-yellow-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Pending Applications</p>
                  <p className="text-xl font-bold">{filteredApplications.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-md">
                  <FiCheckCircle className="text-green-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Accepted Applications</p>
                  <p className="text-xl font-bold">{filteredHiredPlayers.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 p-2 rounded-md">
                  <FiCheckCircle className="text-blue-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Completed Gigs</p>
                  <p className="text-xl font-bold">{filteredCompletedGigs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/20 p-2 rounded-md">
                  <FiDollarSign className="text-yellow-500" size={20} />
                </div>
                <div>
                  <p className="text-dark-300 text-sm">Total Spent</p>
                  <p className="text-xl font-bold">${orgData.stats.totalSpent.toLocaleString()}</p> 
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-dark-800 rounded-lg overflow-hidden border border-dark-700 mb-6">
          <div className="flex border-b border-dark-700">
            <button 
              className={`px-6 py-4 font-medium ${activeTab === 'posted' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-200 hover:text-dark-100'}`}
              onClick={() => setActiveTab('posted')}
            >
              Active Gigs
            </button>
            <button 
              className={`px-6 py-4 font-medium ${activeTab === 'applications' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-200 hover:text-dark-100'}`}
              onClick={() => setActiveTab('applications')}
            >
              Applications
            </button>
            <button 
              className={`px-6 py-4 font-medium ${activeTab === 'accepted' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-200 hover:text-dark-100'}`}
              onClick={() => setActiveTab('accepted')}
            >
              Accepted Gigs
            </button>
            <button 
              className={`px-6 py-4 font-medium ${activeTab === 'completed' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-dark-200 hover:text-dark-100'}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed Gigs
            </button>
          </div>
          
          <div className="p-6">
            {/* Active Gigs Tab */}
            {activeTab === 'posted' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Category</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Price</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Applicants</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActiveGigs.length > 0 ? (
                        filteredActiveGigs.map((gig) => (
                          <tr key={gig.id} className="border-b border-dark-700 hover:bg-dark-750 cursor-pointer" onClick={() => handleViewGigDetails(gig.id)}>
                            <td className="py-4 px-4">{gig.title}</td>
                            <td className="py-4 px-4">
                              <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">
                                {gig.tags && gig.tags.length > 0 ? gig.tags[0] : 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-4">${gig.budget ? gig.budget.toFixed(2) : 'N/A'}</td>
                            <td className="py-4 px-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (gig.applicants > 0) {
                                    setActiveTab('applications');
                                  }
                                }}
                                className={`text-dark-300 ${gig.applicants > 0 ? 'hover:text-primary-500 cursor-pointer' : ''}`}
                              >
                                {gig.applicants || 0}
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-xs px-2 py-1 rounded ${gig.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {gig.status === 'active' ? 'Active' : 'Closed'}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewGigDetails(gig.id); }}
                                  className="text-dark-300 hover:text-dark-100 p-1">
                                  <FiEye size={18} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditGig(gig.id); }}
                                  className="text-dark-300 hover:text-primary-500 p-1">
                                  <FiEdit size={18} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteGig(gig.id); }}
                                  className="text-dark-300 hover:text-red-500 p-1">
                                  <FiTrash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-dark-300">
                            No active gigs found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Accepted Gigs Tab */}
            {activeTab === 'accepted' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Category</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Budget</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Payment Method</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAcceptedGigs.length > 0 ? (
                        filteredAcceptedGigs.map((gig) => (
                          <tr key={gig.id} className="border-b border-dark-700 hover:bg-dark-750">
                            <td className="py-4 px-4">{gig.title}</td>
                            <td className="py-4 px-4">
                              <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">
                                {gig.tags && gig.tags.length > 0 ? gig.tags[0] : 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-4">${gig.budget ? gig.budget.toFixed(2) : 'N/A'}</td>
                            <td className="py-4 px-4">{gig.method || 'Not specified'}</td>
                            <td className="py-4 px-4">
                              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                                Accepted
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewGigDetails(gig.id); }}
                                  className="text-dark-300 hover:text-dark-100 p-1">
                                  <FiEye size={18} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCompleteGig(gig.id); }}
                                  className="text-dark-300 hover:text-green-500 p-1">
                                  <FiCheckCircle size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-dark-300">
                            No accepted gigs found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Applications Tab */}
            {activeTab === 'applications' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Applicant</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Gig</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Applied Date</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.length > 0 ? (
                        filteredApplications.map((app) => (
                          <tr key={app._id} className="border-b border-dark-700 hover:bg-dark-750">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 text-sm font-bold">
                                  {app.player?.username ? app.player.username.substring(0,2).toUpperCase() : '??'}
                                </div>
                                <span>{app.player?.username || 'Unknown'}</span>
                                {app.player?.verified && (
                                  <span className="ml-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">{app.gig?.title || 'Unknown Gig'}</td>
                            <td className="py-4 px-4">{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-4 px-4">
                              <span className={`text-xs px-2 py-1 rounded ${app.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : app.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleViewApplication(e, app._id)}
                                  className="text-dark-300 hover:text-dark-100 p-1">
                                  <FiEye size={18} />
                                </button>
                                {app.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={(e) => handleAcceptApplication(e, app._id)}
                                      className="text-dark-300 hover:text-green-500 p-1">
                                      <FiCheckCircle size={18} />
                                    </button>
                                    <button
                                      onClick={(e) => handleRejectApplication(e, app._id)}
                                      className="text-dark-300 hover:text-red-500 p-1">
                                      <FiTrash2 size={18} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-dark-300">
                            No applications found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Completed Gigs Tab */}
            {activeTab === 'completed' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Category</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Budget</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Payment Method</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Completed Date</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompletedGigs.length > 0 ? (
                        filteredCompletedGigs.map((gig) => (
                          <tr key={gig.id} className="border-b border-dark-700 hover:bg-dark-750">
                            <td className="py-4 px-4">{gig.title}</td>
                            <td className="py-4 px-4">
                              <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">
                                {gig.tags && gig.tags.length > 0 ? gig.tags[0] : 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-4">${gig.budget ? gig.budget.toFixed(2) : 'N/A'}</td>
                            <td className="py-4 px-4">{gig.method || 'Not specified'}</td>
                            <td className="py-4 px-4">{gig.updated_at ? new Date(gig.updated_at).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleViewGigDetails(gig.id); }}
                                  className="text-dark-300 hover:text-dark-100 p-1">
                                  <FiEye size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-dark-300">
                            No completed gigs found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Hired Players Tab */}
            {activeTab === 'hired' && (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Player</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Gig</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Accepted Date</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-dark-300 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHiredPlayers.length > 0 ? (
                        filteredHiredPlayers.map((app) => (
                          <tr key={app._id} className="border-b border-dark-700 hover:bg-dark-750">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 text-sm font-bold">
                                  {app.player?.username ? app.player.username.substring(0,2).toUpperCase() : '??'}
                                </div>
                                <span>{app.player?.username || 'Unknown'}</span>
                                {app.player?.verified && (
                                  <span className="ml-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                                    Verified
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">{app.gig?.title || 'Unknown Gig'}</td>
                            <td className="py-4 px-4">{app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'N/A'}</td>
                            <td className="py-4 px-4">
                              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                                Accepted
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleViewApplication(e, app._id)}
                                  className="text-dark-300 hover:text-dark-100 p-1">
                                  <FiEye size={18} />
                                </button>
                                <button
                                  onClick={() => handleViewPlayer(app.player?.id)}
                                  className="text-dark-300 hover:text-primary-500 p-1">
                                  <FiEdit size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-dark-300">
                            No accepted applications found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgDashboard;