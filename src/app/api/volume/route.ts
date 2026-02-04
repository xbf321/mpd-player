import rawDebug from 'debug';
import { MessageType } from '@/lib/constant';
const debug = rawDebug('api:volume');

export async function GET(req) {
  const value = req.nextUrl.searchParams.get('vol');

  const mpd = (process as any).mpdClient;
  const response = await mpd.doAction(MessageType.REQUEST_SET_VOL, value);
  debug('response %o', response);
  return Response.json(response);
}
