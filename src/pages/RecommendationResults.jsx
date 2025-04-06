import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoiem91ZHluYXN0eSIsImEiOiJjbTk1MHBkanIxM2JxMmluN3NyNnNidTI5In0.1LL1jCv4LMiOLUoLgw_77g';

const RecommendationResults = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state || {}; // Get the form data passed from previous page
  
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [group, setGroup] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  // Add map refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const [isGroupHangout, setIsGroupHangout] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [allResponsesReceived, setAllResponsesReceived] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const [responsesCount, setResponsesCount] = useState(0);
  
  // Fetch user data and group details
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if we're viewing results for a group hangout
        const requestId = location.state?.requestId;
        if (requestId) {
          setIsGroupHangout(true);
          
          // Get request details
          const { data: requestData, error: requestError } = await supabase
            .from('hangout_requests')
            .select('*')
            .eq('id', requestId)
            .single();
            
          if (requestError) throw requestError;
          
          // Check if user is the creator
          const { data: { user: authUser } } = await supabase.auth.getUser();
          setIsCreator(requestData.created_by === authUser.id);
          
          // Get total members count
          const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId);
            
          if (membersError) throw membersError;
          setMembersCount(membersData.length);
          
          // Get responses count
          const { data: responsesData, error: responsesError } = await supabase
            .from('hangout_responses')
            .select('*')
            .eq('request_id', requestId);
            
          if (responsesError) throw responsesError;
          setResponsesCount(responsesData.length);
          
          // Check if all responses received
          setAllResponsesReceived(responsesData.length >= membersData.length);
          
          // If creator or all responses received, process responses
          if (requestData.created_by === authUser.id || responsesData.length >= membersData.length) {
            // Combine all form data to generate aggregate recommendations
            const combinedPreferences = responsesData.reduce((acc, response) => {
              const formData = response.form_data;
              return {
                priceLimit: Math.max(acc.priceLimit || 0, formData.priceLimit || 0),
                distanceLimit: Math.min(acc.distanceLimit || 100, formData.distanceLimit || 100),
                preferences: acc.preferences + ' ' + (formData.preferences || '')
              };
            }, { priceLimit: 0, distanceLimit: 100, preferences: '' });
            
            // Override the form data for generating recommendations
            Object.assign(formData, combinedPreferences);
          } else {
            // Not allowed to see results yet
            navigate(`/groups/${groupId}`, { 
              state: { message: 'Waiting for all members to respond' } 
            });
            return;
          }
        }
        
        // Continue with existing logic for fetching user, group data and generating recommendations
        fetchUserData();
        fetchGroupDetails();
        generateRecommendations();
      } catch (err) {
        console.error('Error processing group hangout:', err);
        // Continue with normal flow
        fetchUserData();
        fetchGroupDetails();
        generateRecommendations();
      }
    };
    
    fetchData();
  }, [groupId, navigate, location.state]);
  
  // Generate mock recommendations based on form inputs
  const generateRecommendations = () => {
    // In a real app, this would be an API call to a backend service
    setLoading(true);
    
    // Example preferences from form data (would come from the previous page)
    const { priceLimit = 50, distanceLimit = 5, timeOfDay = 12, preferences = '' } = formData;
    
    // Mock data - in a real app these would come from your backend
    const mockRecommendations = [
      {
        id: 1,
        name: "Central Park Picnic",
        type: "Outdoor Activity",
        price: 15,
        priceCategory: "$",
        distance: 1.2,
        description: "Enjoy a relaxing picnic in the park with beautiful scenery and plenty of space for games.",
        rating: 4.7,
        reviewCount: 342,
        image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        tags: ["Outdoor", "Relaxing", "Nature"],
        location: { lat: 40.7812, lng: -73.9665 }
      },
      {
        id: 2,
        name: "Downtown Arcade",
        type: "Entertainment",
        price: 25,
        priceCategory: "$$",
        distance: 3.5,
        description: "Classic and modern arcade games with a full bar and food menu. Perfect for groups looking for competitive fun.",
        rating: 4.3,
        reviewCount: 189,
        image: "https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        tags: ["Games", "Indoor", "Drinks"],
        location: { lat: 40.7580, lng: -73.9855 }
      },
      {
        id: 3,
        name: "Harbor Kayaking",
        type: "Adventure",
        price: 40,
        priceCategory: "$$",
        distance: 4.1,
        description: "Explore the harbor by kayak with experienced guides. All equipment provided, no experience necessary.",
        rating: 4.8,
        reviewCount: 215,
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        tags: ["Water", "Adventure", "Active"],
        location: { lat: 40.7023, lng: -74.0121 }
      },
      {
        id: 4,
        name: "Museum of Modern Art",
        type: "Cultural",
        price: 25,
        priceCategory: "$$",
        distance: 2.3,
        description: "World-class art collection with rotating exhibitions. Perfect for a cultural afternoon.",
        rating: 4.6,
        reviewCount: 567,
        image: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        tags: ["Art", "Indoor", "Cultural"],
        location: { lat: 40.7614, lng: -73.9776 }
      },
      {
        id: 5,
        name: "Rooftop Brewery Tour",
        type: "Food & Drink",
        price: 35,
        priceCategory: "$$",
        distance: 3.8,
        description: "Tour three local craft breweries with tastings at each location. Includes a souvenir glass.",
        rating: 4.5,
        reviewCount: 321,
        image: "https://images.unsplash.com/photo-1575367439058-6096bb9cf5e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
        tags: ["Drinks", "Tour", "Social"],
        location: { lat: 40.7431, lng: -73.9712 }
      }
    ];
    
    // Filter based on price and distance (would be done on the backend in real app)
    let filtered = mockRecommendations.filter(rec => 
      rec.price <= priceLimit && 
      rec.distance <= distanceLimit
    );
    
    // If we have preferences text, do some basic matching
    if (preferences) {
      const preferencesLower = preferences.toLowerCase();
      const prefTerms = preferencesLower.split(/\s+/).filter(term => term.length > 3);
      
      if (prefTerms.length > 0) {
        filtered = filtered.map(rec => {
          let score = 0;
          const recText = `${rec.name} ${rec.type} ${rec.description} ${rec.tags.join(' ')}`.toLowerCase();
          
          prefTerms.forEach(term => {
            if (recText.includes(term)) {
              score += 1;
            }
          });
          
          return { ...rec, score };
        }).sort((a, b) => b.score - a.score);
      }
    }
    
    // Set the top 5 recommendations
    setRecommendations(filtered.slice(0, 5));
    
    // Set the first recommendation as selected by default
    if (filtered.length > 0) {
      setSelectedRecommendation(filtered[0]);
    }
    
    // Generate AI suggestion
    if (filtered.length > 0) {
      const suggestion = generateAISuggestion(filtered);
      setAiSuggestion(suggestion);
    }
    
    setLoading(false);
  };
  
  // Generate AI suggestion
  const generateAISuggestion = (recs) => {
    if (!recs || recs.length === 0) return '';
    
    // Sort recommendations by price and distance for sensible combinations
    const sortedRecs = [...recs].sort((a, b) => a.distance - b.distance);
    
    // Select 2-3 complementary activities
    const selectedRecs = [];
    
    // Try to get a food/drink option
    const foodDrinkOption = sortedRecs.find(rec => 
      rec.type.toLowerCase().includes('food') || 
      rec.type.toLowerCase().includes('drink') ||
      rec.tags.some(tag => tag.toLowerCase() === 'drinks' || tag.toLowerCase() === 'food')
    );
    
    if (foodDrinkOption) {
      selectedRecs.push(foodDrinkOption);
    }
    
    // Try to get an activity option that's not food/drink
    const activityOption = sortedRecs.find(rec => 
      !rec.type.toLowerCase().includes('food') && 
      !rec.type.toLowerCase().includes('drink') &&
      !selectedRecs.includes(rec)
    );
    
    if (activityOption) {
      selectedRecs.push(activityOption);
    }
    
    // If we need one more, pick something different
    if (selectedRecs.length < 2 || (Math.random() > 0.5 && selectedRecs.length < 3)) {
      const anotherOption = sortedRecs.find(rec => !selectedRecs.includes(rec));
      if (anotherOption) {
        selectedRecs.push(anotherOption);
      }
    }
    
    // Fallback if our selection logic didn't work
    if (selectedRecs.length === 0) {
      selectedRecs.push(sortedRecs[0]);
      if (sortedRecs.length > 1) {
        selectedRecs.push(sortedRecs[1]);
      }
    }
    
    // Generate the suggestion text
    let suggestion = '';
    
    const timeOptions = ['evening', 'day', 'outing', 'adventure', 'experience'];
    const timeChoice = timeOptions[Math.floor(Math.random() * timeOptions.length)];
    
    const intros = [
      `The perfect hangout might consist of `,
      `For an ideal ${timeChoice} with your group, consider `,
      `Based on your preferences, I'd recommend `,
      `Your group would likely enjoy `
    ];
    
    suggestion = intros[Math.floor(Math.random() * intros.length)];
    
    selectedRecs.forEach((rec, index) => {
      if (index === 0) {
        suggestion += `starting with ${rec.name} for some ${rec.tags[0].toLowerCase()} time`;
      } else if (index === selectedRecs.length - 1) {
        suggestion += ` and then finishing the ${timeChoice} at ${rec.name}`;
      } else {
        suggestion += `, followed by a visit to ${rec.name}`;
      }
    });
    
    suggestion += `. With the venues being ${selectedRecs.map(r => Math.round(r.distance * 10) / 10).sort((a, b) => a - b)[0]}-${selectedRecs.map(r => Math.round(r.distance * 10) / 10).sort((a, b) => a - b).pop()} miles apart, you can easily enjoy multiple activities in one ${timeChoice}. The combined experiences offer a great balance of ${selectedRecs.map(r => r.tags[0].toLowerCase()).join(' and ')}.`;
    
    return suggestion;
  };
  
  // Initialize map after recommendations are loaded
  useEffect(() => {
    if (recommendations.length > 0 && !map.current) {
      try {
        initializeMap();
      } catch (err) {
        console.error("Error initializing map:", err);
      }
    }
  }, [recommendations]);
  
  // Update markers when selected recommendation changes
  useEffect(() => {
    if (map.current && mapLoaded && markers.current.length > 0) {
      try {
        updateMarkers();
      } catch (err) {
        console.error("Error updating markers:", err);
      }
    }
  }, [selectedRecommendation]);
  
  // Initialize Mapbox map
  const initializeMap = () => {
    try {
      if (map.current) return; // Already initialized
      
      console.log("Initializing map with recommendations:", recommendations);
      
      if (!recommendations || recommendations.length === 0) {
        console.warn("No recommendations to display on map");
        return;
      }
      
      // Calculate center of recommendations
      const lats = recommendations.map(r => r.location.lat);
      const lngs = recommendations.map(r => r.location.lng);
      const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      
      console.log("Creating map at center:", [centerLng, centerLat]);
      
      // Create map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [centerLng, centerLat],
        zoom: 12
      });
      
      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Wait for map to load before adding markers
      map.current.on('load', () => {
        console.log("Map loaded");
        setMapLoaded(true);
        addMarkers();
      });
    } catch (err) {
      console.error("Map initialization error:", err);
    }
  };
  
  // Add markers to map
  const addMarkers = () => {
    try {
      if (!map.current || !mapLoaded) {
        console.warn("Map not ready for markers");
        return;
      }
      
      // Clear any existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Add markers for each recommendation
      recommendations.forEach((rec, index) => {
        // Create a custom HTML element for marker
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = rec.id === selectedRecommendation?.id ? '#6e8efb' : '#666';
        el.style.color = 'white';
        el.style.borderRadius = '50%';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.textAlign = 'center';
        el.style.lineHeight = '30px';
        el.style.fontWeight = 'bold';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
        el.style.transition = 'all 0.2s ease-in-out';
        el.innerHTML = `${index + 1}`;
        
        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([rec.location.lng, rec.location.lat])
          .addTo(map.current);
        
        // Add click handler to marker
        el.addEventListener('click', () => {
          handleSelectRecommendation(rec);
        });
        
        // Store marker reference
        markers.current.push({
          marker,
          element: el,
          recommendation: rec
        });
      });
      
      console.log(`Added ${markers.current.length} markers to map`);
    } catch (err) {
      console.error("Error adding markers:", err);
    }
  };
  
  // Update marker styles based on selection
  const updateMarkers = () => {
    markers.current.forEach(({ element, recommendation }) => {
      element.style.backgroundColor = recommendation.id === selectedRecommendation?.id ? '#6e8efb' : '#666';
      element.style.transform = recommendation.id === selectedRecommendation?.id ? 'scale(1.2)' : 'scale(1)';
      element.style.zIndex = recommendation.id === selectedRecommendation?.id ? '10' : '1';
    });
  };
  
  // Handle selecting a recommendation
  const handleSelectRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
    
    // Fly to the selected recommendation location
    if (map.current) {
      map.current.flyTo({
        center: [recommendation.location.lng, recommendation.location.lat],
        zoom: 14,
        essential: true
      });
    }
  };
  
  // Get directions to the selected venue
  const handleGetDirections = () => {
    if (selectedRecommendation) {
      const { lat, lng } = selectedRecommendation.location;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };
  
  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  // Toggle user menu
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };
  
  // Modify the navigation handler to be more robust
  const handleBackToGroup = () => {
    try {
      // Navigate back to group page with clean state
      navigate(`/groups/${groupId}`, { 
        replace: true  // Use replace to avoid history stacking issues
      });
    } catch (err) {
      console.error("Navigation error:", err);
      // Fallback navigation
      window.location.href = `/groups/${groupId}`;
    }
  };
  
  return (
    <PageContainer>
      <Header>
        <Logo onClick={() => handleNavigate('/dashboard')}>HangoutAI</Logo>
        <Navigation>
          <NavItem onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem active onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <UserName>{user.name}</UserName>
          <UserAvatar onClick={toggleUserMenu}>
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarPlaceholder>{user.name.charAt(0)}</AvatarPlaceholder>
            )}
          </UserAvatar>
          {showUserMenu && (
            <UserMenu>
              <UserMenuItem>Profile</UserMenuItem>
              <UserMenuItem>Settings</UserMenuItem>
              <UserMenuDivider />
              <UserMenuItem>Logout</UserMenuItem>
            </UserMenu>
          )}
        </UserSection>
      </Header>
      
      <ContentContainer>
        <BreadcrumbNav>
          <BreadcrumbLink onClick={() => handleNavigate('/groups')}>Groups</BreadcrumbLink>
          <BreadcrumbSeparator>›</BreadcrumbSeparator>
          <BreadcrumbLink onClick={() => handleNavigate(`/groups/${groupId}`)}>
            {group?.name || 'Group Details'}
          </BreadcrumbLink>
          <BreadcrumbSeparator>›</BreadcrumbSeparator>
          <BreadcrumbCurrent>Recommendations</BreadcrumbCurrent>
        </BreadcrumbNav>
        
        {isGroupHangout && (
          <GroupHangoutBanner>
            <BannerIcon>{allResponsesReceived ? '🎉' : '⏳'}</BannerIcon>
            <BannerContent>
              <BannerTitle>
                {allResponsesReceived 
                  ? 'All members have submitted their preferences!' 
                  : 'Group Hangout in Progress'}
              </BannerTitle>
              <BannerText>
                {allResponsesReceived
                  ? 'These recommendations are based on everyone\'s combined preferences.'
                  : `${responsesCount} of ${membersCount} members have responded. ${isCreator ? 'As the organizer, you can view preliminary results.' : ''}`}
              </BannerText>
            </BannerContent>
          </GroupHangoutBanner>
        )}
        
        <ResultsTitle>Hangout Recommendations for {group?.name || 'Your Group'}</ResultsTitle>
        
        {loading ? (
          <LoadingContainer>
            <LoadingText>Finding the perfect hangout spots...</LoadingText>
          </LoadingContainer>
        ) : recommendations.length === 0 ? (
          <NoResultsContainer>
            <NoResultsIcon>😕</NoResultsIcon>
            <NoResultsTitle>No matching recommendations found</NoResultsTitle>
            <NoResultsText>Try adjusting your preferences or increasing your distance radius.</NoResultsText>
            <NewRecommendationButton onClick={() => navigate(`/groups/${groupId}/recommend`)}>
              Try Again
            </NewRecommendationButton>
          </NoResultsContainer>
        ) : (
          <ResultsLayout>
            <RecommendationsList>
              {recommendations.map((recommendation, index) => (
                <RecommendationCard 
                  key={recommendation.id}
                  onClick={() => handleSelectRecommendation(recommendation)}
                  selected={selectedRecommendation?.id === recommendation.id}
                >
                  <RecNumberBadge>{index + 1}</RecNumberBadge>
                  <RecImage style={{ backgroundImage: `url(${recommendation.image})` }}>
                    <RecImageOverlay />
                  </RecImage>
                  <RecContent>
                    <RecName>{recommendation.name}</RecName>
                    <RecDetails>
                      <RecType>{recommendation.type}</RecType>
                      <RecDetailsDot>•</RecDetailsDot>
                      <RecPrice>{recommendation.priceCategory}</RecPrice>
                      <RecDetailsDot>•</RecDetailsDot>
                      <RecDistance>{recommendation.distance} miles</RecDistance>
                    </RecDetails>
                    <RecRating>
                      <RecRatingStars>★★★★★</RecRatingStars>
                      <RecRatingValue>{recommendation.rating}</RecRatingValue>
                      <RecReviewCount>({recommendation.reviewCount})</RecReviewCount>
                    </RecRating>
                    <RecTags>
                      {recommendation.tags.map(tag => (
                        <RecTag key={tag}>{tag}</RecTag>
                      ))}
                    </RecTags>
                  </RecContent>
                </RecommendationCard>
              ))}
            </RecommendationsList>
            
            <MapSection>
              <MapContainer ref={mapContainer}>
                {!mapLoaded && (
                  <MapLoadingIndicator>
                    Loading map...
                  </MapLoadingIndicator>
                )}
              </MapContainer>
              
              {selectedRecommendation && (
                <DetailPanel>
                  <DetailHeader>
                    <DetailName>{selectedRecommendation.name}</DetailName>
                    <DetailType>{selectedRecommendation.type}</DetailType>
                  </DetailHeader>
                  
                  <DetailDescription>
                    {selectedRecommendation.description}
                  </DetailDescription>
                  
                  <DetailStats>
                    <DetailStat>
                      <DetailStatIcon>💰</DetailStatIcon>
                      <DetailStatValue>
                        {selectedRecommendation.priceCategory} · Around ${selectedRecommendation.price} per person
                      </DetailStatValue>
                    </DetailStat>
                    <DetailStat>
                      <DetailStatIcon>📍</DetailStatIcon>
                      <DetailStatValue>
                        {selectedRecommendation.distance} miles away
                      </DetailStatValue>
                    </DetailStat>
                    <DetailStat>
                      <DetailStatIcon>⭐</DetailStatIcon>
                      <DetailStatValue>
                        {selectedRecommendation.rating} stars · {selectedRecommendation.reviewCount} reviews
                      </DetailStatValue>
                    </DetailStat>
                  </DetailStats>
                  
                  <GetDirectionsButton onClick={handleGetDirections}>
                    Get Directions
                  </GetDirectionsButton>
                </DetailPanel>
              )}
            </MapSection>
          </ResultsLayout>
        )}
        
        {/* AI suggestion section */}
        {aiSuggestion && (
          <AISuggestionContainer>
            <AISuggestionHeader>
              <AISuggestionIcon>✨</AISuggestionIcon>
              <AISuggestionTitle>AI-Suggested Itinerary</AISuggestionTitle>
            </AISuggestionHeader>
            <AISuggestionText>{aiSuggestion}</AISuggestionText>
          </AISuggestionContainer>
        )}
        
        <ButtonGroup>
          <BackToGroupButton onClick={handleBackToGroup}>
            Back to Group
          </BackToGroupButton>
          <NewRecommendationButton onClick={() => navigate(`/groups/${groupId}/recommend`)}>
            New Recommendation
          </NewRecommendationButton>
        </ButtonGroup>
      </ContentContainer>
    </PageContainer>
  );
};

// Styled components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f7f9fc;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 30px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavItem = styled.div`
  padding: 8px 0;
  color: ${props => props.active ? '#6e8efb' : '#666'};
  font-weight: ${props => props.active ? '600' : '500'};
  border-bottom: ${props => props.active ? '2px solid #6e8efb' : 'none'};
  cursor: pointer;
  
  &:hover {
    color: #6e8efb;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const UserName = styled.div`
  margin-right: 10px;
  color: #333;
  font-weight: 500;
  
  @media (max-width: 480px) {
    display: none;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  font-weight: 600;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.2rem;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 55px;
  right: 0;
  width: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  z-index: 10;
  overflow: hidden;
`;

const UserMenuItem = styled.div`
  padding: 12px 15px;
  color: #333;
  cursor: pointer;
  
  &:hover {
    background: #f5f7fa;
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background: #eee;
  margin: 5px 0;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  color: #666;
  font-size: 0.9rem;
`;

const BreadcrumbLink = styled.span`
  cursor: pointer;
  
  &:hover {
    color: #6e8efb;
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 10px;
`;

const BreadcrumbCurrent = styled.span`
  color: #333;
  font-weight: 600;
`;

const ResultsTitle = styled.h1`
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 30px;
`;

const ResultsLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const RecommendationCard = styled.div`
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: ${props => props.selected ? '2px solid #6e8efb' : '2px solid transparent'};
  box-shadow: ${props => props.selected ? '0 5px 20px rgba(110, 142, 251, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.05)'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RecNumberBadge = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 24px;
  height: 24px;
  background: #6e8efb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  z-index: 1;
`;

const RecImage = styled.div`
  width: 120px;
  background-size: cover;
  background-position: center;
  position: relative;
  
  @media (max-width: 600px) {
    width: 80px;
  }
`;

const RecImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
`;

const RecContent = styled.div`
  padding: 15px;
  flex: 1;
`;

const RecName = styled.h3`
  margin: 0 0 5px;
  font-size: 1.1rem;
  color: #333;
`;

const RecDetails = styled.div`
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 8px;
`;

const RecDetailsDot = styled.span`
  margin: 0 5px;
`;

const RecType = styled.span``;
const RecPrice = styled.span``;
const RecDistance = styled.span``;

const RecRating = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  margin-bottom: 10px;
`;

const RecRatingStars = styled.div`
  color: #ffc107;
  margin-right: 5px;
`;

const RecRatingValue = styled.span`
  font-weight: 600;
  margin-right: 3px;
`;

const RecReviewCount = styled.span`
  color: #999;
`;

const RecTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const RecTag = styled.span`
  background: #f0f7ff;
  color: #6e8efb;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 12px;
`;

const MapSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MapContainer = styled.div`
  height: 350px;
  background: #f0f0f0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
`;

const MapLoadingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1;
`;

const DetailPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const DetailHeader = styled.div`
  margin-bottom: 15px;
`;

const DetailName = styled.h2`
  margin: 0 0 5px;
  font-size: 1.4rem;
  color: #333;
`;

const DetailType = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const DetailDescription = styled.p`
  color: #444;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const DetailStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const DetailStat = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DetailStatIcon = styled.span`
  font-size: 1.2rem;
`;

const DetailStatValue = styled.span`
  color: #555;
`;

const GetDirectionsButton = styled.button`
  width: 100%;
  background: #6e8efb;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #5a7ce0;
  }
`;

const AISuggestionContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #a777e3;
`;

const AISuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
`;

const AISuggestionIcon = styled.span`
  font-size: 1.5rem;
  margin-right: 12px;
  color: #a777e3;
`;

const AISuggestionTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #333;
`;

const AISuggestionText = styled.p`
  color: #555;
  line-height: 1.7;
  font-size: 1.05rem;
  margin: 0;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
`;

const BackToGroupButton = styled.button`
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f5f7fa;
  }
`;

const NewRecommendationButton = styled.button`
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 1.1rem;
`;

const NoResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const NoResultsIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const NoResultsTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 10px;
`;

const NoResultsText = styled.p`
  color: #666;
  margin-bottom: 25px;
`;

const GroupHangoutBanner = styled.div`
  display: flex;
  align-items: center;
  background: #f0f7ff;
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 25px;
  border: 1px solid #dceaff;
`;

const BannerIcon = styled.div`
  font-size: 2rem;
  margin-right: 15px;
`;

const BannerContent = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h3`
  margin: 0 0 5px;
  color: #4b74c9;
`;

const BannerText = styled.p`
  margin: 0;
  color: #666;
`;

export default RecommendationResults; 