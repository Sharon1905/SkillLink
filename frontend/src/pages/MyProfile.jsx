import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiMapPin, FiEdit3, FiGlobe, FiTag, FiArrowLeft, FiSave, FiUploadCloud } from 'react-icons/fi';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function MyProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        location: '',
        socials: { twitter: '', twitch: '', youtube: '', discord: '', spotify: '' },
        games: '',
        phone_number: '',
        profile_picture_url: ''
    });
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // --- Fetch current user's profile data ---
    useEffect(() => {
        const fetchMyProfile = async () => {
            setLoading(true);
            setError(null);
            const token = secureStorage.getItem('access_token');
            if (!isAuthenticated() || !token) {
                setError("You must be logged in to view your profile.");
                setLoading(false);
                navigate('/login', { replace: true });
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorDetail = await response.json();
                    throw new Error(errorDetail.detail || `Failed to fetch profile: ${response.status}`);
                }
                const data = await response.json();
                setUserData(data); // Store full user data
                setFormData({ // Pre-fill form
                    username: data.username || '',
                    email: data.email || '',
                    bio: data.bio || '',
                    location: data.location || '',
                    socials: {
                        twitter: data.socials?.twitter || '',
                        twitch: data.socials?.twitch || '',
                        youtube: data.socials?.youtube || '',
                        discord: data.socials?.discord || '',
                        spotify: data.socials?.spotify || ''
                    },
                    games: (data.games || []).join(', '),
                    phone_number: data.phone_number || '',
                    profile_picture_url: data.profile_picture_url || '' // Get existing URL
                });
            } catch (err) {
                console.error("Error fetching my profile:", err);
                setError(err.message || "Failed to load profile details.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyProfile();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('socials.')) {
            const socialPlatform = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                socials: {
                    ...prev.socials,
                    [socialPlatform]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // --- Handle File Input Change (for profile picture upload) ---
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        const token = secureStorage.getItem('access_token');
        if (!isAuthenticated() || !token) {
            setError("You must be logged in to upload a picture.");
            setIsLoading(false);
            return;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", file); // 'file' must match backend's parameter name

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload-profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set 'Content-Type': 'multipart/form-data' here; browser does it automatically with FormData
                },
                body: uploadFormData
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(errorDetail.detail || `Failed to upload picture: ${response.status}`);
            }

            const result = await response.json();
            setSuccessMessage("Profile picture uploaded!");
            setFormData(prev => ({ ...prev, profile_picture_url: result.file_url })); // Update form state with new URL
            setUserData(prev => ({ ...prev, profile_picture_url: result.file_url })); // Update displayed data immediately

        } catch (err) {
            console.error("Error uploading profile picture:", err);
            setError(err.message || 'Failed to upload picture. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

        const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (!isAuthenticated()) {
                throw new Error('You must be logged in to update your profile');
            }

            // Validate and sanitize inputs
            const sanitizedData = {
                username: sanitizeInput(formData.username),
                email: sanitizeInput(formData.email),
                bio: sanitizeInput(formData.bio),
                location: sanitizeInput(formData.location),
                socials: {
                    twitter: sanitizeInput(formData.socials.twitter),
                    twitch: sanitizeInput(formData.socials.twitch),
                    youtube: sanitizeInput(formData.socials.youtube),
                    discord: sanitizeInput(formData.socials.discord),
                    spotify: sanitizeInput(formData.socials.spotify)
                },
                games: formData.games ? formData.games.split(',').map(g => sanitizeInput(g.trim())) : [],
                phone_number: sanitizeInput(formData.phone_number),
                profile_picture_url: formData.profile_picture_url
            };

            // Clean up empty social links
            for (const key in sanitizedData.socials) {
                if (!sanitizedData.socials[key]) {
                    delete sanitizedData.socials[key];
                }
            }
            if (Object.keys(sanitizedData.socials).length === 0) {
                sanitizedData.socials = null;
            }

            // Validation
            if (!sanitizedData.username || sanitizedData.username.length < 3) {
                throw new Error('Username must be at least 3 characters long');
            }
            if (!sanitizedData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.email)) {
                throw new Error('Please enter a valid email address');
            }

            const token = secureStorage.getItem('access_token');
            if (!token || !isValidToken(token)) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(errorDetail.detail || `Failed to update profile: ${response.status}`);
            }

            const updatedUser = await response.json();
            setUserData(updatedUser);
            setSuccessMessage("Profile updated successfully!");

            // Update session storage with the new username
            sessionStorage.setItem('username', updatedUser.username);

            // Redirect to the appropriate dashboard with the updated user data in the state
            const userType = getUserType();
            setTimeout(() => {
                if (userType === 'player') {
                    navigate('/dashboard', { state: { updatedUser }, replace: true });
                } else if (userType === 'org') {
                    navigate('/org-dashboard', { state: { updatedUser }, replace: true });
                } else {
                    navigate('/', { replace: true });
                }
            }, 1500);
        } catch (err) {
            setError(generateSafeError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        const userType = getUserType();
        if (userType === 'player') {
            navigate('/dashboard');
        } else if (userType === 'org') {
            navigate('/org-dashboard');
        } else {
            navigate('/');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click(); // Programmatically click the hidden file input
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
                Loading profile...
            </div>
        );
    }

    if (error && !isLoading) {
        return (
            <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
                <div className="container mx-auto px-4 py-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Error Loading Profile</h2>
                    <p className="mb-6">{error}</p>
                    <button onClick={handleBack} className="bg-primary-500 hover:bg-primary-600 text-dark-50 py-2 px-4 rounded-md transition-colors">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 text-dark-50 p-4">
            <div className="container mx-auto py-8">
                <button 
                    onClick={handleBack}
                    className="flex items-center text-primary-500 hover:text-primary-600 mb-6"
                >
                    <FiArrowLeft className="mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-dark-50 mb-6 text-center">Edit My Profile</h2>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded text-green-500 text-sm">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Profile Picture Upload Section */}
                        <div className="flex flex-col items-center mb-4">
                            <img 
                                src={formData.profile_picture_url || "https://placehold.co/100x100/333333/FFFFFF?text=PFP"} // Placeholder
                                alt="Profile Picture"
                                className="w-24 h-24 rounded-full object-cover border-2 border-primary-500 mb-3"
                            />
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" // Hide the default file input
                            />
                            <button 
                                type="button" 
                                onClick={triggerFileInput} 
                                disabled={isLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-medium ${
                                    isLoading ? 'bg-dark-700 text-dark-300 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600 text-dark-950'
                                }`}
                            >
                                <FiUploadCloud /> {isLoading ? 'Uploading...' : 'Change Photo'}
                            </button>
                            {/* Option to clear profile picture URL */}
                            {formData.profile_picture_url && (
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, profile_picture_url: '' }))}
                                    className="mt-2 text-red-400 hover:text-red-500 text-xs"
                                >
                                    Remove Photo
                                </button>
                            )}
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-dark-200 mb-1">Username</label>
                            <input type="text" id="username" name="username" required
                                value={formData.username} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        {/* Email (usually not editable via this form) */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-dark-200 mb-1">Email</label>
                            <input type="email" id="email" name="email" required
                                value={formData.email}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50"
                                disabled={true} // Email typically not editable
                            />
                        </div>
                        {/* Phone Number */}
                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-semibold text-dark-200 mb-1">Phone Number (Optional)</label>
                            <input type="tel" id="phone_number" name="phone_number"
                                value={formData.phone_number} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., +1-555-123-4567"
                            />
                        </div>
                        {/* Bio */}
                        <div>
                            <label htmlFor="bio" className="block text-sm font-semibold text-dark-200 mb-1">Bio</label>
                            <textarea id="bio" name="bio" rows="4"
                                value={formData.bio} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="Tell us about yourself..."
                            ></textarea>
                        </div>
                        {/* Location */}
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-dark-200 mb-1">Location</label>
                            <input type="text" id="location" name="location"
                                value={formData.location} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        {/* Social Links */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-dark-200">Socials</h3>
                            {Object.keys(formData.socials).map(platform => (
                                <div key={platform}>
                                    <label htmlFor={`socials-${platform}`} className="block text-xs font-semibold text-dark-300 mb-1 capitalize">{platform}</label>
                                    <input type="text" id={`socials-${platform}`} name={`socials.${platform}`}
                                        value={formData.socials[platform]} onChange={handleChange}
                                        className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                        placeholder={`Your ${platform} URL or handle`}
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Games */}
                        <div>
                            <label htmlFor="games" className="block text-sm font-semibold text-dark-200 mb-1">Games (Comma-separated)</label>
                            <input type="text" id="games" name="games"
                                value={formData.games} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., Valorant, CS2, League of Legends"
                            />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full py-2 px-4 rounded text-dark-950 font-medium ${
                            isLoading ? 'bg-primary-500/60 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
                          } transition-colors shadow-sm`}
                        >
                          {isLoading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MyProfile;