export interface Env {
  BGM_ACCESS_TOKEN: string;
}

export async function onRequest(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const path = url.pathname.replace('/api', '');
  const targetUrl = `https://api.bgm.tv${path}${url.search}`;
  
  // 创建新 headers，不直接修改 request.headers（只读）
  const headers = new Headers();
  // 复制除 Authorization 外的所有头
  for (const [key, value] of request.headers) {
    if (key.toLowerCase() !== 'authorization') {
      headers.set(key, value);
    }
  }
  // 强制使用环境变量的 Token
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
