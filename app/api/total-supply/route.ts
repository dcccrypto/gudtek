import { NextResponse } from 'next/server';

export async function GET() {
  // The total supply is 1 billion (1,000,000,000)
  const total_supply = 1000000000;

  return new NextResponse(total_supply.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 