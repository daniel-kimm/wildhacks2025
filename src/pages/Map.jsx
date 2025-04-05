import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const Map = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ 
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showAllFriends, setShowAllFriends] = useState(true);
  
  // Sample friends data with location information
  const sampleFriends = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      interests: ['Coffee', 'Hiking', 'Movies'],
      avatar: 'A',
      location: { x: 30, y: 40 },
      lastUpdated: '2 min ago',
      place: 'Downtown Coffee Shop'
    },
    { 
      id: 2, 
      name: 'Sam Carter', 
      interests: ['Art', 'Museums', 'Photography'],
      avatar: 'S',
      location: { x: 55, y: 65 },
      lastUpdated: '15 min ago',
      place: 'City Art Museum'
    },
    { 
      id: 3, 
      name: 'Jamie Smith', 
      interests: ['Books', 'Coffee', 'Music'],
      avatar: 'J',
      location: { x: 70, y: 30 },
      lastUpdated: '1 hour ago',
      place: 'Central Library'
    },
    { 
      id: 4, 
      name: 'Taylor Williams', 
      interests: ['Hiking', 'Camping', 'Travel'],
      avatar: 'T',
      location: { x: 40, y: 80 },
      lastUpdated: '5 min ago',
      place: 'Hiking Trail'
    },
    { 
      id: 5, 
      name: 'Jordan Lee', 
      interests: ['Gaming', 'Technology', 'Movies'],
      avatar: 'J',
      location: { x: 85, y: 50 },
      lastUpdated: '30 min ago',
      place: 'Tech Hub Cafe'
    },
  ];

  // Load user data and friends on component mount
  useEffect(() => {
    const loadUserData = async () => {
      // Get session data from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        const { user: authUser } = session;
        
        // Set user data from Supabase auth
        setUser({
          name: authUser.user_metadata?.full_name || 'User',
          avatar: authUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
        });
      } else {
        // Fallback to localStorage
        const savedUserData = localStorage.getItem('userData');
        if (savedUserData) {
          const parsedData = JSON.parse(savedUserData);
          setUser(prevUser => ({
            ...prevUser,
            name: parsedData.name || 'User',
            avatar: parsedData.avatar_url || 'https://via.placeholder.com/40'
          }));
        }
      }
      
      // Simulate API loading delay
      setTimeout(() => {
        setFriends(sampleFriends);
        setIsLoading(false);
      }, 800);
    };

    loadUserData();
  }, []);

  // Handle navigations
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Handle friend selection
  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setShowAllFriends(false);
  };

  // Handle show all friends
  const handleShowAllFriends = () => {
    setSelectedFriend(null);
    setShowAllFriends(true);
  };

  return (
    <PageContainer>
      <Header>
        <Logo onClick={() => handleNavigate('/dashboard')}>HangoutAI</Logo>
        <Navigation>
          <NavItem onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem active onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src={user.avatar} alt="User avatar" />
          </UserAvatar>
        </UserSection>
      </Header>

      <ContentContainer>
        <MapSection>
          <MapControls>
            <MapTitle>Friend Locations</MapTitle>
            <ToggleView>
              <ViewButton 
                active={showAllFriends} 
                onClick={handleShowAllFriends}
              >
                All Friends
              </ViewButton>
              {selectedFriend && (
                <ViewButton 
                  active={!showAllFriends}
                >
                  {selectedFriend.name}
                </ViewButton>
              )}
            </ToggleView>
          </MapControls>
          
          <MapContainer>
            {isLoading ? (
              <LoadingState>
                <LoadingText>Loading map...</LoadingText>
              </LoadingState>
            ) : (
              <>
                <MapBackground>
                  {/* Map grid lines */}
                  <MapGrid />
                  
                  {/* City landmarks */}
                  <Landmark style={{ top: '20%', left: '30%' }} title="Downtown">🏙️</Landmark>
                  <Landmark style={{ top: '60%', left: '20%' }} title="Park">🌳</Landmark>
                  <Landmark style={{ top: '30%', left: '70%' }} title="Library">📚</Landmark>
                  <Landmark style={{ top: '80%', left: '40%' }} title="Hiking Trail">⛰️</Landmark>
                  <Landmark style={{ top: '50%', left: '85%' }} title="Tech Hub">💻</Landmark>
                  <Landmark style={{ top: '65%', left: '55%' }} title="Museum">🏛️</Landmark>
                  
                  {/* Friend locations */}
                  {friends.map(friend => (
                    <FriendMarker 
                      key={friend.id}
                      style={{ 
                        top: `${friend.location.y}%`, 
                        left: `${friend.location.x}%` 
                      }}
                      active={selectedFriend && selectedFriend.id === friend.id}
                      onClick={() => handleSelectFriend(friend)}
                    >
                      <MarkerAvatar>
                        <img src={`https://via.placeholder.com/40?text=${friend.avatar}`} alt={friend.name} />
                      </MarkerAvatar>
                      <MarkerName>{friend.name}</MarkerName>
                    </FriendMarker>
                  ))}
                  
                  {/* Your location */}
                  <UserMarker>
                    <MarkerAvatar>
                      <img src={user.avatar} alt="You" />
                    </MarkerAvatar>
                    <MarkerName>You</MarkerName>
                  </UserMarker>
                </MapBackground>
              </>
            )}
          </MapContainer>
        </MapSection>
        
        <SidePanel>
          <SidePanelHeader>
            {selectedFriend ? (
              <SidePanelTitle>{selectedFriend.name}</SidePanelTitle>
            ) : (
              <SidePanelTitle>Nearby Friends</SidePanelTitle>
            )}
          </SidePanelHeader>
          
          <SidePanelContent>
            {selectedFriend ? (
              <FriendDetail>
                <FriendDetailHeader>
                  <LargeFriendAvatar>
                    <img src={`https://via.placeholder.com/60?text=${selectedFriend.avatar}`} alt={selectedFriend.name} />
                  </LargeFriendAvatar>
                  <FriendDetailInfo>
                    <FriendDetailName>{selectedFriend.name}</FriendDetailName>
                    <FriendLocation>
                      📍 {selectedFriend.place}
                    </FriendLocation>
                    <LastUpdated>
                      Last updated: {selectedFriend.lastUpdated}
                    </LastUpdated>
                  </FriendDetailInfo>
                </FriendDetailHeader>
                
                <FriendInterests>
                  <DetailTitle>Interests</DetailTitle>
                  <InterestTags>
                    {selectedFriend.interests.map((interest, index) => (
                      <InterestTag key={index}>{interest}</InterestTag>
                    ))}
                  </InterestTags>
                </FriendInterests>
                
                <ActionButtons>
                  <MessageButton>
                    <ButtonIcon>✉️</ButtonIcon>
                    Message
                  </MessageButton>
                  <DirectionsButton>
                    <ButtonIcon>🧭</ButtonIcon>
                    Directions
                  </DirectionsButton>
                </ActionButtons>
              </FriendDetail>
            ) : (
              <FriendsList>
                {friends.map(friend => (
                  <FriendListItem 
                    key={friend.id}
                    onClick={() => handleSelectFriend(friend)}
                  >
                    <FriendListAvatar>
                      <img src={`https://via.placeholder.com/40?text=${friend.avatar}`} alt={friend.name} />
                    </FriendListAvatar>
                    <FriendListInfo>
                      <FriendListName>{friend.name}</FriendListName>
                      <FriendListLocation>
                        📍 {friend.place}
                      </FriendListLocation>
                      <FriendListTime>
                        Updated {friend.lastUpdated}
                      </FriendListTime>
                    </FriendListInfo>
                  </FriendListItem>
                ))}
              </FriendsList>
            )}
          </SidePanelContent>
        </SidePanel>
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

const ContentContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MapSection = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const MapControls = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
`;

const MapTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ToggleView = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewButton = styled.button`
  background: ${props => props.active ? '#6e8efb' : '#f0f2f5'};
  color: ${props => props.active ? 'white' : '#666'};
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#5d7dea' : '#e4e6e9'};
  }
`;

const MapContainer = styled.div`
  position: relative;
  height: calc(100vh - 220px);
  min-height: 400px;
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 1rem;
`;

const MapBackground = styled.div`
  background-color: #f0f5ff;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
`;

const MapGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 5% 5%;
`;

const Landmark = styled.div`
  position: absolute;
  font-size: 1.5rem;
  transform: translate(-50%, -50%);
  z-index: 5;
  
  &:hover::after {
    content: attr(title);
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
  }
`;

const FriendMarker = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: pointer;
  transition: all 0.3s ease;
  filter: ${props => props.active ? 'drop-shadow(0 0 8px #6e8efb)' : 'none'};
  scale: ${props => props.active ? 1.1 : 1};
  
  &:hover {
    scale: 1.1;
    z-index: 15;
  }
`;

const UserMarker = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
  z-index: 10;
  filter: drop-shadow(0 0 8px #4caf50);
`;

const MarkerAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MarkerName = styled.div`
  background-color: white;
  color: #333;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  margin-top: 5px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const SidePanel = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SidePanelHeader = styled.div`
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
`;

const SidePanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SidePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const FriendsList = styled.div`
  padding: 10px;
`;

const FriendListItem = styled.div`
  display: flex;
  padding: 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const FriendListAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FriendListInfo = styled.div`
  flex: 1;
`;

const FriendListName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
`;

const FriendListLocation = styled.div`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 3px;
`;

const FriendListTime = styled.div`
  font-size: 0.75rem;
  color: #888;
`;

const FriendDetail = styled.div`
  padding: 20px;
`;

const FriendDetailHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
`;

const LargeFriendAvatar = styled.div`
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

const FriendDetailInfo = styled.div`
  flex: 1;
`;

const FriendDetailName = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px;
`;

const FriendLocation = styled.div`
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 5px;
`;

const LastUpdated = styled.div`
  font-size: 0.8rem;
  color: #888;
`;

const FriendInterests = styled.div`
  margin-bottom: 20px;
`;

const DetailTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  margin: 0 0 10px;
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

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const MessageButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  color: #333;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #e4e6e9;
  }
`;

const DirectionsButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #6e8efb;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #5d7dea;
  }
`;

const ButtonIcon = styled.span`
  margin-right: 5px;
`;

export default Map; 