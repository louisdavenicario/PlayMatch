// sw.js

self.addEventListener('push', (event) => {
  let data = {
    title: 'PlayMatch Notification',
    message: 'You have a new notification',
    url: '/',
  }

  // Safely parse push payload
  if (event.data) {
    try {
      const json = event.data.json()
      data.title = json.title || data.title
      data.message = json.message || data.message
      data.url = json.url || data.url
    } catch {
      try {
        data.message = event.data.text()
      } catch {
        // fallback already set
      }
    }
  }

  const options = {
    body: data.message,
    icon: '/icons/icon-192x192.png', // path to your app icon
    badge: '/icons/icon-72x72.png', // small badge icon
    requireInteraction: true, // stay until user interacts
    vibrate: [200, 100, 200], // vibration pattern
    data: { url: data.url }, // pass URL for click
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      // Focus existing tab if URL matches
      for (let client of clientsList) {
        if (client.url.includes(event.notification.data.url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Open a new tab if none found
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    }),
  )
})
