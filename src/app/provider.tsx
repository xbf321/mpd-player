'use client';
import { useState } from 'react';
import StatusContext from "./context";

export function Provider({ children, value }) {
  const [songInfo, setSongInfo] = useState(value);
  return <StatusContext.Provider value={[songInfo, setSongInfo]}>{children}</StatusContext.Provider>;
}
