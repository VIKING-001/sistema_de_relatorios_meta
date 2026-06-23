// Carregamento e inicialização do Facebook JS SDK para o Meta Embedded Signup
// (conexão "1 clique" do WhatsApp, igual ao Tintim). Carrega sob demanda para
// não pesar o boot do app e não poluir o index.html.

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const META_APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined;
export const WHATSAPP_CONFIG_ID = import.meta.env.VITE_WHATSAPP_CONFIG_ID as string | undefined;
const GRAPH_VERSION = "v21.0";

let loadPromise: Promise<any> | null = null;

/** Carrega o SDK do Facebook uma única vez e resolve com window.FB já inicializado. */
export function loadFacebookSdk(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.FB) return Promise.resolve(window.FB);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!META_APP_ID) {
      reject(new Error("VITE_META_APP_ID não configurado no build."));
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: META_APP_ID,
        autoLogAppEvents: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve(window.FB);
    };

    const id = "facebook-jssdk";
    if (document.getElementById(id)) return;
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    js.crossOrigin = "anonymous";
    js.onerror = () => reject(new Error("Falha ao carregar o SDK do Facebook."));
    document.body.appendChild(js);
  });

  return loadPromise;
}

export interface EmbeddedSignupResult {
  code: string;
  phoneNumberId?: string;
  wabaId?: string;
}

/**
 * Abre o popup nativo do Meta Embedded Signup e resolve com o `code` (do
 * FB.login) + `phone_number_id`/`waba_id` (do evento WA_EMBEDDED_SIGNUP).
 */
export async function launchWhatsappEmbeddedSignup(): Promise<EmbeddedSignupResult> {
  const FB = await loadFacebookSdk();
  if (!WHATSAPP_CONFIG_ID) {
    throw new Error("VITE_WHATSAPP_CONFIG_ID não configurado no build.");
  }

  return new Promise((resolve, reject) => {
    let phoneNumberId: string | undefined;
    let wabaId: string | undefined;

    // O Embedded Signup envia os IDs por postMessage (evento WA_EMBEDDED_SIGNUP)
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH" || data.event === "FINISH_ONLY_WABA") {
            phoneNumberId = data.data?.phone_number_id ?? phoneNumberId;
            wabaId = data.data?.waba_id ?? wabaId;
          } else if (data.event === "CANCEL") {
            cleanup();
            reject(new Error("Conexão cancelada."));
          }
        }
      } catch {
        /* mensagens não-JSON do Facebook são ignoradas */
      }
    };

    const cleanup = () => window.removeEventListener("message", onMessage);
    window.addEventListener("message", onMessage);

    FB.login(
      (response: any) => {
        cleanup();
        const code = response?.authResponse?.code;
        if (code) {
          resolve({ code, phoneNumberId, wabaId });
        } else {
          reject(new Error("Autorização não concluída."));
        }
      },
      {
        config_id: WHATSAPP_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { sessionInfoVersion: "3" },
      }
    );
  });
}
