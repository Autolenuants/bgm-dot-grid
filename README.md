<p align="center">
  <img src="https://raw.githubusercontent.com/huohen92/bgm-dot-grid/main/img/bgm-dot-grid-logo.png" alt="BGM点格子" width="120" />
</p>

<h1 align="center">bgm-dot-grid · BGM 点格子</h1>

<p align="center">
  <strong>Bangumi 收藏进度管理 · 移动端友好的单页应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/版本-v1.8.9-f09199" alt="版本" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <a href="https://hub.docker.com/r/huohen92/bgm-dot-grid"><img src="https://img.shields.io/badge/Docker-available-2496ED?logo=docker" alt="Docker" /></a>
</p>

---

## 📖 简介

**BGM 点格子** 是一个基于 Bangumi API 的番剧收藏管理工具。

相比 Bangumi 官方界面，它专注于 **追番效率**：

- 🏠 **主页** — 卡片网格直观展示所有收藏条目
- 📊 **实时进度** — 每部番的已看集数 / 总集数一目了然
- 🟢 **绿色高亮** — 最近 7 天内播出的未看最新集自动高亮
- 📱 **移动优先** — 底部弹出的二级页面，单手持机操作舒适
- ⚡ **极速体验** — 批量 API 查询 + 增量渲染，告别逐集加载
- 🔧 **高度可配置** — API 端点、图片代理、显示选项均可自定义

---

## ⚡ 快速开始

### 单文件版（开箱即用）

下载 [`1.8.9.html`](./1.8.9.html)，浏览器打开，填入 Access Token 即可。

> 在 [next.bgm.tv/demo/access-token](https://next.bgm.tv/demo/access-token) 获取 Token

### Docker 版（推荐服务器/NAS部署）

```bash
docker run -d \
  --name bgm-dot-grid \
  --restart unless-stopped \
  -p 4500:3000 \
  huohen92/bgm-dot-grid:v1.9.0
```

打开 `http://你的IP:4500` 即可使用。详情见下方 [Docker 版说明](#-docker-版说明)。

---

## 🖼️ 界面预览

<p align="center">
  <strong>移动端</strong><br />
  <img src="https://raw.githubusercontent.com/huohen92/bgm-dot-grid/main/img/bgm-dot-grid-Mobile-1.png" alt="移动端主页" width="300" />
  <img src="https://raw.githubusercontent.com/huohen92/bgm-dot-grid/main/img/bgm-dot-grid-Mobile-2.png" alt="移动端二级页面" width="300" />
</p>

<p align="center">
  <strong>PC 端</strong><br />
  <img src="https://raw.githubusercontent.com/huohen92/bgm-dot-grid/main/img/bgm-dot-grid-PC-1.png" alt="PC端主页" width="600" />
  <br />
  <img src="https://raw.githubusercontent.com/huohen92/bgm-dot-grid/main/img/bgm-dot-grid-PC-2.png" alt="PC端二级页面" width="600" />
</p>

---

## ✨ 核心功能

### 🏠 主页

| 功能 | 说明 |
|------|------|
| **卡片网格** | 以 3 列（移动端）或自适应（桌面端）网格展示番剧封面 |
| **分类筛选** | 全部 / 想看 / 看过 / 在看 / 搁置 / 抛弃 |
| **进度标注** | `x/y(q)` — 已看 x / 总 y 集，在播番额外显示已播出 q 集 |
| **搜索** | 实时按标题搜索过滤 |
| **统计栏** | 顶部显示各分类条目数量 + 总体进度条 |
| **排序** | 默认 / 更新时间 / 评分 / 进度 / 标签 五种排序 |
| **右键快捷** | 右键卡片快速标记下一集（PC 端） |
| **加载条** | 顶部细条显示 API 请求状态 |

### 🎬 二级页面（剧集详情）

点击任意卡片打开，从底部弹出（移动端）：

| 功能 | 说明 |
|------|------|
| **剧集网格** | 显示该作品的所有剧集 |
| **观看状态** | 粉色 = 已看，灰色 = 未来播出，绿色（7天内）= 未看最新集 |
| **快速标记** | 点击任意集 → 菜单：「看过」「看到这里」「撤销」 |
| **状态切换** | 想看 / 看过 / 在看 / 搁置 / 抛弃 一键切换 |
| **看一集** | 一键标记下一集未看 |
| **评分 + 类型** | 显示 Bangumi 评分和风格标签 |
| **快捷跳转** | 点击海报跳转 Bangumi 详情页 |
| **长按标题复制** | 长按标题复制标(移动端浏览器中file://协议可能无法使用该功能) |

### ⚙️ 设置

| 设置项 | 默认 | 说明 |
|--------|------|------|
| **Access Token** | — | Bangumi API 认证 |
| **API 端点** | `https://api.bgm.tv/v0` | 支持自定义，Docker 版默认 `/v0` 走本地代理 |
| **图片代理** | 留空 | 解决封面图加载问题 |
| **Bangumi 主站** | `https://bgm.tv` | 跳转详情页时使用 |
| **显示状态标签** | 开启 | 卡片左上角的「在看」「想看」等 |
| **显示更新时间** | 开启 | 在播番封面显示「周X」 |
| **显示评分** | 关闭 | 封面右下角显示 ⭐ 评分 |
| **显示操作说明** | 开启 | 二级页面底部的提示文字 |

---

## 🏗️ 版本说明

本项目提供两个版本，满足不同使用场景。

### 版本对比

| 特性 | 单文件版（纯前端） | Docker 版（前后端） |
|---|---|---|
| **部署方式** | 浏览器直接打开 HTML | Docker 容器运行 |
| **后端** | 无，浏览器直连 Bangumi API | Node.js (Express) 反向代理 |
| **API 请求** | 浏览器 → 远端 API 直连 | 浏览器 → 本地后端 → 远端 API |
| **图片加载** | 浏览器直连官方图片源 | 后端拉取 + **磁盘缓存** (TTL 1h) |
| **跨域问题** | 需 API 端点支持 CORS | 同域请求，无跨域问题 |
| **图片代理** | 设置页手动填写公共反代地址 | 默认可配置 `/img/` 走本地缓存 |
| **IP 限制** | 无 | 支持 ALLOWED_IPS 白名单 |
| **资源占用** | 0（浏览器即可） | ~50MB 内存 |
| **适用场景** | 个人电脑临时使用 | 服务器 / NAS 长期部署 |

### 选型建议

- **单文件版**：适合在自己电脑上临时使用，双击 HTML 即可，不依赖任何服务端
- **Docker 版**：适合部署到 NAS 或 VPS，图片缓存可大幅提升加载速度，多人共享访问也更安全

---

## 🐳 Docker 版说明

适合部署到 VPS、NAS 或任何支持 Docker 的设备。

### Docker Hub

镜像地址：[huohen92/bgm-dot-grid](https://hub.docker.com/r/huohen92/bgm-dot-grid)

### Docker Compose（推荐）

```yaml
version: '3.8'
services:
  bgm-dot-grid:
    image: huohen92/bgm-dot-grid:v1.9.0
    container_name: bgm-dot-grid
    restart: unless-stopped
    ports:
      - "4500:3000"
    environment:
      - API_BASE=/v0
      - IMAGE_PROXY_PREFIX=/img/
      - BGM_SITE=https://bgm.tv
      - BGM_IMG_DOMAIN=lain.bgm.tv
      - INBUILT_TOKEN=
      - ALLOWED_IPS=
    volumes:
      - ./image_cache:/app/image_cache
```
#### Docker Compose 详细（推荐）
```yaml
version: '3.8'
services:
  bgm-dot-grid:
    image: huohen92/bgm-dot-grid:v1.9.0
    container_name: bgm-dot-grid
    restart: unless-stopped
    ports:
      - "4500:3000"
      - "4501:3001"
      - "4502:3002"
    environment:
      # API 端点：/v0 = 本地代理；https://api.bgm.tv/v0 = 直连官方
      - API_BASE=/v0
      # 图片代理：/img/ = 本地缓存；留空 = 直连；也可填公共反代地址
      - IMAGE_PROXY_PREFIX=/img/
      # Bangumi 主站：海报、条目、评论区跳转用
      - BGM_SITE=https://bgm.tv
      # 后端拉取原图域名：lain.bgm.tv 
      - BGM_IMG_DOMAIN=lain.bgm.tv
      # 内置 Token：留空则由用户在前端填写
      - INBUILT_TOKEN=
      # IP 白名单：留空 = 不限制；local = 仅内网；或填 192.168.*.*
      - ALLOWED_IPS=
      # 是否对 4500 普通前端端口启用 IP 白名单：默认 0
      - CHECK_PUBLIC_IP=0
      # 是否对 4501 私有管理端口启用 IP 白名单：默认 1
      - CHECK_PRIVATE_IP=1
      # 是否对 4502 API 代理端口启用 IP 白名单：默认 1
      - CHECK_PROXY_IP=1
      # 如果部署在可信反向代理后面并需要读取 X-Forwarded-For，可设为 1
      - TRUST_PROXY=0
    volumes:
      - ./image_cache:/app/image_cache
      - ./bgmdata_cache:/app/bgmdata_cache
```

```bash
docker compose up -d
```

### 环境变量

| 变量 | 功能 | 默认值 |
|---|---|---|
| `API_BASE` | API 端点。`/v0` 走本地后端代理，也支持 `https://api.bgm.tv/v0` 直连官方 | `/v0` |
| `IMAGE_PROXY_PREFIX` | 图片代理。`/img/` 走本地缓存 + 磁盘缓存，留空直连原图，或填公共反代地址 | `/img/` |
| `BGM_SITE` | Bangumi 主站，跳转海报/评论区用 | `https://bgm.tv` |
| `BGM_IMG_DOMAIN` | 后端拉取原图的域名。国内封锁环境可改为 `lain.bangumi.one` | `lain.bgm.tv` |
| `INBUILT_TOKEN` | 内置 Token，预设到设置页。留空让用户自己填 | 空 |
| `ALLOWED_IPS` | IP 白名单，逗号分隔。`local`=仅内网，`192.168.*.*`=限定网段，留空=不限制 | 空 |

### 图片缓存

后端自动缓存图片到 `./image_cache`（TTL 1 小时）。手动清理：

```bash
curl -X POST http://你的IP:4500/api/clear-image-cache
```

### 更新

```bash
docker compose pull && docker compose up -d
```

### 本地构建

```bash
git clone https://github.com/huohen92/bgm-dot-grid.git
cd bgm-dot-grid
docker compose up -d --build
```

### 健康检查

```bash
curl http://你的IP:4500/api/health
# → {"status":"ok","uptime":12345}
```

---

## 🖼️ 图片代理说明

国内访问 Bangumi 图片可能受限，可通过以下方式解决：

- **Docker 版默认**：`/img/` 后端自动拉取 + 磁盘缓存
- **公共图片反代**：在设置页「图片代理」填入 `example.com`
- **修改后端图片源**：`BGM_IMG_DOMAIN=example.com`

---

## 🔗 API 请求说明

应用完全基于 Bangumi API v0。

### 首页加载

```
GET /me
```
- **用途**：验证 Token，获取用户信息
- **频率**：每次页面加载 1 次

```
GET /users/{uid}/collections?subject_type=2&type=3&limit=50
```
- **用途**：获取「在看」分类的收藏列表
- **频率**：每次页面加载 1 次

### 切换分类

```
GET /users/{uid}/collections?subject_type=2&type={typeCode}&limit=50&offset={offset}
```
- **typeCode**：1想看 / 2看过 / 3在看 / 4搁置 / 5抛弃

### 后台预加载

```
GET /users/-/collections/{subject_id}/episodes?limit=500
```
- 登录后对每部「在看」作品并发预加载剧集列表 + 观看状态
- 打开二级页面时，预加载过的作品**零请求**直接使用缓存

### 标记单集

```
PUT /users/-/collections/-/episodes/{episode_id}
```
- `{"type": 2}` = 看过，`{"type": 0}` = 撤销

看完所有集时自动更新条目状态：

```
PATCH /users/-/collections/{subject_id}
```

---

## 🔧 自定义指南

### 修改主题色

```css
:root {
  --primary: #f09199;  /* 改为你喜欢的颜色 */
}
```

### 添加自定义 API 端点

支持任何兼容 Bangumi API v0 规范的端点：
- `https://api.bgm.tv/v0`（官方）

---
- [关于自建 Bangumi API 和图片反代](https://catcat.blog/2026/05/bangumi-reverse-proxy)
- [相关Github项目](https://github.com/Yuri-NagaSaki/bangumi-proxy)
---

## 📄 许可

MIT License

## 🙏 致谢

- [Bangumi](https://bgm.tv) — 番组计划
- [Bangumi API](https://bangumi.github.io/api/) — API 文档

---

<p align="center">
  <sub>Powered By July · 本项目代码由 DeepSeek AI 提供</sub>
</p>
