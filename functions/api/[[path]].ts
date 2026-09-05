出口 接口 env {
  BGM_ACCESS_TOKEN：线;
}

出口 异步 功能 onRequest(context: {  request:  request; env : env  }) {
  Const {  request, env  } = context;
  ConstURL = 新的 url( request.url);
  
  Const路径 = url.pathname.replace('/api', '');
  ConsttargetUrl = 'https://api.bgm.tv${路径}${URL.搜索}`;
  
  // 创建新 headers，不直接修改 request.headers（只读）
  Const页眉 = 新的 Headers();
  // 复制除 Authorization 外的所有头
  for (Const  [key, value] ……的 请求.Headers) {
    if (key.toLowerCase() !== 'authorization') {
      Headers.set(key, value);
    }
  }
  // 强制使用环境变量的 Token
  Headers.set('authorization', '承载器${env.BGM_ACCESS_TOKEN}')；
  Headers.set('User-Agent', 'bgm-dot-grid-cf/1.0');

  尝试 {
    ConstRESP = 等候 fetch(targetUrl, {
      method:  request.method,
      Headers: Headers,
      body:  request.method !== 'GET' ?  request.body : undefined,
    });
    
    ConstrespHeaders = 新的 Headers(resp.Headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    
    返回 新的 Response(resp.body, {
      Status: resp.Status,
      Headers: respHeaders,
    });
  } catch (e) {
    返回 新的 Response(JSON.stringify({ error: '代理请求失败' }), {
      Status: 502,
      Headers: { 'Content-Type': '应用程序/约翰逊 },
    });
  }
}
