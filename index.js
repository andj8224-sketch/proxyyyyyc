const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');

const server = http.createServer((req, res) => {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 主页
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('./index.html', 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (e) {
      res.writeHead(500);
      res.end('文件不存在');
    }
    return;
  }

  // API 代理
  if (req.url.startsWith('/api/proxy')) {
    const queryUrl = url.parse(req.url, true);
    const targetUrl = queryUrl.query.url;

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: '缺少 URL 参数' }));
      return;
    }

    try {
      new URL(targetUrl);
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: '无效的 URL' }));
      return;
    }

    const protocol = targetUrl.startsWith('https') ? https : http;
    let requestCompleted = false;

    const options = {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const proxyReq = protocol.get(targetUrl, options, (response) => {
      let data = '';
      let dataSize = 0;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      response.on('data', (chunk) => {
        dataSize += chunk.length;
        if (dataSize > maxSize) {
          data += chunk.toString().substring(0, maxSize - data.length);
          response.destroy();
        } else {
          data += chunk;
        }
      });

      response.on('end', () => {
        if (requestCompleted) return;
        requestCompleted = true;

        try {
          const contentType = response.headers['content-type'] || '';
          let result = data;

          // 尝试解析 JSON
          if (contentType.includes('application/json')) {
            try {
              result = JSON.parse(data);
            } catch (e) {
              result = data;
            }
          } else {
            // HTML - 移除广告和脚本
            result = removeAds(data);
          }

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            statusCode: response.statusCode,
            contentType: contentType,
            data: result
          }));
        } catch (e) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: true,
            statusCode: response.statusCode,
            data: data
          }));
        }
      });

      response.on('error', (error) => {
        if (requestCompleted) return;
        requestCompleted = true;
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      });
    });

    proxyReq.on('error', (error) => {
      if (requestCompleted) return;
      requestCompleted = true;
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
    });

    proxyReq.on('timeout', () => {
      if (requestCompleted) return;
      requestCompleted = true;
      proxyReq.destroy();
      res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: '请求超时'
      }));
    });

    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function removeAds(html) {
  if (typeof html !== 'string') return html;
  
  // 移除脚本
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  // 移除 iframe
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  // 移除 Google Adsense
  html = html.replace(/<ins[^>]*>[\s\S]*?<\/ins>/gi, '');
  // 移除注释
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  
  return html;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
