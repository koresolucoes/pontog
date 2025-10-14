// public/service-worker.js

const CACHE_NAME = 'ponto-g-cache-v3'; // A versão do cache permanece a mesma por enquanto.

// Evento de instalação: simplificado para ser mais robusto.
// A etapa de pré-cache foi removida pois o evento 'fetch' já cuida do cache sob demanda.
// Se a instalação falhar, as notificações e o PWA não funcionam. Esta é a correção principal.
self.addEventListener('install', event => {
  self.skipWaiting(); // Força o novo Service Worker a se tornar ativo imediatamente.
});

// Evento de fetch: serve conteúdo do cache quando offline.
self.addEventListener('fetch', event => {
  // Ignora requisições que não sejam GET (ex: POST para a API)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso já está no cache, retorna ele.
        if (response) {
          return response;
        }

        // Se não está no cache, busca na rede.
        return fetch(event.request).then(
          networkResponse => {
            // Se a resposta da rede for inválida, apenas retorna ela.
            if(!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clona a resposta para poder colocar no cache e retornar ao navegador.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                // Não armazena em cache as chamadas de API para evitar dados obsoletos.
                if (!event.request.url.includes('/api/')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
            console.log('Falha no fetch; retornando página offline se disponível no cache.', error);
            // Em um app real, você poderia retornar uma página de fallback de offline aqui.
            // Ex: return caches.match('/offline.html');
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
    icon: 'https://placehold.co/192x192/db2777/FFFFFF/png?text=G&font=sans', // Usando o ícone de placeholder
    badge: 'https://placehold.co/192x192/db2777/FFFFFF/png?text=G&font=sans'
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