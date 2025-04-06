import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const NotificationInbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [groupInvites, setGroupInvites] = useState([]);
  const [acceptingInvite, setAcceptingInvite] = useState(null);
  const [rejectingInvite, setRejectingInvite] = useState(null);
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
      
      // Step 1: Get pending friend requests directly without join
      const { data: rawRequests, error: requestError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('status', 'pending');
      
      if (requestError) {
        console.error('Error fetching friend requests:', requestError);
        throw requestError;
      }
      
      console.log("Raw friend requests found:", rawRequests?.length || 0, rawRequests);
      
      if (!rawRequests || rawRequests.length === 0) {
        setRequests([]);
        setNotificationCount(0);
        setLoading(false);
        return;
      }
      
      // Step 2: Get sender profiles in a separate query
      const senderIds = rawRequests.map(req => req.sender_id);
      const { data: senderProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', senderIds);
      
      if (profileError) {
        console.error('Error fetching sender profiles:', profileError);
      }
      
      console.log("Sender profiles found:", senderProfiles?.length || 0, senderProfiles);
      
      // Step 3: Create a map of profile data for easy lookup
      const profileMap = {};
      if (senderProfiles) {
        senderProfiles.forEach(profile => {
          profileMap[profile.id] = profile;
        });
      }
      
      // Step 4: Combine the data
      const formattedRequests = rawRequests.map(request => {
        const senderProfile = profileMap[request.sender_id] || {};
        return {
          id: request.id,
          sender_id: request.sender_id,
          status: request.status,
          created_at: request.created_at,
          sender: {
            id: request.sender_id,
            name: senderProfile.name || 'Unknown User',
            avatar_url: senderProfile.avatar_url || null
          }
        };
      });
      
      console.log("Formatted friend requests:", formattedRequests);
      
      setRequests(formattedRequests);
      setNotificationCount(formattedRequests.length || 0);
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
    const newIsOpen = !isOpen;
    console.log("Toggling inbox:", newIsOpen ? "open" : "closed");
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      console.log("Refreshing friend requests");
      fetchFriendRequests(); // Refresh data when opening
    }
  };

  // Update the useEffect to fetch group invitations separately
  useEffect(() => {
    if (isOpen) {
      const fetchNotifications = async () => {
        setLoading(true);
        try {
          await fetchFriendRequests();
          // Add a delay before fetching group invitations to ensure both are loaded
          await fetchGroupInvitations();
          console.log("Notifications fetch complete");
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchNotifications();
    }
  }, [isOpen]);

  // Updated fetchGroupInvitations with improved logging
  const fetchGroupInvitations = async () => {
    try {
      console.log("Starting to fetch group invitations");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found for group invitations");
        return;
      }
      
      console.log("Fetching group invitations for user:", user.id);
      
      // Get pending group invitations - using the proper table name and column names
      const { data: rawInvites, error: invitesError } = await supabase
        .from('group_invitations')  // Make sure this matches your Supabase table name exactly
        .select('*')
        .eq('recipient_id', user.id)
        .eq('status', 'pending');
      
      if (invitesError) {
        console.error('Error fetching group invitations:', invitesError);
        throw invitesError;
      }
      
      console.log("Raw group invitations found:", rawInvites?.length || 0, rawInvites);
      
      if (!rawInvites || rawInvites.length === 0) {
        console.log("No pending group invitations found");
        setGroupInvites([]);
        return;
      }
      
      // Get group details for each invitation
      const groupIds = rawInvites.map(invite => invite.group_id);
      console.log("Fetching details for groups:", groupIds);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);
      
      if (groupsError) {
        console.error('Error fetching group details:', groupsError);
        throw groupsError;
      }
      
      console.log("Groups data retrieved:", groupsData);
      
      // Get sender profiles
      const senderIds = rawInvites.map(invite => invite.sender_id);
      console.log("Fetching sender profiles:", senderIds);
      
      const { data: senderProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', senderIds);
      
      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
        throw profilesError;
      }
      
      console.log("Sender profiles retrieved:", senderProfiles);
      
      // Create maps for easy lookup
      const groupMap = {};
      groupsData.forEach(group => {
        groupMap[group.id] = group;
      });
      
      const profileMap = {};
      senderProfiles.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      
      // Format the invitations
      const formattedInvites = rawInvites.map(invite => {
        const group = groupMap[invite.group_id] || {};
        const senderProfile = profileMap[invite.sender_id] || {};
        
        return {
          id: invite.id,
          group_id: invite.group_id,
          sender_id: invite.sender_id,
          status: invite.status,
          created_at: invite.created_at,
          group: {
            id: group.id,
            name: group.name || 'Unknown Group',
            description: group.description || ''
          },
          sender: {
            id: invite.sender_id,
            name: senderProfile.name || 'Unknown User',
            avatar_url: senderProfile.avatar_url || null
          }
        };
      });
      
      console.log("Formatted group invitations:", formattedInvites);
      setGroupInvites(formattedInvites);
      
      // Update total count
      const newCount = requests.length + formattedInvites.length;
      console.log(`Setting notification count to ${newCount} (${requests.length} requests + ${formattedInvites.length} invites)`);
      setNotificationCount(newCount);
      
    } catch (error) {
      console.error('Error fetching group invitations:', error);
      setGroupInvites([]);
    }
  };

  // Add functions to handle group invitation responses
  const handleAcceptGroupInvite = async (inviteId, groupId) => {
    try {
      setAcceptingInvite(inviteId);
      
      // Update invitation status
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted', updated_at: new Date() })
        .eq('id', inviteId);
      
      if (updateError) throw updateError;
      
      // Add user to group members
      const { data: { user } } = await supabase.auth.getUser();
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });
      
      if (memberError) throw memberError;
      
      // Update local state
      setGroupInvites(prev => prev.filter(invite => invite.id !== inviteId));
      setNotificationCount(prev => prev - 1);
      
      alert('You have joined the group!');
    } catch (error) {
      console.error('Error accepting group invitation:', error);
      alert(`Failed to accept group invitation: ${error.message}`);
    } finally {
      setAcceptingInvite(null);
    }
  };

  const handleRejectGroupInvite = async (inviteId) => {
    try {
      setRejectingInvite(inviteId);
      
      // Update invitation status
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'rejected', updated_at: new Date() })
        .eq('id', inviteId);
      
      if (error) throw error;
      
      // Update local state
      setGroupInvites(prev => prev.filter(invite => invite.id !== inviteId));
      setNotificationCount(prev => prev - 1);
      
      alert('Group invitation rejected');
    } catch (error) {
      console.error('Error rejecting group invitation:', error);
      alert(`Failed to reject group invitation: ${error.message}`);
    } finally {
      setRejectingInvite(null);
    }
  };

  return (
    <NotificationWrapper ref={dropdownRef}>
      <NotificationIcon onClick={toggleInbox}>
        <MailIcon>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </MailIcon>
        {notificationCount > 0 && <NotificationBadge>{notificationCount}</NotificationBadge>}
      </NotificationIcon>
      
      {isOpen && (
        <NotificationDropdown>
          <NotificationHeader>
            Notifications
            {loading && <LoadingSpinner />}
          </NotificationHeader>
          
          {requests.length === 0 && groupInvites.length === 0 ? (
            <EmptyNotification>No pending notifications</EmptyNotification>
          ) : (
            <NotificationList>
              {requests.length > 0 && (
                <NotificationSection>
                  <SectionTitle>Friend Requests</SectionTitle>
                  {requests.map(request => (
                    <NotificationItem key={request.id}>
                      <RequestAvatar>
                        {request.sender?.avatar_url ? (
                          <img src={request.sender.avatar_url} alt="User avatar" />
                        ) : (
                          <AvatarPlaceholder>
                            {(request.sender?.name || 'U').charAt(0).toUpperCase()}
                          </AvatarPlaceholder>
                        )}
                      </RequestAvatar>
                      <RequestInfo>
                        <RequestName>{request.sender?.name || 'Unknown User'}</RequestName>
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
                </NotificationSection>
              )}
              
              {groupInvites.length > 0 && (
                <NotificationSection>
                  <SectionTitle>Group Invitations</SectionTitle>
                  {groupInvites.map(invite => (
                    <NotificationItem key={invite.id}>
                      <RequestAvatar>
                        <GroupAvatar>{invite.group.name.charAt(0)}</GroupAvatar>
                      </RequestAvatar>
                      <RequestInfo>
                        <RequestName>{invite.sender.name}</RequestName>
                        <RequestTime>
                          {new Date(invite.created_at).toLocaleDateString()}
                        </RequestTime>
                      </RequestInfo>
                      <RequestActions>
                        <AcceptButton 
                          onClick={() => handleAcceptGroupInvite(invite.id, invite.group_id)}
                          disabled={acceptingInvite === invite.id || rejectingInvite === invite.id}
                        >
                          {acceptingInvite === invite.id ? 'Joining...' : 'Join Group'}
                        </AcceptButton>
                        <RejectButton 
                          onClick={() => handleRejectGroupInvite(invite.id)}
                          disabled={acceptingInvite === invite.id || rejectingInvite === invite.id}
                        >
                          {rejectingInvite === invite.id ? 'Declining...' : 'Decline'}
                        </RejectButton>
                      </RequestActions>
                    </NotificationItem>
                  ))}
                </NotificationSection>
              )}
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

const NotificationList = styled.div`  max-height: 350px;
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

const MailIcon = styled.div`
  width: 20px;
  height: 20px;
  color: #606770;
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const GroupAvatar = styled(AvatarPlaceholder)`
  background: linear-gradient(to right, #6e8efb, #a777e3);
`;

const NotificationSection = styled.div`
  margin-bottom: 16px;
`;

const SectionTitle = styled.h4`
  font-size: 0.9rem;
  color: #65676B;
  margin: 8px 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e6eb;
`;

const RequestDescription = styled.div`
  font-size: 0.85rem;
  color: #65676B;
  margin-top: 4px;
`;

export default NotificationInbox; 
