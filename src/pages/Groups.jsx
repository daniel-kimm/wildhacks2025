import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Groups = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'User' });
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Sample groups data (removed recentActivity)
  const sampleGroups = [
    {
      id: 1,
      name: 'Weekend Adventurers',
      description: 'A group for planning weekend hikes, camping trips, and outdoor activities.',
      members: 8,
      memberAvatars: ['A', 'S', 'J', 'T'],
      lastActive: '2 hours ago'
    },
    {
      id: 2,
      name: 'Coffee Enthusiasts',
      description: 'For those who appreciate quality coffee and cafe culture.',
      members: 5,
      memberAvatars: ['J', 'S', 'A'],
      lastActive: 'Just now'
    },
    {
      id: 3,
      name: 'Movie Night Crew',
      description: 'We meet up for regular movie nights, both at theaters and home screenings.',
      members: 12,
      memberAvatars: ['T', 'J', 'A', 'S'],
      lastActive: '1 day ago'
    },
    {
      id: 4,
      name: 'Foodies Unite',
      description: 'Exploring new restaurants and food experiences around the city.',
      members: 7,
      memberAvatars: ['S', 'A', 'J'],
      lastActive: '5 hours ago'
    }
  ];

  // Load user data and groups on component mount
  useEffect(() => {
    // Load user data from localStorage
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
      const parsedData = JSON.parse(savedUserData);
      setUser(prevUser => ({
        ...prevUser,
        name: parsedData.name
      }));
    }

    // Simulate API loading delay
    setTimeout(() => {
      setGroups(sampleGroups);
      setIsLoading(false);
    }, 800);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigate to different pages
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Navigate to create group page
  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  // Handle viewing a group (in a real app, this would navigate to a group detail page)
  const handleViewGroup = (groupId) => {
    console.log('Viewing group details for:', groupId);
    // This would navigate to a group detail page in a full implementation
    // navigate(`/groups/${groupId}`);
  };

  return (
    <PageContainer>
      <Header>
        <Logo>HangoutAI</Logo>
        <Navigation>
          <NavItem onClick={() => handleNavigate('/dashboard')}>Home</NavItem>
          <NavItem onClick={() => handleNavigate('/friends')}>Friends</NavItem>
          <NavItem active onClick={() => handleNavigate('/groups')}>Groups</NavItem>
          <NavItem onClick={() => handleNavigate('/map')}>Map</NavItem>
        </Navigation>
        <UserSection>
          <UserName>{user.name}</UserName>
          <UserAvatar>
            <img src="https://via.placeholder.com/40" alt="User avatar" />
          </UserAvatar>
        </UserSection>
      </Header>

      <ContentContainer>
        <TopSection>
          <PageTitleSection>
            <PageTitle>Your Groups</PageTitle>
            <PageDescription>
              See all the groups you're part of and connect with members.
            </PageDescription>
          </PageTitleSection>
          <AddButton onClick={handleCreateGroup}>
            <PlusIcon>+</PlusIcon>
            Create Group
          </AddButton>
        </TopSection>

        <SearchContainer>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search your groups..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <ClearButton onClick={() => setSearchTerm('')}>×</ClearButton>
          )}
        </SearchContainer>

        <GroupsContainer>
          {isLoading ? (
            <LoadingState>
              <LoadingText>Loading your groups...</LoadingText>
            </LoadingState>
          ) : filteredGroups.length > 0 ? (
            filteredGroups.map(group => (
              <GroupCard key={group.id}>
                <GroupHeader>
                  <GroupInfo>
                    <GroupAvatar>
                      {group.name.charAt(0)}
                    </GroupAvatar>
                    <GroupNameSection>
                      <GroupName>{group.name}</GroupName>
                      <GroupMembers>{group.members} members</GroupMembers>
                    </GroupNameSection>
                  </GroupInfo>
                  <LastActive>Active {group.lastActive}</LastActive>
                </GroupHeader>
                
                <GroupDescription>
                  {group.description}
                </GroupDescription>
                
                <GroupFooter>
                  <MemberAvatars>
                    {group.memberAvatars.map((avatar, index) => (
                      <MemberAvatar key={index} index={index}>
                        <img src={`https://via.placeholder.com/30?text=${avatar}`} alt="Member" />
                      </MemberAvatar>
                    ))}
                    {group.members > 4 && (
                      <MoreMembers>+{group.members - 4}</MoreMembers>
                    )}
                  </MemberAvatars>
                  <ViewGroupButton onClick={() => handleViewGroup(group.id)}>
                    View Group
                  </ViewGroupButton>
                </GroupFooter>
              </GroupCard>
            ))
          ) : (
            <EmptyState>
              {searchTerm ? (
                <EmptyText>No groups match your search "{searchTerm}"</EmptyText>
              ) : (
                <EmptyText>You're not in any groups yet.</EmptyText>
              )}
              {!searchTerm && (
                <CreateGroupButton onClick={handleCreateGroup}>
                  <PlusIcon>+</PlusIcon>
                  Create Your First Group
                </CreateGroupButton>
              )}
            </EmptyState>
          )}
        </GroupsContainer>
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
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContentContainer = styled.main`
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const PageTitleSection = styled.div`
  flex: 1;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0 0 10px;
`;

const PageDescription = styled.p`
  color: #666;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

const PlusIcon = styled.span`
  margin-right: 8px;
  font-size: 1.2rem;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 25px;
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

const GroupsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const GroupCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
`;

const GroupHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const GroupInfo = styled.div`
  display: flex;
  align-items: center;
`;

const GroupAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.5rem;
  margin-right: 15px;
`;

const GroupNameSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const GroupName = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 5px;
`;

const GroupMembers = styled.div`
  font-size: 0.875rem;
  color: #888;
`;

const LastActive = styled.div`
  font-size: 0.875rem;
  color: #888;
`;

const GroupDescription = styled.p`
  padding: 20px;
  color: #444;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
  border-bottom: 1px solid #eee;
`;

const GroupFooter = styled.div`
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MemberAvatars = styled.div`
  display: flex;
  align-items: center;
`;

const MemberAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  margin-left: ${props => props.index === 0 ? '0' : '-10px'};
  position: relative;
  z-index: ${props => 5 - props.index};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const MoreMembers = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #666;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -10px;
  border: 2px solid white;
`;

const ViewGroupButton = styled.button`
  background-color: #f0f2f5;
  color: #333;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e4e6e9;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const EmptyText = styled.p`
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 20px;
`;

const CreateGroupButton = styled.button`
  display: inline-flex;
  align-items: center;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(110, 142, 251, 0.3);
  }
`;

export default Groups; 