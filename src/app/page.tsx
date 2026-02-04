'use client';
import clsx from 'clsx';
import { ToastContainer, toast } from 'react-toastify';
import { useState, useEffect, useContext } from 'react';

import Button from '@/components/Button';
import SongList from '@/components/SongList';
import Player from '@/components/Player';
import Stepper, { StepperStatus } from '@/components/Stepper';

import { socket } from '@/socket';
import CurrentSongContext from './context';
import useInterval from '@/hooks/useInterval';
import { MessageType, MPDStatus, PlayStatus } from '@/lib/constant';

enum TabType {
  Queue = 0,
  Libray = 1,
}

export default function Home() {
  const [currentSong, setCurrentSong] = useContext(CurrentSongContext);
  const [stepperInfo, setStepperInfo] = useState({
    socketReady: false,
    mpdReady: false,
    current: 0,
  });
  const [selectedTab, setSelectedTab] = useState(TabType.Queue);
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
  ];

  useInterval(() => {
    if (!currentSong) {
      return;
    }
    const { state } = currentSong;
    if (state !== PlayStatus.PLAY) {
      return;
    }
    sendMessage(MessageType.REQUEST_STATUS);
  }, 1000);

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
    console.log('receiveMessage', type, data);
    switch (type) {
      case MessageType.STATUS:
        {
          setCurrentSong((item: SongInfo) => {
            return {
              ...item,
              ...data,
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
      case MessageType.MPD_STATUS:
        if (Number(data) === MPDStatus.READY) {
          return;
        }
        toast.error('MPD Server has been offline. Please refresh page.');
        break;
      case MessageType.OPERATION_SUCCESS:
        toast.success('Success');
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
    sendMessage(MessageType.REQUEST_ADD_TO_QUEUE, item.file);
  };

  return (
    <>
      <Stepper
        current={stepperInfo.current}
        items={stepItems}
        className={clsx({
          hidden: stepperInfo.socketReady,
        })}
      />
      <Player
        data={currentSong as SongInfo}
        doAction={(messageType, data) => sendMessage(messageType, data)}
      />
      <div className="flex text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-3">
        <ul className="flex-1 flex flex-wrap -mb-px">
          <li className="me-2" onClick={() => handleTabChange(TabType.Queue)}>
            <a
              className={clsx({
                'inline-block p-2 border-b-2 rounded-t-lg cursor-pointer': true,
                'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
                  selectedTab !== TabType.Queue,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === TabType.Queue,
              })}
            >
              Queue
            </a>
          </li>
          <li className="me-2" onClick={() => handleTabChange(TabType.Libray)}>
            <a
              className={clsx({
                'inline-block p-2 border-b-2 rounded-t-lg cursor-pointer': true,
                'hover:text-gray-600 hover:border-gray-300 border-transparent dark:hover:text-gray-300':
                  selectedTab !== TabType.Libray,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === TabType.Libray,
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
            playId={(currentSong as SongInfo)?.songid}
            loading={queue.loading}
            data={queue.data}
            showIcon={true}
            onSelect={(id) => sendMessage(MessageType.REQUEST_PLAY, id)}
            extra={(item: Queue) => (
              <>
                <Button onClick={() => sendMessage(MessageType.REQUEST_DELETE, item.id)}>
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="delete"
                    width="1.5em"
                    height="1.5em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M864 256H736v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zm-200 0H360v-72h304v72z"></path>
                  </svg>
                </Button>
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
                <Button onClick={() => handleAddToQueue(item)}>
                  <svg
                    viewBox="64 64 896 896"
                    focusable="false"
                    data-icon="plus-circle"
                    width="1.5em"
                    height="1.5em"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z"></path>
                  </svg>
                </Button>
              </>
            )}
          />
        )}
      </div>
      <ToastContainer />
    </>
  );
}
