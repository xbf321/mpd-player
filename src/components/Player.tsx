import clsx from 'clsx';
import Image from 'next/image';
import Slider from 'rc-slider';
import { toInteger } from 'lodash';
import { useState, useEffect } from 'react';

import Button from './Button';
import { MessageType, PlayStatus } from '@/lib/constant';
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
  doAction: (messageType: MessageType, payload?: string | number | LoopStatus | null) => void;
};

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
        <svg
          focusable="false"
          aria-hidden="true"
          viewBox="0 0 24 24"
          aria-label="fontSize medium"
          fill="currentColor"
          width="1.5em"
          height="1.5em"
        >
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z"></path>
        </svg>
      ) : currentStatus === LoopStatus.RANDOM ? (
        <>
          <svg
            fill="currentColor"
            width="1.5em"
            height="1.5em"
            focusable="false"
            aria-hidden="true"
            viewBox="0 0 24 24"
            aria-label="fontSize medium"
          >
            <path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04z"></path>
          </svg>
        </>
      ) : (
        <svg
          focusable="false"
          aria-hidden="true"
          viewBox="0 0 24 24"
          aria-label="fontSize medium"
          fill="currentColor"
          width="1.5em"
          height="1.5em"
        >
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2zm-4-2V9h-1l-2 1v1h1.5v4z"></path>
        </svg>
      )}
    </span>
  );
};

export default function Player({ data: songInfo, doAction }: PlayerPropsType) {
  const [innerSongInfo, setInnerSongInfo] = useState<SongInfo | null>(songInfo || null);

  useEffect(() => {
    if (!songInfo) {
      return;
    }
    setInnerSongInfo(songInfo);
  }, [songInfo]);

  const handleVolumeChange = (nextValue: number) => {
    handleDoAction(MessageType.REQUEST_SET_VOL, nextValue);
  };

  const handleDoAction = (messageType: MessageType, data: string | number | null = null) => {
    if (!songInfo || !songInfo.id) {
      return;
    }
    doAction(messageType, data);
  };

  const handleLoopStatus = (loopState: LoopStatus) => {
    const messageType = `REQUEST_${loopState}`;
    doAction(messageType as MessageType);
  };

  return (
    <div className="flex flex-col gap-2 mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="flex gap-2">
        <div className="rounded-md w-12 h-12 bg-white">
          <Image
            className={clsx({
              'animate-spin': innerSongInfo?.state === PlayStatus.PLAY,
            })}
            src="/record.png"
            width={48}
            height={48}
            alt="record"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-medium">{songInfo?.file || '--'}</h1>
        </div>
      </div>
      <div className="flex justify-between text-xs gap gap-3">
        <span>{formatTime(songInfo?.elapsed)}</span>
        <Slider
          disabled={songInfo === null}
          value={Number(songInfo?.elapsed)}
          max={Number(songInfo?.duration)}
        />
        <span>{formatTime(songInfo?.duration)}</span>
      </div>
      <div className="flex justify-center items-center gap gap-3 py-2">
        <Button
          disabled={songInfo === null}
          onClick={() => handleDoAction(MessageType.REQUEST_PREVIOUS)}
        >
          <svg
            viewBox="0 0 1024 1024"
            focusable="false"
            width="2em"
            height="2em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M347.6 528.95l383.2 301.02c14.25 11.2 35.2 1.1 35.2-16.95V210.97c0-18.05-20.95-28.14-35.2-16.94L347.6 495.05a21.53 21.53 0 000 33.9M330 864h-64a8 8 0 01-8-8V168a8 8 0 018-8h64a8 8 0 018 8v688a8 8 0 01-8 8"></path>
          </svg>
        </Button>
        <Button
          disabled={songInfo === null}
          onClick={() =>
            handleDoAction(
              innerSongInfo?.state === PlayStatus.PAUSE
                ? MessageType.REQUEST_PLAY
                : MessageType.REQUEST_PAUSE,
            )
          }
        >
          {songInfo?.state === PlayStatus.PLAY || songInfo?.state === PlayStatus.UNKONWN ? (
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              width="2.5em"
              height="2.5em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-88-532h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z"></path>
            </svg>
          ) : (
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              width="2.5em"
              height="2.5em"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
              <path d="M719.4 499.1l-296.1-215A15.9 15.9 0 00398 297v430c0 13.1 14.8 20.5 25.3 12.9l296.1-215a15.9 15.9 0 000-25.8zm-257.6 134V390.9L628.5 512 461.8 633.1z"></path>
            </svg>
          )}
        </Button>
        <Button
          disabled={songInfo === null}
          onClick={() => handleDoAction(MessageType.REQUEST_NEXT)}
        >
          <svg
            viewBox="0 0 1024 1024"
            focusable="false"
            width="2em"
            height="2em"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M676.4 528.95L293.2 829.97c-14.25 11.2-35.2 1.1-35.2-16.95V210.97c0-18.05 20.95-28.14 35.2-16.94l383.2 301.02a21.53 21.53 0 010 33.9M694 864h64a8 8 0 008-8V168a8 8 0 00-8-8h-64a8 8 0 00-8 8v688a8 8 0 008 8"></path>
          </svg>
        </Button>
      </div>
      <div className="flex gap gap-2 items-center">
        <svg
          fillRule="evenodd"
          viewBox="64 64 896 896"
          focusable="false"
          width="1.5em"
          height="1.5em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M771.91 115a31.65 31.65 0 00-17.42 5.27L400 351.97H236a16 16 0 00-16 16v288.06a16 16 0 0016 16h164l354.5 231.7a31.66 31.66 0 0017.42 5.27c16.65 0 32.08-13.25 32.08-32.06V147.06c0-18.8-15.44-32.06-32.09-32.06M732 221v582L439.39 611.75l-17.95-11.73H292V423.98h129.44l17.95-11.73z"></path>
        </svg>
        <Slider
          disabled={songInfo === null}
          step={1}
          min={0}
          max={100}
          onChangeComplete={handleVolumeChange}
          defaultValue={Number(songInfo?.volume || 0)}
        />
        <svg
          viewBox="64 64 896 896"
          focusable="false"
          width="1.5em"
          height="1.5em"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M625.9 115c-5.9 0-11.9 1.6-17.4 5.3L254 352H90c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h164l354.5 231.7c5.5 3.6 11.6 5.3 17.4 5.3 16.7 0 32.1-13.3 32.1-32.1V147.1c0-18.8-15.4-32.1-32.1-32.1zM586 803L293.4 611.7l-18-11.7H146V424h129.4l17.9-11.7L586 221v582zm348-327H806c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16h128c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16zm-41.9 261.8l-110.3-63.7a15.9 15.9 0 00-21.7 5.9l-19.9 34.5c-4.4 7.6-1.8 17.4 5.8 21.8L856.3 800a15.9 15.9 0 0021.7-5.9l19.9-34.5c4.4-7.6 1.7-17.4-5.8-21.8zM760 344a15.9 15.9 0 0021.7 5.9L892 286.2c7.6-4.4 10.2-14.2 5.8-21.8L878 230a15.9 15.9 0 00-21.7-5.9L746 287.8a15.99 15.99 0 00-5.8 21.8L760 344z"></path>
        </svg>
        <BtnLoop data={songInfo} onChange={handleLoopStatus} />
      </div>
    </div>
  );
}
