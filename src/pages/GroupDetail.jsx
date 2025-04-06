import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const GroupDetail = () => {
  console.log("*** GroupDetail component rendering");
  
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [isCreator, setIsCreator] = useState(false);
  const [activeHangoutRequest, setActiveHangoutRequest] = useState(null);
  const [responsesCount, setResponsesCount] = useState(0);
  const [hasResponded, setHasResponded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Improved user authentication and data fetching
  useEffect(() => {
    console.log("*** Checking authentication");
    
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth error:", error);
          throw error;
        }
        
        if (data && data.user) {
          console.log("*** User authenticated:", data.user.id);
          
          // Fetch user profile data
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
          }
          
          // Set user with profile data if available
          setUser({
            id: data.user.id,
            email: data.user.email,
            name: profileData?.name || data.user.email?.split('@')[0] || 'User',
            avatar: profileData?.avatar_url || null
          });
        } else {
          console.log("*** No user, redirecting to login");
          navigate('/login');
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Authentication error");
      }
    };
    
    getUser();
  }, [navigate]);
  
  // Fix the group and members data fetch
  useEffect(() => {
    console.log("*** Fetching group data for ID:", groupId);
    
    const fetchGroupData = async () => {
      try {
        if (!groupId) {
          console.error("No group ID provided");
          setError("No group ID provided");
          setLoading(false);
          return;
        }
        
        // Get group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
        
        if (groupError) {
          console.error("Group fetch error:", groupError);
          throw groupError;
        }
        
        console.log("*** Group data fetched:", groupData);
        setGroup(groupData);
        
        if (user) {
          setIsCreator(groupData.created_by === user.id);
        }
        
        // FIX: Fetch members and profiles separately to avoid join issues
        console.log("*** Fetching group members");
        const { data: membersData, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);
        
        if (membersError) {
          console.error("Members fetch error:", membersError);
          throw membersError;
        }
        
        console.log("*** Found members:", membersData?.length);
        
        if (!membersData || membersData.length === 0) {
          setMembers([]);
          setLoading(false);
          return;
        }
        
        // Get all user IDs from members
        const userIds = membersData.map(member => member.user_id);
        
        // Fetch profiles for these users
        console.log("*** Fetching profiles for user IDs:", userIds);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
        
        if (profilesError) {
          console.error("Profiles fetch error:", profilesError);
          throw profilesError;
        }
        
        console.log("*** Profiles fetched:", profilesData?.length);
        
        // Create a map of profiles by user ID for quick lookup
        const profilesMap = {};
        profilesData?.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
        
        // Format member data
        const formattedMembers = membersData.map(member => {
          const profile = profilesMap[member.user_id] || {};
          return {
            id: member.user_id,
            name: profile.name || profile.email?.split('@')[0] || 'Unknown User',
            email: profile.email,
            avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=random`
          };
        });
        
        console.log("*** Formatted members:", formattedMembers);
        setMembers(formattedMembers);
        
        // Check if there's an active hangout request
        console.log("*** Checking for active hangout requests");
        const { data: requestData, error: requestError } = await supabase
          .from('hangout_requests')
          .select('*')
          .eq('group_id', groupId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (requestError) {
          console.error("Hangout request fetch error:", requestError);
          // Don't throw, just skip hangout request features
        } else if (requestData && requestData.length > 0) {
          console.log("*** Active hangout request found:", requestData[0]);
          setActiveHangoutRequest(requestData[0]);
          
          // Get responses count
          try {
            console.log("*** Fetching response count for request:", requestData[0].id);
            const { data: responsesData, error: responsesError } = await supabase
              .from('hangout_responses')
              .select('user_id')
              .eq('request_id', requestData[0].id);
              
            if (responsesError) {
              console.error("Responses fetch error:", responsesError);
            } else {
              console.log("*** Response data:", responsesData);
              setResponsesCount(responsesData?.length || 0);
              
              // Check if current user has responded
              const hasCurrentUserResponded = user && responsesData?.some(r => r.user_id === user.id) || false;
              console.log("*** User has responded:", hasCurrentUserResponded);
              setHasResponded(hasCurrentUserResponded);
            }
          } catch (responseErr) {
            console.error("Error processing responses:", responseErr);
          }
        } else {
          console.log("*** No active hangout request found");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Group data fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (user) {
      fetchGroupData();
    }
  }, [groupId, user]);
  
  // Even more robust initiateHangout function with extensive debugging
  const initiateHangout = async () => {
    console.log("Initiating hangout for group:", groupId);
    
    try {
      // Validate required data
      if (!groupId) {
        console.error("Missing group ID");
        alert("Cannot create hangout: Missing group ID");
        return;
      }
      
      if (!user?.id) {
        console.error("Missing user ID, user:", user);
        alert("Cannot create hangout: You need to be logged in");
        return;
      }
      
      // Log the payload for debugging
      const hangoutPayload = {
        group_id: groupId,
        created_by: user.id,
        status: 'active',
        created_at: new Date().toISOString() // Explicitly add created_at
      };
      
      console.log("Creating hangout request with payload:", hangoutPayload);
      
      // First, let's check if there's already an active hangout
      console.log("Checking for existing hangout requests...");
      const { data: existingRequests, error: checkError } = await supabase
        .from('hangout_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'active');
      
      if (checkError) {
        console.error("Error checking existing requests:", checkError);
        alert(`Error checking existing requests: ${checkError.message || 'Unknown error'}`);
        return;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        console.log("Found existing active request:", existingRequests[0]);
        setActiveHangoutRequest(existingRequests[0]);
        alert("A hangout request is already active for this group");
        return;
      }
      
      // Create a hangout request with proper error tracing - using basic insert first
      console.log("Inserting new hangout request...");
      
      // Try a simpler insert first without the .select()
      const insertResult = await supabase
        .from('hangout_requests')
        .insert([hangoutPayload]);
      
      // Check for errors in initial insert
      if (insertResult.error) {
        const error = insertResult.error;
        console.error("Full error object:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Error details:", error.details);
        
        // Show detailed error to user
        alert(`Failed to create hangout request: ${error.message || error.details || error.code || 'Unknown error'}`);
        return;
      }
      
      console.log("Insert succeeded, fetching the created record...");
      
      // Now fetch the created record
      const { data: newRequests, error: fetchError } = await supabase
        .from('hangout_requests')
        .select('*')
        .eq('group_id', groupId)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (fetchError) {
        console.error("Error fetching new request:", fetchError);
        alert(`Request was created but failed to retrieve it: ${fetchError.message || 'Unknown error'}`);
        return;
      }
      
      if (!newRequests || newRequests.length === 0) {
        console.error("No data returned after insertion and fetch");
        alert("Request may have been created but couldn't be retrieved");
        return;
      }
      
      const newRequest = newRequests[0];
      console.log("New hangout request created successfully:", newRequest);
      
      // Update state with new request
      setActiveHangoutRequest(newRequest);
      setResponsesCount(0);
      setHasResponded(false);
      
      // Success confirmation
      alert("Hangout request created successfully!");
      
    } catch (err) {
      // Handle truly unexpected errors
      console.error("Unexpected error in initiateHangout:", err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error';
      console.error("Error stack:", err?.stack);
      alert(`An unexpected error occurred: ${errorMessage}`);
    }
  };
  
  // Function to go to recommendation form (updated)
  const goToRecommendationForm = () => {
    console.log("Navigating to recommendation form");
    if (!activeHangoutRequest?.id && !activeHangoutRequest) {
      console.log("No active hangout request, creating new form");
      navigate(`/groups/${groupId}/recommend`);
    } else {
      console.log("Using existing hangout request:", activeHangoutRequest?.id);
      navigate(`/groups/${groupId}/recommend`, {
        state: { requestId: activeHangoutRequest?.id }
      });
    }
  };
  
  // Function to view hangout results (updated)
  const finishHangout = () => {
    console.log("Viewing hangout results");
    if (!activeHangoutRequest?.id) {
      console.error("No active hangout request ID");
      alert("Cannot view results: No active hangout request");
      return;
    }
    
    navigate(`/groups/${groupId}/recommendations`, {
      state: { requestId: activeHangoutRequest.id }
    });
  };
  
  // Function to handle navigation
  const handleNavigate = (path) => {
    navigate(path);
  };
  
  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Error display
  if (error) {
    return (
      <DashboardContainer>
        <ErrorContainer>
          <ErrorIcon>⚠️</ErrorIcon>
          <ErrorTitle>Error</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          <BackButton onClick={() => navigate('/groups')}>Back to Groups</BackButton>
        </ErrorContainer>
      </DashboardContainer>
    );
  }
  
  return (
    <DashboardContainer>
      <Header>
        <Logo>HangoutAI</Logo>
        <Navigation>
          <NavItem onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem active onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <NotificationInbox />
          <UserName>{user?.email?.split('@')[0] || 'User'}</UserName>
          <UserAvatar onClick={() => setShowUserMenu(!showUserMenu)}>
            {user && user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt="User avatar" />
            ) : (
              <AvatarPlaceholder>{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarPlaceholder>
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
        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingText>Loading group details...</LoadingText>
          </LoadingContainer>
        ) : (
          <>
            <BreadcrumbNav>
              <BreadcrumbLink onClick={() => navigate('/groups')}>Groups</BreadcrumbLink>
              <BreadcrumbSeparator>/</BreadcrumbSeparator>
              <BreadcrumbCurrent>{group?.name || "Group"}</BreadcrumbCurrent>
            </BreadcrumbNav>
            
            <GroupHeader>
              <GroupInfo>
                <GroupAvatar>{group?.name?.[0] || "G"}</GroupAvatar>
                <GroupDetails>
                  <GroupName>{group?.name || "Loading..."}</GroupName>
                  <GroupStats>
                    <GroupStat>{members.length} members</GroupStat>
                    <GroupStatDot>•</GroupStatDot>
                    <GroupStat>Created {new Date(group?.created_at).toLocaleDateString()}</GroupStat>
                  </GroupStats>
                </GroupDetails>
              </GroupInfo>
              
              {!activeHangoutRequest && (
                <RecommendButton onClick={goToRecommendationForm}>
                  <RecommendIcon>🔍</RecommendIcon>
                  Recommend Hangout
                </RecommendButton>
              )}
            </GroupHeader>
            
            <GroupDescription>
              {group?.description || "No description available."}
            </GroupDescription>
            
            {activeHangoutRequest && (
              <HangoutRequestCard>
                <HangoutRequestIcon>🎯</HangoutRequestIcon>
                <HangoutRequestContent>
                  <HangoutRequestTitle>Hangout Request Active</HangoutRequestTitle>
                  <HangoutRequestStatus>
                    {responsesCount} of {members.length} members responded
                  </HangoutRequestStatus>
                  {!hasResponded && (
                    <RespondButton onClick={goToRecommendationForm}>
                      Submit Your Preferences
                    </RespondButton>
                  )}
                  {isCreator && (
                    <FinishHangoutButton 
                      onClick={finishHangout}
                      disabled={responsesCount === 0}
                    >
                      {responsesCount === 0 ? 'Waiting for responses...' : 'View Results'}
                    </FinishHangoutButton>
                  )}
                </HangoutRequestContent>
              </HangoutRequestCard>
            )}
            
            <SectionTitle>Members ({members.length})</SectionTitle>
            <MembersContainer>
              {members.map(member => (
                <MemberCard key={member.id}>
                  <MemberAvatar>
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      member.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </MemberAvatar>
                  <MemberInfo>
                    <MemberName>
                      {member.name}
                      {member.id === user?.id && " (You)"}
                    </MemberName>
                    {member.id === group?.created_by && (
                      <MemberBadge>Creator</MemberBadge>
                    )}
                  </MemberInfo>
                </MemberCard>
              ))}
            </MembersContainer>
            
            <ButtonSection>
              {isCreator && !activeHangoutRequest && (
                <PrimaryButton onClick={initiateHangout}>
                  Start a Hangout
                </PrimaryButton>
              )}
              <SecondaryButton onClick={() => navigate('/groups')}>
                Back to Groups
              </SecondaryButton>
            </ButtonSection>
          </>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

// Dashboard styled components (matching Dashboard.jsx exactly)
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
  cursor: pointer;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #6e8efb;
  color: white;
  font-weight: bold;
`;

const UserMenu = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  width: 180px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
`;

const UserMenuItem = styled.div`
  padding: 12px 15px;
  color: #333;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
`;

const UserMenuDivider = styled.div`
  height: 1px;
  background: #e1e4e8;
  margin: 5px 0;
`;

const NotificationInbox = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  
  &:before {
    content: '🔔';
  }
`;

// Main content area
const MainContent = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 30px;
`;

// Group detail styled components (keep from last version)
const BreadcrumbNav = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
`;

const BreadcrumbLink = styled.span`
  color: #4a6cf7;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const BreadcrumbSeparator = styled.span`
  margin: 0 0.5rem;
  color: #999;
`;

const BreadcrumbCurrent = styled.span`
  color: #666;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`;

const LoadingSpinner = styled.div`
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4a6cf7;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1rem;
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const GroupInfo = styled.div`
  display: flex;
  align-items: center;
`;

const GroupAvatar = styled.div`
  width: 4rem;
  height: 4rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  margin-right: 1rem;
`;

const GroupDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const GroupName = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
  color: #333;
`;

const GroupStats = styled.div`
  display: flex;
  align-items: center;
  color: #666;
  font-size: 0.9rem;
`;

const GroupStat = styled.span``;

const GroupStatDot = styled.span`
  margin: 0 0.5rem;
`;

const GroupDescription = styled.p`
  color: #444;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const RecommendButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3a5bd9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(74, 108, 247, 0.3);
  }
`;

const RecommendIcon = styled.span`
  margin-right: 0.5rem;
`;

const SectionTitle = styled.h2`
  margin: 2rem 0 1rem;
  font-size: 1.3rem;
  color: #333;
`;

const MembersContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MemberCard = styled.div`
  display: flex;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const MemberAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #6e8efb;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 0.75rem;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const MemberName = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const MemberBadge = styled.span`
  background: #ffd700;
  color: #333;
  font-size: 0.7rem;
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
  align-self: flex-start;
`;

const ButtonSection = styled.div`
  display: flex;
  margin-top: 2rem;
  gap: 1rem;
`;

const PrimaryButton = styled.button`
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3a5bd9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(74, 108, 247, 0.3);
  }
`;

const SecondaryButton = styled.button`
  background-color: #f0f2f5;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e4e6e9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const HangoutRequestCard = styled.div`
  display: flex;
  background: #f0f7ff;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0 2rem;
  border: 1px dashed #4a6cf7;
  box-shadow: 0 4px 12px rgba(74, 108, 247, 0.1);
`;

const HangoutRequestIcon = styled.div`
  font-size: 2rem;
  margin-right: 1.25rem;
`;

const HangoutRequestContent = styled.div`
  flex: 1;
`;

const HangoutRequestTitle = styled.h3`
  margin: 0 0 0.5rem;
  color: #4a6cf7;
  font-size: 1.2rem;
`;

const HangoutRequestStatus = styled.div`
  margin-bottom: 1rem;
  color: #555;
  font-size: 0.95rem;
`;

const RespondButton = styled.button`
  background: linear-gradient(to right, #4a6cf7, #6a4cf7);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(74, 108, 247, 0.3);
  }
`;

const FinishHangoutButton = styled.button`
  background: ${props => props.disabled ? '#ccc' : '#22c55e'};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: 600;
  transition: all 0.2s;
  margin-left: 0.75rem;
  
  &:hover {
    transform: ${props => props.disabled ? 'none' : 'translateY(-2px)'};
    box-shadow: ${props => props.disabled ? 'none' : '0 5px 10px rgba(34, 197, 94, 0.3)'};
  }
`;

const ErrorContainer = styled.div`
  max-width: 500px;
  margin: 100px auto;
  padding: 30px;
  background: white;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const ErrorIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 15px;
`;

const ErrorMessage = styled.p`
  color: #666;
  margin-bottom: 25px;
`;

const BackButton = styled.button`
  background-color: #f0f2f5;
  color: #333;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background-color: #e4e6e9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

export default GroupDetail; 