const CACHE_NAME = 'voice-recorder-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/recorder.js',
  './js/storage.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Service Worker 설치
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 즉시 클라이언트 제어
  self.clients.claim();
});

// Fetch 이벤트 처리 (오프라인 지원)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }

        // 네트워크 요청 복제
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // 유효하지 않은 응답 체크
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답 복제하여 캐시에 저장
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              // GET 요청만 캐시
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(error => {
          console.error('Fetch failed:', error);
          // 오프라인 폴백 페이지 (선택사항)
          return caches.match('./offline.html');
        });
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

// 푸시 알림 (선택사항)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Voice Recorder', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});

// 녹음 동기화 함수 (구현 예정)
async function syncRecordings() {
  // IndexedDB에서 동기화되지 않은 녹음 가져오기
  // 서버로 업로드 (서버가 있는 경우)
  console.log('Syncing recordings...');
}