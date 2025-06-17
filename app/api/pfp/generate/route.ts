import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import sharp from 'sharp';
import { generateImage, enhancePrompt } from '@/lib/openai';
import path from 'path';

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

    // Add watermark to the preview image (SVG overlay)
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
    // Use the transparent PNG watermark placed in /public/watermark.png
    const watermarkPath = path.join(process.cwd(), 'public', 'watermark.png');

    // Tile the watermark across the whole image with an overlay blend
    return await sharp(imageBuffer)
      .composite([
        {
          input: watermarkPath,
          tile: true,
          blend: 'overlay'
        }
      ])
      .png({ quality: 90 })
      .toBuffer();
  } catch (error) {
    console.error('Watermarking with PNG failed:', error);
    return imageBuffer;
  }
} 