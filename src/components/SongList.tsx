'use client';
import { toInteger } from 'lodash';
import clsx from 'clsx';
import Empty from './Empty';
import Skeleton from './Skeleton';
import formatTime from '@/lib/format-time';

export default function SongList({
  loading = true,
  data = [],
  playId = -1,
  onPlay,
}: {
  loading: boolean;
  data: any;
  playId: number | string;
  onPlay: (id: number | string) => void;
}) {
  if (loading) {
    return <Skeleton />;
  }
  if (data?.length === 0) {
    return <Empty description="空空如也" />;
  }
  // console.info('SongList', playId, data);
  return (
    <div className="flex flex-col gap-3">
      {data.map((item: any, index: number) => {
        const selected = toInteger(item.id) === toInteger(playId);
        return (
          <div
            className="flex gap gap-3 cursor-pointer"
            key={index}
            onClick={() => onPlay(item.pos)}
          >
            <span
              className={clsx({
                'material-symbols-outlined': true,
                '!text-gray-500': selected,
              })}
            >
              play_circle
            </span>
            <div
              className={clsx({
                'flex-1': true,
                'text-blue-600': selected,
              })}
            >
              {item.id} {item.title}
            </div>
            <span>{formatTime(item.duration)}</span>
          </div>
        );
      })}
    </div>
  );
}
