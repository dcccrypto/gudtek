import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from('pfp_generations')
      .select('id, preview_url, original_filename, status, created_at')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List generations error:', error);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    return NextResponse.json({ generations: data || [] });
  } catch (err) {
    console.error('Unexpected list error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
} 