import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CreateGroup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'User' });
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample friends data - would come from API in a real application
  const sampleFriends = [
    { id: 1, name: 'Alex Johnson', interests: ['coffee', 'hiking', 'movies'], avatar: 'A' },
    { id: 2, name: 'Sam Carter', interests: ['art', 'museums', 'photography'], avatar: 'S' },
    { id: 3, name: 'Jamie Smith', interests: ['books', 'coffee', 'music'], avatar: 'J' },
    { id: 4, name: 'Taylor Williams', interests: ['hiking', 'camping', 'travel'], avatar: 'T' },
    { id: 5, name: 'Jordan Lee', interests: ['gaming', 'technology', 'movies'], avatar: 'J' },
  ];

  // Load user data from localStorage on component mount
  useEffect(() => {
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      const parsedData = JSON.parse(savedUserData);
      setUser(prevUser => ({
        ...prevUser,
        name: parsedData.name
      }));
    }

    // In a real app, fetch friends from API
    setFriends(sampleFriends);
  }, []);

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

  // Handle group creation
  const handleCreateGroup = (e) => {
    e.preventDefault();
    
    // Validate group name
    if (!groupName.trim()) {
      setNameError('Please enter a group name');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call to create group
    setTimeout(() => {
      const newGroup = {
        id: Date.now(),
        name: groupName,
        description: groupDescription,
        members: selectedFriends.length + 1, // +1 for the current user
        memberIds: [...selectedFriends]
      };
      
      console.log('Creating new group:', newGroup);
      
      // In a real app, you would store this in your backend
      
      setIsLoading(false);
      // Navigate back to dashboard
      navigate('/dashboard');
    }, 1500);
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
                      <img src={`https://via.placeholder.com/50?text=${friend.avatar}`} alt={friend.name} />
                    </FriendCardAvatar>
                    <FriendCardInfo>
                      <FriendCardName>{friend.name}</FriendCardName>
                      <FriendCardInterests>
                        {friend.interests.join(', ')}
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