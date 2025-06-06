export async function GET() {
  // The total supply is 1 billion (1,000,000,000)
  const total_supply = 1000000000;

  return Response.json(total_supply.toString());
} 