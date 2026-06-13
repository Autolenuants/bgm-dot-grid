var express = require('express');
var axios = require('axios');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

// ==================================================================
// 共享缓存配置
// ==================================================================
var IMAGE_CACHE_DIR = path.join(__dirname, 'image_cache');
if (!fs.existsSync(IMAGE_CACHE_DIR)) fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
var IMAGE_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 小时（在看）
var IMAGE_CACHE_LONG_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天（其他页面）

var BGMDATA_CACHE_DIR = path.join(__dirname, 'bgmdata_cache');
if (!fs.existsSync(BGMDATA_CACHE_DIR)) fs.mkdirSync(BGMDATA_CACHE_DIR, { recursive: true });

// 数据源
var BANGUMI_DATA_URL = 'https://unpkg.com/bangumi-data@0.3/dist/data.json';
var BANGUMI_FULL_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
var SCHEDULE_TTL_MS = 6 * 60 * 60 * 1000;           // 6 小时

// 手动排期文件
var MANUAL_SCHEDULE_FILE = path.join(BGMDATA_CACHE_DIR, 'manual_schedule.json');

function loadManualSchedule() {
  try {
    if (fs.existsSync(MANUAL_SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(MANUAL_SCHEDULE_FILE, 'utf8'));
    }
  } catch(e) {}
  return {};
}

function saveManualSchedule(data) {
  fs.writeFileSync(MANUAL_SCHEDULE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// 配置文件
var DATA_TIMESTAMP_FILE = path.join(__dirname, 'data_timestamp.json');
var LAST_ACTIVE_FILE = path.join(__dirname, 'last_active.json');
var USER_TOKEN_FILE = path.join(__dirname, 'user_token_map.json');
var USER_CACHE_DIR = path.join(__dirname, 'user_cache');
if (!fs.existsSync(USER_CACHE_DIR)) fs.mkdirSync(USER_CACHE_DIR, { recursive: true });

var COLLECTION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// ==================================================================
// 数据时间戳 & 活跃记录
// ==================================================================
function getDataTimestamp() {
  try {
    if (fs.existsSync(DATA_TIMESTAMP_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_TIMESTAMP_FILE, 'utf8'));
    }
  } catch(e) {}
  return null;
}

function setDataTimestamp(type) {
  fs.writeFileSync(DATA_TIMESTAMP_FILE, JSON.stringify({
    type: type,
    time: new Date().toISOString()
  }), 'utf8');
}

function recordActive() {
  var data = {};
  try {
    if (fs.existsSync(LAST_ACTIVE_FILE)) {
      data = JSON.parse(fs.readFileSync(LAST_ACTIVE_FILE, 'utf8'));
    }
  } catch(e) {}
  data.lastActiveAt = new Date().toISOString();
  fs.writeFileSync(LAST_ACTIVE_FILE, JSON.stringify(data), 'utf8');
}

function wasRecentlyActive(hours) {
  hours = hours || 24;
  try {
    if (fs.existsSync(LAST_ACTIVE_FILE)) {
      var data = JSON.parse(fs.readFileSync(LAST_ACTIVE_FILE, 'utf8'));
      if (data.lastActiveAt) {
        var age = Date.now() - new Date(data.lastActiveAt).getTime();
        return age < hours * 60 * 60 * 1000;
      }
    }
  } catch(e) {}
  return false;
}

// ==================================================================
// Token 映射 & 用户收藏缓存
// ==================================================================
function loadTokenMap() {
  try {
    if (fs.existsSync(USER_TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(USER_TOKEN_FILE, 'utf8'));
    }
  } catch(e) {}
  return { tokens: {} };
}

function saveTokenMap(map) {
  fs.writeFileSync(USER_TOKEN_FILE, JSON.stringify(map, null, 2), 'utf8');
}

function recordUserToken(authHeader, userInfo) {
  if (!authHeader) return;
  var map = loadTokenMap();
  var tokenHash = crypto.createHash('md5').update(authHeader).digest('hex');
  map.tokens[tokenHash] = {
    token: authHeader,
    username: userInfo.username || '',
    user_id: userInfo.user_id || '',
    nick: userInfo.nick || '',
    savedAt: new Date().toISOString()
  };
  saveTokenMap(map);
  console.log('[UserToken] recorded: ' + (userInfo.nick || userInfo.username));
  return tokenHash;
}

function getTokenHash(authHeader) {
  return crypto.createHash('md5').update(authHeader).digest('hex');
}

function getUserCacheDir(authHeader) {
  if (!authHeader) return null;
  var hash = getTokenHash(authHeader);
  var dir = path.join(USER_CACHE_DIR, hash);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function isCollectionCacheValid(authHeader) {
  var dir = getUserCacheDir(authHeader);
  if (!dir) return false;
  var file = path.join(dir, 'collections.json');
  try {
    if (!fs.existsSync(file)) return false;
    var data = JSON.parse(fs.readFileSync(file, 'utf8'));
    var age = Date.now() - new Date(data.cachedAt).getTime();
    return age < COLLECTION_TTL_MS;
  } catch(e) { return false; }
}

function getCachedCollectionTimestamp(authHeader) {
  var dir = getUserCacheDir(authHeader);
  if (!dir) return null;
  var file = path.join(dir, 'collections.json');
  try {
    if (!fs.existsSync(file)) return null;
    var data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.cachedAt;
  } catch(e) { return null; }
}

function getCachedCollections(authHeader) {
  var dir = getUserCacheDir(authHeader);
  if (!dir) return null;
  var file = path.join(dir, 'collections.json');
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch(e) { return null; }
}

function saveCachedCollections(authHeader, items) {
  var dir = getUserCacheDir(authHeader);
  if (!dir) return;
  var file = path.join(dir, 'collections.json');
  var data = { data: items, cachedAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  setDataTimestamp('collections_pull');
  console.log('[CollectionCache] saved ' + items.length + ' items for ' + authHeader.substring(0, 30) + '...');
}

async function fetchAndCacheAllCollections(authHeader) {
  var map = loadTokenMap();
  var hash = getTokenHash(authHeader);
  var userEntry = map.tokens[hash];
  if (!userEntry) { console.error('[CollectionPull] no user entry for token'); return; }

  var token = userEntry.token;
  var username = userEntry.username;
  if (!token || !username) { console.error('[CollectionPull] incomplete user info'); return; }

  console.log('[CollectionPull] start pulling for ' + username);
  var tokenValue = token.replace(/^Bearer\s+/i, '').trim();
  var allItems = [];
  var statusCodes = [1, 2, 3, 4, 5]; // wish, watched, watching, hold, drop
  var subjectTypes = [2]; // 默认番剧

  // 计算总请求数，用于分散
  var totalRequests = 0;
  var pageSizes = {};
  for (var si = 0; si < statusCodes.length; si++) {
    for (var tj = 0; tj < subjectTypes.length; tj++) {
      totalRequests++; // 至少一次
      pageSizes[statusCodes[si] + '_' + subjectTypes[tj]] = -1;
    }
  }
  // 加上后续分页的估算（保守估计每50条一页）
  var MAX_PAGES = 10;
  var estimatedPages = statusCodes.length * subjectTypes.length * MAX_PAGES;
  var intervalMs = Math.max(500, Math.floor(30 * 60 * 1000 / estimatedPages));

  var requestCount = 0;
  for (var si = 0; si < statusCodes.length; si++) {
    var sc = statusCodes[si];
    for (var tj = 0; tj < subjectTypes.length; tj++) {
      var st = subjectTypes[tj];
      var offset = 0;
      var total = 9999;
      while (offset < total) {
        try {
          await new Promise(function(r) { setTimeout(r, intervalMs); });
          var resp = await axios({
            method: 'get',
            url: 'https://api.bgm.tv/v0/users/' + encodeURIComponent(username) + '/collections',
            headers: { 'Authorization': 'Bearer ' + tokenValue, 'User-Agent': 'BGM-DotGrid/1.11' },
            params: { subject_type: st, type: sc, limit: 50, offset: offset },
            timeout: 30000
          });
          requestCount++;
          var list = resp.data.data || [];
          total = resp.data.total || list.length;
          for (var ci = 0; ci < list.length; ci++) {
            var col = list[ci];
            var subject = col.subject || {};
            var sid = col.subject_id || subject.id;
            if (!sid) continue;
            allItems.push({
              sid: Number(sid),
              name: subject.name_cn || subject.name || '未知',
              cover: (subject.images && subject.images.medium) || (subject.images && subject.images.common) || '',
              total: subject.eps || subject.eps_count || 0,
              episodes: col.ep_status || 0,
              status: sc,
              score: subject.score ? (subject.score.num || subject.score) : 0,
              tag: (subject.tags && subject.tags.length && subject.tags[0].name) ? subject.tags[0].name : '',
              _allTags: subject.tags || [],
              subjectType: st
            });
          }
          offset += 50;
          if (list.length < 50) break;
        } catch (err) {
          console.error('[CollectionPull] fetch error: ' + err.message);
          break;
        }
      }
    }
  }

  saveCachedCollections(authHeader, allItems);
  console.log('[CollectionPull] done: ' + allItems.length + ' items in ' + requestCount + ' requests (' + intervalMs + 'ms interval)');
}

// 定时任务：每30分钟检查一次，超7天则重新拉取
function startCollectionPullTask() {
  setInterval(async function() {
    var map = loadTokenMap();
    var tokenHashes = Object.keys(map.tokens);
    if (!tokenHashes.length) return;

    console.log('[CollectionPull] checking ' + tokenHashes.length + ' users...');
    for (var i = 0; i < tokenHashes.length; i++) {
      var entry = map.tokens[tokenHashes[i]];
      if (!entry || !entry.token) continue;
      if (!isCollectionCacheValid(entry.token)) {
        console.log('[CollectionPull] cache expired for ' + (entry.nick || entry.username) + ', pulling...');
        try {
          await fetchAndCacheAllCollections(entry.token);
        } catch(e) {
          console.error('[CollectionPull] pull failed: ' + e.message);
        }
      }
    }
  }, 30 * 60 * 1000); // 30分钟
}

// ==================================================================
// 图片缓存函数
// ==================================================================
function getImageCacheFileName(url) {
  var hash = crypto.createHash('md5').update(url).digest('hex');
  var ext = path.extname(url).split('?')[0] || '.jpg';
  return hash + ext;
}

function isImageCacheValid(filePath, useLongTTL) {
  try {
    var stats = fs.statSync(filePath);
    var ttl = useLongTTL ? IMAGE_CACHE_LONG_TTL_MS : IMAGE_CACHE_TTL_MS;
    return (Date.now() - stats.mtimeMs) < ttl;
  } catch(e) { return false; }
}

function clearImageCache() {
  if (!fs.existsSync(IMAGE_CACHE_DIR)) return;
  var files = fs.readdirSync(IMAGE_CACHE_DIR);
  for (var i = 0; i < files.length; i++) {
    try { fs.unlinkSync(path.join(IMAGE_CACHE_DIR, files[i])); } catch(e) {}
  }
}

function getCachedImageList() {
  if (!fs.existsSync(IMAGE_CACHE_DIR)) return [];
  var files = fs.readdirSync(IMAGE_CACHE_DIR);
  var now = Date.now();
  var result = [];
  for (var i = 0; i < files.length; i++) {
    var fp = path.join(IMAGE_CACHE_DIR, files[i]);
    try {
      var stats = fs.statSync(fp);
      var age = now - stats.mtimeMs;
      if (age < IMAGE_CACHE_LONG_TTL_MS) {
        result.push(fp);
      }
    } catch(e) {}
  }
  return result;
}

// ==================================================================
// 通用缓存函数
// ==================================================================
function isCacheValid(filePath, ttlMs) {
  try {
    if (!fs.existsSync(filePath)) return false;
    var stats = fs.statSync(filePath);
    return (Date.now() - stats.mtimeMs) < ttlMs;
  } catch(e) { return false; }
}

function readCacheFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    var raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function writeCacheFile(filePath, data) {
  var cached = { data: data, cachedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(cached), 'utf8');
}

function getCacheMeta(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    var data = readCacheFile(filePath);
    var stats = fs.statSync(filePath);
    return {
      exists: true,
      cachedAt: (data && data.cachedAt) || stats.mtime.toISOString(),
      ageMs: Date.now() - stats.mtimeMs
    };
  } catch(e) { return { exists: false, cachedAt: null, ageMs: Infinity }; }
}

async function fetchWithCache(url, cacheFile, ttlMs, res) {
  if (isCacheValid(cacheFile, ttlMs)) {
    var cached = readCacheFile(cacheFile);
    if (cached && cached.data) {
      if (res) res.set('X-Cache', 'HIT');
      return cached.data;
    }
  }
  try {
    var response = await axios({ method: 'get', url: url, timeout: 15000 });
    writeCacheFile(cacheFile, response.data);
    if (res) res.set('X-Cache', 'MISS');
    return response.data;
  } catch (error) {
    var stale = readCacheFile(cacheFile);
    if (stale && stale.data) {
      if (res) res.set('X-Cache', 'STALE');
      return stale.data;
    }
    throw error;
  }
}

function clearDataCache() {
  if (!fs.existsSync(BGMDATA_CACHE_DIR)) return;
  var files = fs.readdirSync(BGMDATA_CACHE_DIR);
  for (var i = 0; i < files.length; i++) {
    try { fs.unlinkSync(path.join(BGMDATA_CACHE_DIR, files[i])); } catch(e) {}
  }
}

function getCacheStats() {
  if (!fs.existsSync(BGMDATA_CACHE_DIR)) return { imageCache: { count: 0, ttlHours: 4 }, calendar: { exists: false, cachedAt: null, ttlDays: 7 }, schedule: { exists: false, cachedAt: null, ttlHours: 6 }, dataTimestamp: null };
  var calMeta = getCacheMeta(path.join(BGMDATA_CACHE_DIR, 'bangumi-data.json')) || { exists: false, cachedAt: null, ageMs: Infinity };
  var schMeta = getCacheMeta(path.join(BGMDATA_CACHE_DIR, 'schedule.json')) || { exists: false, cachedAt: null, ageMs: Infinity };
  var imageFiles = getCachedImageList();
  var dataTs = getDataTimestamp();
  return {
    imageCache: { count: imageFiles.length, ttlHours: 4 },
    calendar: { exists: calMeta.exists, cachedAt: calMeta.cachedAt, ttlDays: 7 },
    schedule: { exists: schMeta.exists, cachedAt: schMeta.cachedAt, ttlHours: 6 },
    dataTimestamp: dataTs
  };
}

// ==================================================================
// IP 白名单中间件
// ==================================================================
function isPrivateIP(ip) {
  var clean = ip.replace(/^::ffff:/, '');
  var parts = clean.split('.').map(Number);
  if (parts.length !== 4) return false;
  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  return false;
}

function createIpCheckMiddleware() {
  return function(req, res, next) {
    var allowedEnv = process.env.ALLOWED_IPS;
    if (!allowedEnv) return next();

    var clientIp = req.ip.replace(/^::ffff:/, '');
    var directIp = req.connection ? req.connection.remoteAddress.replace(/^::ffff:/, '') : clientIp;
    var patterns = allowedEnv.split(',').map(function(s) { return s.trim(); }).filter(Boolean);

    var matched = patterns.some(function(pattern) {
      if (pattern.toLowerCase() === 'local') {
        return isPrivateIP(clientIp) || isPrivateIP(directIp);
      }
      var regexStr = '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[0-9]+')
        .replace(/\?/g, '[0-9]') + '$';
      try {
        return new RegExp(regexStr).test(clientIp);
      } catch(e) { return false; }
    });

    if (!matched) {
      console.log('[IP Block] ' + clientIp);
      return res.status(403).send('Forbidden');
    }
    next();
  };
}


function envFlag(name, defaultValue) {
  var value = process.env[name];
  if (value === undefined || value === '') return defaultValue;
  value = String(value).toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}
// ==================================================================
// createApp(options)
// ==================================================================
function createApp(options) {
  var app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  var label = options.appLabel || 'app';

  // 可选中间件
  if (options.useIpCheck) {
    app.use(createIpCheckMiddleware());
  }

  // ---------- API 代理 /v0/* ----------
  app.all('/v0/*', async function(req, res) {
    // OPTIONS 预检请求直接放行
    if (req.method === 'OPTIONS') return res.status(204).end();

    var token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: 'No token' });

    var bgmPath = req.path.replace('/v0', '');
    var url = 'https://api.bgm.tv/v0' + bgmPath;

    try {
      var axiosConfig = {
        method: req.method,
        url: url,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
          'User-Agent': 'BGM-DotGrid/1.11'
        },
        params: req.query,
        data: req.body,
        responseType: 'json',
        timeout: 15000
      };
      // DELETE 请求不要 body
      if (req.method === 'DELETE') {
        delete axiosConfig.data;
        delete axiosConfig.params;
      }
      var response = await axios(axiosConfig);
      res.json(response.data);
    } catch (error) {
      var status = (error.response && error.response.status) || 500;
      var data = (error.response && error.response.data) || { error: 'Proxy error' };
      res.status(status).json(data);
    }
  });

  // ---------- 图片代理 /img/*（读取缓存时使用长 TTL 7天）----------
  app.get('/img/*', async function(req, res) {
    var imagePath = req.params[0] || req.url.substring(5);
    if (!imagePath) return res.status(404).send('Not found');

    var bgmImgDomain = process.env.BGM_IMG_DOMAIN || 'lain.bgm.tv';
    var imageUrl = 'https://' + bgmImgDomain + '/' + imagePath;
    var cacheFile = path.join(IMAGE_CACHE_DIR, getImageCacheFileName(imageUrl));

    if (fs.existsSync(cacheFile) && isImageCacheValid(cacheFile, true)) {
      var ext = path.extname(cacheFile);
      res.set('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400, immutable');
      return fs.createReadStream(cacheFile).pipe(res);
    }

    try {
      var imgResp = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream',
        headers: { 'Referer': '', 'User-Agent': 'BGM-DotGrid/1.11' },
        timeout: 15000
      });

      var writeStream = fs.createWriteStream(cacheFile);
          imgResp.data.pipe(writeStream);

          // 先返回给客户端，不等待缓存写完
          res.set('Content-Type', imgResp.headers['content-type']);
          res.set('Cache-Control', 'public, max-age=86400, immutable');
          imgResp.data.pipe(res);

      writeStream.on('finish', function() {
        console.log('[Image Cached] ' + imageUrl);
      });
    } catch (error) {
      console.error('[Image Error] ' + imageUrl + ': ' + error.message);
      if (fs.existsSync(cacheFile)) {
        res.set('Content-Type', 'image/jpeg');
        return fs.createReadStream(cacheFile).pipe(res);
      }
      res.status(502).send('Image not available');
    }
  });

  // ---------- 搜索番剧（走 /v0 代理，需要客户端传 Authorization）----------
  app.get('/api/search', async function(req, res) {
    var q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });
    var token = req.headers.authorization;
    if (!token) return res.status(401).json({ success: false, error: 'No token' });

    try {
      var response = await axios({
        method: 'post',
        url: 'https://api.bgm.tv/v0/search/subjects',
        headers: { 'Authorization': token, 'User-Agent': 'BGM-DotGrid/1.11', 'Content-Type': 'application/json' },
        data: { keyword: q, type: parseInt(req.query.type) || 0, limit: parseInt(req.query.limit) || 20 },
        timeout: 15000
      });
      var data = response.data.data || [];
      var results = data.map(function(item) {
        return {
          id: item.id,
          name: item.name_cn || item.name || '',
          subject_type: item.type || 0,
          cover: (item.images && item.images.medium) || '',
          total: item.eps_count || 0,
          score: item.score || 0,
          summary: (item.summary || '').substring(0, 200),
          air_date: item.date || item.air_date || ''
        };
      });
      res.json({ success: true, data: results });
    } catch (error) {
      var status = (error.response && error.response.status) || '';
      console.error('[Search Error]', error.message);
      res.status(500).json({ success: false, error: (status?'HTTP '+status+': ':'') + (error.message || 'Search failed') });
    }
  });

  // ---------- 清除图片缓存 ----------
  app.post('/api/clear-image-cache', function(req, res) {
    clearImageCache();
    res.json({ success: true, message: 'Image cache cleared' });
  });

  // ---------- 获取本地缓存图片列表 ----------
  app.get('/api/local-images', function(req, res) {
    var files = getCachedImageList();
    res.json({
      success: true,
      count: files.length,
      files: files.map(function(f) { return path.basename(f); })
    });
  });

  // ---------- 健康检查 ----------
  app.get('/api/health', function(req, res) {
    res.json({ status: 'ok', port: label, uptime: process.uptime() });
  });

  // ---------- 放送数据 ----------
  app.get('/api/onair/calendar', async function(req, res) {
    var fullFile = path.join(BGMDATA_CACHE_DIR, 'bangumi-data.json');
    var schFile = path.join(BGMDATA_CACHE_DIR, 'schedule.json');

    // 优先返回 schedule 缓存
    if (isCacheValid(schFile, SCHEDULE_TTL_MS)) {
      var sch = readCacheFile(schFile);
      if (sch && sch.data) {
        return res.json({ success: true, count: sch.data.length, data: sch.data, cache: 'schedule' });
      }
    }

    try {
      var raw = await fetchWithCache(BANGUMI_DATA_URL, fullFile, BANGUMI_FULL_TTL_MS, res);
    } catch (error) {
      var stale = readCacheFile(schFile);
      if (stale && stale.data) {
        return res.json({ success: true, count: stale.data.length, data: stale.data, stale: true });
      }
      console.error('[BangumiData] ' + error.message);
      return res.status(502).json({ success: false, error: 'Schedule not available' });
    }

    var items = raw.items || [];
    var curYear = new Date().getFullYear();
    var manual = loadManualSchedule();
    var results = [];
    var seenIds = {};
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.type !== 'tv' || !item.begin || !item.begin.startsWith(String(curYear))) continue;
      var bgmId = null;
      if (item.sites) {
        for (var s = 0; s < item.sites.length; s++) {
          if (item.sites[s].site === 'bangumi') { bgmId = item.sites[s].id; break; }
        }
      }
      if (!bgmId) continue;
      var d = new Date(item.begin);
      var cst = new Date(d.getTime() + 8 * 3600000);
      var wd = cst.getUTCDay();
      var h = String(cst.getUTCHours()).padStart(2, '0');
      var m = String(cst.getUTCMinutes()).padStart(2, '0');
      var zh = (item.titleTranslate && item.titleTranslate['zh-Hans'] && item.titleTranslate['zh-Hans'][0]) || item.title;
      results.push({ id: Number(bgmId), name: zh, name_original: item.title, weekDayJP: wd, timeJP: h + '' + m, weekDayCN: wd, timeCN: h + ':' + m });
      seenIds[Number(bgmId)] = true;
    }
    for (var mid in manual) {
      var mEntry = manual[mid];
      var nid = Number(mid);
      var found = null;
      for (var ri = 0; ri < results.length; ri++) {
        if (results[ri].id === nid) { found = results[ri]; break; }
      }
      var wd = Number(mEntry.weekDay);
      var tp = String(mEntry.time);
      var tc = tp.length === 4 ? tp.substring(0,2) + ':' + tp.substring(2) : tp;
      if (found) {
        found.weekDayJP = wd; found.weekDayCN = wd;
        found.timeJP = tp; found.timeCN = tc;
        found._manual = true;
      } else {
        results.push({ id: nid, name: mEntry.name || '#' + mid, name_original: '', weekDayJP: wd, timeJP: tp, weekDayCN: wd, timeCN: tc, _manual: true });
      }
    }
    results.sort(function(a, b) { return a.weekDayJP - b.weekDayJP || (a.timeJP || '0000').localeCompare(b.timeJP || '0000'); });

    writeCacheFile(schFile, results);
    res.json({ success: true, count: results.length, data: results, cache: 'full' });
  });

    // ---------- 手动排期 API ----------
  app.get('/api/manual-schedule', function(req, res) {
    res.json({ success: true, data: loadManualSchedule() });
  });
  app.post('/api/manual-schedule', function(req, res) {
    var body = req.body || {};
    if (body.sid === undefined) return res.status(400).json({ success: false, error: 'sid required' });
    var data = loadManualSchedule();
    if (body.clear) {
      delete data[String(body.sid)];
    } else if (body.weekDay !== undefined && body.time !== undefined) {
      data[String(body.sid)] = { weekDay: Number(body.weekDay), time: String(body.time), name: body.name || '' };
    }
    saveManualSchedule(data);
    // 清除 schedule 缓存，下次请求会重新合并
    var schFile = path.join(BGMDATA_CACHE_DIR, 'schedule.json');
    if (fs.existsSync(schFile)) fs.unlinkSync(schFile);
    res.json({ success: true, data: data });
  });

  // 缓存管理端点（仅管理端口启用）
  if (options.enablePrivate) {
    app.get('/api/onair/cache-status', function(req, res) {
      res.json({ success: true, cache: getCacheStats() });
    });

    app.post('/api/onair/refresh', async function(req, res) {
      var schFile = path.join(BGMDATA_CACHE_DIR, 'schedule.json');
      var fullFile = path.join(BGMDATA_CACHE_DIR, 'bangumi-data.json');
      if (req.body.type === 'full') {
        if (fs.existsSync(fullFile)) fs.unlinkSync(fullFile);
      }
      if (fs.existsSync(schFile)) fs.unlinkSync(schFile);
      setDataTimestamp('schedule_refresh');
      res.json({ success: true, message: 'Cache cleared' });
    });

    app.get('/api/cache-status', function(req, res) {
      var stats = getCacheStats();
      var active = wasRecentlyActive(24);
      var lastActive = null;
      try {
        if (fs.existsSync(LAST_ACTIVE_FILE)) {
          var ad = JSON.parse(fs.readFileSync(LAST_ACTIVE_FILE, 'utf8'));
          lastActive = ad.lastActiveAt;
        }
      } catch(e) {}
      res.json({
        success: true,
        imageCache: stats.imageCache,
        calendar: stats.calendar,
        schedule: stats.schedule,
        dataTimestamp: stats.dataTimestamp,
        lastActive: lastActive,
        active: active
      });
    });

    // 数据时间戳
    app.get('/api/data-timestamp', function(req, res) {
      res.json({ success: true, data: getDataTimestamp() });
    });

    // 用户收藏缓存状态
    app.get('/api/user-collection-status', function(req, res) {
      var auth = req.headers.authorization;
      if (!auth) return res.json({ success: false, error: 'No auth' });
      var valid = isCollectionCacheValid(auth);
      var ts = getCachedCollectionTimestamp(auth);
      var count = 0;
      var cached = getCachedCollections(auth);
      if (cached && cached.data) count = cached.data.length;
      res.json({ success: true, cached: valid, timestamp: ts, count: count });
    });
  }

  // ---------- 前端页面 ----------
  if (options.serveFrontend) {
    app.get('/', function(req, res) {
      var htmlPath = path.join(__dirname, 'public', 'index.html');
      if (!fs.existsSync(htmlPath)) return res.status(500).send('index.html not found');
      var html = fs.readFileSync(htmlPath, 'utf8');

      var envScript = '<script>window.__ENV__ = {\n' +
        '  BGM_SITE: ' + JSON.stringify(process.env.BGM_SITE || 'https://bgm.tv') + ',\n' +
        '  API_BASE: ' + JSON.stringify(process.env.API_BASE || 'https://api.bgm.tv/v0') + ',\n' +
        '  IMAGE_PROXY_PREFIX: ' + JSON.stringify(process.env.IMAGE_PROXY_PREFIX || '/img/') + ',\n' +
        '  INBUILT_TOKEN: ' + JSON.stringify(process.env.INBUILT_TOKEN || '') + '\n' +
        '};</script>';

      if (html.indexOf('<!-- INJECT_ENV -->') > -1) {
        html = html.replace('<!-- INJECT_ENV -->', envScript);
      } else {
        html = html.replace('</head>', envScript + '</head>');
      }

      res.send(html);
    });

    // 记录活跃（任何访问前端页面的请求）
    app.use(function(req, res, next) {
      if (req.path === '/' || req.path.indexOf('.html') > -1 || req.path.indexOf('.js') > -1) {
        recordActive();
      }
      next();
    });

    app.use(express.static(path.join(__dirname, 'public')));

    app.get('*', function(req, res) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  return app;
}

// ==================================================================
// 后端自动刷新定时任务（每30分钟检查）
// ==================================================================
function startAutoRefreshTask() {
  setInterval(async function() {
    if (!wasRecentlyActive(24)) {
      console.log('[AutoRefresh] No recent activity, skip');
      return;
    }
    console.log('[AutoRefresh] Recent activity detected, refreshing...');
    try {
      // 刷新 schedule.json
      var schFile = path.join(BGMDATA_CACHE_DIR, 'schedule.json');
      if (fs.existsSync(schFile)) fs.unlinkSync(schFile);
      setDataTimestamp('auto_refresh');
      console.log('[AutoRefresh] Schedule cache cleared');
    } catch(e) {
      console.error('[AutoRefresh] Error:', e.message);
    }
  }, 30 * 60 * 1000); // 30 分钟
}

// ==================================================================
// 启动
// ==================================================================

// 公开端口 3000
var publicApp = createApp({
  serveFrontend: true,
  enablePrivate: false,
  useIpCheck: envFlag('CHECK_PUBLIC_IP', false),
  appLabel: 'public:3000'
});
publicApp.listen(3000, '0.0.0.0', function() {
  console.log('[Public]  http://0.0.0.0:3000  (frontend + API proxy + onair, no IP filter)');
});

// 私有端口 3001 — 缓存管理 + 自动刷新
var privateApp = createApp({
  serveFrontend: true,
  enablePrivate: true,
  useIpCheck: envFlag('CHECK_PRIVATE_IP', true),
  appLabel: 'private:3001'
});
privateApp.listen(3001, '0.0.0.0', function() {
  console.log('[Private] http://0.0.0.0:3001  (frontend + API proxy + onair + cache mgmt)');
});

// API代理端口 3002
var proxyApp = createApp({
  serveFrontend: false,
  enablePrivate: false,
  useIpCheck: envFlag('CHECK_PROXY_IP', true),
  appLabel: 'proxy:3002'
});
proxyApp.listen(3002, '0.0.0.0', function() {
  console.log('[Proxy]   http://0.0.0.0:3002  (API proxy + onair, IP filter)');
});

console.log('BGM点格子 v1.12.1');
console.log('  Image cache: ' + IMAGE_CACHE_DIR + ' (TTL: 4h)');
console.log('  Data cache: ' + BGMDATA_CACHE_DIR);
console.log('  User cache: ' + USER_CACHE_DIR + ' (TTL: 7d)');
if (process.env.ALLOWED_IPS) {
  console.log('  IP whitelist: ' + process.env.ALLOWED_IPS);
  console.log('  IP check public/private/proxy: ' + envFlag('CHECK_PUBLIC_IP', false) + '/' + envFlag('CHECK_PRIVATE_IP', true) + '/' + envFlag('CHECK_PROXY_IP', true));
}

// 启动自动刷新任务
startAutoRefreshTask();
console.log('[AutoRefresh] Task started (interval: 30min)');

// 启动收藏拉取任务
startCollectionPullTask();
console.log('[CollectionPull] Task started (interval: 30min)');
