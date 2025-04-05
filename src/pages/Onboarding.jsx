import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    interests: '',
    preferences: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (currentStep) => {
    let isValid = true;
    const newErrors = {};

    switch (currentStep) {
      case 0:
        // No validation needed as the Google button is the only action
        break;
      case 1:
        if (!userData.name.trim()) {
          newErrors.name = "Name is required";
          isValid = false;
        }
        break;
      case 2:
        if (!userData.interests.trim()) {
          newErrors.interests = "Please tell us about your interests";
          isValid = false;
        }
        break;
      case 3:
        if (!userData.preferences.trim()) {
          newErrors.preferences = "Please share your hangout preferences";
          isValid = false;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleGoogleLogin = () => {
    // This would be replaced with actual Google OAuth implementation
    console.log('Logging in with Google...');
    // Simulate successful login
    setIsLoggedIn(true);
    nextStep();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(step)) {
      // Save user data to localStorage before redirecting
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Here you would connect to your backend to save user data
      console.log('Submitting user data:', userData);
      
      // Navigate to dashboard after successful submission
      navigate('/dashboard');
    }
  };

  return (
    <OnboardingContainer>
      <OnboardingCard>
        <LogoSection>
          <AppLogo>Hangout</AppLogo>
          <AppTagline>Find the perfect place to hang out with friends</AppTagline>
        </LogoSection>

        <ProgressBar>
          <ProgressStep active={step >= 0} />
          <ProgressStep active={step >= 1} />
          <ProgressStep active={step >= 2} />
          <ProgressStep active={step >= 3} />
        </ProgressBar>

        <Form onSubmit={handleSubmit}>
          {step === 0 && (
            <StepContainer>
              <StepTitle>Welcome to HangoutAI!</StepTitle>
              <StepDescription>
                Please sign in with your Google account to get started.
              </StepDescription>
              <GoogleButton type="button" onClick={handleGoogleLogin}>
                <GoogleIcon>G</GoogleIcon>
                Sign in with Google
              </GoogleButton>
            </StepContainer>
          )}

          {step === 1 && (
            <StepContainer>
              <StepTitle>Welcome to HangoutAI!</StepTitle>
              <StepDescription>
                We'll help you and your friends find the perfect places to hang out.
                First, let's get to know you better.
              </StepDescription>
              <InputGroup>
                <Label htmlFor="name">What's your name?</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              </InputGroup>
              <Button type="button" onClick={nextStep}>Next</Button>
            </StepContainer>
          )}

          {step === 2 && (
            <StepContainer>
              <StepTitle>What do you enjoy?</StepTitle>
              <StepDescription>
                Tell us about your interests so we can recommend better hangout spots.
              </StepDescription>
              <InputGroup>
                <Label htmlFor="interests">Your interests</Label>
                <TextArea
                  id="interests"
                  name="interests"
                  value={userData.interests}
                  onChange={handleChange}
                  placeholder="e.g., hiking, coffee, board games, art galleries"
                  rows={4}
                  required
                />
                {errors.interests && <ErrorMessage>{errors.interests}</ErrorMessage>}
              </InputGroup>
              <ButtonGroup>
                <Button type="button" secondary onClick={prevStep}>Back</Button>
                <Button type="button" onClick={nextStep}>Next</Button>
              </ButtonGroup>
            </StepContainer>
          )}

          {step === 3 && (
            <StepContainer>
              <StepTitle>Almost there!</StepTitle>
              <StepDescription>
                Tell us about your hangout preferences.
              </StepDescription>
              <InputGroup>
                <Label htmlFor="preferences">Hangout preferences</Label>
                <TextArea
                  id="preferences"
                  name="preferences"
                  value={userData.preferences}
                  onChange={handleChange}
                  placeholder="e.g., quiet places, outdoor settings, budget-friendly options"
                  rows={4}
                  required
                />
                {errors.preferences && <ErrorMessage>{errors.preferences}</ErrorMessage>}
              </InputGroup>
              <ButtonGroup>
                <Button type="button" secondary onClick={prevStep}>Back</Button>
                <Button type="submit" onClick={(e) => validateStep(step) ? handleSubmit(e) : e.preventDefault()}>Get Started</Button>
              </ButtonGroup>
            </StepContainer>
          )}
        </Form>
      </OnboardingCard>
    </OnboardingContainer>
  );
};

// Styled Components
const OnboardingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #6e8efb 0%, #a777e3 100%);
  padding: 20px;
`;

const OnboardingCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 550px;
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

const ProgressBar = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const ProgressStep = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.active ? '#6e8efb' : '#e0e0e0'};
  margin: 0 5px;
  transition: background-color 0.3s ease;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StepTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
`;

const StepDescription = styled.p`
  color: #666;
  margin-bottom: 20px;
`;

const InputGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #6e8efb;
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    border-color: #6e8efb;
    outline: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  background: ${props => props.secondary ? 'transparent' : 'linear-gradient(to right, #6e8efb, #a777e3)'};
  color: ${props => props.secondary ? '#6e8efb' : 'white'};
  border: ${props => props.secondary ? '1px solid #6e8efb' : 'none'};
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.secondary ? 'none' : '0 5px 15px rgba(110, 142, 251, 0.3)'};
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #757575;
  border: 1px solid #ddd;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 15px;

  &:hover {
    background: #f5f5f5;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
`;

const GoogleIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #4285F4;
  color: white;
  border-radius: 50%;
  margin-right: 10px;
  font-weight: bold;
`;

const ErrorMessage = styled.p`
  color: #e53935;
  font-size: 0.875rem;
  margin-top: 5px;
  margin-bottom: 0;
`;

export default Onboarding; 