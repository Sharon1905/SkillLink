import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function CreateGig() {
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
    const [walletBalance, setWalletBalance] = useState(null);

    // Validation check on mount and fetch wallet balance
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

        // Fetch wallet balance
        const fetchWalletBalance = async () => {
            try {
                const token = secureStorage.getItem('access_token');
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/wallet`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const walletData = await response.json();
                    setWalletBalance(walletData.balance);
                }
            } catch (error) {
                console.error('Failed to fetch wallet balance:', error);
            }
        };

        fetchWalletBalance();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBack = () => {
        navigate('/org-dashboard');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        try {
            if (!isAuthenticated()) {
                throw new Error('You must be logged in to create a gig');
            }

            const userType = getUserType();
            if (userType !== 'org') {
                throw new Error('Only organizations can create gigs');
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

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(sanitizedData)
            });

            if (!response.ok) {
                const errorDetail = await response.json();
                throw new Error(errorDetail.detail || `Failed to create gig: ${response.status}`);
            }

            setSuccessMessage("Gig created successfully!");
            setTimeout(() => {
                navigate('/org-dashboard', {
                    state: { gigPosted: true, message: 'Gig created successfully' }
                });
            }, 1500);
        } catch (err) {
            setError(generateSafeError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
            <div className="container mx-auto py-8">
                <button 
                    onClick={handleBack}
                    className="flex items-center text-primary-500 hover:text-primary-600 mb-6"
                >
                    <FiArrowLeft className="mr-2" />
                    Back to Dashboard
                </button>

                <div className="bg-dark-800 rounded-lg p-6 mb-6 border border-dark-700 max-w-xl mx-auto">
                    <h2 className="text-2xl font-bold text-dark-50 mb-6 text-center">Post New Gig</h2>
                    
                    {walletBalance !== null && (
                        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-sm">
                            <strong>Wallet Balance:</strong> ${walletBalance.toFixed(2)}
                            {formData.budget && parseFloat(formData.budget) > walletBalance && (
                                <div className="mt-2 text-red-400">
                                    <strong>Insufficient funds!</strong> You need ${(parseFloat(formData.budget) - walletBalance).toFixed(2)} more.
                                    <Link to="/wallet" className="ml-2 text-blue-400 hover:underline">Add Money</Link>
                                </div>
                            )}
                        </div>
                    )}
                    
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
                        <div> {/* Added game field */}
                            <label htmlFor="game" className="block text-sm font-semibold text-dark-200 mb-1">Game (Optional)</label>
                            <input type="text" id="game" name="game"
                                value={formData.game} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div> {/* Added budget field */}
                            <label htmlFor="budget" className="block text-sm font-semibold text-dark-200 mb-1">Budget (Optional)</label>
                            <input type="number" id="budget" name="budget" step="0.01"
                                value={formData.budget} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        <div> {/* Added skills_required field */}
                            <label htmlFor="skills_required" className="block text-sm font-semibold text-dark-200 mb-1">Skills Required (Comma-separated, Optional)</label>
                            <input type="text" id="skills_required" name="skills_required"
                                value={formData.skills_required} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., Immortal+, IGL, Communication"
                            />
                        </div>
                        <div> {/* Added tags field */}
                            <label htmlFor="tags" className="block text-sm font-semibold text-dark-200 mb-1">Tags (Comma-separated, Optional)</label>
                            <input type="text" id="tags" name="tags"
                                value={formData.tags} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                                placeholder="e.g., FPS, MOBA, Teamwork"
                            />
                        </div>
                        <div> {/* Added deadline field */}
                            <label htmlFor="deadline" className="block text-sm font-semibold text-dark-200 mb-1">Deadline (Optional)</label>
                            <input type="date" id="deadline" name="deadline"
                                value={formData.deadline} onChange={handleChange}
                                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded text-dark-50 focus:outline-none focus:border-primary-500"
                            />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isLoading}
                          className={`w-full py-2 px-4 rounded text-dark-950 font-medium ${
                            isLoading ? 'bg-primary-500/60 cursor-not-allowed' : 'bg-primary-500 hover:bg-primary-600'
                          } transition-colors shadow-sm`}
                        >
                          {isLoading ? 'Posting...' : 'Post Gig'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateGig;