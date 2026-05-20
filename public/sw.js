self.addEventListener("push", (event) => {
  const fallback = {
    title: "FotoFlow Manager",
    body: "Imaš nove opomnike v aplikaciji.",
    url: "/projects"
  };

  const data = event.data ? event.data.json() : fallback;
  const title = data.title || fallback.title;
  const options = {
    body: data.body || fallback.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: {
      url: data.url || fallback.url
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/projects";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existingClient = clientList.find((client) =>
          client.url.includes(self.location.origin)
        );

        if (existingClient) {
          existingClient.focus();
          return existingClient.navigate(url);
        }

        return clients.openWindow(url);
      })
  );
});
