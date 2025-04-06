import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { supabase } from '../utils/supabaseClient';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    
    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard'
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
    <LoginContainer>
      <LoginCard>
        <LogoSection>
          <AppLogo>Hangout</AppLogo>
          <AppTagline>Find the perfect place to hang out with friends</AppTagline>
        </LogoSection>
        
        <LoginContent>
          <WelcomeTitle>Welcome Back!</WelcomeTitle>
          <Description>
            Sign in to continue planning hangouts with your friends
          </Description>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <GoogleButton 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <GoogleIcon>G</GoogleIcon>
            {loading ? 'Connecting...' : 'Sign in with Google'}
          </GoogleButton>
          
          <Divider>
            <DividerLine />
            <DividerText>or</DividerText>
            <DividerLine />
          </Divider>
          
          <NewUserText>
            New to HangoutAI?{' '}
            <NewUserLink onClick={() => navigate('/signup')}>
              Create an account
            </NewUserLink>
          </NewUserText>
        </LoginContent>
      </LoginCard>
    </LoginContainer>
  );
};

// Styled components
const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
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

const LoginContent = styled.div`
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

const NewUserText = styled.p`
  font-size: 0.9rem;
  color: #666;
`;

const NewUserLink = styled.a`
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

export default Login; 