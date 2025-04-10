import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import NotificationInbox from '../components/NotificationInbox';
import { getUserRecommendations } from '../utils/recommendations';

const Dashboard = () => {
  const navigate = useNavigate();

  // Add user data state (this would normally come from context or authentication)
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    avatar: null
  });

  const [recommendations, setRecommendations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load user data and friends on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          navigate('/login');
          return;
        }
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profileError) throw profileError;
        
        setUser({
          id: authUser.id,
          name: profile.name || authUser.email?.split('@')[0] || 'User',
          avatar: profile.avatar_url
        });
        
        // Fetch personalized recommendations
        const userRecommendations = await getUserRecommendations(authUser.id);
        setRecommendations(userRecommendations);
        
        // Fetch friends
        await fetchFriends(authUser.id);
        
        // Fetch groups
        await fetchGroups(authUser.id);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  // Function to load friends from Supabase
  const fetchFriends = async (userId) => {
    try {
      console.log('Loading friends for user:', userId);
      
      // Get friend relationships
      const { data: friendRelations, error: friendError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);
      
      if (friendError) {
        console.error('Error fetching friends:', friendError);
        throw friendError;
      }
      
      console.log('Friend relations found:', friendRelations?.length || 0);
      
      if (!friendRelations || friendRelations.length === 0) {
        setFriends([]);
        return;
      }
      
      // Get friend IDs
      const friendIds = friendRelations.map(rel => rel.friend_id);
      
      // Get friend profiles
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);
      
      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        throw profilesError;
      }
      
      console.log('Friend profiles found:', friendProfiles?.length || 0);
      
      // Format friend data
      const formattedFriends = friendProfiles.map(profile => ({
        id: profile.id,
        name: profile.name || 'Unnamed User',
        interests: profile.interests ? (typeof profile.interests === 'string' ? 
          profile.interests.split(',').map(i => i.trim()) : 
          Array.isArray(profile.interests) ? profile.interests : []) : [],
        avatar: profile.avatar_url || profile.name?.charAt(0) || 'U',
        lastActive: 'Recently'
      }));
      
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error loading friends:', error.message);
      setFriends([]);
    }
  };

  // Add the fetchGroups function
  const fetchGroups = async (userId) => {
    try {
      console.log('Fetching groups for dashboard:', userId);
      
      // Get group memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      
      if (membershipError) {
        console.error('Error fetching group memberships:', membershipError);
        return;
      }
      
      console.log('Group memberships found:', memberships);
      
      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }
      
      // Get group IDs
      const groupIds = memberships.map(m => m.group_id);
      
      // Fetch the groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })
        .limit(5);  // Limit to 5 most recent groups for dashboard
      
      if (groupsError) {
        console.error('Error fetching groups data:', groupsError);
        return;
      }
      
      console.log('Groups retrieved:', groupsData);
      
      // Process groups data to include member count
      const processedGroups = await Promise.all(groupsData.map(async (group) => {
        try {
          // Get member count
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          if (countError) throw countError;
          
          return {
            id: group.id,
            name: group.name,
            description: group.description,
            members: count || 0
          };
        } catch (error) {
          console.error(`Error processing group ${group.id}:`, error);
          return {
            id: group.id,
            name: group.name,
            description: group.description,
            members: 0
          };
        }
      }));
      
      setGroups(processedGroups);
    } catch (error) {
      console.error('Error in fetchGroups:', error);
      setGroups([]);
    }
  };

  const handleAddFriend = () => {
    navigate('/add-friend');
  };

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  const handleRecommendationClick = (recommendation) => {
    // In a real app, this would navigate to details page
    console.log('Viewing recommendation:', recommendation);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <DashboardContainer>
      <Header>
        <Logo>HangoutAI</Logo>
        <Navigation>
          <NavItem active onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <NotificationInbox />
          <UserName>{user.name}</UserName>
          <UserAvatar onClick={() => setShowUserMenu(!showUserMenu)}>
            {typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt="User avatar" />
            ) : (
              <AvatarPlaceholder>{typeof user.avatar === 'string' ? user.avatar.charAt(0) : 'U'}</AvatarPlaceholder>
            )}
            
            {showUserMenu && (
              <UserMenu>
                <UserMenuItem>Profile</UserMenuItem>
                <UserMenuItem>Settings</UserMenuItem>
                <UserMenuDivider />
                <UserMenuItem onClick={handleSignOut}>Sign Out</UserMenuItem>
              </UserMenu>
            )}
          </UserAvatar>
        </UserSection>
      </Header>

      <MainContent>
        <Section>
          <SectionHeader>
            <SectionTitle>Solo Hangout Recommendations</SectionTitle>
            <SectionSubtitle>Places we think you might enjoy</SectionSubtitle>
          </SectionHeader>
          <RecommendationsGrid>
            {recommendations.map(rec => (
              <RecommendationCard 
                key={rec.id} 
                onClick={() => handleRecommendationClick(rec)}
              >
                <RecImage>
                  <img src={rec.image} alt={rec.name} />
                </RecImage>
                <RecContent>
                  <RecName>{rec.name}</RecName>
                  <RecMeta>
                    <RecCategory>{rec.category}</RecCategory>
                    <RecRating>★ {rec.rating}</RecRating>
                  </RecMeta>
                  <RecDistance>{rec.distance}</RecDistance>
                  <RecDescription>{rec.description}</RecDescription>
                </RecContent>
              </RecommendationCard>
            ))}
          </RecommendationsGrid>
        </Section>

        <SidebarContent>
          <SideSection>
            <SectionHeader>
              <SectionTitle>Your Friends</SectionTitle>
              <AddButton onClick={handleAddFriend}>
                <PlusIcon>+</PlusIcon>
                Add Friend
              </AddButton>
            </SectionHeader>
            {isLoading ? (
              <LoadingIndicator>Loading friends...</LoadingIndicator>
            ) : friends.length > 0 ? (
              <FriendsSection>
                {friends.slice(0, 6).map(friend => (
                  <FriendCard key={friend.id}>
                    <FriendAvatar>
                      {friend.avatar && typeof friend.avatar === 'string' && friend.avatar.startsWith('http') ? (
                        <img src={friend.avatar} alt={friend.name} />
                      ) : (
                        <AvatarPlaceholder>{typeof friend.avatar === 'string' ? friend.avatar : friend.name[0]}</AvatarPlaceholder>
                      )}
                    </FriendAvatar>
                    <FriendInfo>
                      <FriendName>{friend.name}</FriendName>
                      <FriendStatus>{friend.lastActive}</FriendStatus>
                    </FriendInfo>
                  </FriendCard>
                ))}
              </FriendsSection>
            ) : (
              <EmptyState>
                <EmptyStateText>You haven't added any friends yet.</EmptyStateText>
                <AddFriendsButton onClick={() => navigate('/add-friend')}>
                  Find Friends
                </AddFriendsButton>
              </EmptyState>
            )}
          </SideSection>

          <SideSection>
            <SectionHeader>
              <SectionTitle>Your Groups</SectionTitle>
              <AddButton onClick={handleCreateGroup}>
                <PlusIcon>+</PlusIcon>
                Create Group
              </AddButton>
            </SectionHeader>
            {isLoading ? (
              <LoadingIndicator>Loading groups...</LoadingIndicator>
            ) : groups.length > 0 ? (
              <GroupsList>
                {groups.map(group => (
                  <GroupCard key={group.id} onClick={() => navigate(`/groups/${group.id}`)}>
                    <GroupAvatar>
                      <img src={`https://via.placeholder.com/50?text=${group.name.charAt(0)}`} alt={group.name} />
                    </GroupAvatar>
                    <GroupInfo>
                      <GroupName>{group.name}</GroupName>
                      <GroupMembers>{group.members} members</GroupMembers>
                    </GroupInfo>
                  </GroupCard>
                ))}
              </GroupsList>
            ) : (
              <EmptyState>
                You haven't created any groups yet. Create a group to plan hangouts together!
              </EmptyState>
            )}
          </SideSection>
        </SidebarContent>
      </MainContent>
    </DashboardContainer>
  );
};

// Styled Components
const DashboardContainer = styled.div`
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
`;

const Navigation = styled.nav`
  display: flex;
  gap: 25px;

  @media (max-width: 768px) {
    display: none;
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

const MainContent = styled.main`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 25px;
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  margin-bottom: 30px;
`;

const SidebarContent = styled.aside`
  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SideSection = styled.section`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 25px;
`;

const SectionHeader = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SectionSubtitle = styled.p`
  color: #666;
  margin: 5px 0 0;
  font-size: 0.875rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
`;

const PlusIcon = styled.span`
  margin-right: 5px;
  font-size: 1.1rem;
`;

const RecommendationsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
`;

const RecommendationCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const RecImage = styled.div`
  width: 100%;
  height: 180px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  ${RecommendationCard}:hover & img {
    transform: scale(1.05);
  }
`;

const RecContent = styled.div`
  padding: 15px;
`;

const RecName = styled.h3`
  font-size: 1.1rem;
  margin: 0 0 8px;
  color: #333;
`;

const RecMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
`;

const RecCategory = styled.span`
  color: #666;
  font-size: 0.875rem;
`;

const RecRating = styled.span`
  color: #f5b400;
  font-weight: 600;
  font-size: 0.875rem;
`;

const RecDistance = styled.div`
  font-size: 0.875rem;
  color: #888;
`;

const RecDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 8px 0;
  line-height: 1.4;
`;

const FriendsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
`;

const FriendCard = styled.div`
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const FriendAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  font-weight: 600;
  margin-bottom: 4px;
`;

const FriendStatus = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const GroupsList = styled.div`
  padding: 10px;
`;

const GroupCard = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: #f5f7fa;
  }
`;

const GroupAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;
  background-color: #6e8efb;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const GroupInfo = styled.div`
  flex: 1;
`;

const GroupName = styled.div`
  font-weight: 600;
  margin-bottom: 3px;
`;

const GroupMembers = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: white;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const EmptyStateText = styled.p`
  color: #666;
  margin-bottom: 20px;
`;

const AddFriendsButton = styled.button`
  background: #6e8efb;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  
  &:hover {
    background: #5d7dea;
  }
`;

const LoadingIndicator = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  color: #666;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  width: 150px;
  z-index: 1000;
  overflow: hidden;
`;

const UserMenuItem = styled.div`
  padding: 12px 15px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #f5f7fa;
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background: #e1e4e8;
  margin: 5px 0;
`;

export default Dashboard; 