// @ts-nocheck
export async function getStatus() {
  const mpd = process.mpdClient;
  if (!mpd) {
    return null;
  }
  const wrapPromise = () => {
    return new Promise((resolve, reject) => {
      mpd.getStatus((err: Error, msg) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(msg);
      });
    });
  };
  const data = await wrapPromise();
  return data;
}
export async function GET() {
  const data = await getStatus();
  return new Response(data ? data : '', {
    status: 200,
  })
}