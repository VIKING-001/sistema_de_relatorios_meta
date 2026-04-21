/**
 * Lista centralizada de plataformas de webhook e API
 * Organizadas por categoria com emojis e metadata
 */

export interface Platform {
  id: string;
  name: string;
  icon: string;
  category: "ecommerce" | "infoproduto" | "pagamento" | "marketplace" | "automacao" | "principal";
}

export const WEBHOOK_PLATFORMS: Platform[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // 🎯 PLATAFORMAS PRINCIPAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "shopify", name: "Shopify", icon: "🛍️", category: "principal" },
  { id: "woocommerce", name: "WooCommerce", icon: "🔧", category: "principal" },
  { id: "custom", name: "Webhook Genérico", icon: "⚙️", category: "principal" },
  { id: "zapier", name: "Zapier", icon: "⚡", category: "automacao" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 📚 PLATAFORMAS DE INFOPRODUTO & CURSOS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "hotmart", name: "Hotmart", icon: "🔥", category: "infoproduto" },
  { id: "kiwify", name: "Kiwify", icon: "🥝", category: "infoproduto" },
  { id: "eduzz", name: "Eduzz", icon: "📚", category: "infoproduto" },
  { id: "braip", name: "Braip", icon: "🧠", category: "infoproduto" },
  { id: "monetizze", name: "Monetizze", icon: "💰", category: "infoproduto" },
  { id: "hubla", name: "Hubla", icon: "🌐", category: "infoproduto" },
  { id: "clickbank", name: "Clickbank", icon: "💸", category: "infoproduto" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏪 E-COMMERCE & VENDAS DIGITAIS
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "cartpanda", name: "CartPanda", icon: "🐼", category: "ecommerce" },
  { id: "vega1", name: "Vega 1", icon: "✨", category: "ecommerce" },
  { id: "kirvano", name: "Kirvano", icon: "🎯", category: "ecommerce" },
  { id: "perfectpay", name: "PerfectPay", icon: "✅", category: "ecommerce" },
  { id: "yampi", name: "Yampi", icon: "🎨", category: "ecommerce" },
  { id: "lastlink", name: "Lastlink", icon: "🔗", category: "ecommerce" },
  { id: "payt", name: "Payt", icon: "💳", category: "ecommerce" },
  { id: "logzz", name: "Logzz", icon: "📊", category: "ecommerce" },
  { id: "adoorel", name: "Adoorel", icon: "🎁", category: "ecommerce" },
  { id: "tribopay", name: "TriboPay", icon: "🔔", category: "ecommerce" },
  { id: "ticto", name: "Ticto", icon: "⏱️", category: "ecommerce" },
  { id: "pepper", name: "Pepper", icon: "🌶️", category: "ecommerce" },
  { id: "buygoods", name: "BuyGoods", icon: "🛒", category: "ecommerce" },
  { id: "mundpay", name: "MundPay", icon: "🌎", category: "ecommerce" },
  { id: "disrupty", name: "Disrupty", icon: "💥", category: "ecommerce" },
  { id: "greenn", name: "Greenn", icon: "💚", category: "ecommerce" },
  { id: "guru", name: "Guru", icon: "🧘", category: "ecommerce" },
  { id: "digistore", name: "Digistore24", icon: "🏪", category: "ecommerce" },
  { id: "doppus", name: "Doppus", icon: "🚀", category: "ecommerce" },
  { id: "frendz", name: "Frendz", icon: "👥", category: "ecommerce" },
  { id: "invictuspay", name: "InvictusPay", icon: "🎖️", category: "ecommerce" },
  { id: "appmax", name: "Appmax", icon: "📱", category: "ecommerce" },
  { id: "nitropagamentos", name: "Nitro Pagamentos", icon: "💨", category: "ecommerce" },
  { id: "goatpay", name: "GoatPay", icon: "🐐", category: "ecommerce" },
  { id: "nuvemshop", name: "Nuvem Shop", icon: "☁️", category: "ecommerce" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💳 GATEWAYS DE PAGAMENTO (100+)
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "facilzap", name: "FácilZap", icon: "⚡", category: "pagamento" },
  { id: "mercadopago", name: "Mercado Pago", icon: "💛", category: "pagamento" },
  { id: "pagseguro", name: "PagSeguro", icon: "🔐", category: "pagamento" },
  { id: "stripe", name: "Stripe", icon: "💎", category: "pagamento" },
  { id: "paypal", name: "PayPal", icon: "🅿️", category: "pagamento" },
  { id: "cielo", name: "Cielo", icon: "🏦", category: "pagamento" },
  { id: "rede", name: "Rede", icon: "🔗", category: "pagamento" },
  { id: "stone", name: "Stone", icon: "🪨", category: "pagamento" },
  { id: "getnet", name: "GetNet", icon: "📡", category: "pagamento" },
  { id: "vindi", name: "Vindi", icon: "💍", category: "pagamento" },
  { id: "todo", name: "Todo", icon: "☑️", category: "pagamento" },

  // Mais gateways
  { id: "hebreus", name: "Hebreus", icon: "🔷", category: "pagamento" },
  { id: "iexperience", name: "iExperience", icon: "🎯", category: "pagamento" },
  { id: "pagtrust", name: "Pagtrust", icon: "🛡️", category: "pagamento" },
  { id: "fortpay", name: "Fortpay", icon: "🏰", category: "pagamento" },
  { id: "systeme", name: "Systeme", icon: "⚙️", category: "pagamento" },
  { id: "ironpay", name: "IronPay", icon: "⚒️", category: "pagamento" },
  { id: "clinqpay", name: "ClinqPay", icon: "🏥", category: "pagamento" },
  { id: "sharkpays", name: "SharkPays", icon: "🦈", category: "pagamento" },
  { id: "maxweb", name: "MaxWeb", icon: "🌐", category: "pagamento" },
  { id: "zoutl", name: "Zoutl", icon: "⭐", category: "pagamento" },
  { id: "pantherfy", name: "Pantherfy", icon: "🐆", category: "pagamento" },
  { id: "strivpay", name: "StrivPay", icon: "💪", category: "pagamento" },
  { id: "atomopay", name: "AtomoPay", icon: "⚛️", category: "pagamento" },
  { id: "allpay", name: "AllPay", icon: "💳", category: "pagamento" },
  { id: "bullpay", name: "BullPay", icon: "🐂", category: "pagamento" },
  { id: "octuspay", name: "OctusPay", icon: "🐙", category: "pagamento" },
  { id: "zippify", name: "Zippify", icon: "⚡", category: "pagamento" },
  { id: "masterfy", name: "Masterfy", icon: "👑", category: "pagamento" },
  { id: "inovapag", name: "InovaPag", icon: "🔬", category: "pagamento" },
  { id: "soutpay", name: "SoutPay", icon: "🎖️", category: "pagamento" },
  { id: "wolfpay", name: "WolfPay", icon: "🐺", category: "pagamento" },
  { id: "sigmapagamentos", name: "Sigma Pagamentos", icon: "∑", category: "pagamento" },
  { id: "nexopavt", name: "Nexo Pavt", icon: "🌉", category: "pagamento" },
  { id: "wegate", name: "WeGate", icon: "🎪", category: "pagamento" },
  { id: "unicornify", name: "Unicornify", icon: "🦄", category: "pagamento" },
  { id: "alipes", name: "Alipes", icon: "✈️", category: "pagamento" },
  { id: "vittapay", name: "VittaPay", icon: "🍇", category: "pagamento" },
  { id: "fluxionpay", name: "FluxionPay", icon: "🌊", category: "pagamento" },
  { id: "pmhmpay", name: "PmhmPay", icon: "🎵", category: "pagamento" },
  { id: "trivexpay", name: "TrivexPay", icon: "🔷", category: "pagamento" },
  { id: "gatpay", name: "GatPay", icon: "🚪", category: "pagamento" },
  { id: "bearpay", name: "BearPay", icon: "🐻", category: "pagamento" },
  { id: "digipag", name: "DigiPag", icon: "💻", category: "pagamento" },
  { id: "alphapay", name: "AlphaPay", icon: "🅰️", category: "pagamento" },
  { id: "assetpay", name: "AssetPay", icon: "💰", category: "pagamento" },
  { id: "brgateway", name: "BR Gateway", icon: "🇧🇷", category: "pagamento" },
  { id: "creedx", name: "CreedX", icon: "✝️", category: "pagamento" },
  { id: "hotfy", name: "Hotfy", icon: "🌶️", category: "pagamento" },
  { id: "klivopay", name: "KlivoPay", icon: "🎬", category: "pagamento" },
  { id: "plumify", name: "Plumify", icon: "🪶", category: "pagamento" },
  { id: "primegate", name: "PrimeGate", icon: "👑", category: "pagamento" },
  { id: "wise2pay", name: "Wise2Pay", icon: "🧠", category: "pagamento" },
  { id: "visionpay", name: "VisionPay", icon: "👁️", category: "pagamento" },
  { id: "sharkbytepay", name: "SharkBytePay", icon: "🦈", category: "pagamento" },
  { id: "sigmapay", name: "SigmaPay", icon: "🔺", category: "pagamento" },
  { id: "zeroeonepay", name: "ZeroEone Pay", icon: "0️⃣", category: "pagamento" },
  { id: "traxon", name: "Traxon", icon: "🛣️", category: "pagamento" },
  { id: "bloo", name: "Bloo", icon: "💙", category: "pagamento" },
  { id: "kitepay", name: "KitePay", icon: "🪁", category: "pagamento" },
  { id: "b4you", name: "B4You", icon: "4️⃣", category: "pagamento" },
  { id: "risepay", name: "RisePay", icon: "📈", category: "pagamento" },
  { id: "urus", name: "Urus", icon: "🦙", category: "pagamento" },
  { id: "cakto", name: "Cakto", icon: "🎂", category: "pagamento" },
  { id: "flashpay", name: "FlashPay", icon: "⚡", category: "pagamento" },
  { id: "digitalmart", name: "DigitalMart", icon: "🏬", category: "pagamento" },
  { id: "exattus", name: "Exattus", icon: "📐", category: "pagamento" },
  { id: "lunarcash", name: "LunarCash", icon: "🌙", category: "pagamento" },
  { id: "youshop", name: "YouShop", icon: "🛍️", category: "pagamento" },
  { id: "blackpay", name: "BlackPay", icon: "🖤", category: "pagamento" },
  { id: "venuzpay", name: "VenuzPay", icon: "♀️", category: "pagamento" },
  { id: "lunacheckout", name: "LunaCheckout", icon: "🌙", category: "pagamento" },
  { id: "fullsale", name: "FullSale", icon: "💯", category: "pagamento" },
  { id: "bullspay", name: "BullsPay", icon: "🐂", category: "pagamento" },
  { id: "moodl", name: "Moodl", icon: "🎓", category: "pagamento" },
  { id: "nikpay", name: "NikPay", icon: "✓", category: "pagamento" },
  { id: "ghostspay", name: "GhostsPay", icon: "👻", category: "pagamento" },
  { id: "keedpay", name: "KeedPay", icon: "🌾", category: "pagamento" },
  { id: "salduu", name: "Salduu", icon: "💳", category: "pagamento" },
  { id: "viperpay", name: "ViperPay", icon: "🐍", category: "pagamento" },
  { id: "sunize", name: "Sunize", icon: "☀️", category: "pagamento" },
  { id: "assiny", name: "Assiny", icon: "✍️", category: "pagamento" },
  { id: "wiapy", name: "Wiapy", icon: "💫", category: "pagamento" },
  { id: "unicopaq", name: "Unicopaq", icon: "📦", category: "pagamento" },
  { id: "imperialpay", name: "ImperialPay", icon: "👑", category: "pagamento" },
  { id: "zedy", name: "Zedy", icon: "⚡", category: "pagamento" },
  { id: "sinlx", name: "SinLx", icon: "〰️", category: "pagamento" },
  { id: "voomp", name: "Voomp", icon: "🎸", category: "pagamento" },
  { id: "ombrelone", name: "Ombrelone", icon: "☂️", category: "pagamento" },
  { id: "pushinpay", name: "PushinPay", icon: "📤", category: "pagamento" },
  { id: "genesys", name: "Genesys", icon: "🧬", category: "pagamento" },
  { id: "onprofit", name: "OnProfit", icon: "📊", category: "pagamento" },
  { id: "sacapay", name: "SacaPay", icon: "💸", category: "pagamento" },
  { id: "cloudfy", name: "Cloudfy", icon: "☁️", category: "pagamento" },
  { id: "kuenha", name: "Kuenha", icon: "🔑", category: "pagamento" },
  { id: "ninjapay", name: "NinjaPay", icon: "🥷", category: "pagamento" },
  { id: "xgrow", name: "XGrow", icon: "📈", category: "pagamento" },
  { id: "ggcheckout", name: "GG Checkout", icon: "🎮", category: "pagamento" },
  { id: "panteracheckout", name: "PanteraCheckout", icon: "🐆", category: "pagamento" },
  { id: "nublapay", name: "NublaPay", icon: "☁️", category: "pagamento" },
  { id: "cartly", name: "Cartly", icon: "🛒", category: "pagamento" },
  { id: "pagah", name: "Pagah", icon: "📱", category: "pagamento" },
  { id: "pagsafe", name: "PagSafe", icon: "🔒", category: "pagamento" },
  { id: "nomadfy", name: "Nomadfy", icon: "🏕️", category: "pagamento" },
  { id: "sync", name: "Sync", icon: "🔄", category: "pagamento" },
  { id: "lpov", name: "LPov", icon: "👀", category: "pagamento" },
  { id: "auryon369", name: "Auryon369", icon: "🌟", category: "pagamento" },
  { id: "paradise", name: "Paradise", icon: "🏝️", category: "pagamento" },
  { id: "firepay", name: "FirePay", icon: "🔥", category: "pagamento" },
  { id: "lowify", name: "Lowify", icon: "📉", category: "pagamento" },
  { id: "hyppe", name: "Hyppe", icon: "💎", category: "pagamento" },
  { id: "seedpay", name: "SeedPay", icon: "🌱", category: "pagamento" },
  { id: "membriz", name: "Membriz", icon: "👤", category: "pagamento" },
  { id: "cerefy", name: "Cerefy", icon: "🧠", category: "pagamento" },
  { id: "pagamerican", name: "PagAmerican", icon: "🇺🇸", category: "pagamento" },
  { id: "affiliaxpay", name: "AffiliaxPay", icon: "🤝", category: "pagamento" },
  { id: "kambafy", name: "Kambafy", icon: "🎺", category: "pagamento" },
  { id: "approval", name: "Approval", icon: "✅", category: "pagamento" },
  { id: "zuckpay", name: "ZuckPay", icon: "📘", category: "pagamento" },
  { id: "xynonpay", name: "XynonPay", icon: "🔤", category: "pagamento" },
  { id: "kavoo", name: "Kavoo", icon: "🎤", category: "pagamento" },
  { id: "fruitfy", name: "Fruitfy", icon: "🍎", category: "pagamento" },
  { id: "coeud", name: "Coeud", icon: "❤️", category: "pagamento" },
  { id: "clickpay", name: "ClickPay", icon: "🖱️", category: "pagamento" },
  { id: "orlacheckout", name: "OrlaCheckout", icon: "🌺", category: "pagamento" },
  { id: "tukanopay", name: "TukanoPay", icon: "🦜", category: "pagamento" },
  { id: "amandlspay", name: "AmandlsPay", icon: "💝", category: "pagamento" },
  { id: "nezzyay", name: "NezzyAy", icon: "🎨", category: "pagamento" },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🛒 MARKETPLACES
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "amazon", name: "Amazon", icon: "🅰️", category: "marketplace" },
  { id: "ebay", name: "eBay", icon: "🔴", category: "marketplace" },
  { id: "aliexpress", name: "AliExpress", icon: "🌏", category: "marketplace" },
  { id: "mercado_livre", name: "Mercado Livre", icon: "🟡", category: "marketplace" },

  // ═══════════════════════════════════════════════════════════════════════════
  // ⚙️ AUTOMAÇÃO & CUSTOM
  // ═══════════════════════════════════════════════════════════════════════════
  { id: "n8n", name: "n8n", icon: "🔄", category: "automacao" },
  { id: "make", name: "Make (Integromat)", icon: "🎭", category: "automacao" },
  { id: "custom_api", name: "API Customizada", icon: "🔌", category: "automacao" },
];

// Agrupar por categoria
export const PLATFORMS_BY_CATEGORY = {
  principal: WEBHOOK_PLATFORMS.filter(p => p.category === "principal"),
  infoproduto: WEBHOOK_PLATFORMS.filter(p => p.category === "infoproduto"),
  ecommerce: WEBHOOK_PLATFORMS.filter(p => p.category === "ecommerce"),
  pagamento: WEBHOOK_PLATFORMS.filter(p => p.category === "pagamento"),
  marketplace: WEBHOOK_PLATFORMS.filter(p => p.category === "marketplace"),
  automacao: WEBHOOK_PLATFORMS.filter(p => p.category === "automacao"),
};

export const CATEGORY_LABELS = {
  principal: "🎯 Plataformas Principais",
  infoproduto: "📚 Infoprodutos & Cursos",
  ecommerce: "🏪 E-commerce & Vendas",
  pagamento: "💳 Gateways de Pagamento",
  marketplace: "🛒 Marketplaces",
  automacao: "⚙️ Automação & Custom",
} as const;

export function getPlatformById(id: string): Platform | undefined {
  return WEBHOOK_PLATFORMS.find(p => p.id === id);
}

export function getPlatformIcon(id: string): string {
  return getPlatformById(id)?.icon ?? "🔗";
}

export function getPlatformName(id: string): string {
  return getPlatformById(id)?.name ?? id;
}
