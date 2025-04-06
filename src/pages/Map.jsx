import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../utils/mapboxStyles.css';

// Set Mapbox API key
mapboxgl.accessToken = 'pk.eyJ1Ijoiem91ZHluYXN0eSIsImEiOiJjbTk0cnhqa3QwdzNsMnJweWQ4dmhxanVwIn0.cNqDoYHQZqoQvc16RejvsQ';

const Map = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const refreshIntervalRef = useRef(null);
  const [mapSupported, setMapSupported] = useState(true);
  
  const [user, setUser] = useState({ 
    name: 'User',
    avatar: 'https://via.placeholder.com/40',
    location: { longitude: -87.6298, latitude: 41.8781 } // Default to Chicago
  });
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showAllFriends, setShowAllFriends] = useState(true);
  
  // Sample friends data with actual coordinates
  const sampleFriends = [
    { 
      id: 1, 
      name: 'Alex Johnson', 
      interests: ['Coffee', 'Hiking', 'Movies'],
      avatar: 'A',
      location: { longitude: -87.6348, latitude: 41.8841 }, // Northwestern campus area
      lastUpdated: '2 min ago',
      place: 'Downtown Coffee Shop'
    },
    { 
      id: 2, 
      name: 'Sam Carter', 
      interests: ['Art', 'Museums', 'Photography'],
      avatar: 'S',
      location: { longitude: -87.6236, latitude: 41.8796 }, // Art Institute area
      lastUpdated: '15 min ago',
      place: 'City Art Museum'
    },
    { 
      id: 3, 
      name: 'Jamie Smith', 
      interests: ['Books', 'Coffee', 'Music'],
      avatar: 'J',
      location: { longitude: -87.6278, latitude: 41.8751 }, // Harold Washington Library area
      lastUpdated: '1 hour ago',
      place: 'Central Library'
    },
    { 
      id: 4, 
      name: 'Taylor Williams', 
      interests: ['Hiking', 'Camping', 'Travel'],
      avatar: 'T',
      location: { longitude: -87.6395, latitude: 41.8851 }, // Millennium Park area
      lastUpdated: '5 min ago',
      place: 'Hiking Trail'
    },
    { 
      id: 5, 
      name: 'Jordan Lee', 
      interests: ['Gaming', 'Technology', 'Movies'],
      avatar: 'J',
      location: { longitude: -87.6412, latitude: 41.8917 }, // River North tech hub area
      lastUpdated: '30 min ago',
      place: 'Tech Hub Cafe'
    },
  ];

  // Check if browser supports Mapbox GL
  useEffect(() => {
    if (!mapboxgl.supported()) {
      setMapSupported(false);
      setMapError("Your browser doesn't support Mapbox GL");
    }
  }, []);

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
          avatar: authUser.user_metadata?.avatar_url || 'https://via.placeholder.com/40',
          location: { longitude: -87.6298, latitude: 41.8781 } // Default location
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
      
      // Use sample friends data for now
      setFriends(sampleFriends);
      setIsLoading(false);
      setLastUpdated(new Date());
    };

    loadUserData();

    // Setup refresh interval
    refreshIntervalRef.current = setInterval(() => {
      refreshLocations();
    }, 60000); // Refresh every minute
    
    // Cleanup interval on component unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Function to refresh friend locations
  const refreshLocations = () => {
    setIsLoading(true);
    
    // In a real app, you would fetch updated locations from your API
    // For this demo, we'll simulate movement by slightly adjusting coordinates
    setTimeout(() => {
      const updatedFriends = friends.map(friend => ({
        ...friend,
        location: {
          longitude: friend.location.longitude + (Math.random() * 0.004 - 0.002),
          latitude: friend.location.latitude + (Math.random() * 0.004 - 0.002)
        },
        lastUpdated: 'just now'
      }));
      
      setFriends(updatedFriends);
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 800);
  };

  // Initialize Mapbox when container is available
  useEffect(() => {
    console.log("Initializing map:", {
      containerExists: !!mapContainer.current,
      mapExists: !!map.current,
      userLocation: user.location,
      mapSupported: mapSupported
    });
    
    if (mapContainer.current && !map.current && mapSupported) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: [user.location.longitude, user.location.latitude],
          zoom: 13
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          console.log("Map loaded successfully");
          setMapLoaded(true);
          
          // Force a resize in case the container dimensions were not correctly detected
          setTimeout(() => {
            map.current && map.current.resize();
          }, 100);
        });
        
        map.current.on('error', (e) => {
          console.error("Mapbox error:", e);
          setMapError(e.error || e.message || "Unknown map error");
        });
      } catch (err) {
        console.error("Error initializing map:", err);
        setMapError(err.toString());
      }
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [user.location, mapSupported]);

  // Add markers to the map when it's loaded and when friends change
  useEffect(() => {
    console.log("Adding markers:", {
      mapLoaded: mapLoaded,
      mapExists: !!map.current,
      friendsCount: friends.length
    });
    
    if (mapLoaded && map.current) {
      try {
        // Remove existing markers
        const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
        existingMarkers.forEach(marker => marker.remove());

        // Add user marker
        const userEl = document.createElement('div');
        userEl.className = 'user-marker-container';
        
        const userAvatar = document.createElement('div');
        userAvatar.className = 'marker-avatar user-marker';
        const userImg = document.createElement('img');
        userImg.src = user.avatar;
        userImg.alt = 'You';
        userAvatar.appendChild(userImg);
        
        const userLabel = document.createElement('div');
        userLabel.className = 'marker-label';
        userLabel.textContent = 'You';
        
        userEl.appendChild(userAvatar);
        userEl.appendChild(userLabel);
        
        new mapboxgl.Marker(userEl)
          .setLngLat([user.location.longitude, user.location.latitude])
          .addTo(map.current);

        // Add friend markers
        friends.forEach(friend => {
          const el = document.createElement('div');
          el.className = 'friend-marker-container';
          el.addEventListener('click', () => handleSelectFriend(friend));
          
          if (selectedFriend && selectedFriend.id === friend.id) {
            el.classList.add('selected');
          }
          
          const avatar = document.createElement('div');
          avatar.className = 'marker-avatar friend-marker';
          const img = document.createElement('img');
          img.src = `https://via.placeholder.com/40?text=${friend.avatar}`;
          img.alt = friend.name;
          avatar.appendChild(img);
          
          const label = document.createElement('div');
          label.className = 'marker-label';
          label.textContent = friend.name;
          
          el.appendChild(avatar);
          el.appendChild(label);
          
          new mapboxgl.Marker(el)
            .setLngLat([friend.location.longitude, friend.location.latitude])
            .addTo(map.current);
        });
      } catch (err) {
        console.error("Error adding markers:", err);
      }
    }
  }, [mapLoaded, friends, selectedFriend, user]);

  // Handle navigations
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Handle friend selection
  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    setShowAllFriends(false);
    
    // Center map on selected friend
    if (map.current) {
      map.current.flyTo({
        center: [friend.location.longitude, friend.location.latitude],
        zoom: 15,
        speed: 1.2
      });
    }
  };

  // Handle show all friends
  const handleShowAllFriends = () => {
    setSelectedFriend(null);
    setShowAllFriends(true);
    
    // Fit map to show all friends
    if (map.current && friends.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add user location to bounds
      bounds.extend([user.location.longitude, user.location.latitude]);
      
      // Add all friend locations to bounds
      friends.forEach(friend => {
        bounds.extend([friend.location.longitude, friend.location.latitude]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
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
            <ControlsRight>
              <LastUpdateInfo>
                Updated {lastUpdated.toLocaleTimeString()} 
                <RefreshButton onClick={refreshLocations}>
                  <RefreshIcon>🔄</RefreshIcon>
                </RefreshButton>
              </LastUpdateInfo>
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
            </ControlsRight>
          </MapControls>
          
          <MapContainer>
            {isLoading ? (
              <LoadingState>
                <LoadingText>Loading map...</LoadingText>
              </LoadingState>
            ) : mapError ? (
              <MapErrorContainer>
                <MapErrorMessage>
                  Error loading map: {mapError}
                </MapErrorMessage>
                <MapErrorHint>
                  Please check your internet connection and verify API key is valid.
                </MapErrorHint>
              </MapErrorContainer>
            ) : !mapSupported ? (
              <MapErrorContainer>
                <MapErrorMessage>
                  Your browser doesn't support Mapbox GL
                </MapErrorMessage>
                <MapErrorHint>
                  Please try using a modern browser like Chrome, Firefox, or Safari.
                </MapErrorHint>
              </MapErrorContainer>
            ) : (
              <MapboxContainer id="mapbox-container" ref={mapContainer} className="mapboxgl-map" />
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
  display: flex;
  flex-direction: column;
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

const ControlsRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
`;

const LastUpdateInfo = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f2f5;
  }
`;

const RefreshIcon = styled.span`
  font-size: 1rem;
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
  width: 100%;
`;

const MapboxContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  /* Custom Mapbox marker styles */
  .friend-marker-container, .user-marker-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }
  
  .user-marker-container {
    z-index: 2;
  }
  
  .marker-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .friend-marker {
    background: white;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .user-marker {
    border-color: #4caf50;
    box-shadow: 0 0 0 2px #4caf50, 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .friend-marker-container.selected .friend-marker {
    border-color: #6e8efb;
    box-shadow: 0 0 0 2px #6e8efb, 0 2px 5px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
  }
  
  .friend-marker-container:hover .friend-marker {
    transform: scale(1.1);
  }
  
  .marker-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .marker-label {
    background-color: white;
    color: #333;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.75rem;
    margin-top: 5px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
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

const MapErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  background-color: #fff3f3;
`;

const MapErrorMessage = styled.div`
  color: #e53935;
  font-size: 1rem;
  margin-bottom: 10px;
  text-align: center;
`;

const MapErrorHint = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-align: center;
`;

export default Map; 