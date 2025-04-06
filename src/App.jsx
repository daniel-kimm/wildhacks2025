import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AddFriend from './pages/AddFriend';
import CreateGroup from './pages/CreateGroup';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import Map from './pages/Map';
import Login from './pages/Login';
import ViewGroup from './pages/ViewGroup';
import Hangout from './pages/Hangout';
import { supabase } from './utils/supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        setSession(session);
        
        // Set up auth state listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            setSession(session);
            setLoading(false);
          }
        );
        
        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);
  
  // Add a simple loading indicator
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #6e8efb 0%, #a777e3 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/onboarding" element={session ? <Navigate to="/dashboard" replace /> : <Onboarding />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={!session ? <Navigate to="/login" replace /> : <Dashboard />} />
        <Route path="/add-friend" element={!session ? <Navigate to="/login" replace /> : <AddFriend />} />
        <Route path="/create-group" element={!session ? <Navigate to="/login" replace /> : <CreateGroup />} />
        <Route path="/friends" element={!session ? <Navigate to="/login" replace /> : <Friends />} />
        <Route path="/groups" element={!session ? <Navigate to="/login" replace /> : <Groups />} />
        <Route path="/map" element={!session ? <Navigate to="/login" replace /> : <Map />} />
        <Route path="/group/:groupId" element={!session ? <Navigate to="/login" replace /> : <ViewGroup />} />
        <Route path="/hangout/:hangoutId" element={!session ? <Navigate to="/login" replace /> : <Hangout />} />
      </Routes>
    </Router>
  );
}

export default App;
