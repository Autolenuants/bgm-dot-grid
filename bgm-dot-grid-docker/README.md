# BGM 点格子 v1.12.1

一个轻量的 Bangumi 收藏网格工具，支持查看收藏、追番进度、单集标记、搜索、图片缓存和放送时间显示。

> v1.12.1 是 v1.12.0 的小修复版，重点修复 `ALLOWED_IPS` 只对代理端口生效的问题。

---

## 快速启动

```bash
cd bgm-dot-grid-v1.12.1
docker compose up -d --build
```

访问：

```txt
http://服务器IP:4503
```

---

## 端口说明

```txt
4503 -> 3000：普通前端端口，日常使用
4501 -> 3001：私有管理端口，包含缓存管理功能
4502 -> 3002：API 代理端口
```

---

## docker-compose.yml 说明

核心配置如下：

```yaml
services:
  bgm-dot-grid:
    build: .
    container_name: bgm-dot-grid
    restart: unless-stopped
    ports:
      - "4500:3000"
      - "4501:3001"
      - "4502:3002"
    environment:
      - API_BASE=/v0
      - IMAGE_PROXY_PREFIX=/img/
      - BGM_SITE=https://bgm.tv
      - BGM_IMG_DOMAIN=lain.bgm.tv
      - INBUILT_TOKEN=
      - ALLOWED_IPS=
      - CHECK_PUBLIC_IP=0
      - CHECK_PRIVATE_IP=1
      - CHECK_PROXY_IP=1
      - TRUST_PROXY=0
    volumes:
      - ./image_cache:/app/image_cache
      - ./bgmdata_cache:/app/bgmdata_cache
```

---

## IP 白名单说明

v1.12.1 新增三个开关：

```yaml
- CHECK_PUBLIC_IP=0
- CHECK_PRIVATE_IP=1
- CHECK_PROXY_IP=1
```

含义：

```txt
CHECK_PUBLIC_IP：是否限制 4500 普通前端端口
CHECK_PRIVATE_IP：是否限制 4501 私有管理端口
CHECK_PROXY_IP：是否限制 4502 API 代理端口
```

默认策略：

```txt
4500 普通前端：默认不限制
4501 管理端口：默认限制
4502 代理端口：默认限制
```

如果你想只允许内网访问管理端口和代理端口：

```yaml
- ALLOWED_IPS=local
- CHECK_PUBLIC_IP=0
- CHECK_PRIVATE_IP=1
- CHECK_PROXY_IP=1
```

如果你想三个端口都只允许内网访问：

```yaml
- ALLOWED_IPS=local
- CHECK_PUBLIC_IP=1
- CHECK_PRIVATE_IP=1
- CHECK_PROXY_IP=1
```

如果你想允许指定 IP 段：

```yaml
- ALLOWED_IPS=192.168.*.*
```

如果 `ALLOWED_IPS` 留空，则不进行 IP 限制。

---

## 反向代理注意事项

如果你在 Nginx、Cloudflare、1Panel、宝塔等反向代理后面部署，并且需要读取真实用户 IP，可以设置：

```yaml
- TRUST_PROXY=1
```

只有在你信任前面的反向代理时才建议开启。

---

## 更简单的内网限制方式

如果你只想让本机访问，可以直接改端口绑定：

```yaml
ports:
  - "127.0.0.1:4500:3000"
  - "127.0.0.1:4501:3001"
  - "127.0.0.1:4502:3002"
```

如果只想绑定服务器内网 IP，例如 `192.168.1.100`：

```yaml
ports:
  - "192.168.1.100:4500:3000"
  - "192.168.1.100:4501:3001"
  - "192.168.1.100:4502:3002"
```

---

## 常用命令

启动：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker logs -f bgm-dot-grid
```

重启：

```bash
docker restart bgm-dot-grid
```

停止：

```bash
docker compose down
```

容器名冲突时：

```bash
docker stop bgm-dot-grid
docker rm bgm-dot-grid
docker compose up -d --build
```

---

## v1.12.1 更新内容

- 修复 `ALLOWED_IPS=local` 只对 4502 代理端口生效的问题。
- 新增 `CHECK_PUBLIC_IP`、`CHECK_PRIVATE_IP`、`CHECK_PROXY_IP` 三个开关。
- 默认保护 4501 私有管理端口和 4502 API 代理端口。
- 保持 4500 普通前端端口默认不限制，避免个人部署时误锁自己。
- README 更新 IP 白名单说明。
