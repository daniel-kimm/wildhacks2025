import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const Hangout = () => {
  const { hangoutId } = useParams();
  const navigate = useNavigate();
  const [hangout, setHangout] = useState(null);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    const fetchHangoutData = async () => {
      try {
        setLoading(true);
        
        // Fetch hangout details
        const { data: hangoutData, error: hangoutError } = await supabase
          .from('hangouts')
          .select(`
            *,
            group:group_id (
              id,
              name
            )
          `)
          .eq('id', hangoutId)
          .single();
        
        if (hangoutError) throw hangoutError;
        
        setHangout(hangoutData);
        setGroup(hangoutData.group);
        
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
          .eq('group_id', hangoutData.group_id);
        
        if (membersError) throw membersError;
        
        setMembers(membersData.map(member => member.users));
        
        // Generate suggestions based on hangout criteria
        generateSuggestions(hangoutData);
      } catch (err) {
        console.error('Error fetching hangout data:', err);
        setError('Failed to load hangout information');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHangoutData();
  }, [hangoutId]);

  const generateSuggestions = (hangoutData) => {
    // This is a placeholder for actual suggestion generation logic
    // In a real app, this would call an API or use a recommendation engine
    
    const mockSuggestions = [
      {
        id: 1,
        name: 'Coffee Shop',
        description: 'A cozy coffee shop with great ambiance',
        price: '$5-15',
        distance: '0.5 miles',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      },
      {
        id: 2,
        name: 'Local Park',
        description: 'Beautiful park with walking trails and picnic areas',
        price: 'Free',
        distance: '1.2 miles',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      },
      {
        id: 3,
        name: 'Restaurant',
        description: 'Casual dining with a variety of options',
        price: '$15-30',
        distance: '0.8 miles',
        rating: 4.2,
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'
      }
    ];
    
    setSuggestions(mockSuggestions);
  };

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleConfirmHangout = async () => {
    if (!selectedSuggestion) return;
    
    try {
      // Update hangout with selected suggestion
      const { error } = await supabase
        .from('hangouts')
        .update({
          status: 'confirmed',
          selected_activity: selectedSuggestion.name,
          activity_details: selectedSuggestion
        })
        .eq('id', hangoutId);
      
      if (error) throw error;
      
      // Navigate to a confirmation page or back to groups
      navigate('/groups');
    } catch (err) {
      console.error('Error confirming hangout:', err);
      setError('Failed to confirm hangout');
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Generating hangout suggestions...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Hangout for {group?.name}</Title>
        <BackButton onClick={() => navigate(`/group/${group?.id}`)}>Back to Group</BackButton>
      </Header>
      
      <Content>
        <Section>
          <SectionTitle>Hangout Details</SectionTitle>
          <DetailsList>
            <DetailItem>
              <DetailLabel>Price Limit:</DetailLabel>
              <DetailValue>${hangout?.price_limit}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Distance Limit:</DetailLabel>
              <DetailValue>{hangout?.distance_limit} miles</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Time of Day:</DetailLabel>
              <DetailValue>{hangout?.time_of_day}</DetailValue>
            </DetailItem>
            {hangout?.preferences && (
              <DetailItem>
                <DetailLabel>Preferences:</DetailLabel>
                <DetailValue>{hangout.preferences}</DetailValue>
              </DetailItem>
            )}
          </DetailsList>
          
          <SectionTitle>Group Members</SectionTitle>
          <MembersList>
            {members.map(member => (
              <MemberCard key={member.id}>
                <MemberAvatar src={member.avatar_url || 'https://via.placeholder.com/40'} alt={member.username} />
                <MemberName>{member.username}</MemberName>
              </MemberCard>
            ))}
          </MembersList>
        </Section>
        
        <Section>
          <SectionTitle>Suggested Activities</SectionTitle>
          <SuggestionsList>
            {suggestions.map(suggestion => (
              <SuggestionCard 
                key={suggestion.id}
                selected={selectedSuggestion?.id === suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <SuggestionImage src={suggestion.image} alt={suggestion.name} />
                <SuggestionContent>
                  <SuggestionName>{suggestion.name}</SuggestionName>
                  <SuggestionDescription>{suggestion.description}</SuggestionDescription>
                  <SuggestionDetails>
                    <SuggestionDetail>
                      <DetailIcon>💰</DetailIcon>
                      {suggestion.price}
                    </SuggestionDetail>
                    <SuggestionDetail>
                      <DetailIcon>📍</DetailIcon>
                      {suggestion.distance}
                    </SuggestionDetail>
                    <SuggestionDetail>
                      <DetailIcon>⭐</DetailIcon>
                      {suggestion.rating}
                    </SuggestionDetail>
                  </SuggestionDetails>
                </SuggestionContent>
              </SuggestionCard>
            ))}
          </SuggestionsList>
          
          {selectedSuggestion && (
            <ConfirmSection>
              <ConfirmButton onClick={handleConfirmHangout}>
                Confirm Hangout at {selectedSuggestion.name}
              </ConfirmButton>
            </ConfirmSection>
          )}
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

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
`;

const DetailLabel = styled.span`
  font-weight: 500;
  color: #555;
`;

const DetailValue = styled.span`
  color: #333;
`;

const MembersList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
`;

const MemberCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
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
  font-size: 0.9rem;
`;

const SuggestionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SuggestionCard = styled.div`
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: ${props => props.selected ? '2px solid #4a6cf7' : '1px solid #eee'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const SuggestionImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
`;

const SuggestionContent = styled.div`
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const SuggestionName = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: #333;
`;

const SuggestionDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 0.75rem 0;
`;

const SuggestionDetails = styled.div`
  display: flex;
  gap: 1rem;
`;

const SuggestionDetail = styled.span`
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: #555;
`;

const DetailIcon = styled.span`
  margin-right: 0.25rem;
`;

const ConfirmSection = styled.div`
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  background-color: #4a6cf7;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  
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

export default Hangout; 