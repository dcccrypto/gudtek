import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImage } from '@/lib/openai';

// Approximate GUDTEK amount to burn (≈ $2 worth)
const BURN_AMOUNT = 2000;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { wallet } = await request.json();
    const { id } = params;

    if (!wallet || !id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get generation details
    const { data: generation, error: genError } = await supabase
      .from('pfp_generations')
      .select('prompt, status')
      .eq('id', id)
      .eq('wallet_address', wallet)
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    if (generation.status === 'downloaded') {
      return NextResponse.json(
        { error: 'Already downloaded' },
        { status: 400 }
      );
    }

    // Verify token balance
    const balanceRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/game/verify-holder?wallet=${wallet}`
    );
    const balanceData = await balanceRes.json();

    if (!balanceData.balance || balanceData.balance < BURN_AMOUNT) {
      return NextResponse.json(
        { error: 'Insufficient token balance' },
        { status: 403 }
      );
    }

    // Generate high-quality image
    const imageBuffer = await generateImage(generation.prompt, 'hd');

    // Upload to Supabase Storage
    const fileName = `${wallet}/${Date.now()}_hq.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pfp-downloads')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pfp-downloads')
      .getPublicUrl(fileName);

    // Burn tokens
    const burnRes = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/game/burn-tokens`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet,
          amount: BURN_AMOUNT,
          reason: 'pfp_download',
        }),
      }
    );

    if (!burnRes.ok) {
      return NextResponse.json(
        { error: 'Failed to burn tokens' },
        { status: 500 }
      );
    }

    // Update generation status
    const { error: updateError } = await supabase
      .from('pfp_generations')
      .update({
        status: 'downloaded',
        hq_url: publicUrl,
        burn_tx_signature: (await burnRes.json()).signature,
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Return image
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="gudtek-pfp-${id}.png"`,
      },
    });
  } catch (error) {
    console.error('Error downloading PFP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 