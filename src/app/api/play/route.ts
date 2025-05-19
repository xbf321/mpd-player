// @ts-nocheck
export async function GET() {
  const mpd = process.mpdClient;
  if (!mpd) {
    return new Response('MPD is not exist.', {
      status: 200,
    });
  }
  const wrapPromise = () => {
    return new Promise((resolve, reject) => {
      mpd.play(null, (err: Error) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  };
  const data = await wrapPromise();
  return new Response(data ? data : 'Operate success.', {
    status: 200,
  })
}