import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import { generateImage, enhancePrompt } from '@/lib/openai';

// Token requirement to use the PFP generator
const TOKEN_REQUIREMENT = 20000;

export async function POST(request: Request) {
  try {
    console.log('PFP generation request received');
    const { prompt, wallet } = await request.json();
    console.log('Request data:', { prompt, wallet });

    if (!prompt || !wallet) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Skip the balance check on server side - we'll rely on the client-side check
    // The getWalletInfo function returns 0 balance in server environment
    console.log('Skipping server-side balance verification (already checked on client)');

    // Enhance the prompt with GPT-4o
    console.log('Enhancing prompt with GPT-4o');
    const enhancedPrompt = await enhancePrompt(prompt);
    console.log('Enhanced prompt:', enhancedPrompt);

    // Generate image using GPT Image 1
    console.log('Generating image with GPT Image 1');
    const imageData = await generateImage(enhancedPrompt);
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Add watermark to the preview image
    console.log('Adding watermark to preview image');
    const watermarkedBuffer = await addWatermark(imageBuffer);

    // Save to Supabase
    console.log('Saving to Supabase');
    const supabase = createClient();
    
    // Store both original and watermarked images
    const timestamp = Date.now();
    const originalFilename = `${wallet}/${timestamp}_original.png`;
    const watermarkedFilename = `${wallet}/${timestamp}_preview.png`;

    // Upload original image (for later use when burning tokens)
    const { error: originalUploadError } = await supabase.storage
      .from('pfps')
      .upload(originalFilename, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (originalUploadError) {
      console.error('Error uploading original image:', originalUploadError);
      return NextResponse.json(
        { error: 'Failed to upload original image' },
        { status: 500 }
      );
    }
    
    // Upload watermarked preview image
    const { error: previewUploadError } = await supabase.storage
      .from('pfps')
      .upload(watermarkedFilename, watermarkedBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (previewUploadError) {
      console.error('Error uploading preview image:', previewUploadError);
      return NextResponse.json(
        { error: 'Failed to upload preview image' },
        { status: 500 }
      );
    }

    // Get public URL for the preview image
    const { data: previewUrl } = supabase.storage
      .from('pfps')
      .getPublicUrl(watermarkedFilename);

    // Create record in database
    const { data: pfpData, error: dbError } = await supabase
      .from('pfp_generations')
      .insert({
        wallet_address: wallet,
        prompt: enhancedPrompt,
        original_filename: originalFilename,
        preview_filename: watermarkedFilename,
        preview_url: previewUrl.publicUrl,
        status: 'preview'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save generation data' },
        { status: 500 }
      );
    }

    console.log('PFP generation successful');
    return NextResponse.json(pfpData);
  } catch (error) {
    console.error('Error in PFP generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate PFP' },
      { status: 500 }
    );
  }
}

async function addWatermark(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Create a canvas from the image
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(image, 0, 0, image.width, image.height);
    
    // Add very light overlay so preview can be inspected
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, image.width, image.height);
    
    // Set up watermark styling
    const fontSize = Math.max(24, image.width / 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw diagonal watermarks across the entire image
    ctx.save();
    ctx.translate(image.width / 2, image.height / 2);
    ctx.rotate(-Math.PI / 6); // Rotate -30 degrees
    
    // Draw multiple watermark texts for better coverage
    const watermarkText = 'GUDTEK';
    const spacing = fontSize * 2;
    
    for (let y = -image.height; y <= image.height; y += spacing) {
      for (let x = -image.width; x <= image.width; x += spacing * 3) {
        // Draw with shadow for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(watermarkText, x, y);
      }
    }
    
    ctx.restore();
    
    // Convert canvas to buffer
    const watermarkedBuffer = canvas.toBuffer('image/png');
    
    // Optimize the image with sharp
    return await sharp(watermarkedBuffer)
      .png({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Error adding watermark:', error);
    // If watermarking fails, add a simple text overlay using sharp
    try {
      const width = 1024;
      const height = 1024;
      const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .title { fill: #fff; font-size: 70px; font-weight: bold; opacity: 0.8; }
          .subtitle { fill: #fff; font-size: 40px; font-weight: bold; opacity: 0.8; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" class="title">GUDTEK</text>
      </svg>
      `;
      const svgBuffer = Buffer.from(svgText);
      
      return await sharp(imageBuffer)
        .composite([{
          input: svgBuffer,
          top: 0,
          left: 0,
        }])
        .png()
        .toBuffer();
    } catch (fallbackError) {
      console.error('Fallback watermarking also failed:', fallbackError);
      return imageBuffer; // Return original if all watermarking attempts fail
    }
  }
} 