# BGM 点格子 v1.12.1 更新说明

## 修复

- 修复 v1.12.0 中 `ALLOWED_IPS` 实际只作用于 3002 / 4502 代理端口的问题。
- 新增可配置的端口级 IP 检查开关：
  - `CHECK_PUBLIC_IP`：控制 3000 / 4500 普通前端端口。
  - `CHECK_PRIVATE_IP`：控制 3001 / 4501 私有管理端口。
  - `CHECK_PROXY_IP`：控制 3002 / 4502 API 代理端口。

## 默认行为

```txt
4500 普通前端：默认不限制
4501 私有管理端口：默认启用 IP 白名单
4502 API 代理端口：默认启用 IP 白名单
```

## 推荐配置

只保护管理端口和代理端口：

```yaml
- ALLOWED_IPS=local
- CHECK_PUBLIC_IP=0
- CHECK_PRIVATE_IP=1
- CHECK_PROXY_IP=1
```

三个端口都只允许内网访问：

```yaml
- ALLOWED_IPS=local
- CHECK_PUBLIC_IP=1
- CHECK_PRIVATE_IP=1
- CHECK_PROXY_IP=1
```
