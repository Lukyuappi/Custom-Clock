// sw.js
const CACHE_NAME = 'clock-app-v1';

// キャッシュするファイルのリスト
const ASSETS_TO_CACHE = [
  './',
  './clock.html',
  './clock.css',
  './clock.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 使用する画像をここに追加
  './clock2.png',
  './clock3.png'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 有効化時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ネットワークリクエスト時にキャッシュから応答（オフライン対応）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // キャッシュがあればそれを返し、なければネットワークから取得
      return cachedResponse || fetch(event.request);
    })
  );
});