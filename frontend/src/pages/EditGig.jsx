import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function EditGig() {
    const { gigId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        game: '',
        budget: '',
        skills_required: '',
        tags: '',
        deadline: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Validate user is authenticated and is an org
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        
        const userType = getUserType();
        if (userType !== 'org') {
            navigate('/dashboard');
            return;
        }
    }, [navigate]);

    // --- Fetch gig details for editing ---
    useEffect(() => {
        const fetchGigDetails = async () => {
            setIsLoading(true); // CORRECTED: Use setIsLoading
            setError(null);
            const token = sessionStorage.getItem('access_token');
            const userType = getUserType();

            if (!isAuthenticated() || userType !== 'org' || !token) {
                setError("You must be logged in as an organization to edit gigs.");
                setIsLoading(false); // CORRECTED: Use setIsLoading
                navigate('/login'); // Redirect if not authorized
                return;
            }

            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${gigId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    const errorDetail = await response.json();
                    throw new Error(errorDetail.detail || `Failed to fetch gig: ${response.status}`);
                }
                const data = await response.json();
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    location: data.location || '',
                    game: data.game || '',
                    budget: data.budget || '',
                    skills_required: (data.skills_required || []).join(', '),
                    tags: (data.tags || []).join(', '),
                    deadline: data.deadline ? data.deadline.substring(0, 10) : '' // Format date for input type="date"
                });
            } catch (err) {
                console.error("Error fetching gig details for edit:", err);
                setError(err.message || "Failed to load gig details for editing.");
            } finally {
                setIsLoading(false); // CORRECTED: Use setIsLoading
            }
        };

        if (gigId) { // Only fetch if gigId is available
            fetchGigDetails();
        }
    }, [gigId, navigate]); // Dependencies: gigId and navigate

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            if (!isAuthenticated()) {
                throw new Error('You must be logged in to edit a gig');
            }

            const userType = getUserType();
            if (userType !== 'org') {
                throw new Error('Only organizations can edit gigs');
            }

            // Validate and sanitize all inputs
            const sanitizedData = {
                title: sanitizeInput(formData.title),
                description: sanitizeInput(formData.description),
                location: sanitizeInput(formData.location),
                game: sanitizeInput(formData.game),
                budget: formData.budget ? parseFloat(formData.budget) : null,
                skills_required: formData.skills_required ? formData.skills_required.split(',').map(skill => sanitizeInput(skill.trim())) : [],
                tags: formData.tags ? formData.tags.split(',').map(tag => sanitizeInput(tag.trim())) : [],
                deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
            };

            // Validation checks
            if (!sanitizedData.title || sanitizedData.title.length < 5) {
                throw new Error('Title must be at least 5 characters long');
            }
            if (!sanitizedData.description || sanitizedData.description.length < 20) {
                throw new Error('Description must be at least 20 characters long');
            }
            if (sanitizedData.budget !== null && (isNaN(sanitizedData.budget) || sanitizedData.budget <= 0)) {
                throw new Error('Please enter a valid budget amount');
            }

            setIsLoading(true);

            const token = secureStorage.getItem('access_token');
            if (!token || !isValidToken(token)) {
                navigate('/login');
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs/${gigId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(errorDetail.detail || `Failed to update gig: ${response.status}`);
            }

            setSuccessMessage("Gig updated successfully!");

            // Navigate back to org dashboard with success message
            setTimeout(() => {
                navigate('/org-dashboard', {
                    state: { gigUpdated: true, message: 'Gig updated successfully' }
                });
            }, 1500);
        } catch (err) {
            setError(generateSafeError(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/org-dashboard');
    };

    if (isLoading) { // Use isLoading for loading state display
        return (
            <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
                Loading gig for editing...
            </div>
        );
    }

    if (error && !isLoading) { // Only show error if not currently loading/submitting
        return (
            <div className="min-h-screen bg-dark-900 text-dark-50">
                <div className="container mx-auto px-4 py-8 text-center">
                    <h2 className="text-2xl font-bold mb-4">Error Loading Gig</h2>
                    <p className="text-red-500 mb-6">{error}</p>
                    <button 
                        onClick={handleBack}
                        className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-6 py-2 rounded-md transition-colors"
                    >
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

                <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700 max-w-xl mx-auto">
                    <h2 className="text-2xl font-bold text-dark-50 mb-6 text-center">Edit Gig</h2>
                    
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
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-dark-200 mb-1">Gig Title</label>
                            <input type="text" id="title" name="title" required
                                value={formData.title} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-dark-200 mb-1">Description</label>
                            <textarea id="description" name="description" rows="5" required
                                value={formData.description} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-semibold text-dark-200 mb-1">Location</label>
                            <input type="text" id="location" name="location" required
                                value={formData.location} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="game" className="block text-sm font-semibold text-dark-200 mb-1">Game (Optional)</label>
                            <input type="text" id="game" name="game"
                                value={formData.game} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="budget" className="block text-sm font-semibold text-dark-200 mb-1">Budget (Optional)</label>
                            <input type="number" id="budget" name="budget" step="0.01"
                                value={formData.budget} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="skills_required" className="block text-sm font-semibold text-dark-200 mb-1">Skills Required (Comma-separated, Optional)</label>
                            <input type="text" id="skills_required" name="skills_required"
                                value={formData.skills_required} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., Immortal+, IGL, Communication"
                            />
                        </div>
                        <div>
                            <label htmlFor="tags" className="block text-sm font-semibold text-dark-200 mb-1">Tags (Comma-separated, Optional)</label>
                            <input type="text" id="tags" name="tags"
                                value={formData.tags} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., FPS, MOBA, Teamwork"
                            />
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-semibold text-dark-200 mb-1">Deadline (Optional)</label>
                            <input type="date" id="deadline" name="deadline"
                                value={formData.deadline} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading} // Disable button during loading
                          className={`w-full py-2 px-4 rounded text-dark-950 font-medium ${
                            isLoading ? 'bg-primary-500/60 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
                          } transition-colors shadow-sm`}
                        >
                          {isLoading ? 'Updating Gig...' : 'Update Gig'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditGig;