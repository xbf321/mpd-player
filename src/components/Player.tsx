import clsx from 'clsx';
import Image from 'next/image';
import { toInteger } from 'lodash';
import { useState, useEffect } from 'react';
import Slider from 'rc-slider';
import formatTime from '@/lib/format-time';

import 'rc-slider/assets/index.css';

enum LoopStatus {
  SINGLE = 'SINGLE',
  REPEAT = 'REPEAT',
  RANDOM = 'RANDOM',
}

type PlayerPropsType = {
  loading?: boolean;
  data: SongInfo | null;
  onPlay: () => void;
  onPause: () => void;
  onVolumn: (value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onLoopStatus: (status: LoopStatus) => void;
};

export enum PlayStatus {
  UNKONWN = 'unkonwn',
  PLAY = 'play',
  STOP = 'stop',
  PAUSE = 'pause',
}

const BtnLoop = ({
  data: songInfo,
  onChange,
}: {
  data: SongInfo | null;
  onChange: (state: LoopStatus) => void;
}) => {
  const [currentStatus, setCurrentStatus] = useState(LoopStatus.REPEAT);

  useEffect(() => {
    if (!songInfo) {
      return;
    }
    const { random, repeat, single } = songInfo;
    const combinedType = toInteger(`${repeat}${random}${single}`);
    let loopStatus = LoopStatus.REPEAT;
    switch (combinedType) {
      case 110:
        loopStatus = LoopStatus.RANDOM;
        break;
      case 101:
        loopStatus = LoopStatus.SINGLE;
        break;
      case 100:
        loopStatus = LoopStatus.REPEAT;
        break;
      default:
        // 播放器没有设置过循环模式
        // 需要更新
        onChange?.(LoopStatus.REPEAT);
        break;
    }
    setCurrentStatus(loopStatus);
  }, [songInfo]);

  // 1. 循环
  // 2. 随机
  // 3. 单曲循环
  const handleChange = () => {
    let nextStatus = LoopStatus.REPEAT;
    if (currentStatus === LoopStatus.REPEAT) {
      // 下一个是 2
      nextStatus = LoopStatus.RANDOM;
    } else if (currentStatus === LoopStatus.RANDOM) {
      // 下一个是 3
      nextStatus = LoopStatus.SINGLE;
    } else if (currentStatus === LoopStatus.SINGLE) {
      nextStatus = LoopStatus.REPEAT;
    }
    setCurrentStatus(nextStatus);
    onChange?.(nextStatus);
  };

  return (
    <span className="material-symbols-outlined cursor-pointer" onClick={handleChange}>
      {currentStatus === LoopStatus.REPEAT ? (
        <>repeat</>
      ) : currentStatus === LoopStatus.RANDOM ? (
        <>shuffle</>
      ) : (
        <>repeat_one</>
      )}
    </span>
  );
};

export default function Player({
  data: songInfo,
  onPause,
  onPlay,
  onVolumn,
  onPrevious,
  onNext,
  onLoopStatus,
}: PlayerPropsType) {
  const [volume, setVolume] = useState(songInfo?.volume || 0);
  const [btnPlayStatus, setBtnPlayStatus] = useState(songInfo?.state);

  // done
  useEffect(() => {
    if (toInteger(songInfo?.volume || 0)) {
      setVolume(toInteger(songInfo?.volume || 0));
    }
  }, [songInfo?.volume]);

  // done
  useEffect(() => {
    if (!songInfo) {
      return;
    }
    setBtnPlayStatus(songInfo.state as PlayStatus);
  }, [songInfo?.state]);

  // done
  useEffect(() => {
    const debounceVolumeChange = setTimeout(() => {
      if (volume === 0) {
        return;
      }
      if (volume === toInteger(songInfo?.volume)) {
        return;
      }
      onVolumn?.(toInteger(volume));
    }, 1500);
    return () => clearTimeout(debounceVolumeChange);
  }, [volume]);

  // done
  const handleVolumeChange = (nextValue: number | number[]) => {
    setVolume(nextValue as number);
  };

  // done
  const handlePrevious = () => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    onPrevious?.();
  };

  // done
  const handleNext = () => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    onNext?.();
  };

  // done
  const handleLoopStatus = (state: LoopStatus) => {
    onLoopStatus(state);
  };

  // done
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
    <div className="flex flex-col gap-2 mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex !mb-1">
        <div className="rounded-md w-12 h-12 bg-white">
          <Image
            className={clsx({
              'animate-spin': btnPlayStatus === PlayStatus.PLAY,
            })}
            src="/record.png"
            width={48}
            height={48}
            alt="record"
          />
        </div>
        <div className="ml-2">
          <h1 className="text-lg font-medium">{songInfo?.file || '--'}</h1>
        </div>
      </div>
      <div className="flex justify-between text-xs gap gap-3">
        <span>{formatTime(songInfo?.elapsed)}</span>
        <Slider value={Number(songInfo?.elapsed)} max={Number(songInfo?.duration)} />
        <span>{formatTime(songInfo?.duration)}</span>
      </div>
      <div className="flex justify-center items-center gap gap-3">
        <span className="material-symbols-outlined cursor-pointer" onClick={handlePrevious}>
          skip_previous
        </span>
        <span
          className="material-symbols-outlined !text-4xl cursor-pointer"
          onClick={handlePlayOrPause}
        >
          {songInfo?.state === PlayStatus.PLAY || songInfo?.state === PlayStatus.UNKONWN
            ? 'pause'
            : 'play_circle'}
        </span>
        <span className="material-symbols-outlined cursor-pointer" onClick={handleNext}>
          skip_next
        </span>
      </div>
      <div className="flex gap gap-2 items-center">
        <span className="material-symbols-outlined">volume_mute</span>
        <Slider step={1} min={0} max={100} onChange={handleVolumeChange} value={Number(volume)} />
        <span className="material-symbols-outlined">volume_up</span>
        <BtnLoop data={songInfo} onChange={handleLoopStatus} />
      </div>
    </div>
  );
}
