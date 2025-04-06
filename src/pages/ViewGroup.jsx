import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const ViewGroup = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  console.log('ViewGroup component loaded with groupId:', groupId);
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [formData, setFormData] = useState({
    priceLimit: 50,
    distanceLimit: 5,
    timeOfDay: 'afternoon',
    preferences: ''
  });
  
  // Chat UI state
  const [messageInput, setMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Alex Johnson', message: 'Hey everyone! Anyone up for coffee this weekend?', timestamp: '2 hours ago' },
    { id: 2, sender: 'Sam Carter', message: 'I\'m in! How about Saturday afternoon?', timestamp: '1 hour ago' },
    { id: 3, sender: 'Jamie Smith', message: 'Saturday works for me too. Any specific place in mind?', timestamp: '45 mins ago' },
    { id: 4, sender: 'Alex Johnson', message: 'I was thinking of trying that new cafe downtown.', timestamp: '30 mins ago' }
  ]);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        console.log('Fetching group data for ID:', groupId);
        
        // Check if groupId is valid
        if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
          console.error('Invalid group ID:', groupId);
          setError('Invalid group ID');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting current user:', userError);
          setError('Authentication error');
          setLoading(false);
          return;
        }
        
        if (!currentUser) {
          console.error('No authenticated user found');
          setError('You must be logged in to view groups');
          setLoading(false);
          return;
        }
        
        console.log('Current user:', currentUser.id);
        
        // Check if the group exists
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
        
        if (groupError) {
          console.error('Error fetching group:', groupError);
          throw groupError;
        }
        
        console.log('Group data fetched successfully:', groupData);
        setGroup(groupData);
        
        // Check if the user is a member of the group
        const { data: membershipData, error: membershipError } = await supabase
          .from('group_members')
          .select('*')
          .eq('group_id', groupId)
          .eq('user_id', currentUser.id)
          .single();
        
        if (membershipError && membershipError.code !== 'PGRST116') {
          // PGRST116 is the error code for "no rows returned" which is expected if the user is not a member
          console.error('Error checking membership:', membershipError);
        }
        
        const userIsMember = !!membershipData;
        console.log('User is member of group:', userIsMember);
        setIsMember(userIsMember);
        
        // Check if the group_members table exists
        try {
          console.log('Checking group_members table structure');
          const { data: tableInfo, error: tableError } = await supabase
            .from('group_members')
            .select('*')
            .limit(1);
          
          if (tableError) {
            console.error('Error checking group_members table:', tableError);
            // Continue with empty members list
            setMembers([]);
            return;
          }
          
          console.log('group_members table exists, fetching members');
          
          // Fetch group members
          const { data: membersData, error: membersError } = await supabase
            .from('group_members')
            .select(`
              user_id,
              users:user_id (
                id,
                username,
                avatar_url
              )
            `)
            .eq('group_id', groupId);
          
          if (membersError) {
            console.error('Error fetching members:', membersError);
            throw membersError;
          }
          
          console.log('Members data fetched successfully:', membersData);
          
          // Check if membersData is in the expected format
          if (!membersData || !Array.isArray(membersData)) {
            console.error('Members data is not in the expected format:', membersData);
            setMembers([]);
            return;
          }
          
          // Map the members data, with a fallback for missing user data
          const formattedMembers = membersData.map(member => {
            if (!member || !member.users) {
              console.warn('Member data is missing user information:', member);
              return {
                id: member?.user_id || 'unknown',
                username: 'Unknown User',
                avatar_url: 'https://via.placeholder.com/40'
              };
            }
            return member.users;
          });
          
          console.log('Formatted members:', formattedMembers);
          setMembers(formattedMembers);
        } catch (tableErr) {
          console.error('Error with group_members table:', tableErr);
          // Continue with empty members list
          setMembers([]);
        }
      } catch (err) {
        console.error('Error fetching group data:', err);
        setError('Failed to load group information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create a new hangout
      const { data, error } = await supabase
        .from('hangouts')
        .insert([
          {
            group_id: groupId,
            price_limit: formData.priceLimit,
            distance_limit: formData.distanceLimit,
            time_of_day: formData.timeOfDay,
            preferences: formData.preferences,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Navigate to the hangout generation page
      navigate(`/hangout/${data[0].id}`);
    } catch (err) {
      console.error('Error creating hangout:', err);
      setError('Failed to create hangout');
    }
  };
  
  // Chat UI handlers
  const handleMessageChange = (e) => {
    setMessageInput(e.target.value);
  };
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() === '') return;
    
    // In a real app, this would send the message to a backend
    // For now, we'll just add it to the local state
    const newMessage = {
      id: chatMessages.length + 1,
      sender: 'You',
      message: messageInput,
      timestamp: 'Just now'
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setMessageInput('');
  };

  const handleJoinGroup = async () => {
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Error getting current user:', userError);
        setError('Authentication error');
        return;
      }
      
      // Add user to group_members
      const { data, error } = await supabase
        .from('group_members')
        .insert([
          {
            group_id: groupId,
            user_id: currentUser.id
          }
        ]);
      
      if (error) {
        console.error('Error joining group:', error);
        setError('Failed to join group');
        return;
      }
      
      console.log('Successfully joined group');
      setIsMember(true);
      
      // Refresh members list
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('group_id', groupId);
      
      if (membersError) {
        console.error('Error fetching members after joining:', membersError);
        return;
      }
      
      // Map the members data, with a fallback for missing user data
      const formattedMembers = membersData.map(member => {
        if (!member || !member.users) {
          return {
            id: member?.user_id || 'unknown',
            username: 'Unknown User',
            avatar_url: 'https://via.placeholder.com/40'
          };
        }
        return member.users;
      });
      
      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group');
    }
  };

  if (loading) {
    console.log('ViewGroup is in loading state');
    return (
      <Container>
        <LoadingMessage>Loading group information...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    console.log('ViewGroup has error:', error);
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
        <BackButton onClick={() => navigate('/groups')}>Back to Groups</BackButton>
      </Container>
    );
  }

  if (!group) {
    console.log('No group data found for ID:', groupId);
    return (
      <Container>
        <ErrorMessage>Group not found. The group may have been deleted or you may not have permission to view it.</ErrorMessage>
        <BackButton onClick={() => navigate('/groups')}>Back to Groups</BackButton>
      </Container>
    );
  }

  if (!isMember) {
    console.log('User is not a member of the group');
    return (
      <Container>
        <Header>
          <Title>{group?.name || 'Group'}</Title>
          <BackButton onClick={() => navigate('/groups')}>Back to Groups</BackButton>
        </Header>
        <Content>
          <Section>
            <ErrorMessage>You are not a member of this group. Please join the group to view its details.</ErrorMessage>
            <JoinButton onClick={handleJoinGroup}>Join Group</JoinButton>
          </Section>
        </Content>
      </Container>
    );
  }

  console.log('ViewGroup rendering with group:', group);
  return (
    <Container>
      <Header>
        <Title>{group?.name || 'Group'}</Title>
        <BackButton onClick={() => navigate('/groups')}>Back to Groups</BackButton>
      </Header>
      
      <Content>
        <Section>
          <SectionTitle>Group Members</SectionTitle>
          {members.length > 0 ? (
            <MembersList>
              {members.map(member => (
                <MemberCard key={member.id}>
                  <MemberAvatar src={member.avatar_url || 'https://via.placeholder.com/40'} alt={member.username} />
                  <MemberName>{member.username}</MemberName>
                </MemberCard>
              ))}
            </MembersList>
          ) : (
            <EmptyState>
              <EmptyStateText>No members found for this group.</EmptyStateText>
            </EmptyState>
          )}
        </Section>
        
        <Section>
          <SectionTitle>Group Chat</SectionTitle>
          <ChatContainer>
            <ChatMessages>
              {chatMessages.map(message => (
                <MessageBubble key={message.id} isCurrentUser={message.sender === 'You'}>
                  <MessageHeader>
                    <MessageSender>{message.sender}</MessageSender>
                    <MessageTime>{message.timestamp}</MessageTime>
                  </MessageHeader>
                  <MessageContent>{message.message}</MessageContent>
                </MessageBubble>
              ))}
            </ChatMessages>
            <ChatInputForm onSubmit={handleSendMessage}>
              <ChatInput
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={handleMessageChange}
              />
              <SendButton type="submit">Send</SendButton>
            </ChatInputForm>
          </ChatContainer>
        </Section>
        
        <Section>
          <SectionTitle>Create a Hangout</SectionTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="priceLimit">Price Limit ($)</Label>
              <Input
                type="number"
                id="priceLimit"
                name="priceLimit"
                value={formData.priceLimit}
                onChange={handleInputChange}
                min="0"
                max="1000"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="distanceLimit">Distance Limit (miles)</Label>
              <Input
                type="number"
                id="distanceLimit"
                name="distanceLimit"
                value={formData.distanceLimit}
                onChange={handleInputChange}
                min="1"
                max="50"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="timeOfDay">Time of Day</Label>
              <Select
                id="timeOfDay"
                name="timeOfDay"
                value={formData.timeOfDay}
                onChange={handleInputChange}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="preferences">Preferences</Label>
              <Textarea
                id="preferences"
                name="preferences"
                value={formData.preferences}
                onChange={handleInputChange}
                placeholder="Enter any specific preferences (e.g., outdoor activities, food preferences, etc.)"
              />
            </FormGroup>
            
            <Button type="submit">Generate Hangout</Button>
          </Form>
        </Section>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
`;

const BackButton = styled.button`
  background-color: #f0f0f0;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
`;

const MembersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
`;

const MemberCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const MemberAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
`;

const MemberName = styled.span`
  font-weight: 500;
`;

// Chat UI styled components
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f9f9f9;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  background-color: ${props => props.isCurrentUser ? '#4a6cf7' : '#e9ecef'};
  color: ${props => props.isCurrentUser ? 'white' : '#333'};
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
`;

const MessageSender = styled.span`
  font-weight: 600;
`;

const MessageTime = styled.span`
  color: ${props => props.isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : '#666'};
`;

const MessageContent = styled.div`
  word-break: break-word;
`;

const ChatInputForm = styled.form`
  display: flex;
  padding: 0.75rem;
  background-color: white;
  border-top: 1px solid #e0e0e0;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 0.5rem;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4a6cf7;
  }
`;

const SendButton = styled.button`
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background-color: #3a5ce5;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const Button = styled.button`
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background-color: #3a5ce5;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  margin-top: 2rem;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-top: 2rem;
  padding: 1rem;
  background-color: #fdf0ed;
  border-radius: 4px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const EmptyStateText = styled.span`
  font-size: 1.2rem;
  color: #666;
`;

const JoinButton = styled.button`
  background-color: #6e8efb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  
  &:hover {
    background-color: #5d7dea;
  }
`;

export default ViewGroup; 