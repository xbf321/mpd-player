'use client';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import SongList from '@/components/SongList';
import Stepper, { StepperStatus } from '@/components/Stepper';
import Player, { PlayStatus } from '@/components/Player';

import { MessageType, MPDStatus } from '@/lib/constant';
import { socket } from '@/lib/socket-client';
import useInterval from '@/hooks/useInterval';

import { SongInfo, Queue, Library } from '@/type';


enum TabType {
  Queue = 0,
  Libray = 1,
}

export default function Home() {
  const [selectedTab, setSelectedTab] = useState(TabType.Queue);
  const [stepperInfo, setStepperInfo] = useState({
    socketReady: false,
    mpdReady: false,
    current: 0,
  });
  const [currentPlaySongId, setCurrentPlaySongId] = useState(-1);
  const [songInfo, setSongInfo] = useState<{ loading: boolean; data: SongInfo | null }>({
    loading: true,
    data: null,
  });
  const [queue, setQueue] = useState<{ loading: boolean; data: Queue[] }>({
    loading: true,
    data: [],
  });
  const [libray, setLibray] = useState<{ loading: boolean; data: Library[] }>({
    loading: true,
    data: [],
  });

  const stepItems = [
    {
      title: stepperInfo.socketReady ? 'Network Connected' : 'Checking Network...',
      status: stepperInfo.socketReady ? StepperStatus.DONE : StepperStatus.CHECKING,
    },
    {
      title: stepperInfo.socketReady
        ? stepperInfo.mpdReady
          ? 'MPD has been ready'
          : 'Checking MPD...'
        : 'Waiting',
      status: stepperInfo.mpdReady ? StepperStatus.DONE : StepperStatus.CHECKING,
    },
  ];

  useInterval(() => {
    if (!songInfo.data) {
      return;
    }
    const { state } = songInfo.data;
    if (state !== PlayStatus.PLAY) {
      return;
    }
    sendMessage(MessageType.REQUEST_ELAPSED);
  }, 900);

  useInterval(() => {
    sendMessage(MessageType.MPD_HEART);
  }, 5000);

  useEffect(() => {
    const onConnect = () => {
      setStepperInfo({
        ...stepperInfo,
        socketReady: true,
      });
      socket.on(MessageType.MESSAGE_EVENT, receiveMessage);
      sendMessage(MessageType.REQUEST_STATUS);
      sendMessage(MessageType.REQUEST_QUEUE);
      sendMessage(MessageType.REQUEST_LIBRARY);
      sendMessage(MessageType.MPD_HEART);
    };

    const onDisconnect = () => {
      setStepperInfo({
        ...stepperInfo,
        socketReady: false,
      });
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const sendMessage = (type = '', data: number | string | null = null) => {
    const msg = {
      type: type,
      payload: data ? data : null,
    };
    if (!socket.connected) {
      return;
    }
    socket.emit(MessageType.MESSAGE_EVENT, JSON.stringify(msg));
  };

  const receiveMessage = (msg: string) => {
    const { type, payload: data } = JSON.parse(msg);
    switch (type) {
      case MessageType.STATUS:
        {
          const updatedSong = {
            loading: false,
            data: {
              ...data,
            },
          };
          setSongInfo(updatedSong);
          setCurrentPlaySongId(data?.id || -1);
        }
        break;
      case MessageType.ELAPSED:
        {
          // @ts-ignore
          setSongInfo(({ loading, data: songInfo }) => {
            return {
              loading,
              data: {
                ...songInfo,
                elapsed: data,
              },
            };
          });
        }
        break;
      case MessageType.QUEUE:
        setQueue({
          ...queue,
          loading: false,
          data,
        });
        break;
      case MessageType.LIBRARY:
        setLibray({
          loading: false,
          data,
        });
        break;
      case MessageType.MPD_ERROR:
        toast.error(data);
        break;
      case MessageType.MPD_OFFLINE:
        setStepperInfo({
          socketReady: true,
          mpdReady: Number(data) === MPDStatus.READY,
          current: 1,
        });
        break;
      case MessageType.OPERATION_SUCCESS:
        toast.success('Success');
        break;
    }
  };

  const handlePlayback = (type: MessageType = MessageType.MESSAGE_EVENT, data: string | number | null = null) => {
    switch (type) {
      case MessageType.PLAY:
        sendMessage(MessageType.PLAY, data);
        break;
      case MessageType.PREVIOUS:
        sendMessage(MessageType.PREVIOUS);
        break;
      case MessageType.NEXT:
        sendMessage(MessageType.NEXT);
        break;
      case MessageType.PAUSE:
        sendMessage(MessageType.PAUSE);
        break;
      case MessageType.SET_VOL:
        sendMessage(MessageType.SET_VOL, data);
        break;
      case MessageType.DELETE:
        sendMessage(MessageType.DELETE, data);
        break;
      case MessageType.SINGLE:
        sendMessage(MessageType.SINGLE);
        break;
      case MessageType.RANDOM:
        sendMessage(MessageType.RANDOM);
        break;
      case MessageType.REPEAT:
        sendMessage(MessageType.REPEAT);
        break;
    }
  };

  const handleTabChange = (value: number) => {
    setSelectedTab(value);
  };

  const handleClearQueue = () => {
    if (queue.data?.length === 0) {
      return;
    }
    sendMessage(MessageType.REQUEST_CLEAR_QUEUE);
  };

  const handleAddToQueue = (item: Library) => {
    sendMessage(MessageType.ADD_TO_QUEUE, item.file);
  };

  return (
    <>
      <Stepper current={stepperInfo.current} items={stepItems} />
      <Player
        loading={songInfo.loading}
        data={songInfo.data}
        onPlay={() => handlePlayback(MessageType.PLAY)}
        onPause={() => handlePlayback(MessageType.PAUSE)}
        onNext={() => handlePlayback(MessageType.NEXT)}
        onPrevious={() => handlePlayback(MessageType.PREVIOUS)}
        onVolumn={(value) => handlePlayback(MessageType.SET_VOL, value)}
        onLoopStatus={(status) => handlePlayback(MessageType[status])}
      />
      <div className="flex text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-3">
        <ul className="flex-1 flex flex-wrap -mb-px">
          <li className="me-2" onClick={() => handleTabChange(0)}>
            <a
              className={clsx({
                'inline-block p-2 border-b-2 rounded-t-lg cursor-pointer': true,
                'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
                  selectedTab !== 0,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === 0,
              })}
            >
              Queue
            </a>
          </li>
          <li className="me-2" onClick={() => handleTabChange(1)}>
            <a
              className={clsx({
                'inline-block p-2 border-b-2 rounded-t-lg cursor-pointer': true,
                'hover:text-gray-600 hover:border-gray-300 border-transparent dark:hover:text-gray-300':
                  selectedTab !== 1,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === 1,
              })}
            >
              Libray
            </a>
          </li>
        </ul>
        {selectedTab === TabType.Queue && queue.data?.length > 0 && (
          <button
            className="h-8 px-3 py-2 text-xs font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-pointer"
            onClick={handleClearQueue}
          >
            Clear Queue
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {selectedTab === TabType.Queue && (
          <SongList
            playId={currentPlaySongId}
            loading={queue.loading}
            data={queue.data}
            showIcon={true}
            onSelect={(id) => handlePlayback(MessageType.PLAY, id)}
            extra={(item: Queue) => (
              <>
                <span
                  className="material-symbols-outlined cursor-pointer"
                  onClick={() => handlePlayback(MessageType.DELETE, item.id)}
                >
                  delete
                </span>
                <span>{item.durationLabel}</span>
              </>
            )}
          />
        )}
        {selectedTab === TabType.Libray && (
          <SongList
            showIcon={false}
            loading={queue.loading}
            data={libray.data}
            extra={(item: Library) => (
              <>
                <span
                  className="material-symbols-outlined cursor-pointer"
                  onClick={() => handleAddToQueue(item)}
                >
                  add
                </span>
              </>
            )}
          />
        )}
      </div>
      <ToastContainer />
    </>
  );
}
