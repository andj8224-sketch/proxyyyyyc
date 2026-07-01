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
      const errorMsg = JSON.stringify({ success: false, error: '缺少 URL 参数' });
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(errorMsg) });
      res.end(errorMsg);
      return;
    }

    try {
      new URL(targetUrl);
    } catch (e) {
      const errorMsg = JSON.stringify({ success: false, error: '无效的 URL' });
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(errorMsg) });
      res.end(errorMsg);
      return;
    }

    const protocol = targetUrl.startsWith('https') ? https : http;
    let responseSent = false;

    const options = {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    const proxyReq = protocol.get(targetUrl, options, (response) => {
      let data = '';
      let dataSize = 0;
      const maxSize = 2 * 1024 * 1024; // 2MB limit

      response.on('data', (chunk) => {
        if (!responseSent) {
          dataSize += chunk.length;
          if (dataSize > maxSize) {
            data += chunk.toString().substring(0, maxSize - data.length);
            response.destroy();
          } else {
            data += chunk;
          }
        }
      });

      response.on('end', () => {
        if (responseSent) return;
        responseSent = true;

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
          } else if (contentType.includes('text/html')) {
            // HTML - 移除广告和脚本
            result = removeAds(data);
          }

          const responseMsg = JSON.stringify({
            success: true,
            statusCode: response.statusCode,
            contentType: contentType,
            data: result
          });

          res.writeHead(200, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(responseMsg)
          });
          res.end(responseMsg);
        } catch (e) {
          const errorMsg = JSON.stringify({
            success: false,
            error: '处理响应失败: ' + e.message,
            data: data.substring(0, 500)
          });
          res.writeHead(500, { 
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(errorMsg)
          });
          res.end(errorMsg);
        }
      });

      response.on('error', (error) => {
        if (responseSent) return;
        responseSent = true;
        const errorMsg = JSON.stringify({
          success: false,
          error: '响应错误: ' + error.message
        });
        res.writeHead(500, { 
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(errorMsg)
        });
        res.end(errorMsg);
      });
    });

    proxyReq.on('error', (error) => {
      if (responseSent) return;
      responseSent = true;
      const errorMsg = JSON.stringify({
        success: false,
        error: '请求错误: ' + error.message
      });
      res.writeHead(500, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(errorMsg)
      });
      res.end(errorMsg);
    });

    proxyReq.on('timeout', () => {
      if (responseSent) return;
      responseSent = true;
      proxyReq.destroy();
      const errorMsg = JSON.stringify({
        success: false,
        error: '请求超时（15秒）'
      });
      res.writeHead(504, { 
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(errorMsg)
      });
      res.end(errorMsg);
    });

    return;
  }

  const notFoundMsg = '404 Not Found';
  res.writeHead(404, { 'Content-Length': Buffer.byteLength(notFoundMsg) });
  res.end(notFoundMsg);
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
