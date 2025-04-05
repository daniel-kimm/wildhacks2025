import { supabase } from './supabaseClient';

// Function to update a user's profile
export async function updateUserProfile(userData) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      throw new Error('No authenticated user found');
    }
    
    const { user } = session;
    
    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        interests: userData.interests,
        preferences: userData.preferences
      }
    });
    
    if (updateError) throw updateError;
    
    // Update the user's profile in the profiles table
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: userData.email || user.email,
        name: userData.name,
        interests: userData.interests,
        preferences: userData.preferences,
        avatar_url: userData.avatar_url,
        updated_at: new Date()
      });
    
    if (upsertError) throw upsertError;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to get the current user's profile
export async function getUserProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return { success: false, error: 'Not authenticated' };
    }
    
    const { user } = session;
    
    // Get the user's profile from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return { success: true, profile: data };
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    return { success: false, error: error.message };
  }
} 