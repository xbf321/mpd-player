import { debounce } from 'lodash';
import { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import formatTime from '@/lib/format-time';

import 'rc-slider/assets/index.css';

type PlayerType = {
  loading: boolean;
  data: any;
  onPlay: () => void;
  onPause: () => void;
  onVolumn: (nextValue: number) => void;
  onNext: () => void;
  onPrevious: () => void;
};
export enum PlayStatus {
  UNKONWN = 'UNKONWN',
  PLAY = 'play',
  STOP = 'stop',
  PAUSE = 'pause',
}
const BtnPlay = ({ status }: { status: PlayStatus }) => {
  if (status === PlayStatus.PLAY || status === PlayStatus.UNKONWN) {
    return 'pause';
  }
  return 'play_circle';
};

export default function Player({
  loading,
  data,
  onPause,
  onPlay,
  onVolumn,
  onPrevious,
  onNext,
}: PlayerType) {
  // console.info('Player', loading, data);
  const [btnPlayStatus, setBtnPlayStatus] = useState(PlayStatus.UNKONWN);
  const [songInfo, setSongInfo] = useState(null);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (data) {
      setBtnPlayStatus(data.state);
      const songInfo = {
        ...data,
        elapsedLabel: formatTime(data.elapsed || 0),
        durationLabel: formatTime(data.duration || 0),
      };
      setVolume(parseInt(songInfo?.volume || 0, 10));
      setSongInfo(songInfo);
    }
  }, [data]);

  const handleVolumeChange = debounce((nextValue) => {
    onVolumn?.(nextValue);
  }, 300);

  const handlePrevious = () => {
    onPrevious?.();
  };

  const handleNext = () => {
    onNext?.();
  };

  const handlePlayOrPause = () => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    if (btnPlayStatus === PlayStatus.PAUSE) {
      setBtnPlayStatus(PlayStatus.PLAY);
      onPlay?.();
    } else {
      setBtnPlayStatus(PlayStatus.PAUSE);
      onPause?.();
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex">
        <h1 className="text-lg font-medium">{songInfo?.title || '--'}</h1>
        {/* <div className="rounded-md bg-white w-10 h-10"></div>
        <div className="ml-2">
          
        </div> */}
      </div>
      <div className="flex justify-between text-xs gap gap-3">
        <span>{songInfo?.elapsedLabel}</span>
        <Slider value={songInfo?.elapsed} max={Number(songInfo?.duration)} />
        <span>{songInfo?.durationLabel}</span>
      </div>
      <div className="flex justify-center items-center gap gap-3">
        <span className="material-symbols-outlined cursor-pointer" onClick={handlePrevious}>
          skip_previous
        </span>
        <span
          className="material-symbols-outlined !text-4xl cursor-pointer"
          onClick={handlePlayOrPause}
        >
          <BtnPlay status={btnPlayStatus} />
        </span>
        <span className="material-symbols-outlined cursor-pointer" onClick={handleNext}>
          skip_next
        </span>
      </div>
      <div className="flex gap gap-2 items-center">
        <span className="material-symbols-outlined">volume_mute</span>
        <Slider min={0} max={100} onChange={(nextValue) => {
          setVolume(nextValue as number);
          handleVolumeChange(nextValue)
        }} value={volume} />
        <span className="material-symbols-outlined">volume_up</span>
      </div>
    </div>
  );
}
