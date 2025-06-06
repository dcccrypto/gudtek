export async function GET() {
  // The total supply is 1 billion (1,000,000,000)
  const total_supply = 1000000000;

  return new Response(total_supply.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
} 