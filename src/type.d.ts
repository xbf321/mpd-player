import { MessageType } from "./lib/constant";

declare global {
  
  interface InnerResponseType {
    error: unknown;
    data: any;
  }

  interface Status {
    volume: string;
    repeat: string;
    random: string;
    single: string;
  }

  interface SongInfo extends Status {
    id: string;
    songid: string;
    file: string;
    state: string;
    single: string;
    elapsed: string;
    elapsedLabel?: string;
    duration: string;
    durationLabel?: string;
  }

  type Queue = Pick<SongInfo, 'id' | 'duration' | 'durationLabel' | 'file'>;

  type Library = Pick<SongInfo, 'id' | 'file'>;
}
export {};
