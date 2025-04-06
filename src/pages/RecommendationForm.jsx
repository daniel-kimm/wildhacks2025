import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const RecommendationForm = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const requestId = location.state?.requestId;
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Form state
  const [priceLimit, setPriceLimit] = useState(50);
  const [distanceLimit, setDistanceLimit] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState(12);
  const [preferences, setPreferences] = useState('');
  
  // Weather state
  const [temperature, setTemperature] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Add this at the top of your component
  const [errorState, setErrorState] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Wrap the entire useEffect in a try/catch
  useEffect(() => {
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

      fetchUserData();
      fetchGroupDetails();
      getWeatherData();
    } catch (err) {
      console.error("Critical error in useEffect:", err);
      setErrorState("An unexpected error occurred. Please try refreshing the page.");
    }
  }, [groupId, navigate]);

  // Modify the getWeatherData function to request Fahrenheit
  const getWeatherData = () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null); // Reset any previous errors
      
      console.log("Attempting to get location...");
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              console.log("Location obtained:", latitude, longitude);
              
              // Update to request temperature in Fahrenheit
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit`;
              
              console.log("Fetching weather from alternative API:", url);
              
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
            
            // More helpful error message based on the error code
            let errorMessage = 'Location access denied';
            
            if (err.code === 1) {
              errorMessage = 'Please allow location access in your browser';
            } else if (err.code === 2) {
              errorMessage = 'Location unavailable. Try again later';
            } else if (err.code === 3) {
              errorMessage = 'Location request timed out';
            }
            
            setWeatherError(errorMessage);
            setWeatherLoading(false);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
          }
        );
      } else {
        setWeatherError('Geolocation not supported by your browser');
        setWeatherLoading(false);
      }
    } catch (err) {
      console.error("Critical error in getWeatherData:", err);
      setWeatherError("Weather feature unavailable");
      setWeatherLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create the form data object
      const formData = {
        priceLimit,
        distanceLimit,
        timeOfDay,
        preferences
      };
      
      // If this is a response to a request, save it to the database
      if (requestId) {
        const { error } = await supabase
          .from('hangout_responses')
          .insert({
            request_id: requestId,
            user_id: user.id,
            form_data: formData
          });
          
        if (error) throw error;
      }
      
      // Navigate to the results page with the form data
      navigate(`/groups/${groupId}/recommendations`, { 
        state: { 
          ...formData,
          requestId 
        }
      });
    } catch (err) {
      console.error('Error submitting preferences:', err);
      alert('Failed to submit your preferences. Please try again.');
      setSubmitting(false);
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

  // Add a global error state check at the beginning of your render function
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
            <BackButton onClick={() => window.location.reload()}>Refresh Page</BackButton>
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
          <BreadcrumbCurrent>Recommend Hangout</BreadcrumbCurrent>
        </BreadcrumbNav>
        
        <FormCard>
          <FormHeader>
            <FormTitle>Customize Your Hangout</FormTitle>
            {weatherLoading ? (
              <WeatherInfo>
                <WeatherIcon>⏳</WeatherIcon>
                <WeatherTemp>Loading weather...</WeatherTemp>
              </WeatherInfo>
            ) : weatherError ? (
              <WeatherInfo>
                <WeatherIcon>⚠️</WeatherIcon>
                <WeatherTemp>{weatherError}</WeatherTemp>
                <RetryButton onClick={getWeatherData}>Retry</RetryButton>
              </WeatherInfo>
            ) : (
              <WeatherInfo>
                <WeatherIcon>🌡️</WeatherIcon>
                <WeatherTemp>{Math.round(temperature)}°F</WeatherTemp>
                <WeatherLocation>around you</WeatherLocation>
              </WeatherInfo>
            )}
          </FormHeader>
          
          <FormInstruction>
            Tell us your preferences, and we'll suggest the perfect hangout for your group!
          </FormInstruction>
          
          <RecommendForm onSubmit={handleSubmit}>
            <FormSection>
              <FormLabel>
                <FormLabelText>Price Limit: ${priceLimit}</FormLabelText>
              </FormLabel>
              <SliderContainer>
                <Slider 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5" 
                  value={priceLimit} 
                  onChange={(e) => setPriceLimit(parseInt(e.target.value))}
                />
                <SliderMarkers>
                  <SliderMarker>$0</SliderMarker>
                  <SliderMarker>$50</SliderMarker>
                  <SliderMarker>$100</SliderMarker>
                </SliderMarkers>
              </SliderContainer>
            </FormSection>
            
            <FormSection>
              <FormLabel>
                <FormLabelText>Distance Limit: {distanceLimit} miles</FormLabelText>
              </FormLabel>
              <SliderContainer>
                <Slider 
                  type="range" 
                  min="1" 
                  max="20" 
                  step="1" 
                  value={distanceLimit} 
                  onChange={(e) => setDistanceLimit(parseInt(e.target.value))}
                />
                <SliderMarkers>
                  <SliderMarker>1mi</SliderMarker>
                  <SliderMarker>10mi</SliderMarker>
                  <SliderMarker>20mi</SliderMarker>
                </SliderMarkers>
              </SliderContainer>
            </FormSection>
            
            <FormSection>
              <FormLabel>
                <FormLabelText>Time of Day: {formatTimeOfDay(timeOfDay)}</FormLabelText>
              </FormLabel>
              <SliderContainer>
                <Slider 
                  type="range" 
                  min="0" 
                  max="23.75" 
                  step="0.25" 
                  value={timeOfDay} 
                  onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
                />
                <SliderMarkers>
                  <SliderMarker>Morning</SliderMarker>
                  <SliderMarker>Afternoon</SliderMarker>
                  <SliderMarker>Evening</SliderMarker>
                </SliderMarkers>
              </SliderContainer>
            </FormSection>
            
            <FormSection>
              <FormLabel>
                <FormLabelText>Preferences</FormLabelText>
              </FormLabel>
              <PreferencesInput 
                placeholder="E.g., outdoor activities, Italian food, quiet places to talk, etc."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </FormSection>
            
            <ButtonGroup>
              <SubmitButton type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Find Hangout Spots'}
              </SubmitButton>
              <CancelButton type="button" onClick={() => navigate(`/groups/${groupId}`)}>
                Cancel
              </CancelButton>
            </ButtonGroup>
          </RecommendForm>
        </FormCard>
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

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const FormHeader = styled.div`
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

const FormTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 600;
  color: #333;
  margin: 0;
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

const FormInstruction = styled.p`
  color: #666;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const RecommendForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FormLabel = styled.label`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const FormLabelText = styled.span`
  font-weight: 500;
  color: #444;
`;

const SliderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e1e5f0;
  border-radius: 3px;
  outline: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(to right, #6e8efb, #a777e3);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(to right, #6e8efb, #a777e3);
    cursor: pointer;
    border: none;
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
`;

const SliderMarkers = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
`;

const SliderMarker = styled.div`
  font-size: 0.75rem;
  color: #999;
`;

const PreferencesInput = styled.textarea`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e1e5f0;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 3px rgba(110, 142, 251, 0.1);
  }
  
  &::placeholder {
    color: #aab;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 15px;
  
  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  @media (max-width: 500px) {
    width: 100%;
  }
`;

const CancelButton = styled(Button)`
  background: white;
  color: #666;
  border: 1px solid #ddd;
  
  &:hover {
    background: #f5f7fa;
  }
`;

const SubmitButton = styled(Button)`
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
`;

const RetryButton = styled.button`
  background: transparent;
  color: #6e8efb;
  border: 1px solid #6e8efb;
  font-size: 0.8rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 8px;
  cursor: pointer;
  
  &:hover {
    background: #f0f7ff;
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

export default RecommendationForm; 