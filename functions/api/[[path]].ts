export interface Env {
  BGM_ACCESS_TOKEN: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 剔除 /api 前缀，拼接 Bangumi 官方地址
  const path = url.pathname.replace('/api', '');
  const targetUrl = `https://api.bgm.tv${path}${url.search}`;

  const headers = new Headers(request.headers);
  // 从环境变量读取 Token（安全！）
  headers.set('Authorization', `Bearer ${env.BGM_ACCESS_TOKEN}`);
  headers.set('User-Agent', 'bgm-dot-grid-cf/1.0');

  try {
    const resp = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' ? request.body : undefined,
    });

    const respHeaders = new Headers(resp.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    
    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: '代理请求失败' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
