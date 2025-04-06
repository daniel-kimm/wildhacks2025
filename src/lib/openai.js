import OpenAI from 'openai';

// Initialize the OpenAI client with better error handling
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  // Fallback for development
  if (!apiKey) {
    console.warn('⚠️ No OpenAI API key found. Using mock data instead.');
    return null;
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
};

const openai = getOpenAIClient();

// Modified function with error handling for missing API key
export async function generateChatCompletion(messages) {
  try {
    // If no API client, return a formatted mock response
    if (!openai) {
      console.log('Using mock completion as OpenAI client is not available');
      return JSON.stringify([
        {
          name: "Mock Café",
          type: "Coffee Shop",
          price: 15,
          priceCategory: "$$",
          distance: "1.2 miles",
          description: "A cozy café with great atmosphere and delicious pastries.",
          rating: 4.5,
          reviewCount: 127,
          image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60",
          tags: ["Coffee", "Quiet", "WiFi"],
          location: { lat: 40.7128, lng: -74.0060 }
        }
      ]);
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to any model you want to use
      messages: messages,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Return a formatted error response that won't break the app
    return JSON.stringify([{
      name: "Error Café", 
      type: "Error",
      price: 0,
      priceCategory: "$",
      distance: "1.0 miles",
      description: "Could not load recommendations. Error: " + error.message,
      rating: 1.0,
      reviewCount: 1,
      image: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
      tags: ["Error"],
      location: { lat: 40.7128, lng: -74.0060 }
    }]);
  }
}

export default openai; 