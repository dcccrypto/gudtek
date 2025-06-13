import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateImage(prompt: string, quality: 'standard' | 'hd' = 'standard'): Promise<Buffer> {
  try {
    console.log('Generating image with prompt:', prompt);
    
    // Use DALL-E 3 for image generation
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a high-quality profile picture: ${prompt}`,
      n: 1,
      size: "1024x1024",
      quality: quality,
      response_format: "b64_json",
    });

    console.log('OpenAI response received');
    
    if (!response.data?.[0]?.b64_json) {
      console.error('No image data in response:', response);
      throw new Error('No image data received from OpenAI');
    }

    return Buffer.from(response.data[0].b64_json, 'base64');
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    throw error;
  }
} 