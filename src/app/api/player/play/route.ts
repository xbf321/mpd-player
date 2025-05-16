import { headers } from 'next/headers'
 
export async function GET(request: Request) {
  const headersList = await headers()
  const referer = headersList.get('referer')
 
  return new Response('Hello, Next2.js!', {
    status: 200,
    headers: { referer: referer },
  })
}