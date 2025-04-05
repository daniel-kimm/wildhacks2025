import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const NotificationInbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch friend requests on component mount
  useEffect(() => {
    fetchFriendRequests();
    
    // Set up real-time subscription for new friend requests
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      console.log("Setting up real-time subscription for user:", user.id);
      
      const friendRequestSubscription = supabase
        .channel('friend_requests_channel')
        .on('postgres_changes', {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'friend_requests',
          filter: `recipient_id=eq.${user.id}`
        }, (payload) => {
          console.log("Received real-time update:", payload);
          fetchFriendRequests();
        })
        .subscribe();
        
      return friendRequestSubscription;
    };
    
    const subscription = setupSubscription();
    
    // Handle clicks outside the dropdown to close it
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      // Clean up subscription on component unmount
      if (subscription) {
        subscription.then(sub => sub.unsubscribe());
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch friend requests from Supabase
  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user found");
        return;
      }
      
      console.log("Fetching friend requests for user:", user.id);
      
      // Get pending friend requests with correct profiles join
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          sender_id,
          status,
          created_at,
          sender:profiles(name, avatar_url)
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching friend requests:', error);
        throw error;
      }
      
      console.log("Friend requests received:", data);
      
      setRequests(data || []);
      setNotificationCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting a friend request
  const handleAccept = async (requestId, senderId) => {
    try {
      setLoading(true);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to accept a friend request');
      }
      
      console.log(`Accepting friend request ID ${requestId} from ${senderId} to ${user.id}`);
      
      // Call the database function to handle acceptance
      const { data, error } = await supabase
        .rpc('accept_friend_request', {
          sender_id: senderId,
          recipient_id: user.id
        });
      
      if (error) {
        console.error('Error in RPC call:', error);
        throw error;
      }
      
      console.log('RPC response:', data);
      
      if (data === false) {
        throw new Error('No pending friend request found');
      }
      
      // Refresh notification list
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert(`Failed to accept request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting a friend request
  const handleReject = async (requestId) => {
    try {
      // Update request status to 'rejected'
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date() })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update the local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
      setNotificationCount(prev => prev - 1);
      
      alert('Friend request rejected.');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  // Toggle inbox open/closed
  const toggleInbox = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchFriendRequests(); // Refresh data when opening
    }
  };

  return (
    <NotificationWrapper ref={dropdownRef}>
      <NotificationIcon onClick={toggleInbox}>
        <i className="fas fa-bell"></i>
        {notificationCount > 0 && <NotificationBadge>{notificationCount}</NotificationBadge>}
      </NotificationIcon>
      
      {isOpen && (
        <NotificationDropdown>
          <NotificationHeader>
            Friend Requests
            {loading && <LoadingSpinner />}
          </NotificationHeader>
          
          {requests.length === 0 ? (
            <EmptyNotification>No pending friend requests</EmptyNotification>
          ) : (
            <NotificationList>
              {requests.map(request => (
                <NotificationItem key={request.id}>
                  <RequestAvatar>
                    {request.sender.avatar_url ? (
                      <img src={request.sender.avatar_url} alt="User avatar" />
                    ) : (
                      <AvatarPlaceholder>
                        {(request.sender.name || 'U').charAt(0).toUpperCase()}
                      </AvatarPlaceholder>
                    )}
                  </RequestAvatar>
                  <RequestInfo>
                    <RequestName>{request.sender.name || 'Unknown User'}</RequestName>
                    <RequestTime>
                      {new Date(request.created_at).toLocaleDateString()}
                    </RequestTime>
                  </RequestInfo>
                  <RequestActions>
                    <AcceptButton onClick={() => handleAccept(request.id, request.sender_id)}>
                      Accept
                    </AcceptButton>
                    <RejectButton onClick={() => handleReject(request.id)}>
                      Reject
                    </RejectButton>
                  </RequestActions>
                </NotificationItem>
              ))}
            </NotificationList>
          )}
        </NotificationDropdown>
      )}
    </NotificationWrapper>
  );
};

// Styled components for the notification inbox
const NotificationWrapper = styled.div`
  position: relative;
  margin-right: 15px;
`;

const NotificationIcon = styled.div`
  position: relative;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #e4e6eb;
  }
  
  i {
    color: #606770;
    font-size: 16px;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #e41e3f;
  color: white;
  font-size: 11px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: 45px;
  right: -10px;
  width: 320px;
  max-height: 400px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  
  @media (max-width: 480px) {
    width: 300px;
    right: -80px;
  }
`;

const NotificationHeader = styled.div`
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationList = styled.div`
  max-height: 350px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 12px 15px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f7f8fa;
  }
`;

const RequestAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  
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

const RequestInfo = styled.div`
  flex: 1;
`;

const RequestName = styled.div`
  font-weight: 500;
  margin-bottom: 3px;
`;

const RequestTime = styled.div`
  font-size: 12px;
  color: #65676b;
`;

const RequestActions = styled.div`
  display: flex;
  gap: 8px;
`;

const AcceptButton = styled.button`
  background: #66bb6a;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #5baa5f;
  }
`;

const RejectButton = styled.button`
  background: #e57373;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #d46c6c;
  }
`;

const EmptyNotification = styled.div`
  padding: 20px;
  text-align: center;
  color: #65676b;
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #6e8efb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default NotificationInbox; 