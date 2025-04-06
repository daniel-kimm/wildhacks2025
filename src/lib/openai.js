import OpenAI from 'openai';

// Initialize the OpenAI client with your API key from environment variables
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

// Check if API key is available
if (!import.meta.env.VITE_OPENAI_API_KEY) {
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
    coordinates: {
      lat: 40.7589,
      lng: -73.9851
    }
  }
];

// Function to make a chat completion request
export async function generateChatCompletion(messages) {
  try {
    // If API key is not set, return a stringified version of fallback recommendations
    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      console.warn('Using fallback recommendations due to missing OpenAI API key');
      return JSON.stringify(fallbackRecommendations);
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more appropriate model
      messages: messages,
      temperature: 0.7, // Add some creativity but not too much
      max_tokens: 1000, // Limit response length
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Return fallback recommendations as a string
    return JSON.stringify(fallbackRecommendations);
  }
}

export default openai; 