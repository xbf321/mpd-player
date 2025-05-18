import { headers } from 'next/headers'
 
export async function GET(request: Request, response: Response) {
  const headersList = await headers()
  const referer = headersList.get('referer')
  console.info('play-api', request);
  return new Response('Hello, Next2wwww.js!', {
    status: 200,
    headers: { referer: referer },
  })
}