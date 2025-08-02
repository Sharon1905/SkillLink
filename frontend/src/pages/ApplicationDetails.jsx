import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiCalendar, FiFileText, FiCheckCircle, FiTrash2, FiEdit, FiMail, FiExternalLink, FiSave } from 'react-icons/fi';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function ApplicationDetails() {
  const handleAcceptApplication = async () => {
    try {
      if (!isAuthenticated() || currentUserType !== 'org') {
        throw new Error('Unauthorized to accept applications');
      }

      if (!isValidApplicationId(appId)) {
        throw new Error('Invalid application ID');
      }

      setIsSubmitting(true);

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const cleanAppId = appId.trim();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${cleanAppId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'accepted' })
      });

      if (!response.ok) {
        throw new Error('Failed to accept application');
      }

      setApplication(prev => ({
        ...prev,
        status: 'accepted',
      }));
      setSuccessMessage('Application accepted successfully');
    } catch (err) {
      setError(generateSafeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectApplication = async () => {
    try {
      if (!isAuthenticated() || currentUserType !== 'org') {
        throw new Error('Unauthorized to reject applications');
      }

      if (!isValidApplicationId(appId)) {
        throw new Error('Invalid application ID');
      }

      setIsSubmitting(true);

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const cleanAppId = appId.trim();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${cleanAppId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      setApplication(prev => ({
        ...prev,
        status: 'rejected',
      }));
      setSuccessMessage('Application rejected successfully');
    } catch (err) {
      setError(generateSafeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async () => {
    try {
      if (!isAuthenticated()) {
        throw new Error('You must be logged in to perform this action');
      }

      if (!isValidApplicationId(appId)) {
        throw new Error('Invalid application ID');
      }

      if (currentUserType !== 'org' && !isApplicant) {
        throw new Error('Unauthorized to delete this application');
      }

      setIsSubmitting(true);

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const cleanAppId = appId.trim();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${cleanAppId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete application');
      }

      navigate('/dashboard', {
        state: { message: 'Application deleted successfully' }
      });
    } catch (err) {
      setError(generateSafeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };
  const { appId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const currentUserType = getUserType();
  const currentUserId = isAuthenticated() ? secureStorage.getItem('userId') : null;

  // update my application
  const handleUpdateApplication = async () => {
    try {
      if (!isAuthenticated() || !isApplicant) {
        throw new Error('Unauthorized to update this application');
      }

      setIsSubmitting(true);

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const cleanAppId = appId.trim();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${cleanAppId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cover_letter: sanitizeInput(editedCoverLetter)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      setApplication(prev => ({
        ...prev,
        coverLetter: editedCoverLetter
      }));
      setIsEditing(false);
      setSuccessMessage('Application updated successfully');
    } catch (err) {
      setError(generateSafeError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // am I the applicant?
  const isApplicant = currentUserId === application?.player?.id;

  // is this a valid application ID?
  const isValidApplicationId = (id) => {
    if (!id || typeof id !== 'string') return false;
    // 24 character MongoDB ObjectId check
    return /^[a-f0-9]{24}$/.test(id.replace(/\s/g, ''));
  };

  useEffect(() => {
    if (!isValidApplicationId(appId)) {
      setError('Invalid application ID format');
      setLoading(false);
      return;
    }

    const fetchApplicationDetails = async () => {
      try {
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        const token = secureStorage.getItem('access_token');
        if (!token || !isValidToken(token)) {
          navigate('/login');
          return;
        }

        const cleanAppId = appId.trim();
        console.log('Fetching application with ID:', cleanAppId); // Debug log
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/application/${cleanAppId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.detail || 'Failed to fetch application details');
        }

        const data = await response.json();
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }

        const sanitizedData = {
          ...data,
          coverLetter: sanitizeInput(data.coverLetter),
          status: sanitizeInput(data.status),
          player: data.player ? {
            ...data.player,
            username: sanitizeInput(data.player.username),
          } : null,
          gig: data.gig ? {
            ...data.gig,
            title: sanitizeInput(data.gig.title),
            description: sanitizeInput(data.gig.description),
          } : null,
        };

        setApplication(sanitizedData);
        setEditedCoverLetter(sanitizedData.coverLetter || '');
      } catch (err) {
        setError(generateSafeError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [appId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="bg-dark-800 p-6 rounded-lg max-w-md w-full text-center">
          <p className="text-red-500 mb-4">{error || 'Application not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-dark-300 hover:text-dark-100 flex items-center justify-center gap-2"
          >
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 p-4">
      <div className="container mx-auto py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-500/20 text-green-400 p-4 rounded-md mb-6">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-dark-300 hover:text-dark-100 flex items-center gap-2 mb-6"
        >
          <FiArrowLeft /> Back
        </button>

        {/* Application Details */}
        <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold">{application.gig?.title || 'Unknown Gig'}</h1>
              <div className="flex items-center gap-4 text-dark-300 mt-2">
                <div className="flex items-center gap-2">
                  <FiUser />
                  <span>{application.player?.username || 'Unknown Player'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar />
                  <span>
                    {application.created_at 
                      ? new Date(application.created_at).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentUserType === 'org' && application.status === 'pending' && (
                <>
                  <button
                    onClick={handleAcceptApplication}
                    className="bg-green-500/20 text-green-400 p-2 rounded hover:bg-green-500/30"
                    disabled={isSubmitting}
                  >
                    <FiCheckCircle size={20} />
                  </button>
                  <button
                    onClick={handleRejectApplication}
                    className="bg-red-500/20 text-red-400 p-2 rounded hover:bg-red-500/30"
                    disabled={isSubmitting}
                  >
                    <FiTrash2 size={20} />
                  </button>
                </>
              )}

              {isApplicant && application.status === 'pending' && (
                <>
                  <button
                    onClick={() => setIsEditing(prev => !prev)}
                    className="bg-primary-500/20 text-primary-400 p-2 rounded hover:bg-primary-500/30"
                    disabled={isSubmitting}
                  >
                    <FiEdit size={20} />
                  </button>
                  <button
                    onClick={handleDeleteApplication}
                    className="bg-red-500/20 text-red-400 p-2 rounded hover:bg-red-500/30"
                    disabled={isSubmitting}
                  >
                    <FiTrash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className={`p-4 rounded-md mb-6 ${
            application.status === 'pending'
              ? 'bg-yellow-500/20 text-yellow-400'
              : application.status === 'accepted'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            Status: {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </div>

          {/* Cover Letter */}
          <div className="bg-dark-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FiFileText />
              Cover Letter
            </h2>

            {!isEditing ? (
              <div className="whitespace-pre-wrap text-dark-100">
                {application.coverLetter || 'No cover letter provided.'}
              </div>
            ) : (
              <div>
                <textarea
                  className="w-full bg-dark-700 border border-dark-600 rounded-md p-3 text-dark-100 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  rows="10"
                  value={editedCoverLetter}
                  onChange={(e) => setEditedCoverLetter(e.target.value)}
                  placeholder="Edit your cover letter here..."
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-4 gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-dark-300 hover:text-dark-100"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateApplication}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-dark-50 rounded-md flex items-center gap-2"
                    disabled={isSubmitting}
                  >
                    <FiSave />
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetails;
