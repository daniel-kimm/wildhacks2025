import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ id: null, name: 'User' });
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data and fetch real friends from Supabase
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user from Supabase auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          console.log("No authenticated user found");
          navigate('/login');
          return;
        }
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setUser({
            id: authUser.id,
            name: profileData.name || authUser.email?.split('@')[0] || 'User'
          });
        }
        
        // Fetch actual friends
        await fetchFriends(authUser.id);
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };
    
    loadUserData();
  }, [navigate]);
  
  // Function to fetch friends from Supabase
  const fetchFriends = async (userId) => {
    try {
      console.log('Fetching friends for user:', userId);
      
      // Get friend relationships
      const { data: friendRelations, error: friendError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);
      
      if (friendError) {
        console.error('Error fetching friends:', friendError);
        return;
      }
      
      console.log('Friend relations found:', friendRelations?.length || 0);
      
      if (!friendRelations || friendRelations.length === 0) {
        setFriends([]);
        return;
      }
      
      // Get friend IDs
      const friendIds = friendRelations.map(rel => rel.friend_id);
      
      // Get friend profiles
      const { data: friendProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendIds);
      
      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        return;
      }
      
      console.log('Friend profiles found:', friendProfiles?.length || 0);
      
      // Format friend data
      const formattedFriends = friendProfiles.map(profile => ({
        id: profile.id,
        name: profile.name || profile.email?.split('@')[0] || 'Unnamed User',
        interests: profile.interests ? (typeof profile.interests === 'string' ? 
          profile.interests.split(',').map(i => i.trim()) : 
          Array.isArray(profile.interests) ? profile.interests : []) : [],
        avatar: profile.avatar_url ? profile.avatar_url : (profile.name ? profile.name.charAt(0) : 'U')
      }));
      
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error loading friends:', error.message);
      setFriends([]);
    }
  };

  // Handle group name change
  const handleGroupNameChange = (e) => {
    setGroupName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
  };

  // Handle group description change
  const handleDescriptionChange = (e) => {
    setGroupDescription(e.target.value);
  };

  // Handle friend selection
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(prevSelected => {
      if (prevSelected.includes(friendId)) {
        return prevSelected.filter(id => id !== friendId);
      } else {
        return [...prevSelected, friendId];
      }
    });
  };

  // Handle group creation - updated to save to Supabase
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    // Validate group name
    if (!groupName.trim()) {
      setNameError('Please enter a group name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Creating new group:", groupName);
      console.log("Selected friends to invite:", selectedFriends);
      
      // Create the group in Supabase
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          description: groupDescription,
          created_by: user.id
        })
        .select()
        .single();
      
      if (groupError) {
        console.error("Error creating group:", groupError);
        throw groupError;
      }
      
      console.log('Created new group:', newGroup);
      
      // Add only the creator as a direct member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ 
          group_id: newGroup.id, 
          user_id: user.id, 
          role: 'admin' 
        });
      
      if (memberError) {
        console.error('Error adding creator as member:', memberError);
        throw memberError;
      }
      
      console.log("Creator added as admin member");
      
      // Send invitations to selected friends instead of adding them directly
      if (selectedFriends.length > 0) {
        const invitations = selectedFriends.map(friendId => ({
          group_id: newGroup.id,
          sender_id: user.id,
          recipient_id: friendId,
          status: 'pending'
        }));
        
        console.log("Sending group invitations:", invitations);
        
        const { data: invitesData, error: invitationError } = await supabase
          .from('group_invitations')
          .insert(invitations)
          .select();
        
        if (invitationError) {
          console.error('Error sending group invitations:', invitationError);
          throw invitationError;
        }
        
        console.log('Group invitations sent successfully:', invitesData);
      } else {
        console.log("No friends selected for invitation");
      }
      
      alert('Group created successfully!');
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating group:', error);
      alert(`Failed to create group: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to dashboard
  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={handleBack}>
          <ArrowIcon>←</ArrowIcon>
          Back to Dashboard
        </BackButton>
        <UserSection>
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src="https://via.placeholder.com/40" alt="User avatar" />
          </UserAvatar>
        </UserSection>
      </Header>

      <ContentContainer>
        <PageTitle>Create a New Group</PageTitle>
        <PageDescription>
          Start a group with your friends to plan hangouts together.
          Select the friends you'd like to invite to join your new group.
        </PageDescription>

        <Form onSubmit={handleCreateGroup}>
          <FormSection>
            <Label htmlFor="groupName">Group Name*</Label>
            <Input
              type="text"
              id="groupName"
              value={groupName}
              onChange={handleGroupNameChange}
              placeholder="Enter a name for your group"
              required
            />
            {nameError && <ErrorMessage>{nameError}</ErrorMessage>}
          </FormSection>

          <FormSection>
            <Label htmlFor="groupDescription">Description (Optional)</Label>
            <TextArea
              id="groupDescription"
              value={groupDescription}
              onChange={handleDescriptionChange}
              placeholder="What's this group about?"
              rows={3}
            />
          </FormSection>

          <FormSection>
            <Label>Invite Friends</Label>
            <FriendsContainer>
              {friends.length > 0 ? (
                friends.map(friend => (
                  <FriendCard 
                    key={friend.id}
                    selected={selectedFriends.includes(friend.id)}
                    onClick={() => toggleFriendSelection(friend.id)}
                  >
                    <FriendCardAvatar>
                      {typeof friend.avatar === 'string' && friend.avatar.startsWith('http') ? (
                        <img src={friend.avatar} alt={friend.name} />
                      ) : (
                        <AvatarPlaceholder>{friend.avatar}</AvatarPlaceholder>
                      )}
                    </FriendCardAvatar>
                    <FriendCardInfo>
                      <FriendCardName>{friend.name}</FriendCardName>
                      <FriendCardInterests>
                        {friend.interests && friend.interests.length > 0 
                          ? friend.interests.join(', ') 
                          : 'No interests added'}
                      </FriendCardInterests>
                    </FriendCardInfo>
                    <SelectionIndicator selected={selectedFriends.includes(friend.id)}>
                      {selectedFriends.includes(friend.id) && <CheckIcon>✓</CheckIcon>}
                    </SelectionIndicator>
                  </FriendCard>
                ))
              ) : (
                <EmptyMessage>You don't have any friends yet. Add friends to invite them to your group.</EmptyMessage>
              )}
            </FriendsContainer>
          </FormSection>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Group'}
          </SubmitButton>
        </Form>
      </ContentContainer>
    </PageContainer>
  );
};

// Add this new styled component
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

const BackButton = styled.button`
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: #6e8efb;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 0;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ArrowIcon = styled.span`
  margin-right: 8px;
  font-size: 1.2rem;
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

const ContentContainer = styled.main`
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
`;

const PageDescription = styled.p`
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  margin-bottom: 10px;
  color: #333;
`;

const Input = styled.input`
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #6e8efb;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #6e8efb;
    outline: none;
  }
`;

const ErrorMessage = styled.p`
  color: #e53935;
  font-size: 0.875rem;
  margin-top: 5px;
  margin-bottom: 0;
`;

const FriendsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  max-height: 400px;
  overflow-y: auto;
`;

const FriendCard = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  background-color: ${props => props.selected ? 'rgba(110, 142, 251, 0.1)' : 'white'};
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.selected ? 'rgba(110, 142, 251, 0.15)' : '#f9f9f9'};
  }
`;

const FriendCardAvatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FriendCardInfo = styled.div`
  flex: 1;
`;

const FriendCardName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 3px;
`;

const FriendCardInterests = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const SelectionIndicator = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid ${props => props.selected ? '#6e8efb' : '#ddd'};
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.selected ? '#6e8efb' : 'transparent'};
  margin-left: 10px;
  transition: all 0.2s ease;
`;

const CheckIcon = styled.span`
  color: white;
  font-size: 0.875rem;
  font-weight: bold;
`;

const EmptyMessage = styled.div`
  padding: 30px;
  text-align: center;
  color: #666;
`;

const SubmitButton = styled.button`
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 15px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }

  &:disabled {
    background: #ccc;
    transform: none;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

export default CreateGroup; 