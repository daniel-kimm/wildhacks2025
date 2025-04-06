import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

// Correct component name!
const RecommendationResults = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId;
  
  console.log("RecommendationResults component mounted");
  console.log("Group ID:", groupId);
  console.log("Request ID from state:", requestId);

  const [group, setGroup] = useState(null);
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Results state
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [errorState, setErrorState] = useState(null);
  const [responseData, setResponseData] = useState([]);
  
  // Weather state (keeping this from form)
  const [temperature, setTemperature] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);

  useEffect(() => {
    console.log("RecommendationResults useEffect running");
    try {
      const fetchUserData = async () => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (!authUser) {
            navigate('/login');
            return;
          }
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (profileData) {
            setUser({
              id: authUser.id,
              name: profileData.name || authUser.email?.split('@')[0] || 'User',
              avatar: profileData.avatar_url || 'https://via.placeholder.com/40'
            });
          }
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      };

      const fetchGroupDetails = async () => {
        try {
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();
          
          if (groupError) {
            throw groupError;
          }
          
          if (!groupData) {
            throw new Error('Group not found');
          }
          
          setGroup(groupData);
        } catch (err) {
          console.error('Error fetching group details:', err);
        }
      };

      // Fetch responses for this request
      const fetchResponses = async () => {
        if (!requestId) {
          console.error("No request ID provided in location state");
          setErrorState('No hangout request specified');
          setLoading(false);
          return;
        }
        
        try {
          console.log('Fetching responses for request:', requestId);
          const { data, error } = await supabase
            .from('hangout_responses')
            .select('*')
            .eq('request_id', requestId);
            
          if (error) throw error;
          
          console.log('Response data:', data);
          
          if (!data || data.length === 0) {
            console.log('No responses found');
            setResponseData([{
              form_data: {
                priceLimit: 50,
                distanceLimit: 5,
                timeOfDay: 12,
                preferences: ''
              }
            }]);
          } else {
            console.log('Found responses:', data.length);
            setResponseData(data);
          }
          
          // Generate mock recommendations regardless of data
          generateRecommendations(data || []);
        } catch (err) {
          console.error('Error fetching responses:', err);
          setErrorState('Failed to load hangout responses');
          setLoading(false);
        }
      };

      fetchUserData();
      fetchGroupDetails();
      fetchResponses();
      getWeatherData();
    } catch (err) {
      console.error("Critical error in useEffect:", err);
      setErrorState("An unexpected error occurred. Please try refreshing the page.");
    }
  }, [groupId, navigate, requestId]);

  // Update the getWeatherData function to use real location data
  const getWeatherData = () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null); // Reset any previous errors
      
      console.log("Attempting to get location for weather data...");
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log("Location obtained:", latitude, longitude);
              
              // Update to request temperature in Fahrenheit
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`;
              
              console.log("Fetching weather from API:", url);
              
              const response = await fetch(url);
              
              if (!response.ok) {
                throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
              }
              
              const data = await response.json();
              console.log("Weather data received:", data);
              
              if (data && data.current_weather && typeof data.current_weather.temperature !== 'undefined') {
                setTemperature(data.current_weather.temperature);
                setWeatherLoading(false);
              } else {
                throw new Error('Unexpected API response structure');
              }
            } catch (err) {
              console.error('Error fetching weather:', err);
              setWeatherError('Weather information unavailable');
              setWeatherLoading(false);
            }
          },
          (err) => {
            console.error('Geolocation permission error:', err);
            setWeatherError('Location access denied');
            setWeatherLoading(false);
          }
        );
      } else {
        setWeatherError('Geolocation not supported');
        setWeatherLoading(false);
      }
    } catch (err) {
      console.error('Critical error in getWeatherData:', err);
      setWeatherError('Failed to get weather');
      setWeatherLoading(false);
    }
  };

  // Generate recommendations based on all responses
  const generateRecommendations = (responses) => {
    try {
      // For testing, always generate mock recommendations
      const mockRecommendations = [
        {
          id: 1,
          name: 'Central Park Picnic',
          description: 'Enjoy a relaxing picnic in the beautiful Central Park.',
          priceEstimate: '$25-40 per person',
          distance: '2.3 miles',
          rating: 4.8,
          type: 'Outdoor',
          imageUrl: 'https://images.unsplash.com/photo-1617369120004-4fc70312c5e6'
        },
        {
          id: 2,
          name: 'Art Gallery Tour',
          description: 'Explore the latest contemporary art exhibitions at local galleries.',
          priceEstimate: '$15-30 per person',
          distance: '1.8 miles',
          rating: 4.6,
          type: 'Cultural',
          imageUrl: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4'
        },
        {
          id: 3,
          name: 'Rooftop Brunch',
          description: 'Savor delicious brunch with stunning city views from a rooftop restaurant.',
          priceEstimate: '$35-50 per person',
          distance: '3.1 miles',
          rating: 4.7,
          type: 'Food & Drink',
          imageUrl: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d'
        }
      ];
      
      setRecommendations(mockRecommendations);
      setLoading(false);
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setErrorState('Failed to generate recommendations');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleGoBack = () => {
    navigate(`/groups/${groupId}`);
  };

  // Format time of day from 0-24 to display time
  const formatTimeOfDay = (value) => {
    const hour = Math.floor(value);
    const minutes = Math.round((value - hour) * 60);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (errorState) {
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
            <UserName>User</UserName>
            <UserAvatar>
              <AvatarPlaceholder>U</AvatarPlaceholder>
            </UserAvatar>
          </UserSection>
        </Header>
        <ContentContainer>
          <ErrorState>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorText>{errorState}</ErrorText>
            <BackButton onClick={() => navigate(`/groups/${groupId}`)}>Back to Group</BackButton>
          </ErrorState>
        </ContentContainer>
      </PageContainer>
    );
  }

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
          <UserAvatar onClick={() => setShowUserMenu(!showUserMenu)}>
            {typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt="User avatar" />
            ) : (
              <AvatarPlaceholder>{user.name.charAt(0)}</AvatarPlaceholder>
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

      <ContentContainer>
        <BreadcrumbNav>
          <BreadcrumbLink onClick={() => navigate('/groups')}>Groups</BreadcrumbLink>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbLink onClick={handleGoBack}>{group?.name}</BreadcrumbLink>
          <BreadcrumbSeparator>/</BreadcrumbSeparator>
          <BreadcrumbCurrent>Hangout Recommendations</BreadcrumbCurrent>
        </BreadcrumbNav>
        
        <ResultsCard>
          <ResultsHeader>
            <ResultsTitle>Hangout Recommendations</ResultsTitle>
            {weatherLoading ? (
              <WeatherInfo>
                <WeatherIcon>⏳</WeatherIcon>
                <WeatherTemp>Loading weather...</WeatherTemp>
              </WeatherInfo>
            ) : weatherError ? (
              <WeatherInfo>
                <WeatherIcon>⚠️</WeatherIcon>
                <WeatherTemp>{weatherError}</WeatherTemp>
              </WeatherInfo>
            ) : (
              <WeatherInfo>
                <WeatherIcon>🌡️</WeatherIcon>
                <WeatherTemp>{Math.round(temperature)}°F</WeatherTemp>
                <WeatherLocation>around you</WeatherLocation>
              </WeatherInfo>
            )}
          </ResultsHeader>
          
          <ResultsDescription>
            Based on everyone's preferences, here are the top recommendations for your group!
          </ResultsDescription>
          
          {loading ? (
            <LoadingContainer>
              <LoadingSpinner />
              <LoadingText>Generating recommendations...</LoadingText>
            </LoadingContainer>
          ) : (
            <>
              <ResponseStats>
                <ResponseStat>
                  <ResponseStatLabel>Responses</ResponseStatLabel>
                  <ResponseStatValue>{responseData.length}</ResponseStatValue>
                </ResponseStat>
                <ResponseStat>
                  <ResponseStatLabel>Avg. Budget</ResponseStatLabel>
                  <ResponseStatValue>
                    ${Math.round(responseData.reduce((sum, r) => sum + (r.form_data?.priceLimit || 0), 0) / responseData.length || 50)}
                  </ResponseStatValue>
                </ResponseStat>
                <ResponseStat>
                  <ResponseStatLabel>Preferred Time</ResponseStatLabel>
                  <ResponseStatValue>
                    {formatTimeOfDay(responseData.reduce((sum, r) => sum + (r.form_data?.timeOfDay || 0), 0) / responseData.length || 12)}
                  </ResponseStatValue>
                </ResponseStat>
              </ResponseStats>
            
              <RecommendationsList>
                {recommendations.map(rec => (
                  <RecommendationCard key={rec.id}>
                    <RecommendationImage imageUrl={rec.imageUrl} />
                    <RecommendationContent>
                      <RecommendationName>{rec.name}</RecommendationName>
                      <RecommendationDetails>
                        <RecommendationDetail>
                          <RecommendationDetailIcon>💰</RecommendationDetailIcon>
                          {rec.priceEstimate}
                        </RecommendationDetail>
                        <RecommendationDetail>
                          <RecommendationDetailIcon>📍</RecommendationDetailIcon>
                          {rec.distance} away
                        </RecommendationDetail>
                        <RecommendationDetail>
                          <RecommendationDetailIcon>🏷️</RecommendationDetailIcon>
                          {rec.type}
                        </RecommendationDetail>
                      </RecommendationDetails>
                      <RecommendationDescription>
                        {rec.description}
                      </RecommendationDescription>
                    </RecommendationContent>
                  </RecommendationCard>
                ))}
              </RecommendationsList>
              
              <ButtonGroup>
                <BackToGroupButton onClick={() => navigate(`/groups/${groupId}`)}>
                  Back to Group
                </BackToGroupButton>
              </ButtonGroup>
            </>
          )}
        </ResultsCard>
      </ContentContainer>
    </PageContainer>
  );
};

// The styled components
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const Logo = styled.div`
  font-weight: 700;
  font-size: 1.5rem;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 30px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const NavItem = styled.div`
  font-weight: 500;
  position: relative;
  padding: 5px 0;
  cursor: pointer;
  color: ${props => props.active ? '#6e8efb' : '#333'};
  
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
  position: relative;
  
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

const ContentContainer = styled.main`
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
`;

const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 0.9rem;
`;

const BreadcrumbLink = styled.a`
  color: #6e8efb;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 8px;
  color: #999;
`;

const BreadcrumbCurrent = styled.span`
  color: #666;
  font-weight: 500;
`;

const ResultsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
`;

const ResultsTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ResultsDescription = styled.p`
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const WeatherInfo = styled.div`
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.9rem;
  padding: 8px 15px;
  background: #f7f9fc;
  border-radius: 20px;
`;

const WeatherIcon = styled.span`
  margin-right: 5px;
  font-size: 1.2rem;
`;

const WeatherTemp = styled.span`
  font-weight: 600;
  margin-right: 5px;
`;

const WeatherLocation = styled.span`
  color: #888;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #6e8efb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1rem;
`;

const ResponseStats = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  
  @media (max-width: 600px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ResponseStat = styled.div`
  flex: 1;
  background: #f7f9fc;
  border-radius: 8px;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
`;

const ResponseStatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const ResponseStatValue = styled.div`
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
`;

const RecommendationCard = styled.div`
  display: flex;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

const RecommendationImage = styled.div`
  width: 200px;
  min-height: 200px;
  background-image: url(${props => props.imageUrl});
  background-size: cover;
  background-position: center;
  
  @media (max-width: 700px) {
    width: 100%;
    height: 150px;
  }
`;

const RecommendationContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const RecommendationName = styled.h3`
  margin: 0 0 10px;
  font-size: 1.3rem;
  color: #333;
`;

const RecommendationDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
`;

const RecommendationDetail = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
`;

const RecommendationDetailIcon = styled.span`
  margin-right: 5px;
`;

const RecommendationDescription = styled.p`
  color: #555;
  margin: 0 0 20px;
  line-height: 1.5;
  flex-grow: 1;
`;

const RecommendationActions = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const RecommendationAction = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  
  background: ${props => props.primary ? 'linear-gradient(to right, #6e8efb, #a777e3)' : 'white'};
  color: ${props => props.primary ? 'white' : '#666'};
  border: ${props => props.primary ? 'none' : '1px solid #ddd'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.primary ? 
      '0 4px 10px rgba(110, 142, 251, 0.3)' : 
      '0 4px 10px rgba(0, 0, 0, 0.05)'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const BackToGroupButton = styled.button`
  padding: 12px 20px;
  background: #f0f2f5;
  color: #333;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #e4e6e9;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  padding: 40px;
  margin-top: 50px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const ErrorText = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 25px;
`;

const BackButton = styled.button`
  background-color: #6e8efb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #5a7ce0;
  }
`;

// Make sure to export the component with the correct name!
export default RecommendationResults;