'use client';
import { toInteger } from 'lodash';
import clsx from 'clsx';
import Empty from './Empty';
import Skeleton from './Skeleton';

import { Queue, Library } from '@/type';

export default function SongList({
  loading = true,
  data = [],
  playId = -1,
  showIcon = false,
  onSelect,
  extra,
}: {
  loading: boolean;
  data: Queue[] | Library[];
  showIcon?: boolean;
  playId?: number | string;
  onSelect?: (id: string) => void;
  extra?: any;
}) {
  if (loading) {
    return <Skeleton />;
  }
  if (data?.length === 0) {
    return <Empty description="空空如也" />;
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((item, index) => {
        const selected = toInteger(item.id) === toInteger(playId);
        return (
          <div className="flex gap gap-3 border-b border-gray-200 pb-2" key={index}>
            {showIcon && (
              <span
                className={clsx({
                  'material-symbols-outlined cursor-pointer': true,
                  '!text-gray-500': selected,
                })}
                onClick={() => onSelect?.(item?.id)}
              >
                play_circle
              </span>
            )}
            <div
              className={clsx({
                'flex-1': true,
                'text-blue-600': selected,
              })}
            >
              {item.id} {item.file}
            </div>
            {extra && extra(item)}
          </div>
        );
      })}
    </div>
  );
}
