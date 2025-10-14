// public/service-worker.js

const CACHE_NAME = 'ponto-g-cache-v3'; // Versão incrementada para forçar a atualização
// FIX: Removido os ícones da lista de pré-cache.
// Se os ícones não forem encontrados, a instalação do Service Worker falha,
// fazendo com que `navigator.serviceWorker.ready` nunca resolva, o que causa o
// estado de carregamento infinito ao tentar se inscrever para notificações.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Evento de instalação: força a ativação do novo SW.
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo Service Worker a se tornar ativo imediatamente.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto e ativos principais sendo cacheados');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de fetch: serve conteúdo do cache quando offline.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                if (!event.request.url.includes('/api/')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
            console.log('Falha no fetch; retornando página offline.', error);
        });
      })
  );
});

// Evento de ativação: limpa caches antigos e assume o controle.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Garante que o SW atualizado controle a página imediatamente.
  );
});

// Evento de push: manipula as mensagens push recebidas.
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Evento de clique na notificação: foca na janela do app ou abre uma nova.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
