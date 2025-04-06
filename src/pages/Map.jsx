import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../utils/mapboxStyles.css';
import { findActivitiesNearGroup } from '../utils/mapboxClient';

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
  
  // New state for activities
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5000); // Default 5km
  const [selectedCategories, setSelectedCategories] = useState(['restaurant', 'cafe', 'park', 'museum', 'entertainment']);
  
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
          
          const avatar = document.createElement('div');
          avatar.className = 'marker-avatar friend-marker';
          avatar.textContent = friend.avatar;
          
          const label = document.createElement('div');
          label.className = 'marker-label';
          label.textContent = friend.name;
          
          el.appendChild(avatar);
          el.appendChild(label);
          
          new mapboxgl.Marker(el)
            .setLngLat([friend.location.longitude, friend.location.latitude])
            .addTo(map.current);
        });
        
        // Add activity markers if they exist
        if (activities.length > 0) {
          activities.forEach(activity => {
            const el = document.createElement('div');
            el.className = 'activity-marker-container';
            el.addEventListener('click', () => handleSelectActivity(activity));
            
            const icon = document.createElement('div');
            icon.className = 'marker-avatar activity-marker';
            icon.innerHTML = getActivityIcon(activity.category);
            
            const label = document.createElement('div');
            label.className = 'marker-label';
            label.textContent = activity.text;
            
            el.appendChild(icon);
            el.appendChild(label);
            
            new mapboxgl.Marker(el)
              .setLngLat(activity.center)
              .addTo(map.current);
          });
        }
      } catch (error) {
        console.error("Error adding markers:", error);
      }
    }
  }, [mapLoaded, friends, activities]);

  // Function to handle friend selection
  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    
    // Pan to friend's location
    if (map.current) {
      map.current.flyTo({
        center: [friend.location.longitude, friend.location.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  };

  // Function to handle activity selection
  const handleSelectActivity = (activity) => {
    setSelectedActivity(activity);
    
    // Pan to activity location
    if (map.current) {
      map.current.flyTo({
        center: activity.center,
        zoom: 15,
        duration: 1000
      });
    }
  };

  // Function to get icon for activity category
  const getActivityIcon = (category) => {
    switch (category) {
      case 'restaurant':
        return '🍽️';
      case 'cafe':
        return '☕';
      case 'park':
        return '🌳';
      case 'museum':
        return '🏛️';
      case 'entertainment':
        return '🎮';
      default:
        return '📍';
    }
  };

  // Function to find activities near the group
  const findActivitiesNearGroup = async () => {
    try {
      setIsLoadingActivities(true);
      
      // Get all locations (user + friends)
      const allLocations = [
        { latitude: user.location.latitude, longitude: user.location.longitude },
        ...friends.map(friend => ({
          latitude: friend.location.latitude,
          longitude: friend.location.longitude
        }))
      ];
      
      // Find activities near the group
      const nearbyActivities = await findActivitiesNearGroup(
        allLocations,
        searchRadius,
        selectedCategories
      );
      
      setActivities(nearbyActivities);
      setSelectedActivity(null);
      
      // If we found activities, pan to the center of the group
      if (nearbyActivities.length > 0 && map.current) {
        const center = calculateCenterPoint(allLocations);
        map.current.flyTo({
          center: [center.longitude, center.latitude],
          zoom: 12,
          duration: 1000
        });
      }
    } catch (error) {
      console.error('Error finding activities:', error);
      setMapError('Failed to find activities. Please try again.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Helper function to calculate the center point of multiple locations
  const calculateCenterPoint = (locations) => {
    if (!locations || locations.length === 0) {
      return { latitude: 0, longitude: 0 };
    }
    
    const sum = locations.reduce((acc, loc) => ({
      latitude: acc.latitude + loc.latitude,
      longitude: acc.longitude + loc.longitude
    }), { latitude: 0, longitude: 0 });
    
    return {
      latitude: sum.latitude / locations.length,
      longitude: sum.longitude / locations.length
    };
  };

  // Function to handle category toggle
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Function to handle radius change
  const handleRadiusChange = (e) => {
    setSearchRadius(parseInt(e.target.value));
  };

  // Function to format distance in meters to a human-readable string
  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  return (
    <MapContainer>
      <MapHeader>
        <Title>Find Activities Near Your Group</Title>
        <Controls>
          <SearchControls>
            <RadiusControl>
              <label htmlFor="radius">Search Radius: {formatDistance(searchRadius)}</label>
              <input
                type="range"
                id="radius"
                min="1000"
                max="20000"
                step="1000"
                value={searchRadius}
                onChange={handleRadiusChange}
              />
            </RadiusControl>
            <CategoryControls>
              <CategoryLabel>Categories:</CategoryLabel>
              <CategoryButtons>
                {['restaurant', 'cafe', 'park', 'museum', 'entertainment'].map(category => (
                  <CategoryButton
                    key={category}
                    active={selectedCategories.includes(category)}
                    onClick={() => toggleCategory(category)}
                  >
                    {getActivityIcon(category)} {category}
                  </CategoryButton>
                ))}
              </CategoryButtons>
            </CategoryControls>
            <SearchButton
              onClick={findActivitiesNearGroup}
              disabled={isLoadingActivities}
            >
              {isLoadingActivities ? 'Searching...' : 'Find Activities'}
            </SearchButton>
          </SearchControls>
        </Controls>
      </MapHeader>
      
      <MapContent>
        <MapContainer ref={mapContainer} />
        
        {mapError && (
          <ErrorMessage>
            {mapError}
          </ErrorMessage>
        )}
        
        {!mapSupported && (
          <ErrorMessage>
            Your browser doesn't support Mapbox GL. Please try a different browser.
          </ErrorMessage>
        )}
        
        {isLoading && (
          <LoadingOverlay>
            <LoadingSpinner />
            <LoadingText>Loading map data...</LoadingText>
          </LoadingOverlay>
        )}
      </MapContent>
      
      <Sidebar>
        <SidebarSection>
          <SectionTitle>Your Friends</SectionTitle>
          <FriendsList>
            {friends.map(friend => (
              <FriendItem
                key={friend.id}
                selected={selectedFriend?.id === friend.id}
                onClick={() => handleSelectFriend(friend)}
              >
                <FriendAvatar>{friend.avatar}</FriendAvatar>
                <FriendInfo>
                  <FriendName>{friend.name}</FriendName>
                  <FriendLocation>{friend.place}</FriendLocation>
                  <FriendLastUpdated>Last updated: {friend.lastUpdated}</FriendLastUpdated>
                </FriendInfo>
              </FriendItem>
            ))}
          </FriendsList>
        </SidebarSection>
        
        {activities.length > 0 && (
          <SidebarSection>
            <SectionTitle>Nearby Activities</SectionTitle>
            <ActivitiesList>
              {activities.map(activity => (
                <ActivityItem
                  key={activity.id}
                  selected={selectedActivity?.id === activity.id}
                  onClick={() => handleSelectActivity(activity)}
                >
                  <ActivityIcon>{getActivityIcon(activity.category)}</ActivityIcon>
                  <ActivityInfo>
                    <ActivityName>{activity.text}</ActivityName>
                    <ActivityDistance>
                      {formatDistance(activity.distance)} away
                    </ActivityDistance>
                  </ActivityInfo>
                </ActivityItem>
              ))}
            </ActivitiesList>
          </SidebarSection>
        )}
      </Sidebar>
    </MapContainer>
  );
};

// Styled components
const MapContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  position: relative;
`;

const MapHeader = styled.div`
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
`;

const Title = styled.h1`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #333;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SearchControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RadiusControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.9rem;
    color: #666;
  }
  
  input {
    width: 100%;
  }
`;

const CategoryControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CategoryLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
`;

const CategoryButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CategoryButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid ${props => props.active ? '#4a90e2' : '#ddd'};
  background-color: ${props => props.active ? '#e6f2ff' : '#fff'};
  color: ${props => props.active ? '#4a90e2' : '#666'};
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: ${props => props.active ? '#d9ecff' : '#f5f5f5'};
  }
`;

const SearchButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #3a7bc8;
  }
  
  &:disabled {
    background-color: #a0c3e8;
    cursor: not-allowed;
  }
`;

const MapContent = styled.div`
  flex: 1;
  position: relative;
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  border-radius: 4px;
  z-index: 10;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 5;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4a90e2;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  color: #333;
  font-size: 1rem;
`;

const Sidebar = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: white;
  box-shadow: -2px 0 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SidebarSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
`;

const FriendsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.selected ? '#e6f2ff' : '#f5f5f5'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.selected ? '#d9ecff' : '#e9e9e9'};
  }
`;

const FriendAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
`;

const FriendInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const FriendName = styled.div`
  font-weight: bold;
  color: #333;
`;

const FriendLocation = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const FriendLastUpdated = styled.div`
  font-size: 0.7rem;
  color: #999;
`;

const ActivitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.selected ? '#e6f2ff' : '#f5f5f5'};
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.selected ? '#d9ecff' : '#e9e9e9'};
  }
`;

const ActivityIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`;

const ActivityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ActivityName = styled.div`
  font-weight: bold;
  color: #333;
`;

const ActivityDistance = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

export default Map; 