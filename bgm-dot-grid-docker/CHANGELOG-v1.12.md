# BGM 点格子 v1.12.0 更新说明

## 主要优化

- 优化封面显示：旧封面不再因为 `grid.innerHTML` 重建而重复淡入，新封面仍保留淡入动画。
- 修复封面加载失败时 `.cv` 被整体清空的问题，状态标签、更新时间、评分徽章不会被误删。
- 降低分页加载时的重绘频率：每页数据合并后改为 `requestAnimationFrame` 节流渲染。
- 增加本地搜索防抖，减少输入时的连续全量渲染。
- API 搜索增加请求序号，避免旧搜索请求后返回覆盖新搜索结果。
- 切换分类时减少不必要的 loading 闪烁，已加载分类直接渲染。
- `mergeItems()` 增加 `animeMap` 索引，降低重复合并和查找成本。

## 后端优化

- 后端版本号更新到 v1.12.0。
- 增加 `/api/search` 10 分钟短缓存，降低重复搜索请求压力。
- 图片代理响应增加更合理的浏览器缓存头，并补充 `X-Cache` 标记。
- 图片代理流式返回时同步写入本地缓存，增加错误处理。
- 增加每日图片缓存清理任务，清理超期旧缓存。
- `data_timestamp.json`、`last_active.json`、`user_token_map.json`、`user_cache` 移入 `bgmdata_cache`，便于 Docker volume 持久化。
- 手动更新时间接口增加参数校验，避免非法 `sid/weekDay/time` 写入。
- Express 关闭 `x-powered-by`，并限制 JSON 请求体大小。

## Docker 优化

- Dockerfile 使用 `npm ci --omit=dev`，没有 lock 文件时自动回退到 `npm install --omit=dev`。
- 修复 docker-compose 示例缩进和注释格式。
- `.dockerignore` 增加 `bgmdata_cache`、日志、`.env` 等忽略项。

## 文件结构

```txt
bgm-dot-grid-v1.12.0/
├─ index.js
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .dockerignore
├─ public/
│  └─ index.html
└─ CHANGELOG-v1.12.md
```
