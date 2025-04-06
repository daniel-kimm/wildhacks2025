import OpenAI from 'openai';

// Initialize the OpenAI client with your API key from environment variables
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
console.log('OpenAI API Key available:', !!apiKey);
console.log('OpenAI API Key value:', apiKey ? 'sk-...' + apiKey.slice(-4) : 'Not set');

const openai = new OpenAI({
  apiKey: apiKey,
});

// Check if API key is available
if (!apiKey) {
  console.warn('OpenAI API key is not set. Recommendations will use fallback data.');
}

// Sample fallback recommendations in case OpenAI API fails
const fallbackRecommendations = [
  {
    name: "Central Park",
    category: "Park",
    description: "A large urban park with walking trails, lakes, and recreational areas.",
    price: "$",
    bestTime: "Any time",
    rating: 4.5,
    distance: "0.5 miles",
    coordinates: {
      lat: 40.7829,
      lng: -73.9654
    }
  },
  {
    name: "Local Art Museum",
    category: "Museum",
    description: "A museum featuring local and international art exhibitions.",
    price: "$$",
    bestTime: "Afternoon",
    rating: 4.7,
    distance: "1.2 miles",
    coordinates: {
      lat: 40.7794,
      lng: -73.9632
    }
  },
  {
    name: "Craft Beer Pub",
    category: "Restaurant",
    description: "A cozy pub serving craft beers and pub food.",
    price: "$$",
    bestTime: "Evening",
    rating: 4.6,
    distance: "0.8 miles",
    coordinates: {
      lat: 40.7589,
      lng: -73.9851
    }
  }
];

// Function to make a chat completion request
export async function generateChatCompletion(messages) {
  try {
    console.log('generateChatCompletion called with messages:', messages);
    
    // If API key is not set, return a stringified version of fallback recommendations
    if (!apiKey) {
      console.warn('Using fallback recommendations due to missing OpenAI API key');
      return JSON.stringify(fallbackRecommendations);
    }
    
    console.log('Making request to OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more appropriate model
      messages: messages,
      temperature: 0.7, // Add some creativity but not too much
      max_tokens: 1000, // Limit response length
    });
    
    console.log('OpenAI API response received:', completion);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Return fallback recommendations as a string
    return JSON.stringify(fallbackRecommendations);
  }
}

export default openai; 