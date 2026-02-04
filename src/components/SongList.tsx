import clsx from 'clsx';
import { toInteger } from 'lodash';

import Empty from './Empty';
import Button from './Button';
import Skeleton from './Skeleton';

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
  if (!data || data?.length === 0) {
    return <Empty description="空空如也" />;
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((item, index) => {
        const selected = toInteger(item.id) === toInteger(playId);
        return (
          <div
            className={clsx({
              'flex gap-3 pb-2': true,
              'border-b border-gray-200': index !== data.length - 1,
            })}
            key={index}
          >
            {showIcon && (
              <Button onClick={() => onSelect?.(item?.id)}>
                <svg
                  viewBox="64 64 896 896"
                  focusable="false"
                  width="1.5em"
                  height="1.5em"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm144.1 454.9L437.7 677.8a8.02 8.02 0 01-12.7-6.5V353.7a8 8 0 0112.7-6.5L656.1 506a7.9 7.9 0 010 12.9z"></path>
                </svg>
              </Button>
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
