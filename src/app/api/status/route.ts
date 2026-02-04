import { MessageType } from '@/lib/constant';
import rawDebug from 'debug';
const debug = rawDebug('api:status');
export async function status(): Promise<InnerResponseType> {
  const mpd = (process as any).mpdClient;
  const response = await mpd.doAction(MessageType.REQUEST_STATUS);
  debug('status %o', response);
  return response;
}

export async function GET() {
  const response = await status();
  return Response.json(response);
}
