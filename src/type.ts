export interface Status {
  volume: string;
  repeat: string;
  random: string;
  single: string;
}

export interface SongInfo extends Status {
  id: string;
  songid: string;
  file: string;
  state: string;
  single: string;
  elapsed: string;
  elapsedLabel: string;
  duration: string;
  durationLabel: string;
}

export type Queue = Pick<SongInfo, 'id' | 'duration' | 'durationLabel' | 'file'>;

export type Libary = Pick<SongInfo, 'id' | 'file'>;
