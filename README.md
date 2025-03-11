npm i && npm run dev

## Scope
- Enable Socket mode
- Bot Token Scopes
  - channels:history
  - channels:manage
  - channels:read
  - chat:write
  - groups:history
  - groups:write
  - im:history
  - mpim:history
- Event Subscriptions
  - channel_archive
  - channel_created
  - channel_deleted
  - channel_rename
  - channel_unarchive
  - message.channels
  - message.groups
  - message.im
  - message.mpim

## Deployment
see: https://scrapbox.io/kmc/%E9%83%A8%E5%86%85%E3%81%A7%E5%8B%95%E3%81%8F%E5%8B%95%E7%9A%84Web%E3%82%A2%E3%83%97%E3%83%AA%E3%82%92%E7%AB%8B%E3%81%A6%E3%82%8B%E6%96%B9%E6%B3%95

on ringo

```
git clone git@github.com:kmc-jp/emoji-watcher.git
cd emoji-watcher
npm i
```

`/etc/systemd/system/channel-watcher.service`
```
[Unit]
Description=channle watcher

[Service]
EnvironmentFile=/home/segre/channel-watcher/.env
ExecStart=node /home/segre/channel-watcher/app.js
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
```
```
systemctl daemon-reload
systemctl enable --now channel-watcher.service
systemctl status channel-watcher.service
```
