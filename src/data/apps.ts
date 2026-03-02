export type AppItem = {
  id: string;
  name: string;
  icon: string;
  color: string;
  domains: string[];
  bundleId: {
    ios?: string;
    android?: string;
  };
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  apps: AppItem[];
};

export const APP_CATALOG: Category[] = [
  {
    id: "social",
    name: "소셜 미디어",
    icon: "💬",
    apps: [
      {
        id: "instagram",
        name: "Instagram",
        icon: "📸",
        color: "#E4405F",
        domains: ["instagram.com", "www.instagram.com", "i.instagram.com", "cdninstagram.com"],
        bundleId: { ios: "com.burbn.instagram", android: "com.instagram.android" },
      },
      {
        id: "x-twitter",
        name: "X (Twitter)",
        icon: "𝕏",
        color: "#000000",
        domains: ["twitter.com", "x.com", "api.twitter.com", "t.co", "tweetdeck.twitter.com"],
        bundleId: { ios: "com.atebits.Tweetie2", android: "com.twitter.android" },
      },
      {
        id: "threads",
        name: "Threads",
        icon: "🧵",
        color: "#000000",
        domains: ["threads.net", "www.threads.net"],
        bundleId: { ios: "com.burbn.barcelona", android: "com.instagram.barcelona" },
      },
      {
        id: "facebook",
        name: "Facebook",
        icon: "f",
        color: "#1877F2",
        domains: ["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com"],
        bundleId: { ios: "com.facebook.Facebook", android: "com.facebook.katana" },
      },
      {
        id: "snapchat",
        name: "Snapchat",
        icon: "👻",
        color: "#FFFC00",
        domains: ["snapchat.com", "www.snapchat.com", "web.snapchat.com"],
        bundleId: { ios: "com.toyopagroup.picaboo", android: "com.snapchat.android" },
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        icon: "in",
        color: "#0A66C2",
        domains: ["linkedin.com", "www.linkedin.com"],
        bundleId: { ios: "com.linkedin.LinkedIn", android: "com.linkedin.android" },
      },
    ],
  },
  {
    id: "video",
    name: "동영상 · 스트리밍",
    icon: "🎬",
    apps: [
      {
        id: "youtube",
        name: "YouTube",
        icon: "▶",
        color: "#FF0000",
        domains: [
          "youtube.com", "www.youtube.com", "m.youtube.com",
          "youtu.be", "youtube-nocookie.com", "youtubei.googleapis.com",
          "music.youtube.com",
        ],
        bundleId: { ios: "com.google.ios.youtube", android: "com.google.android.youtube" },
      },
      {
        id: "tiktok",
        name: "TikTok",
        icon: "♪",
        color: "#010101",
        domains: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "m.tiktok.com"],
        bundleId: { ios: "com.zhiliaoapp.musically", android: "com.zhiliaoapp.musically" },
      },
      {
        id: "netflix",
        name: "Netflix",
        icon: "N",
        color: "#E50914",
        domains: ["netflix.com", "www.netflix.com"],
        bundleId: { ios: "com.netflix.Netflix", android: "com.netflix.mediaclient" },
      },
      {
        id: "twitch",
        name: "Twitch",
        icon: "📺",
        color: "#9146FF",
        domains: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
        bundleId: { ios: "tv.twitch", android: "tv.twitch.android.app" },
      },
      {
        id: "wavve",
        name: "Wavve",
        icon: "W",
        color: "#1E2B4D",
        domains: ["wavve.com", "www.wavve.com"],
        bundleId: { ios: "com.kt.olleh.wavve", android: "com.kt.olleh.wavve" },
      },
    ],
  },
  {
    id: "messaging",
    name: "메시징 · 채팅",
    icon: "💬",
    apps: [
      {
        id: "kakaotalk",
        name: "카카오톡",
        icon: "💛",
        color: "#FEE500",
        domains: ["talk.kakao.com", "open.kakao.com"],
        bundleId: { ios: "com.iwilab.KakaoTalk", android: "com.kakao.talk" },
      },
      {
        id: "discord",
        name: "Discord",
        icon: "🎮",
        color: "#5865F2",
        domains: ["discord.com", "discord.gg", "discordapp.com"],
        bundleId: { ios: "com.hammerandchisel.discord", android: "com.discord" },
      },
      {
        id: "telegram",
        name: "Telegram",
        icon: "✈️",
        color: "#26A5E4",
        domains: ["telegram.org", "web.telegram.org", "t.me"],
        bundleId: { ios: "ph.telegra.Telegraph", android: "org.telegram.messenger" },
      },
      {
        id: "line",
        name: "LINE",
        icon: "🟢",
        color: "#06C755",
        domains: ["line.me", "timeline.line.me"],
        bundleId: { ios: "jp.naver.line", android: "jp.naver.line.android" },
      },
    ],
  },
  {
    id: "community",
    name: "커뮤니티 · 뉴스",
    icon: "📰",
    apps: [
      {
        id: "reddit",
        name: "Reddit",
        icon: "R",
        color: "#FF4500",
        domains: ["reddit.com", "www.reddit.com", "old.reddit.com"],
        bundleId: { ios: "com.reddit.Reddit", android: "com.reddit.frontpage" },
      },
      {
        id: "naver",
        name: "네이버",
        icon: "N",
        color: "#03C75A",
        domains: ["naver.com", "m.naver.com", "news.naver.com", "cafe.naver.com"],
        bundleId: { ios: "com.nhn.NSearchApp", android: "com.nhn.android.search" },
      },
      {
        id: "dcinside",
        name: "디시인사이드",
        icon: "DC",
        color: "#1D5B99",
        domains: ["dcinside.com", "m.dcinside.com", "gall.dcinside.com"],
        bundleId: { ios: "com.dcinside.app", android: "com.dcinside.app" },
      },
      {
        id: "fmkorea",
        name: "에펨코리아",
        icon: "FM",
        color: "#354B5E",
        domains: ["fmkorea.com", "www.fmkorea.com"],
        bundleId: {},
      },
    ],
  },
  {
    id: "shopping",
    name: "쇼핑 · 마켓",
    icon: "🛒",
    apps: [
      {
        id: "coupang",
        name: "쿠팡",
        icon: "🚀",
        color: "#C70101",
        domains: ["coupang.com", "www.coupang.com", "m.coupang.com"],
        bundleId: { ios: "com.coupang.mobile", android: "com.coupang.mobile" },
      },
      {
        id: "danggeun",
        name: "당근마켓",
        icon: "🥕",
        color: "#FF6F0F",
        domains: ["daangn.com", "www.daangn.com"],
        bundleId: { ios: "com.towneers.www", android: "com.towneers.www" },
      },
      {
        id: "musinsa",
        name: "무신사",
        icon: "M",
        color: "#000000",
        domains: ["musinsa.com", "www.musinsa.com"],
        bundleId: { ios: "com.musinsa.store", android: "com.musinsa.store" },
      },
    ],
  },
  {
    id: "games",
    name: "게임",
    icon: "🎮",
    apps: [
      {
        id: "roblox",
        name: "Roblox",
        icon: "🟩",
        color: "#E2231A",
        domains: ["roblox.com", "www.roblox.com", "web.roblox.com"],
        bundleId: { ios: "com.roblox.robloxmobile", android: "com.roblox.client" },
      },
      {
        id: "steam",
        name: "Steam",
        icon: "🎲",
        color: "#171A21",
        domains: ["store.steampowered.com", "steampowered.com", "steamcommunity.com"],
        bundleId: { ios: "com.valvesoftware.Steam", android: "com.valvesoftware.android.steam.community" },
      },
    ],
  },
];

export function getAllApps(): AppItem[] {
  return APP_CATALOG.flatMap((cat) => cat.apps);
}

export function getAppById(id: string): AppItem | undefined {
  return getAllApps().find((app) => app.id === id);
}

export function getAllDomains(appIds: string[]): string[] {
  const apps = getAllApps().filter((app) => appIds.includes(app.id));
  return Array.from(new Set(apps.flatMap((app) => app.domains)));
}
