import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom'; // ADDED useParams
import Footer from '../components/Footer';
import { FaSpotify, FaDiscord, FaTwitter, FaTwitch, FaYoutube } from 'react-icons/fa';
import { isAuthenticated } from '../utils/auth'; // Import auth helper

function PlayerProfile() {
  const { username } = useParams(); // Get username from URL params
  const [playerData, setPlayerData] = useState(null); // Initialize as null for fetched data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const highlightRef = useRef(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('access_token'); // Get token if authenticated
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // Fetch user by username (assuming you'll add an endpoint for this)
        // For now, let's try fetching by ID if we have it, or a generic user.
        // A more robust solution would be a /users/by_username/{username} endpoint.
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${username}`, { // Assuming username is actually the user_id for now
          headers: headers
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          throw new Error(errorDetail.detail || `Failed to fetch profile: ${response.status}`);
        }
        const data = await response.json();
        
        // Map fetched data to your playerData structure
        setPlayerData({
          username: data.username,
          role: data.user_type === 'player' ? 'Player' : 'User', // Adjust role based on user_type
          rating: 82, // Hardcoded for now, fetch from endorsements later
          badges: ['GRANDMASTER', 'META BREAKER', 'TOURNAMENT WINNER'], // Hardcoded
          gameStats: [ // This would need a separate API call for game stats
            { game: 'CSGO', winRate: 80, kda: 3.5, avgScore: 2150 },
            { game: 'Dota2', winRate: 65, kda: 2.1, avgScore: 1700 },
          ],
          highlights: [], // Fetch highlights later
          teams: [], // Fetch teams later
          socialLinks: data.socials || {}, // Use fetched socials
          online: true // Hardcoded
        });

      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    if (username) { // Only fetch if username is available
      fetchProfileData();
    }
  }, [username]); // Re-fetch if username changes

  useEffect(() => {
    const observer = new window.IntersectionObserver(
      ([entry]) => setHighlightInView(entry.isIntersecting),
      { threshold: 0.5 }
    );
    if (highlightRef.current) observer.observe(highlightRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">{error ? "Error Loading Profile" : "Profile Not Found"}</h2>
          <p className="text-red-500 mb-6">{error || "The player profile you're looking for doesn't exist."}</p>
          <Link to="/" className="bg-primary-500 hover:bg-primary-600 text-dark-50 py-2 px-4 rounded-md transition-colors">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-dark-900 text-dark-100"> {/* Changed bg-white to bg-dark-900 */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-primary-500/15 via-primary-500/10 to-primary-500/5 opacity-60 blur-3xl z-0"></div> {/* Adjusted colors */}
      <div className="relative z-10">
        {/* REMOVED: <Navbar /> - Navbar is rendered globally in App.jsx now */}
        
        <div className="container mx-auto px-4 py-8">
          {/* Player Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img 
                src="/public/cat-pfp-mockup.jpg" // Placeholder image
                alt={playerData.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary-500"
              />
              {playerData.online && (
                <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-dark-50 font-valorant">{playerData.username}</h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="bg-primary-500 text-dark-950 px-2 py-0.5 rounded-full text-xs font-medium font-valorant">{playerData.role}</span>
                <div className="flex items-center gap-0.5 text-primary-500">
                  <span className="text-lg">★</span>
                  <span className="font-bold text-base font-valorant">{playerData.rating}</span>
                </div>
              </div>
              
              {/* Social Links - smaller */}
              <div className="flex flex-wrap gap-2 mt-2">
                {playerData.socialLinks.spotify && <a href={playerData.socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-800 hover:bg-green-500/20 text-green-400 text-xs font-semibold font-valorant transition-all shadow"><FaSpotify size={14} /> Spotify</a>}
                {playerData.socialLinks.discord && <a href={playerData.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-800 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold font-valorant transition-all shadow"><FaDiscord size={14} /> Discord</a>}
                {playerData.socialLinks.twitter && <a href={playerData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-800 hover:bg-blue-400/20 text-blue-400 text-xs font-semibold font-valorant transition-all shadow"><FaTwitter size={14} /> Twitter</a>}
                {playerData.socialLinks.twitch && <a href={playerData.socialLinks.twitch} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-800 hover:bg-purple-500/20 text-purple-400 text-xs font-semibold font-valorant transition-all shadow"><FaTwitch size={14} /> Twitch</a>}
                {playerData.socialLinks.youtube && <a href={playerData.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2 py-1 rounded-full bg-dark-800 hover:bg-red-500/20 text-red-400 text-xs font-semibold font-valorant transition-all shadow"><FaYoutube size={14} /> YouTube</a>}
              </div>
            </div>
          </div>

          {/* Add space between header and achievements */}
          <div className="h-10 md:h-16"></div>

          {/* Achievements + Stats (left), Twitch (right) */}
          <div className="container mx-auto px-4 flex flex-col md:flex-row gap-6 mb-6 max-w-6xl">
            {/* Achievements (badges) - left-aligned */}
            <div className="flex-1 flex flex-col items-start justify-center gap-6 min-w-[260px]">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold font-valorant mb-2 w-full text-left">Achievements</h2>
                <div className="flex flex-wrap gap-2 w-full">
                  {playerData.badges.map((badge, index) => (
                    <div key={index} className="flex items-center gap-1 bg-dark-900 px-2 py-1 rounded-md border border-dark-800 text-xs font-valorant">
                      {badge === 'GRANDMASTER' && <span className="text-primary-500">👑</span>}
                      {badge === 'META BREAKER' && <span className="text-primary-500">🔥</span>}
                      {badge === 'TOURNAMENT WINNER' && <span className="text-primary-500">🏆</span>}
                      <span className="font-medium">{badge}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Modern stats component: only CSGO and Dota2, structured as a vertical card */}
              <div className="w-full mt-4 flex flex-col gap-2">
                {playerData.gameStats.map((game, index) => ( // Removed filter as it might be empty
                  <div key={index} className="flex flex-row items-center gap-8 text-dark-900 font-valorant text-lg md:text-xl bg-primary-500/10 rounded-xl px-6 py-3 shadow border border-primary-500/20"> {/* Adjusted colors */}
                    <span className="font-bold text-primary-500 w-24">{game.game}</span>
                    <span className="text-base md:text-lg">Win Rate: <span className="font-bold">{game.winRate}%</span></span>
                    <span className="text-base md:text-lg">KDA: <span className="font-bold">{game.kda}</span></span>
                    <span className="text-base md:text-lg">Avg Score: <span className="font-bold">{game.avgScore}</span></span>
                  </div>
                ))}
              </div>
            </div>
            {/* Twitch Component - no background, larger */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[220px] max-w-lg w-full">
              <h3 className="font-bold text-primary-500 text-lg mb-2 font-valorant">Live on Twitch</h3>
              <div className="aspect-[16/10] w-full max-w-md min-h-[220px]">
                <iframe
                  src={`https://player.twitch.tv/?channel=${playerData.username}&parent=localhost`} // Use dynamic username
                  allowFullScreen
                  frameBorder="0"
                  className="w-full h-full rounded-lg"
                  title="Twitch Live Stream"
                ></iframe>
              </div>
              <p className="text-dark-200 mt-2 text-center text-xs">Catch the stream when live!</p>
            </div>
          </div>

          {/* Highlights section: full width, text above video, all visible */}
          <div className="w-full flex justify-center mt-16 mb-0">
            <div className="w-full max-w-7xl flex flex-col items-center bg-dark-800 rounded-3xl shadow-lg border-2 border-dark-700 p-8"> {/* Adjusted colors */}
              <h1 className="text-4xl md:text-5xl font-valorant font-bold text-primary-500 mb-2 text-center">HIGHLIGHT</h1>
              <h2 className="text-2xl md:text-3xl font-valorant font-bold text-dark-50 mb-2 text-center">{playerData.highlights[0]?.title || 'No Highlights Yet'}</h2> {/* Use optional chaining */}
              <p className="text-lg md:text-xl text-dark-200 font-valorant text-center">{playerData.highlights[0]?.date || ''}</p> {/* Use optional chaining */}
              <p className="text-base text-dark-200 mt-2 mb-6 text-center max-w-2xl">Watch the best moments and top plays from your recent games. Relive your highlights and share them with your friends!</p>
              <div className="aspect-video w-full max-w-5xl min-h-[340px] border-4 border-primary-500 bg-dark-950 rounded-2xl overflow-hidden">
                {playerData.highlights[0]?.clip_url ? ( // Conditionally render iframe
                  <iframe
                    src={playerData.highlights[0].clip_url}
                    title={playerData.highlights[0].title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-xl"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-300">
                    No highlights available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default PlayerProfile;