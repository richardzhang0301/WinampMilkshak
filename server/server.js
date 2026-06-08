#!/usr/bin/env node
/*
 * Milkshake static file server (local dev). Zero deps.
 * Usage:  node server/server.js   (PORT env var to change port; default 8080)
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = parseInt(process.env.PORT, 10) || 8080;
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.wav':  'audio/wav',
  '.mp3':  'audio/mpeg',
  '.ogg':  'audio/ogg',
  '.oga':  'audio/ogg',
  '.flac': 'audio/flac',
  '.m4a':  'audio/mp4',
  '.aac':  'audio/aac',
  '.opus': 'audio/opus',
  '.txt':  'text/plain; charset=utf-8',
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({ 'Cache-Control': 'no-cache' }, headers || {}));
  res.end(body);
}

function serveRange(req, res, resolved, stat, type) {
  const size = stat.size;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (!m) return false;
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end   = m[2] ? parseInt(m[2], 10) : size - 1;
  if (isNaN(end) || end >= size) end = size - 1;
  if (start > end || start < 0) { start = 0; end = size - 1; }
  console.log('[206] ' + req.method + ' ' + req.url + ' bytes=' + start + '-' + end + '/' + size);
  res.writeHead(206, {
    'Content-Type': type,
    'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
    'Accept-Ranges': 'bytes',
    'Content-Length': end - start + 1,
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(resolved, { start: start, end: end }).pipe(res);
  return true;
}

const server = http.createServer(function (req, res) {
  const parsed = url.parse(req.url);
  let pathname = decodeURIComponent(parsed.pathname || '/');
  if (pathname === '/' || pathname === '') pathname = '/butterchurn.html';

  const resolved = path.resolve(ROOT, '.' + pathname);
  if (!resolved.startsWith(ROOT)) return send(res, 403, 'Forbidden');

  fs.stat(resolved, function (err, stat) {
    if (err || !stat.isFile()) {
      console.log('[404] ' + req.method + ' ' + req.url);
      return send(res, 404, 'Not found: ' + pathname, { 'Content-Type': 'text/plain' });
    }
    const ext  = path.extname(resolved).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    if (req.headers.range && serveRange(req, res, resolved, stat, type)) return;
    console.log('[200] ' + req.method + ' ' + req.url);
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(resolved).pipe(res);
  });
});

server.listen(PORT, function () {
  console.log('Milkshake dev server:');
  console.log('  Root: ' + ROOT);
  console.log('  URL:  http://localhost:' + PORT + '/   (serves butterchurn.html)');
});
