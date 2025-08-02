import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    const fetchTeams = async () => {
      try {
        const token = secureStorage.getItem('access_token');
        
        if (!isValidToken(token)) {
          throw new Error('Invalid token');
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teams`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }

        const data = await response.json();
        
        // Sanitize the team data
        const sanitizedTeams = data.map(team => ({
          ...team,
          name: sanitizeInput(team.name),
          description: sanitizeInput(team.description || ''),
          members: team.members?.map(member => ({
            ...member,
            username: sanitizeInput(member.username),
            role: sanitizeInput(member.role)
          })) || []
        }));

        setTeams(sanitizedTeams);
      } catch (err) {
        setError(generateSafeError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 p-4">
        <main className="container mx-auto py-8 px-4 text-center">
          <p>Loading teams...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 p-4">
        <main className="container mx-auto py-8 px-4 text-center">
          <p className="text-red-500">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50 p-4">
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4 text-center">Teams</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h2 className="text-xl font-bold mb-2">{team.name}</h2>
              <p className="text-dark-300 mb-4">{team.description}</p>
              <div className="space-y-2">
                {team.members.map(member => (
                  <div key={member.id} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
                      {member.username.substring(0, 2).toUpperCase()}
                    </div>
                    <span>{member.username}</span>
                    <span className="text-dark-300 text-sm">({member.role})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Teams;