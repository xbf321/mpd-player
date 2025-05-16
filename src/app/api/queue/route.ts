export async function GET(request: Request) {
  const mockData = {
    version: 833,
    count: 20,
    items: [
      {
        id: 12122,
        position: 0,
        track_id: 10749,
        title: 'Angels',
        artist: 'The xx',
        artist_sort: 'xx, The',
        album: 'Coexist',
        album_sort: 'Coexist',
        albumartist: 'The xx',
        albumartist_sort: 'xx, The',
        genre: 'Indie Rock',
        year: 2012,
        track_number: 1,
        disc_number: 1,
        length_ms: 171735,
        media_kind: 'music',
        data_kind: 'file',
        path: '/music/srv/The xx/Coexist/01 Angels.mp3',
        uri: 'library:track:10749',
      },
    ],
  };
  return new Response(JSON.stringify(mockData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
