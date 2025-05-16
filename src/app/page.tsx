// @ts-nocheck
'use client';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { socket } from '@/socket';

import Player from '@/components/Player';
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
  const [songStatus, setSongStatus] = useState({
    loading: true,
    data: null,
  });
  useInterval(() => {
    if (!socket.connected) {
      return;
    }
    // socket.emit(MessageType.MESSAGE_EVENT, MessageType.REQUEST_STATUS);
  }, 3000);

  const onMessage = (type, data) => {
    console.info('client -> onMessage', type, data);
    switch (type) {
      case MessageType.QUEUE:
        setQueue({
          ...queue,
          loading: false,
          data,
        });
        break;
      case MessageType.STATUS:
        setSongStatus({
          loading: false,
          data,
        });
        break;
    }
  };

  const handlePlayerPlay = () => {
    socket.emit(MessageType.MESSAGE_EVENT, MessageType.PLAY);
  };

  const handlePlayerPause = () => {
    socket.emit(MessageType.MESSAGE_EVENT, MessageType.PAUSE);
  };

  const handleVolumeChanage = (nextValue) => {

  };

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);
      socket.on(MessageType.MESSAGE_EVENT, onMessage);
      socket.io.engine.on('upgrade', (transport) => {
        setTransport(transport.name);
      });
      socket.emit(MessageType.MESSAGE_EVENT, MessageType.QUEUE);
      socket.emit(MessageType.MESSAGE_EVENT, MessageType.REQUEST_STATUS);
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport('N/A');
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
        loading={songStatus.loading}
        data={songStatus.data}
        onPlay={handlePlayerPlay}
        onPause={handlePlayerPause}
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
      <SongList loading={queue.loading} data={queue.data} />
    </>
  );
}
