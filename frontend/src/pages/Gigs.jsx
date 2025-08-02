import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiExternalLink, FiCalendar, FiDollarSign, FiTag, FiUser } from 'react-icons/fi';

function Gigs() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  const [fetchedGigs, setFetchedGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [errorGigs, setErrorGigs] = useState(null);

  // --- Fetch all gigs from API and their creator details ---
  useEffect(() => {
    const fetchAllGigs = async () => {
      setLoadingGigs(true);
      setErrorGigs(null);
      try {
        const gigsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/gigs`);
        
        if (!gigsResponse.ok) {
          const errorDetail = await gigsResponse.json();
          throw new Error(`Error fetching gigs: ${gigsResponse.status} ${errorDetail.detail || gigsResponse.statusText}`);
        }
        const gigsData = await gigsResponse.json();
        const gigs = Array.isArray(gigsData) ? gigsData : (gigsData.results && Array.isArray(gigsData.results) ? gigsData.results : []);
        
        // Fetch creator details for each gig
        const gigsWithCreators = await Promise.all(gigs.map(async (gig) => {
          if (gig.creator_id) {
            try {
              const creatorResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/orgs/${gig.creator_id}`);
              if (creatorResponse.ok) {
                const creatorData = await creatorResponse.json();
                return {
                  ...gig,
                  creator_name: creatorData.username, // Add creator's username
                  creator_avatar_initials: creatorData.username ? creatorData.username.substring(0, 2).toUpperCase() : '??'
                };
              } else {
                console.warn(`Could not fetch creator details for ID ${gig.creator_id}: ${creatorResponse.status}`);
              }
            } catch (creatorError) {
              console.error(`Error fetching creator ${gig.creator_id}:`, creatorError);
            }
          }
          return { ...gig, creator_name: 'Unknown Org', creator_avatar_initials: '??' }; // Default if creator not found or error
        }));

        console.log("Fetched All Gigs with Creators:", gigsWithCreators);
        setFetchedGigs(gigsWithCreators);

      } catch (err) {
        console.error("Error fetching all gigs:", err);
        setErrorGigs(err.message || "Failed to load gigs.");
      } finally {
        setLoadingGigs(false);
      }
    };

    fetchAllGigs();
  }, []);
  
  // Filter gigs based on search query and selected category (now uses fetchedGigs)
  const filteredGigs = Array.isArray(fetchedGigs) ? fetchedGigs.filter(gig => {
    const matchesSearch = gig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (gig.creator_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || // Search by creator_name
                         (gig.tags && gig.tags.length > 0 && gig.tags[0].toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All Categories' || 
                            (gig.tags && gig.tags.includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  }) : [];
  
  // Handle gig click to navigate to details page
  const handleGigClick = (gigId) => {
    navigate(`/gigs/${gigId}`);
  };

  if (loadingGigs) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-100 flex items-center justify-center">
        Loading gigs...
      </div>
    );
  }

  if (errorGigs) {
    return (
      <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
        Error: {errorGigs}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Esports Gigs</h1>
            <p className="text-dark-200">Find opportunities in the gaming and esports industry</p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <button className="bg-dark-700 hover:bg-dark-600 text-dark-100 py-2 px-4 rounded-md inline-flex items-center transition-colors">
              <FiFilter className="mr-2" />
              Filter
            </button>
            
            <button className="bg-primary-500 hover:bg-primary-600 text-dark-50 py-2 px-4 rounded-md transition-colors">
              Create Gig
            </button>
          </div>
        </div>
        
        {/* Search and Category Filters */}
        <div className="bg-dark-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Search for gigs..." 
                className="w-full bg-dark-700 text-dark-100 px-4 py-3 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-300" />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {/* Categories based on common gig categories or fetched tags */}
              {['All Categories', 'Tournament', 'Coaching', 'Content', 'Recruitment', 'Commentary', 'Design', 'Analysis'].map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`${selectedCategory === cat ? 'bg-primary-500 text-dark-50' : 'bg-dark-700 hover:bg-dark-600 text-dark-100'} px-4 py-2 rounded-md whitespace-nowrap transition-colors`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Gigs List */}
        <div className="space-y-4">
          {filteredGigs.length > 0 ? (
            filteredGigs.map((gig) => (
              <div 
                key={gig.id} 
                className="bg-dark-800 rounded-lg border border-dark-700 hover:border-primary-500/30 transition-all duration-300 group cursor-pointer"
                onClick={() => handleGigClick(gig.id)}
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    {/* Organization Avatar - Use fetched initials */}
                    <div className="w-12 h-12 rounded-md bg-primary-500 flex items-center justify-center text-dark-50 font-bold">
                      {gig.creator_avatar_initials}
                    </div>
                    
                    {/* Gig Info */}
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <h3 className="text-lg font-semibold text-dark-50 group-hover:text-primary-500 transition-colors">
                          {gig.title}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded">
                            {gig.tags && gig.tags.length > 0 ? gig.tags[0] : 'General'}
                          </span>
                          
                          <span className="bg-dark-700 text-dark-50 font-bold px-3 py-1 rounded-md">
                            ${gig.budget ? gig.budget.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-dark-200 mt-2 line-clamp-2">
                        {gig.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 mt-3">
                        <div className="flex items-center text-dark-300">
                          <FiUser className="mr-1" size={14} />
                          <span>{gig.creator_name}</span> {/* Display creator_name */}
                        </div>
                        
                        <div className="flex items-center text-dark-300">
                          <FiCalendar className="mr-1" size={14} />
                          <span>Ends in {gig.deadline ? Math.ceil((new Date(gig.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 'N/A'} days</span>
                        </div>
                        
                        <div className="flex items-center text-dark-300">
                          <FiTag className="mr-1" size={14} />
                          <span>{gig.location}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="md:self-center mt-3 md:mt-0 w-full md:w-auto">
                      <button 
                        className="bg-primary-500 hover:bg-primary-600 text-dark-50 px-4 py-2 rounded-md transition-colors w-full md:w-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGigClick(gig.id);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-dark-800 rounded-lg p-8 text-center border border-dark-700">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-dark-50 mb-2">No gigs found</h3>
                <p className="text-dark-200 mb-4">Try adjusting your search or filters to find what you're looking for.</p>
                <button className="bg-primary-500 hover:bg-primary-600 text-dark-50 py-2 px-4 rounded-md transition-colors">
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Gigs;