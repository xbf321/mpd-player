import clsx from 'clsx';
import Image from 'next/image';
import { toInteger } from 'lodash';
import { useState, useEffect, useRef } from 'react';
import Slider from 'rc-slider';
import formatTime from '@/lib/format-time';

import { SongInfo } from '@/type';

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

const BtnPlay = ({ status }: { status: PlayStatus }) => {
  if (status === PlayStatus.PLAY || status === PlayStatus.UNKONWN) {
    return 'pause';
  }
  return 'play_circle';
};

const BtnLoop = ({
  data,
  onChange,
}: {
  data: SongInfo | null;
  onChange: (state: LoopStatus) => void;
}) => {
  const [currentStatus, setCurrentStatus] = useState(LoopStatus.REPEAT);

  useEffect(() => {
    if (!data) {
      return;
    }
    const { random, repeat, single } = data;
    const combinedType = toInteger(`${repeat}${random}${single}`);
    let loopStatus = null;
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
        loopStatus = LoopStatus.REPEAT;
        break;
    }
    setCurrentStatus(loopStatus);
  }, [data]);
  // 1. 循环
  // 2. 随机
  // 3. 单曲循环
  const handleChange = () => {
    let nextStatus = null;
    if (currentStatus === LoopStatus.REPEAT) {
      // 下一个是 2
      nextStatus = LoopStatus.RANDOM;
    } else if (currentStatus === LoopStatus.RANDOM) {
      // 下一个是 3
      nextStatus = LoopStatus.SINGLE;
    } else {
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
  data,
  onPause,
  onPlay,
  onVolumn,
  onPrevious,
  onNext,
  onLoopStatus,
}: PlayerPropsType) {
  const [btnPlayStatus, setBtnPlayStatus] = useState(PlayStatus.UNKONWN);
  const [songInfo, setSongInfo] = useState<SongInfo | null>(null);
  const [volume, setVolume] = useState(0);
  // 只有手动改变过音量，才发送请求
  const isManuChangeVolume = useRef(false);

  useEffect(() => {
    if (data) {
      setBtnPlayStatus(data.state as PlayStatus);
      const songInfo = {
        ...data,
        elapsedLabel: formatTime(data.elapsed || 0),
        durationLabel: formatTime(data.duration || 0),
      };
      setVolume(toInteger(songInfo?.volume || '0'));
      setSongInfo(songInfo);
    }
  }, [data]);

  useEffect(() => {
    const debounceVolumeChange = setTimeout(() => {
      if (volume === 0) {
        return;
      }
      if (!isManuChangeVolume.current) {
        return;
      }
      if (volume === toInteger(songInfo?.volume)) {
        return;
      }
      onVolumn?.(volume);
    }, 1500);
    return () => clearTimeout(debounceVolumeChange);
  }, [volume]);

  const handleVolumeChange = (nextValue: number | number[]) => {
    isManuChangeVolume.current = true;
    setVolume(nextValue as number);
  };

  const handlePrevious = () => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    onPrevious?.();
  };

  const handleNext = () => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    onNext?.();
  };

  const handleLoopStatus = (state: LoopStatus) => {
    onLoopStatus(state);
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
        <span>{songInfo?.elapsedLabel}</span>
        <Slider value={Number(songInfo?.elapsed)} max={Number(songInfo?.duration)} />
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
        <Slider step={1} min={0} max={100} onChange={handleVolumeChange} value={volume} />
        <span className="material-symbols-outlined">volume_up</span>
        <BtnLoop data={songInfo} onChange={handleLoopStatus} />
      </div>
    </div>
  );
}
