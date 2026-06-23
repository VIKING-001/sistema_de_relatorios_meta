import { useState, useEffect, useCallback } from "react";
import { trpc } from "./trpc";

type Permission = "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<Permission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const publicKeyQuery = trpc.notifications.getPublicKey.useQuery(undefined, {
    staleTime: Infinity,
  });
  const subscribeMut = trpc.notifications.subscribe.useMutation();
  const unsubscribeMut = trpc.notifications.unsubscribe.useMutation();

  const vapidPublicKey =
    publicKeyQuery.data?.vapidPublicKey ||
    (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ||
    "";

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as Permission);
      // Verifica se já existe subscription ativa
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub);
        })
      );
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !vapidPublicKey) return false;
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as Permission);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      await subscribeMut.mutateAsync({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[Push] Falha ao ativar notificações:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey, subscribeMut]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeMut.mutateAsync({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("[Push] Falha ao desativar notificações:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, unsubscribeMut]);

  return { isSupported, permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
