前端使用 Nextjs 开发，基于 MPD 的客户端播放器，支持：

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
services:
  mpd-player:
    image: xbf321/mpd-player:latest
    container_name: mpd-player
    restart: unless-stopped
    ports:
      - 7100:7100
    environment:
      - MPD_HOST=192.168.1.191
      - MPD_PORT=6600
```


## 开发

修改 .env 文件，仅在 development 环境生效

```sh
HOST_NAME=0.0.0.0
PORT=7100
MPD_HOST=127.0.0.1
MPD_PORT=6600
```

First, run the development server:

```bash
pnpm run dev
```

推荐使用 PNPM。

Open [http://localhost:7100](http://localhost:7100) with your browser to see the result.

## Mac 中测试

安装 mpd 和 mpc

```shell
brew install mpd mpc
```

配置声卡 (mpd.conf)：找到配置文件（通常在 ~/.mpdconf 或 /usr/local/etc/mpd.conf），编辑 audio_output 部分：

```shell
audio_output {
    type        "osx"
    name        "My Mac Sound Card"
    # device    "hw:0,0" # 可选：使用特定设备ID
}
```

type 为 "osx" 适用于macOS原生系统声音输出。

## WS Command

参见 **/src/lib/sockt-server.ts**

```js
{ "type": "REQUEST_PLAY"}
{ "type": "REQUEST_PAUSE"}
{ "type": "REQUEST_STATUS"}
{ "type": "REQUEST_SET_VOL","data": 20}
{ "type": "REQUEST_REPEAT","data": true}
{ "type": "REQUEST_RANDOM","data": true}
{ "type": "REQUEST_QUEUE"}
...
```

## Docker Development

```shell
# 构建 image
docker build -t xbf321/mpd-player .

# 发布到 hub.docker.io
docker push xbf321/mpd-player:latest

# 创建容器
# 后台运行
docker run -d \
 -p 7100:7100 \
 -e MPD_HOST=192.168.1.191 \
 -e MPD_PORT=6600 \
 --name mpd-player xbf321/mpd-player:latest

# 临时运行
docker run -it --name mpd-player xbf321/mpd-player /bin/bash
# 进入容器内部
docker exec -it mpd-player /bin/bash
```