// @ts-nocheck
'use client';
import Empty from './Empty';
import Skeleton from './Skeleton';
export default function SongList({ loading, data }: { loading: boolean; data: any }) {
  if (loading) {
    return <Skeleton />;
  }
  if (data?.length === 0) {
    return <Empty description="空空如也" />;
  }
  return (
    <div className="flex flex-col gap-3">
      {data.map((item, index) => {
        return (
          <div className="flex gap gap-3" key={index}>
            <span className="material-symbols-outlined !text-gray-500">play_circle</span>
            <div className="flex-1">
              {item.Id} {item.file}
            </div>
            <span>{item.Time}</span>
          </div>
        );
      })}
    </div>
  );
}
