export async function GET() {
  // Total supply is 1,000,000,000
  // Circulating supply = Total supply - 10,000,000
  const total_supply = 1000000000;
  const circulating_supply = total_supply - 10000000;

  return Response.json(circulating_supply.toString());
} 