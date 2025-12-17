这是一款基于 MPD 的客户端播放器，使用 Nextjs 开发，支持：

* 播放/暂停
* 下一首/上一首
* 更改音量
* 更改播放模式
* 清空播放队列
* 从 Database 中添加歌曲

![界面](./public/screen-1.jpg)

## 什么是 MPD

MPD 是 [Music Player Daemon](https://www.musicpd.org/) 缩写。

Music Player Daemon (MPD) is a flexible, powerful, server-side application for playing music. Through plugins and libraries it can play a variety of sound files while being controlled by its network protocol.

## 部署

请使用 Docker 部署

```sh
version: '3.9'
services:
  mpd-player:
    image: xbf321/mpd-player:latest
    container_name: mpd-player
    restart: unless-stopped
    ports:
      - 7170:7170
    environment:
      - MPD_HOST=192.168.100.1
      - MPD_PORT=7160
```


## 开发

修改 .env 文件，仅在 development 环境生效

```sh
HOST_NAME=0.0.0.0
PORT=7170
MPD_HOST=10.147.20.1
MPD_PORT=7160
```

First, run the development server:

```bash
pnpm run dev
```

推荐使用 PNPM。

Open [http://localhost:7170](http://localhost:7170) with your browser to see the result.

## WS Command

参见 **/src/lib/sockt-server.ts**

```js
{ "type": "PLAY"}
{ "type": "PAUSE"}
{ "type": "REQUEST_STATUS"}
{ "type": "REQUEST_ELAPSED"}
{ "type": "GET_VOL"}
{ "type": "SET_VOL","data": 20}
{ "type": "REPEAT","data": true}
{ "type": "RANDOM","data": true}
{ "type": "QUEUE"}
...
```

## Docker 操作

```shell
# 构建 image
docker build -t xbf321/mpd-player .

# 发布到 hub.docker.io
docker push xbf321/mpd-player:latest

# 创建容器
# 后台运行
docker run -d -p 7170:7170 -e MPD_HOST=192.168.100.1 -e MPD_PORT=7160 --name mpd-player xbf321/mpd-player:latest
# 临时运行
docker run -it --name mpd-player xbf321/mpd-player /bin/bash
# 进入容器内部
docker exec -it mpd-player /bin/bash
```