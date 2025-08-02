import { useState, useEffect } from 'react';
import { FiMessageCircle, FiUser, FiClock, FiPaperclip } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserType } from '../utils/auth';
import { isValidToken, secureStorage, sanitizeInput, generateSafeError } from '../utils/security';

function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]); // State for fetched conversations
  const [activeChat, setActiveChat] = useState(null); // ID of the currently selected conversation
  const [messages, setMessages] = useState([]); // State for messages of the active chat
  const [messageInput, setMessageInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // --- Fetch conversations for the logged-in user ---
  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConversations(true);
      setError(null);
      const token = secureStorage.getItem('access_token');
      const userType = getUserType();

      if (!isAuthenticated() || !token) {
        setError("You must be logged in to view messages.");
        setLoadingConversations(false);
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/conversations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          throw new Error(errorDetail.detail || `Failed to fetch conversations: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched Conversations:", data);
        setConversations(data);
        
        // Automatically select the first conversation if available
        if (data.length > 0) {
          setActiveChat(data[0].id);
        }

      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError(err.message || "Failed to load conversations.");
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [navigate]); // Depend on navigate to avoid stale closure warning

  // --- Fetch messages for the active chat ---
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) {
        setMessages([]); // Clear messages if no chat is active
        return;
      }

      setLoadingMessages(true);
      setError(null);
      const token = secureStorage.getItem('access_token');
      
      if (!isValidToken(token)) {
        throw new Error('Invalid token');
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/conversations/${activeChat}/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          const errorDetail = await response.json();
          throw new Error(errorDetail.detail || `Failed to fetch messages: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched Messages for chat", activeChat, ":", data);
        setMessages(data);

        // Mark conversation as read after fetching messages
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/conversations/${activeChat}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        // Update the unread status in the conversations state locally
        setConversations(prevConvos => 
          prevConvos.map(convo => 
            convo.id === activeChat ? { ...convo, unread: false } : convo
          )
        );

      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(err.message || "Failed to load messages.");
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChat]); // Re-fetch messages when activeChat changes

  // Function to handle sending a message
    const handleSendMessage = async () => {
    try {
      if (!isAuthenticated()) {
        throw new Error('You must be logged in to send messages');
      }

      const sanitizedMessage = sanitizeInput(messageInput.trim());
      if (!sanitizedMessage) {
        return; // Don't send empty messages
      }

      if (!activeChat) {
        throw new Error('No active chat selected');
      }

      const token = secureStorage.getItem('access_token');
      if (!token || !isValidToken(token)) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/conversations/${activeChat}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: sanitizedMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');
    } catch (err) {
      setError(generateSafeError(err));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleAttachmentClick = () => {
    alert("Attachment functionality is not yet implemented.");
  };

  // Find the active conversation to display its details
  const currentActiveConversation = conversations.find(convo => convo.id === activeChat);

  // Helper to get participant's display name and avatar (excluding current user)
  const getChatPartnerInfo = (convo) => {
    const currentUserId = isAuthenticated() ? sessionStorage.getItem('user_id') : null;
    const partnerId = convo.participants.find(pId => pId !== currentUserId);
    
    // In a real app, you'd fetch partner details from /users/{partnerId}
    // For now, use a placeholder based on ID or fetched user data
    if (partnerId) {
      // You'd need a way to map partnerId to username and avatar
      // For seed data, org1@example.com is 'GamingOrgX', john.doe@example.com is 'john_doe'
      if (partnerId === "68851116b8bf8f0ec373f40a") return { name: "GamingOrgX", avatar: "GX" };
      if (partnerId === "68851116b8bf8f0ec373f40b") return { name: "EsportsTeamY", avatar: "EY" };
      if (partnerId === "68851116b8bf8f0ec373f40c") return { name: "ContentCreatorsZ", avatar: "CZ" };
      if (partnerId === "68851116b8bf8f0ec373f40d") return { name: "john_doe", avatar: "JD" };
      if (partnerId === "68851116b8bf8f0ec373f40e") return { name: "jane_smith", avatar: "JS" };
      return { name: `User ${partnerId.substring(0,4)}`, avatar: partnerId.substring(0,2).toUpperCase() };
    }
    return { name: "Unknown User", avatar: "??" };
  };


  if (loadingConversations) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-50 flex items-center justify-center">
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-red-500 flex items-center justify-center">
        Error: {error}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 text-dark-100 flex items-center justify-center p-4">
        <div className="bg-dark-800 rounded-lg p-8 text-center border border-dark-700">
          <h3 className="text-xl font-bold text-dark-50 mb-2">No Conversations Yet</h3>
          <p className="text-dark-200">Start a conversation by applying to a gig or messaging a user.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100">
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
            <div className="p-4 border-b border-dark-700">
              <h2 className="text-xl font-bold text-dark-50">Messages</h2>
              <p className="text-dark-200 text-sm">Connect with teams and organizations</p>
            </div>
            
            <div className="divide-y divide-dark-700">
              {conversations.map((convo) => {
                const partnerInfo = getChatPartnerInfo(convo);
                return (
                  <div 
                    key={convo.id} 
                    className={`p-4 hover:bg-dark-700 cursor-pointer transition-colors ${activeChat === convo.id ? 'bg-dark-700' : ''}`}
                    onClick={() => setActiveChat(convo.id)} // Setting active chat will trigger message fetch
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 font-bold mr-3">
                        {partnerInfo.avatar}
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-dark-50">{partnerInfo.name}</h3>
                          <span className="text-xs text-dark-300">{convo.time}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-dark-200 truncate">{convo.lastMessage}</p>
                          {convo.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Chat Window */}
          <div className="flex-grow bg-dark-800 rounded-lg border border-dark-700 overflow-hidden flex flex-col">
            {currentActiveConversation ? (
              <>
                <div className="p-4 border-b border-dark-700 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-dark-50 font-bold mr-3">
                    {getChatPartnerInfo(currentActiveConversation).avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-dark-50">{getChatPartnerInfo(currentActiveConversation).name}</h3>
                    <p className="text-xs text-dark-300">Online</p>
                  </div>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto">
                  {loadingMessages ? (
                    <div className="text-center text-dark-300">Loading messages...</div>
                  ) : messages.length > 0 ? (
                    messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`mb-4 flex ${message.sender_id === sessionStorage.getItem('user_id') ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${message.sender_id === sessionStorage.getItem('user_id') 
                            ? 'bg-primary-500 text-dark-50' 
                            : 'bg-dark-700 text-dark-100'}`}
                        >
                          <p>{message.content}</p>
                          <p className="text-xs mt-1 opacity-70">{new Date(message.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-dark-300">No messages in this conversation.</div>
                  )}
                </div>
                
                <div className="p-4 border-t border-dark-700">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleAttachmentClick}
                      className="p-2 text-dark-300 hover:text-dark-100"
                    >
                      <FiPaperclip />
                    </button>
                    
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="flex-grow bg-dark-700 text-dark-100 px-4 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    
                    <button 
                      onClick={handleSendMessage}
                      className="bg-primary-500 hover:bg-primary-600 text-dark-50 p-2 rounded-md transition-colors"
                    >
                      <FiMessageCircle />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-dark-700 flex items-center justify-center text-dark-300 mb-4">
                  <FiMessageCircle size={24} />
                </div>
                <h3 className="text-xl font-bold text-dark-50 mb-2">Your Messages</h3>
                <p className="text-dark-200 max-w-md">Select a conversation to view messages or start a new conversation with a team or organization.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Messages;