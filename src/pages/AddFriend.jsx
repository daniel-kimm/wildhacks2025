import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const AddFriend = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ 
    id: null,
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get session data from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log("Current session:", session ? "Session exists" : "No session");
        
        if (session && session.user) {
          const { user: authUser } = session;
          console.log("Authenticated user ID:", authUser.id);
          
          // Get the user's profile from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else if (profileData) {
            console.log("Found profile data:", profileData);
            setUser({
              id: authUser.id,
              name: profileData.name || authUser.user_metadata?.full_name || 'User',
              avatar: profileData.avatar_url || authUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
            });
          } else {
            console.log("No profile found for current user");
          }
        }

        // Fetch all users from the database
        await fetchAllUsers();
      } catch (err) {
        console.error("Error in loadUserData:", err);
        setDebugInfo("Error loading user data: " + err.message);
      }
    };

    loadUserData();
  }, []);

  // Fetch all users from Supabase
  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get current user ID
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      
      if (!currentUserId) {
        console.log("No authenticated user found");
        setDebugInfo("Not authenticated. Please sign in.");
        setIsLoading(false);
        return;
      }

      console.log("Fetching profiles for all users except:", currentUserId);
      
      // Get all users except the current user
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, interests, avatar_url, preferences, email')
        .neq('id', currentUserId);
      
      if (error) {
        console.error("Error fetching profiles:", error);
        setDebugInfo("Error fetching profiles: " + error.message);
        throw error;
      }
      
      console.log("Fetched profiles:", data ? data.length : 0);
      
      if (!data || data.length === 0) {
        // No other users found - add debug info
        setDebugInfo("No other users found in the database.");
        setAllUsers([]);
        setIsLoading(false);
        return;
      }
      
      // Get existing friends
      const { data: existingFriends, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', currentUserId);
      
      if (friendsError) {
        console.error("Error fetching friends:", friendsError);
      }
      
      // Get sent friend requests
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select('recipient_id, status')
        .eq('sender_id', currentUserId);
      
      if (sentError) {
        console.error("Error fetching sent requests:", sentError);
      }
      
      // Get received friend requests
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select('sender_id, status')
        .eq('recipient_id', currentUserId);
      
      if (receivedError) {
        console.error("Error fetching received requests:", receivedError);
      }
      
      // Create lookup maps for quick checking
      const friendIds = new Set(existingFriends?.map(f => f.friend_id) || []);
      const sentRequestMap = (sentRequests || []).reduce((map, req) => {
        map[req.recipient_id] = req.status;
        return map;
      }, {});
      const receivedRequestMap = (receivedRequests || []).reduce((map, req) => {
        map[req.sender_id] = req.status;
        return map;
      }, {});
      
      // Format the user data and mark existing friends & requests
      const formattedUsers = data.map(user => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unnamed User',
        interests: user.interests ? 
          (typeof user.interests === 'string' ? 
            user.interests.split(',').map(i => i.trim()) : 
            Array.isArray(user.interests) ? user.interests : []
          ) : [],
        preferences: user.preferences || '',
        avatar: user.avatar_url || (user.name ? user.name.charAt(0) : 'U'),
        email: user.email,
        isFriend: friendIds.has(user.id),
        requestStatus: sentRequestMap[user.id] || null,
        receivedRequestStatus: receivedRequestMap[user.id] || null
      }));
      
      console.log("Formatted users:", formattedUsers.length);
      setAllUsers(formattedUsers);
      
      if (searchTerm.trim() !== '') {
        handleSearchChange({ target: { value: searchTerm } });
      }
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setDebugInfo("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    // Filter users based on search term
    const filtered = allUsers.filter(user =>
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      (user.interests && user.interests.some(interest => 
        interest.toLowerCase().includes(term.toLowerCase())
      )) ||
      (user.email && user.email.toLowerCase().includes(term.toLowerCase()))
    );
    
    setSearchResults(filtered);
  };

  // Function to send a friend request
  const handleAddFriend = async (recipientId) => {
    try {
      setLoadingStates(prev => ({ ...prev, [recipientId]: true }));
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to send a friend request');
      }
      
      console.log(`Sending friend request from ${user.id} to ${recipientId}`);
      
      // Insert the friend request into the friend_requests table
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error sending friend request:', error);
        
        // Check if it's a duplicate request
        if (error.code === '23505') {
          alert('Friend request already sent to this user');
        } else {
          throw error;
        }
      } else {
        console.log('Friend request sent successfully');
        
        // Update the local state to show request as pending
        setAllUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === recipientId 
              ? { ...u, requestStatus: 'pending' } 
              : u
          )
        );
        
        alert('Friend request sent successfully!');
      }

      // Verify the request was saved
      const { data: checkRequest } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('recipient_id', recipientId);

      console.log("Verification of request saved:", checkRequest);
    } catch (error) {
      console.error('Error in handleAddFriend:', error);
      alert(`Failed to send friend request: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [recipientId]: false }));
    }
  };

  // Function to accept a friend request
  const handleAcceptRequest = async (senderId) => {
    try {
      setLoadingStates(prev => ({ ...prev, [senderId]: true }));
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to accept a friend request');
      }
      
      console.log(`Accepting friend request from ${senderId} to ${user.id}`);
      
      // Call the database function to accept the request and create friendship
      const { data, error } = await supabase
        .rpc('accept_friend_request', {
          sender_id: senderId,
          recipient_id: user.id
        });
      
      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }
      
      console.log('Accept friend request response:', data);
      
      if (data === false) {
        throw new Error('Could not find or accept the friend request');
      }
      
      // Update the local state
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === senderId 
            ? { ...u, isFriend: true, receivedRequestStatus: 'accepted' } 
            : u
        )
      );
      
      // Show success message
      alert('Friend request accepted!');
      
      // Refresh the list to ensure UI is up to date
      await fetchAllUsers();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(`Failed to accept friend request: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [senderId]: false }));
    }
  };

  // Update the handleRejectRequest function to reset the request status
  const handleRejectRequest = async (senderId) => {
    try {
      setLoadingStates(prev => ({ ...prev, [senderId]: true }));
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to reject a friend request');
      }
      
      console.log(`Rejecting friend request from ${senderId} to ${user.id}`);
      
      // Find the request ID
      const { data: requestData, error: requestError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', senderId)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .single();
      
      if (requestError || !requestData) {
        throw new Error('Friend request not found');
      }
      
      // Update request status to 'rejected'
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date() })
        .eq('id', requestData.id);
      
      if (updateError) throw updateError;
      
      // Update the local state - set receivedRequestStatus to null instead of 'rejected'
      setAllUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === senderId 
            ? { ...u, receivedRequestStatus: null } 
            : u
        )
      );
      
      alert('Friend request rejected');
      await fetchAllUsers(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert(`Failed to reject friend request: ${error.message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [senderId]: false }));
    }
  };

  // Display all users if no search is active
  const displayResults = searchTerm.trim() === '' ? allUsers : searchResults;

  // Function to render the correct button based on status
  const renderActionButton = (user) => {
    if (user.isFriend) {
      return <FriendAddedButton disabled>Already Friends</FriendAddedButton>;
    }
    
    // Check for received requests
    if (user.receivedRequestStatus === 'pending') {
      const isLoading = loadingStates[user.id];
      return (
        <ActionButtonGroup>
          <AcceptButton 
            onClick={() => handleAcceptRequest(user.id)} 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Accept'}
          </AcceptButton>
          <RejectButton
            onClick={() => handleRejectRequest(user.id)}
            disabled={isLoading}
          >
            Reject
          </RejectButton>
        </ActionButtonGroup>
      );
    }
    
    // Check for sent requests
    switch (user.requestStatus) {
      case 'pending':
        return <PendingButton disabled>Request Sent</PendingButton>;
      case 'rejected':
        return <RejectedButton disabled>Request Rejected</RejectedButton>;
      default:
        return (
          <SendRequestButton
            onClick={() => handleAddFriend(user.id)}
            disabled={loadingStates[user.id]}
          >
            {loadingStates[user.id] ? 'Sending...' : 'Send Request'}
          </SendRequestButton>
        );
    }
  };

  console.log("AddFriend component state:", {
    user,
    allUsers: allUsers.length,
    searchResults: searchResults.length,
    displayResults: Array.isArray(displayResults) ? displayResults.length : 'N/A'
  });

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/friends')}>
          <ArrowIcon>←</ArrowIcon>
          Back to Friends
        </BackButton>
        <UserSection>
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src={user.avatar} alt="User avatar" />
          </UserAvatar>
        </UserSection>
      </Header>

      <ContentContainer>
        <PageTitle>Add New Friends</PageTitle>
        <PageDescription>
          Search for people and send them friend requests.
        </PageDescription>

        <SearchContainer>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name or interests..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>×</ClearButton>
          )}
        </SearchContainer>

        {debugInfo && (
          <DebugInfo>
            <p>{debugInfo}</p>
            <RefreshButton onClick={fetchAllUsers}>Refresh Users</RefreshButton>
          </DebugInfo>
        )}

        <ResultsContainer>
          {isLoading ? (
            <LoadingMessage>Loading users...</LoadingMessage>
          ) : displayResults.length === 0 ? (
            <NoResultsMessage>
              {searchTerm ? 
                `No users found matching "${searchTerm}"` : 
                "No other users found. Invite your friends to join HangoutAI!"
              }
            </NoResultsMessage>
          ) : (
            displayResults.map(result => (
              <UserCard key={result.id}>
                <UserCardAvatar>
                  {typeof result.avatar === 'string' && result.avatar.startsWith('http') ? 
                    <img src={result.avatar} alt={result.name} /> :
                    <AvatarPlaceholder>{result.avatar.charAt(0).toUpperCase()}</AvatarPlaceholder>
                  }
                </UserCardAvatar>
                <UserCardInfo>
                  <UserCardName>{result.name}</UserCardName>
                  {result.interests && result.interests.length > 0 && (
                    <UserCardInterests>
                      Interests: {result.interests.join(', ')}
                    </UserCardInterests>
                  )}
                  {result.email && <UserCardEmail>{result.email}</UserCardEmail>}
                </UserCardInfo>
                {renderActionButton(result)}
              </UserCard>
            ))
          )}
        </ResultsContainer>
      </ContentContainer>
    </PageContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #6e8efb;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ArrowIcon = styled.span`
  margin-right: 8px;
  font-size: 1.2rem;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserName = styled.div`
  font-weight: 500;
  color: #333;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContentContainer = styled.main`
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
`;

const PageDescription = styled.p`
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 30px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 30px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6e8efb;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #666;
  }
`;

const ResultsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 300px;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9f9f9;
  }
`;

const UserCardAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserCardInfo = styled.div`
  flex: 1;
`;

const UserCardName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const UserCardInterests = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const SendRequestButton = styled.button`
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }

  &:disabled {
    background: #ccc;
    transform: none;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const PendingButton = styled.button`
  background: #ffa726;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  
  &:hover {
    background: ${props => props.disabled ? '#ffa726' : '#fb8c00'};
  }
`;

const RejectedButton = styled.button`
  background: #e57373;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: not-allowed;
`;

const FriendAddedButton = styled.button`
  background: #66bb6a;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: not-allowed;
`;

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

const NoResultsMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

const SearchPrompt = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

const DebugInfo = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const RefreshButton = styled.button`
  background: #6e8efb;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: #5d7dea;
  }
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
`;

const UserCardEmail = styled.div`
  font-size: 0.875rem;
  color: #888;
  margin-top: 2px;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const AcceptButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #43a047;
  }
  
  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #e53935;
  }
  
  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`;

export default AddFriend; 