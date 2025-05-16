'use client';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { socket } from '@/socket';

import Player, { PlayStatus } from '@/components/Player';
import SongList from '@/components/SongList';

import { MessageType } from '@/lib/constant';
import useInterval from '@/hooks/useInterval';

export default function Home() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');
  const [queue, setQueue] = useState({
    loading: true,
    data: [],
  });
  const [songInfo, setSongInfo] = useState({
    loading: true,
    data: null,
  });
  const [currentPlaySongId, setCurrentPlaySongId] = useState(-1);

  useInterval(() => {
    if (!songInfo) {
      return;
    }
    const { state = '' } = songInfo.data;
    if (state !== PlayStatus.PLAY) {
      return;
    }
    console.info('songIfo', songInfo);
    sendMessage(MessageType.REQUEST_ELAPSED);
  }, 800);

  const sendMessage = (type = '', data = null) => {
    const msg = {
      type: type,
      payload: data ? data : null,
    };
    if (!socket.connected) {
      return;
    }
    socket.emit(MessageType.MESSAGE_EVENT, JSON.stringify(msg));
  };

  const receiveMessage = (msg: any) => {
    console.info('client -> receiveMessage', msg);
    const { type, payload: data } = JSON.parse(msg);
    switch (type) {
      case MessageType.QUEUE:
        setQueue({
          ...queue,
          loading: false,
          data,
        });
        break;
      case MessageType.STATUS:
        {
          const updatedSong = {
            loading: false,
            data: {
              ...data,
            },
          };
          setSongInfo(updatedSong);
          setCurrentPlaySongId(data.id);
        }
        break;
      case MessageType.ELAPSED:
        {
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
    }
  };

  const handlePlay = (pos = null) => {
    sendMessage(MessageType.PLAY, pos);
  };

  const handlePause = () => {
    sendMessage(MessageType.PAUSE);
  };

  const handleVolumeChanage = (nextValue: number) => {
    sendMessage(MessageType.SET_VOL, nextValue);
  };

  const handleNext = () => {
    sendMessage(MessageType.NEXT);
  };

  const handlePrevious = () => {
    sendMessage(MessageType.PREVIOUS);
  };

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      socket.on(MessageType.MESSAGE_EVENT, receiveMessage);
      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name);
      });
      sendMessage(MessageType.REQUEST_QUEUE);
      sendMessage(MessageType.REQUEST_STATUS);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setTransport('N/A');
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

  const handleTabChange = (value: number) => {
    setSelectedTab(value);
  };

  return (
    <>
      <p>Status: {isConnected ? 'connected' : 'disconnected'}</p>
      <p>Transport: {transport}</p>
      <Player
        loading={songInfo.loading}
        data={songInfo.data}
        onPlay={handlePlay}
        onPause={handlePause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onVolumn={handleVolumeChanage}
      />
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-4">
        <ul className="flex flex-wrap -mb-px">
          <li className="me-2" onClick={() => handleTabChange(0)}>
            <a
              className={clsx({
                'inline-block p-4 border-b-2 border-transparent rounded-t-lg cursor-pointer': true,
                'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
                  selectedTab !== 0,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === 0,
              })}
            >
              Queue
            </a>
          </li>
          {/* <li className="me-2" onClick={() => handleTabChange(1)}>
            <a
              className={clsx({
                'inline-block p-4 border-b-2 border-transparent rounded-t-lg cursor-pointer': true,
                'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300':
                  selectedTab !== 1,
                'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500':
                  selectedTab === 1,
              })}
            >
              Libray
            </a>
          </li> */}
        </ul>
      </div>
      <SongList
        playId={currentPlaySongId}
        loading={queue.loading}
        data={queue.data}
        onPlay={handlePlay}
      />
    </>
  );
}
