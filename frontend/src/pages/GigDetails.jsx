import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiDollarSign, FiMapPin, FiClock, FiUser, FiTag, FiCheckCircle } from 'react-icons/fi';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function GigDetails() {
  const { gigId } = useParams(); // Get gigId from URL parameters
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applicationText, setApplicationText] = useState('');
  const [error, setError] = useState(null); // Added error state
  const [successMessage, setSuccessMessage] = useState(null); // Added success message state

  // Get current user type for conditional rendering
  const currentUserType = getUserType(); 

    // --- Fetch gig details from API ---
  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        const token = secureStorage.getItem('access_token');
        
        if (!isValidToken(token)) {
          throw new Error('Invalid token');
        }

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${sanitizeInput(gigId)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error('Failed to fetch gig details');
        }

        const data = await response.json();
        
        // Sanitize the received data
        const sanitizedGig = {
          ...data,
          title: sanitizeInput(data.title),
          description: sanitizeInput(data.description),
          location: sanitizeInput(data.location),
          game: sanitizeInput(data.game),
          organization: data.organization ? {
            ...data.organization,
            name: sanitizeInput(data.organization.name),
          } : null,
          skills_required: Array.isArray(data.skills_required) 
            ? data.skills_required.map(skill => sanitizeInput(skill))
            : [],
          tags: Array.isArray(data.tags)
            ? data.tags.map(tag => sanitizeInput(tag))
            : []
        };

        setGig(sanitizedGig);
      } catch (err) {
        setError(generateSafeError(err));
      } finally {
        setLoading(false);
      }
    };

    if (gigId) {
      fetchGigDetails();
    }
  }, [gigId, navigate]);

  // --- Handle Apply to Gig ---
    const handleApply = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!isAuthenticated()) {
        navigate('/login');
        return;
      }

      const userType = getUserType();
      if (userType !== 'player') {
        throw new Error('Only players can apply to gigs');
      }

      const sanitizedApplication = sanitizeInput(applicationText);
      if (!sanitizedApplication.trim()) {
        throw new Error('Please provide a cover letter for your application');
      }

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gig_id: sanitizeInput(gigId),
          cover_letter: sanitizedApplication
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setApplyModalOpen(false);
      setSuccessMessage('Application submitted successfully');
      setApplicationText('');
    } catch (err) {
      setError(generateSafeError(err));
    }
  };
  
  // --- Updated handleBack function ---
  const handleBack = () => {
    if (isAuthenticated()) { // If logged in, go to dashboard
      const userType = getUserType();
      if (userType === 'player') {
        navigate('/dashboard');
      } else if (userType === 'org') {
        navigate('/org-dashboard');
      }
    } else { // If not logged in, go to public gigs page
      navigate('/gigs');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-64 bg-dark-700 rounded mb-4"></div>
            <div className="h-4 w-48 bg-dark-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!gig || error) { // Show error if gig not found or fetch error
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50">
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-primary-500 hover:text-primary-600 mb-6"
          >
            <FiArrowLeft className="mr-2" />
            Back to {isAuthenticated() ? 'Dashboard' : 'Gigs'}
          </button>
          
          <div className="bg-dark-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{error ? "Error Loading Gig" : "Gig Not Found"}</h2>
            <p className="text-red-500 mb-6">{error || "The gig you're looking for doesn't exist or has been removed."}</p>
            <button 
              onClick={handleBack}
              className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-6 py-2 rounded-md transition-colors"
            >
              Back to {isAuthenticated() ? 'Dashboard' : 'Browse Available Gigs'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <button 
          onClick={handleBack}
          className="flex items-center text-primary-500 hover:text-primary-600 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to {isAuthenticated() ? (currentUserType === 'org' ? 'Dashboard' : 'Gigs') : 'Gigs'} {/* Dynamic text for back to... */}
        </button>
        
        {/* Gig Header */}
        <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Organization Avatar */}
            <div className="w-16 h-16 rounded-md bg-primary-500 flex items-center justify-center text-dark-50 text-xl font-bold">
              {/* You'll need to fetch creator's avatar/name from backend using gig.creator_id */}
              {gig.creator_id ? gig.creator_id.substring(0,2).toUpperCase() : '??'}
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h1 className="text-2xl font-bold text-dark-50">
                  {gig.title}
                </h1>
                
                <div className="flex items-center gap-2">
                  <span className="bg-primary-500/20 text-primary-400 px-3 py-1 rounded-md">
                    {gig.tags && gig.tags.length > 0 ? gig.tags[0] : 'General'} {/* Use first tag as category */}
                  </span>
                  
                  <span className="bg-dark-700 text-dark-50 font-bold px-4 py-1 rounded-md">
                    ${gig.budget ? gig.budget.toFixed(2) : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center text-dark-300">
                  <FiUser className="mr-1" />
                  <span>{gig.creator_id}</span> {/* Display creator_id for now, fetch username later */}
                </div>
                
                <div className="flex items-center text-dark-300">
                  <FiCalendar className="mr-1" />
                  <span>Ends in {gig.deadline ? Math.ceil((new Date(gig.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A'} days</span>
                </div>
                
                <div className="flex items-center text-dark-300">
                  <FiMapPin className="mr-1" />
                  <span>{gig.location}</span>
                </div>
                
                <div className="flex items-center text-dark-300">
                  <FiClock className="mr-1" />
                  <span>{/* Duration needs to be added to backend gig model if not there */}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto mt-4 md:mt-0">
              {isAuthenticated() && currentUserType === 'player' && ( // CRITICAL: Only show if logged in AND is a player
                <button 
                  onClick={() => setApplyModalOpen(true)}
                  className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-6 py-3 rounded-md transition-colors w-full md:w-auto font-medium"
                >
                  Apply Now
                </button>
              )}
              {!isAuthenticated() && ( // Show login prompt if not authenticated
                <button
                  onClick={() => navigate('/login')}
                  className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-6 py-3 rounded-md transition-colors w-full md:w-auto font-medium"
                >
                  Login to Apply
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Description */}
          <div className="lg:col-span-2">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold mb-4">Description</h2>
              <div className="text-dark-200 space-y-4">
                {gig.description.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column - Requirements */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {gig.skills_required && gig.skills_required.map((req, index) => ( // Use skills_required
                  <li key={index} className="flex items-start">
                    <FiCheckCircle className="text-primary-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-dark-200">{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700 mt-6">
              <h2 className="text-xl font-semibold mb-4">About {gig.creator_id}</h2> {/* Display creator_id */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-md bg-primary-500 flex items-center justify-center text-dark-50 font-bold mr-3">
                  {gig.creator_id ? gig.creator_id.substring(0,2).toUpperCase() : '??'} {/* Display creator_id */}
                </div>
                <div>
                  <h3 className="font-medium">{gig.creator_id}</h3> {/* Display creator_id */}
                  <p className="text-dark-300 text-sm">Esports Organization</p>
                </div>
              </div>
              <p className="text-dark-200 text-sm">
                {gig.creator_id} is a professional esports organization with teams competing in various games including Valorant, CS2, League of Legends, and more.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Apply for {gig.title}</h2>
            
            <form onSubmit={handleApply}>
              {error && ( // Display error in modal
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                  {error}
                </div>
              )}
              {successMessage && ( // Display success in modal
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-500 text-sm">
                  {successMessage}
                </div>
              )}
              <div className="mb-4">
                <label className="block text-dark-200 mb-2" htmlFor="application">
                  Why are you a good fit for this position?
                </label>
                <textarea
                  id="application"
                  className="w-full bg-dark-700 border border-dark-600 rounded-md p-3 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  rows="6"
                  value={applicationText}
                  onChange={(e) => setApplicationText(e.target.value)}
                  placeholder="Describe your experience, skills, and why you're interested in this opportunity..."
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setApplyModalOpen(false); setError(null); setSuccessMessage(null); }} // Clear messages on close
                  className="bg-dark-700 hover:bg-dark-600 text-dark-100 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading} // Disable during submission
                  className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-4 py-2 rounded-md transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GigDetails;