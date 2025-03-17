export async function GET() {
  return new Response(JSON.stringify({ message: 'Hello, world!' }), {
    headers: {
      'content-type': 'application/json',
    },
  });
} 