import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { generateChatCompletion } from '../lib/openai';
import { FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa';

// Simple token definition
mapboxgl.accessToken = "pk.eyJ1Ijoiem91ZHluYXN0eSIsImEiOiJjbTk1MHBkanIxM2JxMmluN3NyNnNidTI5In0.1LL1jCv4LMiOLUoLgw_77g";

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
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  
  // Map refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  
  // Load basic mock data on initial load
  useEffect(() => {
    console.log("Initial load useEffect triggered");
    
    const loadMockData = async () => {
      try {
        // Get user info
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUser({
              id: user.id,
              name: user.user_metadata?.full_name || user.email,
              avatar: user.user_metadata?.avatar_url || 'https://via.placeholder.com/40'
            });
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
        
        // Load mock recommendations
        const mockRecommendations = [
          {
            id: 1,
            name: "Central Park Picnic",
            type: "Outdoor Activity",
            price: 15,
            priceCategory: "$",
            distance: 1.2,
            description: "Enjoy a relaxing picnic in the park with beautiful scenery and plenty of space for games.",
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
            image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80",
            tags: ["Water", "Adventure", "Active"],
            location: { lat: 40.7023, lng: -74.0121 }
          }
        ];
        
        setRecommendations(mockRecommendations);
        setSelectedRecommendation(mockRecommendations[0]);
        setAiSuggestion("For an ideal day out with your group, consider starting with Central Park Picnic for some relaxation in nature, followed by an exciting Harbor Kayaking adventure. You could finish the day at Downtown Arcade for games and drinks.");
        
        // Finish loading
        setLoading(false);
      } catch (error) {
        console.error("Error in loadMockData:", error);
        setLoading(false);
      }
    };
    
    loadMockData();
  }, []);
  
  // Simple map initialization - separate from data loading
  useEffect(() => {
    if (map.current) return; // already initialized
    if (!mapContainer.current) return; // container not ready
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.0060, 40.7128], // NYC
        zoom: 10
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl());
      
      // Clean up on unmount
      return () => {
        if (map.current) {
          map.current.remove();
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);
  
  // Add markers when recommendations change
  useEffect(() => {
    if (!map.current || !recommendations.length) return;
    
    try {
      // Wait for map to be ready
      map.current.on('load', () => {
        // Add markers for recommendations
        recommendations.forEach(rec => {
          if (rec.location) {
            new mapboxgl.Marker()
              .setLngLat([rec.location.lng, rec.location.lat])
              .setPopup(new mapboxgl.Popup().setText(rec.name))
              .addTo(map.current);
          }
        });
        
        // Fit map to markers
        const bounds = new mapboxgl.LngLatBounds();
        recommendations.forEach(rec => {
          if (rec.location) {
            bounds.extend([rec.location.lng, rec.location.lat]);
          }
        });
        
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 50 });
        }
      });
    } catch (error) {
      console.error("Error adding markers:", error);
    }
  }, [recommendations]);
  
  // Handle recommendation selection
  const handleSelectRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
    
    if (map.current && recommendation.location) {
      try {
        map.current.flyTo({
          center: [recommendation.location.lng, recommendation.location.lat],
          zoom: 14
        });
      } catch (error) {
        console.error("Error flying to location:", error);
      }
    }
  };
  
  // Navigate back to group or form
  const handleBackToGroup = () => {
    if (groupId) {
      navigate(`/group/${groupId}`);
    } else {
      navigate('/');
    }
  };
  
  // Navigate to new recommendation
  const handleNewRecommendation = () => {
    if (groupId) {
      navigate(`/group/${groupId}/hangout`);
    } else {
      navigate('/hangout');
    }
  };
  
  // Simple loading state
  if (loading) {
    return (
      <Layout>
        <ContentWrapper>
          <LoadingContainer>
            <LoadingText>Loading recommendations...</LoadingText>
          </LoadingContainer>
        </ContentWrapper>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header>
        <Logo onClick={() => navigate('/')}>Hangouts</Logo>
        <UserSection>
          <UserAvatar 
            src={user.avatar} 
            alt={user.name}
            onClick={() => setShowUserMenu(!showUserMenu)}
          />
        </UserSection>
      </Header>
      
      <ContentWrapper>
        <Breadcrumb>
          <BreadcrumbLink onClick={() => navigate('/')}>Home</BreadcrumbLink>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbCurrent>Recommendations</BreadcrumbCurrent>
        </Breadcrumb>
        
        <ResultsTitle>Your Perfect Hangout Spots</ResultsTitle>
        
        <ResultsLayout>
          <RecommendationsList>
            {recommendations.map((recommendation, index) => (
              <StyledRecommendationCard 
                key={recommendation.id}
                selected={selectedRecommendation?.id === recommendation.id}
                onClick={() => handleSelectRecommendation(recommendation)}
              >
                <RecNumberBadge>{index + 1}</RecNumberBadge>
                <RecImage style={{backgroundImage: `url(${recommendation.image})`}}>
                  <RecImageOverlay />
                </RecImage>
                <RecContent>
                  <RecName>{recommendation.name}</RecName>
                  <RecDetails>
                    <RecType>{recommendation.type}</RecType>
                    <RecDetailsDot>•</RecDetailsDot>
                    <RecPrice>{recommendation.priceCategory}</RecPrice>
                    <RecDetailsDot>•</RecDetailsDot>
                    <RecDistance>{recommendation.distance} mi</RecDistance>
                  </RecDetails>
                  <RecTags>
                    {recommendation.tags.map((tag, i) => (
                      <RecTag key={i}>{tag}</RecTag>
                    ))}
                  </RecTags>
                </RecContent>
              </StyledRecommendationCard>
            ))}
          </RecommendationsList>
          
          <MapSection>
            <div 
              ref={mapContainer} 
              style={{ 
                height: '600px', 
                width: '100%', 
                borderRadius: '12px',
                marginBottom: '20px'
              }} 
            />
            
            {selectedRecommendation && (
              <StyledDetailPanel>
                <DetailHeader>
                  <DetailName>{selectedRecommendation.name}</DetailName>
                  <DetailType>
                    {selectedRecommendation.type} • 
                    {selectedRecommendation.priceCategory} • 
                    {selectedRecommendation.distance} mi
                  </DetailType>
                </DetailHeader>
                
                <DetailDescription>
                  {selectedRecommendation.description}
                </DetailDescription>
                
                <DetailStats>
                  <DetailStat>
                    <DetailStatIcon>📍</DetailStatIcon>
                    <DetailStatValue>
                      {selectedRecommendation.address || "Location available on map"}
                    </DetailStatValue>
                  </DetailStat>
                  
                  <DetailStat>
                    <DetailStatIcon>💲</DetailStatIcon>
                    <DetailStatValue>
                      Average Price: ${selectedRecommendation.price}
                    </DetailStatValue>
                  </DetailStat>
                </DetailStats>
                
                <GetDirectionsButton 
                  onClick={() => {
                    if (selectedRecommendation.location) {
                      window.open(
                        `https://maps.google.com/maps?q=${selectedRecommendation.location.lat},${selectedRecommendation.location.lng}`,
                        '_blank'
                      );
                    }
                  }}
                >
                  Get Directions
                </GetDirectionsButton>
              </StyledDetailPanel>
            )}
          </MapSection>
        </ResultsLayout>
        
        <AISuggestionContainer>
          <AISuggestionHeader>
            <AISuggestionIcon>✨</AISuggestionIcon>
            <AISuggestionTitle>AI Suggestion</AISuggestionTitle>
          </AISuggestionHeader>
          <AISuggestionText>{aiSuggestion}</AISuggestionText>
        </AISuggestionContainer>
        
        <ButtonGroup>
          <BackToGroupButton onClick={handleBackToGroup}>
            {groupId ? 'Back to Group' : 'Back to Home'}
          </BackToGroupButton>
          <NewRecommendationButton onClick={handleNewRecommendation}>
            Get New Recommendations
          </NewRecommendationButton>
        </ButtonGroup>
      </ContentWrapper>
    </Layout>
  );
};

// Styled components
const Layout = styled.div`
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

const UserSection = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
`;

const Breadcrumb = styled.div`
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

const StyledRecommendationCard = styled.div`
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

const StyledDetailPanel = styled.div`
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

export default RecommendationResults; 