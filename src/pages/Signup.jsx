import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/onboarding');
      }
    };
    
    checkSession();
  }, [navigate]);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`
        }
      });
      
      if (error) throw error;
      
      if (data && data.user) {
        navigate('/onboarding');
      }
      
    } catch (error) {
      console.error('Error signing up with email:', error.message);
      setError(error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/onboarding'
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupContainer>
      <SignupCard>
        <LogoSection>
          <AppLogo>Hangout</AppLogo>
          <AppTagline>Find the perfect place to hang out with friends</AppTagline>
        </LogoSection>
        
        <SignupContent>
          <WelcomeTitle>Create Your Account</WelcomeTitle>
          <Description>
            Sign up to start planning hangouts with your friends
          </Description>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <Form onSubmit={handleEmailSignup}>
            <InputGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
            </InputGroup>
            
            <InputGroup>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </InputGroup>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up with Email'}
            </Button>
          </Form>
          
          <Divider>
            <DividerLine />
            <DividerText>or</DividerText>
            <DividerLine />
          </Divider>
          
          <GoogleButton 
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <GoogleIcon>G</GoogleIcon>
            {loading ? 'Connecting...' : 'Sign up with Google'}
          </GoogleButton>
          
          <ExistingUserRow>
            Already have an account? <ExistingUserLink onClick={() => navigate('/login')}>
              Sign in
            </ExistingUserLink>
          </ExistingUserRow>
        </SignupContent>
      </SignupCard>
    </SignupContainer>
  );
};

// Styled components
const SignupContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  padding: 20px;
`;

const SignupCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  padding: 40px;
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const AppLogo = styled.h1`
  font-size: 2.5rem;
  color: #6e8efb;
  margin: 0;
`;

const AppTagline = styled.p`
  color: #666;
  font-size: 1rem;
`;

const SignupContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const WelcomeTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 30px;
  text-align: center;
`;

const Form = styled.form`
  width: 100%;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  
  &:focus {
    outline: none;
    border-color: #6e8efb;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #6e8efb;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 10px;
  
  &:hover {
    background-color: #5a7dfa;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #f8f8f8;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const GoogleIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background-color: #fff;
  color: #4285F4;
  font-weight: bold;
  border-radius: 50%;
  margin-right: 10px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  margin: 30px 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background-color: #ddd;
`;

const DividerText = styled.span`
  padding: 0 15px;
  color: #888;
  font-size: 0.9rem;
`;

const ExistingUserRow = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-top: 20px;
`;

const ExistingUserLink = styled.a`
  color: #6e8efb;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  width: 100%;
  padding: 12px;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  text-align: center;
`;

export default Signup; 