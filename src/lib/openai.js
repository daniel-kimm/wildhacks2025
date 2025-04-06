import OpenAI from 'openai';

// Initialize the OpenAI client with your API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY, // Handles both Node.js and Vite environments
});

// Example function to make a chat completion request
export async function generateChatCompletion(messages) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can change this to any model you want to use
      messages: messages,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

export default openai; 