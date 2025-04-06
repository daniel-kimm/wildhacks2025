import axios from 'axios';

// Function to find nearby activities using ChatGPT
export const findNearbyActivitiesWithChatGPT = async (center, radius = 5000, categories = ['restaurant', 'cafe', 'park', 'museum', 'entertainment']) => {
  try {
    // Format the prompt for ChatGPT
    const prompt = `Find ${categories.join(', ')} near the coordinates (${center.latitude}, ${center.longitude}) within a radius of ${radius/1000}km. 
    Return the results as a JSON array of objects with the following properties:
    - name: The name of the place
    - category: The category of the place
    - latitude: The latitude coordinate
    - longitude: The longitude coordinate
    - distance: The distance from the center point in meters
    - description: A brief description of the place
    
    Limit the results to 10 places.`;
    
    // Call the ChatGPT API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that finds places near specific coordinates.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
        }
      }
    );
    
    // Extract the JSON response from ChatGPT
    const content = response.data.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Find JSON in the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```([\s\S]*?)```/) || 
                        content.match(/\[([\s\S]*?)\]/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        return JSON.parse(jsonStr);
      } else {
        // If no JSON found, try to parse the entire response
        return JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing ChatGPT response:', parseError);
      throw new Error('Failed to parse ChatGPT response');
    }
  } catch (error) {
    console.error('Error finding nearby activities with ChatGPT:', error);
    throw error;
  }
};

// Function to find activities near a group of people
export const findActivitiesNearGroup = async (locations, radius = 5000, categories = ['restaurant', 'cafe', 'park', 'museum', 'entertainment']) => {
  try {
    // Calculate the center point of all locations
    const center = calculateCenterPoint(locations);
    
    // Find activities near the center point using ChatGPT
    return await findNearbyActivitiesWithChatGPT(center, radius, categories);
  } catch (error) {
    console.error('Error finding activities near group:', error);
    throw error;
  }
};

// Helper function to calculate the center point of multiple locations
const calculateCenterPoint = (locations) => {
  if (!locations || locations.length === 0) {
    throw new Error('No locations provided');
  }
  
  const sum = locations.reduce((acc, loc) => ({
    latitude: acc.latitude + loc.latitude,
    longitude: acc.longitude + loc.longitude
  }), { latitude: 0, longitude: 0 });
  
  return {
    latitude: sum.latitude / locations.length,
    longitude: sum.longitude / locations.length
  };
}; 