import OpenAI from 'openai';

// Suppress the bigint warning by overriding console.warn temporarily
// This prevents the "bigint: Failed to load bindings, pure JS will be used" warning
const suppressBigIntWarning = () => {
  const originalWarn = console.warn;
  console.warn = function(message, ...args) {
    if (typeof message === 'string' && message.includes('bigint: Failed to load bindings')) {
      // Suppress this specific warning
      return;
    }
    originalWarn.call(console, message, ...args);
  };
  
  // Restore original console.warn after a short delay
  setTimeout(() => {
    console.warn = originalWarn;
  }, 1000);
};

// Call the suppression function immediately
suppressBigIntWarning();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Mascot description to include in all prompts
const MASCOT_DESCRIPTION = "A bright yellow chibi mascot with a perfectly round matte head, solid black oval eyes, a wide curved black smile, and three bold red exclamation marks diagonally on the top-right of its head";

export async function enhancePrompt(userPrompt: string): Promise<string> {
  try {
    console.log('Enhancing prompt with GPT-4o:', userPrompt);
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating detailed image generation prompts. Your job is to enhance the user's prompt to create a visually appealing profile picture featuring the GUDTEK mascot: ${MASCOT_DESCRIPTION}. Keep the original intent but add details about style, lighting, composition, and artistic elements. Focus on creating a professional, high-quality result. Don't make it too wordy - keep it under 100 words.`
        },
        {
          role: "user",
          content: `Create a profile picture with the GUDTEK mascot (${MASCOT_DESCRIPTION}) in this scene: ${userPrompt}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const enhancedPrompt = response.choices[0]?.message?.content?.trim() || userPrompt;
    console.log('Enhanced prompt:', enhancedPrompt);
    return enhancedPrompt;
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    // Fall back to original prompt if enhancement fails
    return `Profile picture of ${MASCOT_DESCRIPTION} in scene: ${userPrompt}`;
  }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('Generating image with prompt:', prompt);
    
    // Make sure the mascot description is included in the prompt
    const finalPrompt = prompt.includes(MASCOT_DESCRIPTION) 
      ? prompt 
      : `${prompt} The main character is ${MASCOT_DESCRIPTION}.`;
    
    const response = await openai.images.generate({
      model: "gpt-image-1", // Using GPT Image 1 for high quality images
      prompt: finalPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    console.log('OpenAI image response received');
    
    if (!response.data || response.data.length === 0) {
      throw new Error('Empty data array in OpenAI response');
    }

    // Prefer base64 field if present
    const b64 = response.data[0].b64_json as string | undefined;
    if (b64) {
      console.log('Received base64 image (length)', b64.length);
      return b64;
    }

    // Fall-back to URL field (older / other models)
    const imageUrl = (response.data[0] as any).url as string | undefined;
    if (!imageUrl) {
      throw new Error('No image payload (b64_json or url) found in OpenAI response');
    }

    console.log('Fetching image from URL …');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    const buf = await imageResponse.arrayBuffer();
    console.log('Downloaded image bytes', buf.byteLength);
    return Buffer.from(buf).toString('base64');
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
} 