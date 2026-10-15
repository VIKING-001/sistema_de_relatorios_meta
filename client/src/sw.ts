import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

type ExtendableWorkerEvent = { waitUntil(promise: Promise<unknown>): void };
type IncomingPushEvent = ExtendableWorkerEvent & {
  data: { json(): unknown; text(): string } | null;
};
type ClickNotificationEvent = ExtendableWorkerEvent & {
  notification: { data?: { url?: string }; close(): void };
};
type WorkerClient = {
  url: string;
  navigate(url: string): Promise<unknown>;
  focus(): Promise<unknown>;
};
type WorkerScope = {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  addEventListener(
    type: "install" | "activate",
    listener: (event: ExtendableWorkerEvent) => void,
  ): void;
  addEventListener(type: "push", listener: (event: IncomingPushEvent) => void): void;
  addEventListener(type: "notificationclick", listener: (event: ClickNotificationEvent) => void): void;
  skipWaiting(): Promise<void>;
  clients: {
    claim(): Promise<void>;
    matchAll(options: { type: "window"; includeUncontrolled: boolean }): Promise<WorkerClient[]>;
    openWindow(url: string): Promise<WorkerClient | null>;
  };
  registration: {
    showNotification(title: string, options: NotificationOptions): Promise<void>;
  };
  location: Location;
};

declare const self: WorkerScope;

// New releases replace the current worker immediately so open app tabs can refresh.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
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

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url ?? "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find((c) => c.url.includes(self.location.origin) && "focus" in c);
        if (existing) {
          existing.navigate(url);
          return existing.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});
