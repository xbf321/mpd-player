import rawDebug from 'debug';
import { MessageType } from '@/lib/constant';

const debug = rawDebug('api:pause');

export async function GET() {
  const mpd = (process as any).mpdClient;
  const response = await mpd.doAction(MessageType.REQUEST_PAUSE);
  debug('response %o', response)
  return Response.json(response);
}