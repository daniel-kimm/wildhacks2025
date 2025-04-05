import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AddFriend from './pages/AddFriend';
import CreateGroup from './pages/CreateGroup';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import Map from './pages/Map';
import { supabase } from './utils/supabaseClient';

function App() {
  console.log("App component mounted");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if Supabase is configured correctly
    const checkSupabase = async () => {
      try {
        // Try a simple Supabase query to check connection
        await supabase.from('profiles').select('count', { count: 'exact', head: true });
        console.log("Supabase connection successful");
        setInitialized(true);
      } catch (err) {
        console.error("Error connecting to Supabase:", err);
        setError(err.message);
        setInitialized(true); // Still mark as initialized so we can show error message
      }
    };
    
    checkSupabase();
  }, []);

  if (!initialized) {
    return <div style={{ padding: 20 }}>Loading application...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h2>Error Initializing Application</h2>
        <p>{error}</p>
        <p>Please check your Supabase configuration in .env file.</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-friend" element={<AddFriend />} />
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </Router>
  );
}

export default App;
