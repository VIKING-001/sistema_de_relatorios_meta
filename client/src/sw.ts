import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  try {
    const data = event.data.json() as {
      title: string;
      body: string;
      url?: string;
      icon?: string;
    };
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon ?? "/icon.svg",
        badge: "/icon.svg",
        data: { url: data.url ?? "/" },
      })
    );
  } catch {
    event.waitUntil(
      self.registration.showNotification("Meta Reports", {
        body: event.data.text(),
        icon: "/icon.svg",
        data: { url: "/" },
      })
    );
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";
  event.waitUntil(
    (self.clients as any)
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: WindowClient[]) => {
        const existing = clientList.find((c) => c.url.includes(self.location.origin) && "focus" in c);
        if (existing) {
          existing.navigate(url);
          return existing.focus();
        }
        return (self.clients as any).openWindow(url);
      })
  );
});
