import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const AddFriend = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [user, setUser] = useState({ name: 'User' });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  
  // Sample user data - would come from API in a real application
  const sampleUsers = [
    { id: 1, name: 'Alex Johnson', interests: ['coffee', 'hiking', 'movies'], avatar: 'A' },
    { id: 2, name: 'Sam Carter', interests: ['art', 'museums', 'photography'], avatar: 'S' },
    { id: 3, name: 'Jamie Smith', interests: ['books', 'coffee', 'music'], avatar: 'J' },
    { id: 4, name: 'Taylor Williams', interests: ['hiking', 'camping', 'travel'], avatar: 'T' },
    { id: 5, name: 'Jordan Lee', interests: ['gaming', 'technology', 'movies'], avatar: 'J' },
    { id: 6, name: 'Casey Miller', interests: ['cooking', 'food', 'travel'], avatar: 'C' },
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
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Perform search when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay
    const timer = setTimeout(() => {
      // Filter users based on search term
      const results = sampleUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle adding a friend
  const handleAddFriend = (userId) => {
    // Set loading state for this specific button
    setLoadingStates(prev => ({ ...prev, [userId]: true }));
    
    // Simulate API call to add friend
    setTimeout(() => {
      console.log(`Added friend with ID: ${userId}`);
      // Show success and remove loading state
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
      
      // Remove the user from search results to indicate they've been added
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    }, 1000);
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
        <PageTitle>Find Friends</PageTitle>
        <PageDescription>
          Search for friends by name and add them to your network.
          Connect with people who share your interests!
        </PageDescription>

        <SearchContainer>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>×</ClearButton>
          )}
        </SearchContainer>

        <ResultsContainer>
          {isLoading ? (
            <LoadingMessage>Searching...</LoadingMessage>
          ) : searchTerm && searchResults.length === 0 ? (
            <NoResultsMessage>No users found matching "{searchTerm}"</NoResultsMessage>
          ) : (
            searchResults.map(result => (
              <UserCard key={result.id}>
                <UserCardAvatar>
                  <img src={`https://via.placeholder.com/50?text=${result.avatar}`} alt={result.name} />
                </UserCardAvatar>
                <UserCardInfo>
                  <UserCardName>{result.name}</UserCardName>
                  <UserCardInterests>
                    Interests: {result.interests.join(', ')}
                  </UserCardInterests>
                </UserCardInfo>
                <AddFriendButton 
                  onClick={() => handleAddFriend(result.id)}
                  disabled={loadingStates[result.id]}
                >
                  {loadingStates[result.id] ? 'Adding...' : 'Add Friend'}
                </AddFriendButton>
              </UserCard>
            ))
          )}
          {!isLoading && searchTerm.trim() === '' && (
            <SearchPrompt>
              Enter a name above to search for friends
            </SearchPrompt>
          )}
        </ResultsContainer>
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

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 30px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #6e8efb;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #666;
  }
`;

const ResultsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-height: 300px;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  transition: background-color 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f9f9f9;
  }
`;

const UserCardAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 15px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserCardInfo = styled.div`
  flex: 1;
`;

const UserCardName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
`;

const UserCardInterests = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const AddFriendButton = styled.button`
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

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

const LoadingMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

const NoResultsMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

const SearchPrompt = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 1rem;
`;

export default AddFriend; 