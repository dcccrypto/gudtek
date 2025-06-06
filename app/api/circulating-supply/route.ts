export async function GET() {
  // Total supply is 1,000,000,000
  // Circulating supply = Total supply - 10,000,000
  const total_supply = 1000000000;
  const circulating_supply = total_supply - 10000000;

  return new Response(circulating_supply.toString(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });
} 