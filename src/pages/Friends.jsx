import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';
import NotificationInbox from '../components/NotificationInbox';

const Friends = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ 
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Sample friends data with additional details
  const sampleFriends = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      interests: ['Coffee', 'Hiking', 'Movies', 'Photography'],
      preferences: 'Prefers quiet cafes and outdoor activities. Weekend availability only.',
      avatar: 'A',
      lastActive: '2 hours ago'
    },
    { 
      id: 2, 
      name: 'Sam Carter', 
      interests: ['Art', 'Museums', 'Theater', 'Fine dining'],
      preferences: 'Enjoys cultural activities and trying new restaurants. Available evenings.',
      avatar: 'S',
      lastActive: 'Just now'
    },
    { 
      id: 3, 
      name: 'Jamie Smith', 
      interests: ['Books', 'Coffee', 'Music', 'Meditation'],
      preferences: 'Likes quiet, relaxed environments. Prefers small gatherings over crowds.',
      avatar: 'J',
      lastActive: '1 day ago'
    },
    { 
      id: 4, 
      name: 'Taylor Williams', 
      interests: ['Hiking', 'Camping', 'Travel', 'Photography'],
      preferences: 'Always up for outdoor adventures. Prefers activities on weekends.',
      avatar: 'T',
      lastActive: '4 hours ago'
    },
    { 
      id: 5, 
      name: 'Jordan Lee', 
      interests: ['Gaming', 'Technology', 'Movies', 'Board games'],
      preferences: 'Enjoys indoor activities and game nights. Available most evenings.',
      avatar: 'J',
      lastActive: '3 days ago'
    },
  ];

  // Load user data and friends on component mount
  useEffect(() => {
    const loadUserData = async () => {
      // Get session data from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        const { user: authUser } = session;
        
        // Get the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setUser({
            id: authUser.id,
            name: profileData.name || authUser.user_metadata?.full_name || 'User',
            avatar: profileData.avatar_url || authUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
          });
        }
        
        // Load the user's friends
        await loadFriends(authUser.id);
      } else {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Load friends from Supabase
  const loadFriends = async (userId) => {
    try {
      setIsLoading(true);
      
      // Get friend relationships
      const { data: friendRelations, error: friendError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);
      
      if (friendError) throw friendError;
      
      if (friendRelations.length === 0) {
        setFriends([]);
        setIsLoading(false);
        return;
      }
      
      // Get friend IDs
      const friendIds = friendRelations.map(rel => rel.friend_id);
      
      // Get friend profiles
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);
      
      if (profilesError) throw profilesError;
      
      // Format friend data
      const formattedFriends = friendProfiles.map(profile => ({
        id: profile.id,
        name: profile.name || 'Unnamed User',
        interests: profile.interests ? profile.interests.split(',').map(i => i.trim()) : [],
        avatar: profile.avatar_url || profile.name?.charAt(0) || 'U',
        lastActive: 'Recently'
      }));
      
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error loading friends:', error.message);
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter friends based on search term
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.interests.some(interest => 
      interest.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Navigate to different pages
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Navigate to add friend page
  const handleAddFriend = () => {
    navigate('/add-friend');
  };

  return (
    <PageContainer>
      <Header>
        <Logo>HangoutAI</Logo>
        <Navigation>
          <NavItem onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem active onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <NotificationInbox />
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src={user.avatar} alt="User avatar" />
          </UserAvatar>
        </UserSection>
      </Header>

      <ContentContainer>
        <TopSection>
          <PageTitleSection>
            <PageTitle>Your Friends</PageTitle>
            <PageDescription>
              View all your friends, their interests, and hangout preferences.
            </PageDescription>
          </PageTitleSection>
          <AddButton onClick={handleAddFriend}>
            <PlusIcon>+</PlusIcon>
            Add Friend
          </AddButton>
        </TopSection>

        <SearchContainer>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name or interest..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>×</ClearButton>
          )}
        </SearchContainer>

        <FriendsContainer>
          {isLoading ? (
            <LoadingState>
              <LoadingText>Loading your friends...</LoadingText>
            </LoadingState>
          ) : filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <FriendCard key={friend.id}>
                <FriendHeader>
                  <FriendAvatarSection>
                    <FriendAvatar>
                      <img src={`https://via.placeholder.com/60?text=${friend.avatar}`} alt={friend.name} />
                    </FriendAvatar>
                    <FriendNameSection>
                      <FriendName>{friend.name}</FriendName>
                      <LastActive>Last active: {friend.lastActive}</LastActive>
                    </FriendNameSection>
                  </FriendAvatarSection>
                  <MessageButton>
                    <MessageIcon>✉</MessageIcon>
                    Message
                  </MessageButton>
                </FriendHeader>
                
                <FriendDetails>
                  <DetailSection>
                    <DetailTitle>Interests</DetailTitle>
                    <InterestTags>
                      {friend.interests.map((interest, index) => (
                        <InterestTag key={index}>{interest}</InterestTag>
                      ))}
                    </InterestTags>
                  </DetailSection>
                  
                  <DetailSection>
                    <DetailTitle>Hangout Preferences</DetailTitle>
                    <DetailContent>{friend.preferences}</DetailContent>
                  </DetailSection>
                </FriendDetails>
              </FriendCard>
            ))
          ) : (
            <EmptyState>
              {searchTerm ? (
                <EmptyText>No friends match your search "{searchTerm}"</EmptyText>
              ) : (
                <EmptyText>You haven't added any friends yet.</EmptyText>
              )}
              {!searchTerm && (
                <AddFriendButton onClick={handleAddFriend}>
                  <PlusIcon>+</PlusIcon>
                  Add Your First Friend
                </AddFriendButton>
              )}
            </EmptyState>
          )}
        </FriendsContainer>
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

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #6e8efb;
  cursor: pointer;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 30px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const NavItem = styled.a`
  color: ${props => props.active ? '#6e8efb' : '#666'};
  font-weight: ${props => props.active ? '600' : '500'};
  text-decoration: none;
  padding: 5px 0;
  cursor: pointer;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: #6e8efb;
    transform: scaleX(${props => props.active ? 1 : 0});
    transition: transform 0.3s ease;
  }

  &:hover:after {
    transform: scaleX(1);
  }
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
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const PageTitleSection = styled.div`
  flex: 1;
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
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const PlusIcon = styled.span`
  margin-right: 8px;
  font-size: 1.2rem;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 25px;
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

const FriendsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FriendCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const FriendHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const FriendAvatarSection = styled.div`
  display: flex;
  align-items: center;
`;

const FriendAvatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FriendNameSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const FriendName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px;
`;

const LastActive = styled.div`
  font-size: 0.875rem;
  color: #888;
`;

const MessageButton = styled.button`
  display: flex;
  align-items: center;
  background: #f0f2f5;
  color: #333;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e4e6e9;
  }
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

const MessageIcon = styled.span`
  margin-right: 5px;
`;

const FriendDetails = styled.div`
  padding: 20px;
`;

const DetailSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 10px;
`;

const DetailContent = styled.p`
  font-size: 0.95rem;
  color: #444;
  line-height: 1.5;
  margin: 0;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const InterestTag = styled.span`
  background: rgba(110, 142, 251, 0.1);
  color: #6e8efb;
  font-size: 0.875rem;
  padding: 5px 12px;
  border-radius: 100px;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const EmptyText = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const AddFriendButton = styled.button`
  display: inline-flex;
  align-items: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
`;

export default Friends; 
