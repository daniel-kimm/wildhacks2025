import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '../utils/mapboxStyles.css';
import { supabase } from '../utils/supabaseClient';
import { generateChatCompletion } from '../lib/openai';

// Set your Mapbox access token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const Recommendations = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Check if Mapbox GL is supported
  useEffect(() => {
    if (!mapboxgl.supported()) {
      setError('Your browser does not support Mapbox GL');
      setIsLoading(false);
      return;
    }
  }, []);

  // Load user data and generate recommendations
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!authUser) {
          navigate('/login');
          return;
        }
        
        // Get user profile with interests
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profileError) throw profileError;
        
        setUser({
          id: authUser.id,
          name: profile.name || authUser.email?.split('@')[0] || 'User',
          avatar: profile.avatar_url,
          interests: profile.interests || []
        });
        
        // Get user's current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lng: position.coords.longitude,
                lat: position.coords.latitude
              });
              
              // Generate recommendations based on user interests and location
              generateRecommendations(profile.interests || [], {
                lng: position.coords.longitude,
                lat: position.coords.latitude
              });
            },
            (error) => {
              console.error('Error getting location:', error);
              // Use default location if geolocation fails
              setUserLocation({ lng: -87.6298, lat: 41.8781 }); // Chicago coordinates
              generateRecommendations(profile.interests || [], { lng: -87.6298, lat: 41.8781 });
            }
          );
        } else {
          // Use default location if geolocation is not supported
          setUserLocation({ lng: -87.6298, lat: 41.8781 }); // Chicago coordinates
          generateRecommendations(profile.interests || [], { lng: -87.6298, lat: 41.8781 });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('Failed to load user data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [navigate]);

  // Generate recommendations using OpenAI
  const generateRecommendations = async (interests, location) => {
    try {
      // Create a prompt for OpenAI
      const prompt = `
        I'm looking for places to visit near my location (latitude: ${location.lat}, longitude: ${location.lng}).
        My interests include: ${interests.join(', ')}.
        
        Please recommend 5 places that match my interests. For each place, provide:
        - Name
        - Category (e.g., Restaurant, Park, Museum, etc.)
        - Brief description
        - Approximate price range ($, $$, $$$, or $$$$)
        - Best time to visit (Morning, Afternoon, Evening, or Any time)
        - Approximate coordinates (latitude and longitude) within 10 miles of my location
        
        Format the response as a JSON array with the following structure:
        [
          {
            "name": "Place Name",
            "category": "Category",
            "description": "Brief description",
            "price": "$",
            "bestTime": "Morning",
            "coordinates": {
              "lat": latitude,
              "lng": longitude
            }
          },
          ...
        ]
      `;
      
      // Call OpenAI API
      const response = await generateChatCompletion([
        { role: "system", content: "You are a helpful assistant that provides personalized recommendations for places to visit." },
        { role: "user", content: prompt }
      ]);
      
      // Parse the response
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const recommendationsData = JSON.parse(jsonMatch[0]);
          setRecommendations(recommendationsData);
        } else {
          // Fallback to sample recommendations if parsing fails
          setRecommendations([
            {
              name: "Central Park",
              category: "Park",
              description: "A large urban park with walking trails, lakes, and recreational areas.",
              price: "$",
              bestTime: "Any time",
              coordinates: {
                lat: location.lat + 0.01,
                lng: location.lng + 0.01
              }
            },
            {
              name: "Local Art Museum",
              category: "Museum",
              description: "A museum featuring local and international art exhibitions.",
              price: "$$",
              bestTime: "Afternoon",
              coordinates: {
                lat: location.lat - 0.01,
                lng: location.lng - 0.01
              }
            },
            {
              name: "Craft Beer Pub",
              category: "Restaurant",
              description: "A cozy pub serving craft beers and pub food.",
              price: "$$",
              bestTime: "Evening",
              coordinates: {
                lat: location.lat + 0.02,
                lng: location.lng - 0.02
              }
            }
          ]);
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        // Fallback to sample recommendations
        setRecommendations([
          {
            name: "Central Park",
            category: "Park",
            description: "A large urban park with walking trails, lakes, and recreational areas.",
            price: "$",
            bestTime: "Any time",
            coordinates: {
              lat: location.lat + 0.01,
              lng: location.lng + 0.01
            }
          },
          {
            name: "Local Art Museum",
            category: "Museum",
            description: "A museum featuring local and international art exhibitions.",
            price: "$$",
            bestTime: "Afternoon",
            coordinates: {
              lat: location.lat - 0.01,
              lng: location.lng - 0.01
            }
          },
          {
            name: "Craft Beer Pub",
            category: "Restaurant",
            description: "A cozy pub serving craft beers and pub food.",
            price: "$$",
            bestTime: "Evening",
            coordinates: {
              lat: location.lat + 0.02,
              lng: location.lng - 0.02
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to sample recommendations
      setRecommendations([
        {
          name: "Central Park",
          category: "Park",
          description: "A large urban park with walking trails, lakes, and recreational areas.",
          price: "$",
          bestTime: "Any time",
          coordinates: {
            lat: location.lat + 0.01,
            lng: location.lng + 0.01
          }
        },
        {
          name: "Local Art Museum",
          category: "Museum",
          description: "A museum featuring local and international art exhibitions.",
          price: "$$",
          bestTime: "Afternoon",
          coordinates: {
            lat: location.lat - 0.01,
            lng: location.lng - 0.01
          }
        },
        {
          name: "Craft Beer Pub",
          category: "Restaurant",
          description: "A cozy pub serving craft beers and pub food.",
          price: "$$",
          bestTime: "Evening",
          coordinates: {
            lat: location.lat + 0.02,
            lng: location.lng - 0.02
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize map when container is available
  useEffect(() => {
    if (!mapContainer.current || map.current || !userLocation) return;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add user location marker
    const userMarker = new mapboxgl.Marker({ color: '#4CAF50' })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<h3>You are here</h3>'))
      .addTo(map.current);
    
    markers.current.push(userMarker);
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [userLocation]);

  // Add recommendation markers when recommendations change
  useEffect(() => {
    if (!map.current || !recommendations.length) return;
    
    // Clear existing recommendation markers
    markers.current.forEach(marker => {
      if (marker !== markers.current[0]) { // Keep the user marker
        marker.remove();
      }
    });
    
    markers.current = [markers.current[0]]; // Keep only the user marker
    
    // Add markers for each recommendation
    recommendations.forEach((rec, index) => {
      const marker = new mapboxgl.Marker({ color: '#2196F3' })
        .setLngLat([rec.coordinates.lng, rec.coordinates.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <h3>${rec.name}</h3>
              <p><strong>Category:</strong> ${rec.category}</p>
              <p><strong>Price:</strong> ${rec.price}</p>
              <p><strong>Best Time:</strong> ${rec.bestTime}</p>
              <p>${rec.description}</p>
            `)
        )
        .addTo(map.current);
      
      marker.getElement().addEventListener('click', () => {
        setSelectedRecommendation(rec);
      });
      
      markers.current.push(marker);
    });
    
    // Fit map to show all markers
    if (markers.current.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [recommendations]);

  const handleRecommendationClick = (recommendation) => {
    setSelectedRecommendation(recommendation);
    
    // Fly to the selected recommendation
    if (map.current) {
      map.current.flyTo({
        center: [recommendation.coordinates.lng, recommendation.coordinates.lat],
        zoom: 14,
        essential: true
      });
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={handleBackToDashboard}>← Back to Dashboard</BackButton>
        <Title>Personalized Recommendations</Title>
      </Header>
      
      {isLoading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Generating personalized recommendations...</LoadingText>
        </LoadingContainer>
      ) : error ? (
        <ErrorContainer>
          <ErrorMessage>{error}</ErrorMessage>
          <RetryButton onClick={() => window.location.reload()}>Retry</RetryButton>
        </ErrorContainer>
      ) : (
        <ContentContainer>
          <MapContainer ref={mapContainer} />
          
          <RecommendationsList>
            <RecommendationsTitle>Recommended Places</RecommendationsTitle>
            <RecommendationsSubtitle>
              Based on your interests: {user?.interests?.join(', ') || 'No interests specified'}
            </RecommendationsSubtitle>
            
            {recommendations.map((rec, index) => (
              <RecommendationCard 
                key={index}
                selected={selectedRecommendation === rec}
                onClick={() => handleRecommendationClick(rec)}
              >
                <RecommendationHeader>
                  <RecommendationName>{rec.name}</RecommendationName>
                  <RecommendationCategory>{rec.category}</RecommendationCategory>
                </RecommendationHeader>
                
                <RecommendationDescription>{rec.description}</RecommendationDescription>
                
                <RecommendationDetails>
                  <DetailItem>
                    <DetailLabel>Price:</DetailLabel>
                    <DetailValue>{rec.price}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>Best Time:</DetailLabel>
                    <DetailValue>{rec.bestTime}</DetailValue>
                  </DetailItem>
                </RecommendationDetails>
              </RecommendationCard>
            ))}
          </RecommendationsList>
        </ContentContainer>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 15px 30px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #6e8efb;
  font-weight: 600;
  cursor: pointer;
  padding: 5px 10px;
  margin-right: 20px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
  border-radius: 12px;
  margin: 20px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    height: 300px;
    margin: 10px;
  }
`;

const RecommendationsList = styled.div`
  width: 350px;
  padding: 20px;
  background: white;
  overflow-y: auto;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    width: 100%;
    height: 300px;
  }
`;

const RecommendationsTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px 0;
`;

const RecommendationsSubtitle = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 20px 0;
`;

const RecommendationCard = styled.div`
  background: ${props => props.selected ? '#f0f7ff' : 'white'};
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.selected ? '#6e8efb' : 'transparent'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const RecommendationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const RecommendationName = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const RecommendationCategory = styled.span`
  font-size: 0.8rem;
  color: white;
  background: #6e8efb;
  padding: 3px 8px;
  border-radius: 12px;
`;

const RecommendationDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 10px 0;
  line-height: 1.4;
`;

const RecommendationDetails = styled.div`
  display: flex;
  justify-content: space-between;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  color: #888;
  margin-right: 5px;
`;

const DetailValue = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  color: #333;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const LoadingSpinner = styled.div`
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #6e8efb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 20px;
  color: #666;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 20px;
  text-align: center;
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const RetryButton = styled.button`
  background: #6e8efb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #5d7dea;
  }
`;

export default Recommendations; 