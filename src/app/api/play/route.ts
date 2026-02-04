import rawDebug from 'debug';
import { MessageType } from '@/lib/constant';

const debug = rawDebug('api:play');

export async function GET() {
  const mpd = (process as any).mpdClient;
  const response = await mpd.doAction(MessageType.REQUEST_PLAY);
  debug('response %o', response);
  return Response.json(response);
}
