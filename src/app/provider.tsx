'use client';
import { useState } from 'react';
import CurrentSongContext from './context';

export function Provider({ children, value }) {
  const [currentSong, setCurrentSong] = useState<SongInfo>(value);
  return (
    <CurrentSongContext.Provider value={[currentSong, setCurrentSong]}>
      {children}
    </CurrentSongContext.Provider>
  );
}
