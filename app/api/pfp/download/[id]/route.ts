import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// USD value to burn when downloading a PFP
const USD_BURN_AMOUNT = 1;

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { wallet, txSignature } = await request.json();
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
      .select('prompt, status, original_filename')
      .eq('id', id)
      .eq('wallet_address', wallet)
      .single();

    if (genError || !generation) {
      console.error('Error fetching generation:', genError);
      return NextResponse.json(
        { error: 'Generation not found' },
        { status: 404 }
      );
    }

    // Check if already downloaded
    if (generation.status === 'downloaded') {
      // Get the original image and return it
      const { data: originalImage, error: downloadError } = await supabase.storage
        .from('pfps')
        .download(generation.original_filename);

      if (downloadError) {
        console.error('Error downloading original image:', downloadError);
      return NextResponse.json(
          { error: 'Failed to download image' },
          { status: 500 }
      );
    }

      return new NextResponse(originalImage, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="GUDTEK_PFP.png"',
        },
      });
    }

    // Skip server-side balance check - rely on client-side validation
    console.log('Skipping server-side balance verification (already checked on client)');

    // Determine API base URL (works in dev and prod)
    const origin = (() => {
      try {
        return new URL(request.url).origin;
      } catch {
        return process.env.NEXT_PUBLIC_BASE_URL || '';
      }
    })();

    // Burn tokens – will convert USD value to token amount internally
    const burnRes = await fetch(`${origin}/api/game/burn-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        walletAddress: wallet,
        usdAmount: USD_BURN_AMOUNT,
        reason: `PFP Download (ID: ${id})`,
        txSignature,
        tokenAmount: undefined // placeholder; client sends tokenAmount directly so API now ignores here
      })
    });

    if (!burnRes.ok) {
      const burnError = await burnRes.json();
      console.error('Error burning tokens:', burnError);
      return NextResponse.json(
        { error: 'Failed to burn tokens' },
        { status: 500 }
      );
    }

    // Update status to downloaded
    const { error: updateError } = await supabase
      .from('pfp_generations')
      .update({ status: 'downloaded' })
      .eq('id', id)
      .eq('wallet_address', wallet);

    if (updateError) {
      console.error('Error updating status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Get the original image and return it
    const { data: originalImage, error: downloadError } = await supabase.storage
      .from('pfps')
      .download(generation.original_filename);

    if (downloadError) {
      console.error('Error downloading original image:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download image' },
        { status: 500 }
      );
    }

    return new NextResponse(originalImage, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="GUDTEK_PFP.png"',
      },
    });
  } catch (error) {
    console.error('Error in download process:', error);
    return NextResponse.json(
      { error: 'Failed to download PFP' },
      { status: 500 }
    );
  }
} 