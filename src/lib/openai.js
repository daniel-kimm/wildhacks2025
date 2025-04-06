import OpenAI from 'openai';

// Initialize the OpenAI client with better error handling
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  console.log("API Key defined:", !!apiKey);
  console.log("API Key length:", apiKey?.length || 0);
  
  // Fallback for development
  if (!apiKey) {
    console.warn('⚠️ No OpenAI API key found. Using mock data instead.');
    return null;
  }
  
  try {
    const client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
    console.log("OpenAI client created successfully");
    return client;
  } catch (error) {
    console.error("Error creating OpenAI client:", error);
    return null;
  }
};

const openai = getOpenAIClient();
console.log("OpenAI client initialized:", !!openai);

// Modified function with error handling for missing API key
export async function generateChatCompletion(messages) {
  try {
    // If no API client, return a formatted mock response
    if (!openai) {
      console.log('Using mock completion as OpenAI client is not available');
      return JSON.stringify([
        {
          name: "Mock Café",
          description: "A cozy café with great atmosphere and delicious pastries.",
          priceEstimate: "$$",
          distance: "1.2 miles",
          rating: 4.5,
          type: "Coffee Shop",
          imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8Y2FmZXxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60"
        },
        {
          name: "Local Park",
          description: "A beautiful park with walking trails, picnic areas, and a playground.",
          priceEstimate: "$",
          distance: "0.8 miles",
          rating: 4.7,
          type: "Outdoor",
          imageUrl: "https://images.unsplash.com/photo-1617369120004-4fc70312c5e6"
        },
        {
          name: "Art Gallery",
          description: "A contemporary art gallery featuring works from local and international artists.",
          priceEstimate: "$$",
          distance: "1.5 miles",
          rating: 4.6, 
          type: "Cultural",
          imageUrl: "https://images.unsplash.com/photo-1577083288073-40892c0860a4"
        }
      ]);
    }
    
    console.log("Sending request to OpenAI...");
    console.log("Messages:", JSON.stringify(messages).slice(0, 200) + "...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to any model you want to use
      messages: messages,
    });
    
    console.log("OpenAI response received!");
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Return a formatted error response that won't break the app
    return JSON.stringify([{
      name: "Error Café", 
      description: "Could not load recommendations. Error: " + error.message,
      priceEstimate: "$",
      distance: "1.0 miles",
      rating: 1.0,
      type: "Error",
      imageUrl: "https://images.unsplash.com/photo-1525610553991-2bede1a236e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }]);
  }
}

export default openai; 