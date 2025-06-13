import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCanvas, loadImage } from 'canvas';
import sharp from 'sharp';
import { generateImage } from '@/lib/openai';

// GPT-4 Vision API endpoint
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

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

    // Verify token balance
    console.log('Verifying token balance');
    const balanceRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/game/verify-holder`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet })
      }
    );
    
    if (!balanceRes.ok) {
      const errorText = await balanceRes.text();
      console.error('Balance check failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to verify token balance' },
        { status: 500 }
      );
    }
    
    const balanceData = await balanceRes.json();
    console.log('Balance data:', balanceData);

    if (!balanceData.tokenBalance || balanceData.tokenBalance < 10000) {
      console.log('Insufficient balance:', balanceData.tokenBalance);
      return NextResponse.json(
        { error: 'Insufficient token balance' },
        { status: 403 }
      );
    }

    const supabase = createClient();

    // Check and update quota
    console.log('Checking quota');
    const { data: quotaData, error: quotaError } = await supabase
      .from('pfp_quotas')
      .select('previews_used, quota_reset_at, last_preview_at')
      .eq('wallet_address', wallet)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      console.error('Quota check failed:', quotaError);
      return NextResponse.json(
        { error: 'Failed to check quota' },
        { status: 500 }
      );
    }

    const now = new Date();
    let previews_used = 0;
    let quota_reset_at = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1
    );

    if (quotaData) {
      // Check cooldown
      if (quotaData.last_preview_at) {
        const lastPreview = new Date(quotaData.last_preview_at);
        const timeSinceLastPreview = now.getTime() - lastPreview.getTime();
        console.log('Time since last preview:', timeSinceLastPreview);
        if (timeSinceLastPreview < 30000) { // 30 seconds
          return NextResponse.json(
            { error: 'Please wait before generating another preview' },
            { status: 429 }
          );
        }
      }

      if (new Date(quotaData.quota_reset_at) <= now) {
        // Reset quota
        previews_used = 0;
        console.log('Quota reset');
      } else {
        previews_used = quotaData.previews_used;
        console.log('Current previews used:', previews_used);
        if (previews_used >= 3) {
          return NextResponse.json(
            { error: 'Daily quota exceeded' },
            { status: 429 }
          );
        }
      }
    }

    try {
      console.log('Generating image with OpenAI');
      // Generate image with OpenAI
      const imageBuffer = await generateImage(prompt);
      
      if (!imageBuffer) {
        console.error('No image buffer returned from OpenAI');
        throw new Error('Failed to generate image');
      }
      console.log('Image generated successfully');

      // Add watermark
      console.log('Adding watermark');
      const canvas = createCanvas(1024, 1024);
      const ctx = canvas.getContext('2d');

      // Load and draw the generated image
      const image = await loadImage(imageBuffer);
      ctx.drawImage(image, 0, 0, 1024, 1024);

      // Add watermark
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.rotate(-Math.PI / 4);
      ctx.fillText('GUDTEK', -300, 700);

      // Convert to PNG buffer
      console.log('Converting to PNG');
      const watermarkedBuffer = await sharp(canvas.toBuffer())
        .png()
        .toBuffer();

      // Upload to Supabase Storage
      console.log('Uploading to Supabase');
      const fileName = `${wallet}/${Date.now()}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pfp-previews')
        .upload(fileName, watermarkedBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload failed:', uploadError);
        throw new Error('Failed to upload image');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pfp-previews')
        .getPublicUrl(fileName);

      // Update quota
      console.log('Updating quota');
      const { error: upsertError } = await supabase
        .from('pfp_quotas')
        .upsert({
          wallet_address: wallet,
          previews_used: previews_used + 1,
          last_preview_at: now.toISOString(),
          quota_reset_at: quota_reset_at.toISOString(),
        });

      if (upsertError) {
        console.error('Failed to update quota:', upsertError);
        throw new Error('Failed to update quota');
      }

      // Create generation record
      console.log('Creating generation record');
      const { data: genData, error: genError } = await supabase
        .from('pfp_generations')
        .insert({
          wallet_address: wallet,
          prompt,
          preview_url: publicUrl,
          status: 'preview',
        })
        .select()
        .single();

      if (genError) {
        console.error('Failed to save generation:', genError);
        throw new Error('Failed to save generation');
      }

      console.log('Generation complete:', genData);
      return NextResponse.json(genData);
    } catch (error) {
      console.error('Error in image generation process:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to generate image' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error generating PFP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 