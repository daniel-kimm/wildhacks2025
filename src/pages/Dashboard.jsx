import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();

  // Add user data state (this would normally come from context or authentication)
  const [user, setUser] = useState({
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });

  // Sample data - would come from API in a real application
  const [recommendations, setRecommendations] = useState([
    { id: 1, name: 'Central Park Coffee', category: 'Café', rating: 4.8, distance: '0.8 miles' },
    { id: 2, name: 'Riverside Trail', category: 'Outdoors', rating: 4.6, distance: '1.5 miles' },
    { id: 3, name: 'Museum of Modern Art', category: 'Culture', rating: 4.9, distance: '2.3 miles' },
    { id: 4, name: 'Bookworm Bookstore & Café', category: 'Shopping/Café', rating: 4.5, distance: '0.6 miles' },
  ]);

  const [friends, setFriends] = useState([
    { id: 1, name: 'Alex Johnson', mutualInterests: ['coffee', 'hiking'] },
    { id: 2, name: 'Sam Carter', mutualInterests: ['art', 'museums'] },
  ]);

  const [groups, setGroups] = useState([
    { id: 1, name: 'Weekend Adventurers', members: 5 },
    { id: 2, name: 'Coffee Enthusiasts', members: 3 },
  ]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      // Get session data
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get saved user data from localStorage
      const savedUserData = localStorage.getItem('userData');
      
      if (session && session.user) {
        const { user: authUser } = session;
        
        // Set user data from session
        setUser({
          name: authUser.user_metadata?.full_name || 'User',
          avatar: authUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40',
          email: authUser.email
        });
      } else if (savedUserData) {
        // Fallback to localStorage if session not available
        const parsedData = JSON.parse(savedUserData);
        setUser(prevUser => ({
          ...prevUser,
          name: parsedData.name || 'User',
          avatar: parsedData.avatar_url || 'https://via.placeholder.com/40'
        }));
      }
      
      // ... rest of your loading logic
    };

    loadUserData();
  }, []);

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
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src={user.avatar} alt="User avatar" />
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
                  <img src={`https://via.placeholder.com/300x180?text=${rec.name}`} alt={rec.name} />
                </RecImage>
                <RecContent>
                  <RecName>{rec.name}</RecName>
                  <RecMeta>
                    <RecCategory>{rec.category}</RecCategory>
                    <RecRating>★ {rec.rating}</RecRating>
                  </RecMeta>
                  <RecDistance>{rec.distance}</RecDistance>
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
            {friends.length > 0 ? (
              <FriendsList>
                {friends.map(friend => (
                  <FriendCard key={friend.id}>
                    <FriendAvatar>
                      <img src={`https://via.placeholder.com/50?text=${friend.name.charAt(0)}`} alt={friend.name} />
                    </FriendAvatar>
                    <FriendInfo>
                      <FriendName>{friend.name}</FriendName>
                      <FriendInterests>
                        {friend.mutualInterests.join(', ')}
                      </FriendInterests>
                    </FriendInfo>
                  </FriendCard>
                ))}
              </FriendsList>
            ) : (
              <EmptyState>
                You haven't added any friends yet. Add friends to discover shared interests!
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
            {groups.length > 0 ? (
              <GroupsList>
                {groups.map(group => (
                  <GroupCard key={group.id}>
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

const FriendsList = styled.div`
  padding: 10px;
`;

const FriendCard = styled.div`
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

const FriendAvatar = styled.div`
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

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.div`
  font-weight: 600;
  margin-bottom: 3px;
`;

const FriendInterests = styled.div`
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
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
`;

export default Dashboard; 