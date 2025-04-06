import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const Groups = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    id: null,
    name: 'User',
    avatar: 'https://via.placeholder.com/40'
  });
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load user data and groups on component mount
  useEffect(() => {
    const fetchUserAndGroups = async () => {
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
            name: profileData.name || authUser.email?.split('@')[0] || 'User',
            avatar: profileData.avatar_url || 'https://via.placeholder.com/40'
          });
        }
        
        // Fetch user's groups
        await fetchUserGroups(authUser.id);
      } catch (err) {
        console.error('Error loading user data:', err);
        setIsLoading(false);
      }
    };
    
    fetchUserAndGroups();
  }, [navigate]);

  // Function to fetch user's groups from Supabase
  const fetchUserGroups = async (userId) => {
    try {
      setIsLoading(true);
      console.log('Fetching groups for user:', userId);
      
      // Using a different query approach that's more direct
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);
      
      if (membershipError) {
        console.error('Error fetching group memberships:', membershipError);
        throw membershipError;
      }
      
      console.log('Group memberships found:', memberships);
      
      if (!memberships || memberships.length === 0) {
        console.log('No group memberships found');
        setGroups([]);
        setFilteredGroups([]);
        setIsLoading(false);
        return;
      }
      
      // Get group IDs the user is a member of
      const groupIds = memberships.map(m => m.group_id);
      console.log('Group IDs:', groupIds);
      
      // Fetch the actual groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      
      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }
      
      console.log('Groups data:', groupsData);
      
      // Process each group to get additional details
      const groupsWithDetails = await Promise.all(groupsData.map(async (group) => {
        try {
          // Get member count
          const { count: memberCount, error: countError } = await supabase
            .from('group_members')
            .select('id', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          if (countError) {
            console.error(`Error getting member count for group ${group.id}:`, countError);
            throw countError;
          }
          
          // Get member profiles (limit to 5 for display)
          const { data: memberData, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', group.id)
            .limit(5);
          
          if (membersError) {
            console.error(`Error getting members for group ${group.id}:`, membersError);
            throw membersError;
          }
          
          // Get profiles for these members
          const memberIds = memberData.map(m => m.user_id);
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', memberIds);
          
          if (profilesError) {
            console.error(`Error getting member profiles for group ${group.id}:`, profilesError);
            throw profilesError;
          }
          
          // Format member avatars
          const memberAvatars = profilesData.map(profile => {
            return profile.avatar_url || profile.name?.charAt(0) || '?';
          });
          
          // Calculate last active time (for now, using created_at)
          const lastActive = new Date(group.created_at);
          const now = new Date();
          const diffInDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
          
          let lastActiveText;
          if (diffInDays === 0) {
            lastActiveText = 'today';
          } else if (diffInDays === 1) {
            lastActiveText = 'yesterday';
          } else if (diffInDays < 7) {
            lastActiveText = `${diffInDays} days ago`;
          } else if (diffInDays < 30) {
            const weeks = Math.floor(diffInDays / 7);
            lastActiveText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
          } else {
            const months = Math.floor(diffInDays / 30);
            lastActiveText = `${months} ${months === 1 ? 'month' : 'months'} ago`;
          }
          
          return {
            id: group.id,
            name: group.name,
            description: group.description || 'No description provided.',
            members: memberCount || memberData.length,
            memberAvatars: memberAvatars,
            lastActive: lastActiveText,
            createdBy: group.created_by
          };
        } catch (error) {
          console.error(`Error processing group ${group.id}:`, error);
          return {
            id: group.id,
            name: group.name,
            description: group.description || 'No description provided.',
            members: 0,
            memberAvatars: [],
            lastActive: 'recently',
            createdBy: group.created_by
          };
        }
      }));
      
      console.log('Processed groups with details:', groupsWithDetails);
      
      setGroups(groupsWithDetails);
      setFilteredGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      setFilteredGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(term.toLowerCase()) ||
        group.description.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  };

  // Handle page navigation
  const handleNavigate = (path) => {
    navigate(path);
  };

  // Handle creating a new group
  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  // Handle view group
  const handleViewGroup = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
                        {typeof avatar === 'string' && avatar.startsWith('http') ? (
                          <img src={avatar} alt="Member" />
                        ) : (
                          <AvatarText>{avatar}</AvatarText>
                        )}
                      </MemberAvatar>
                    ))}
                    {group.members > 5 && (
                      <MoreMembers>+{group.members - 5}</MoreMembers>
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

const AvatarText = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, #6e8efb, #a777e3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
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

export default Groups; 