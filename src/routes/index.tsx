import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Instagram,
  Music2,
  PlayCircle,
  Film,
  Image as ImageIcon,
  UserCircle2,
  BookmarkIcon,
  Target,
  Link2,
  RotateCw,
  Search,
  Menu,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InDown.io clone — Instagram Video Downloader" },
      {
        name: "description",
        content:
          "Download Instagram videos, reels, photos, DP, stories and highlights — fast, free and anonymous.",
      },
      { property: "og:title", content: "InDown.io clone — Instagram Video Downloader" },
      {
        property: "og:description",
        content:
          "Download Instagram videos, reels, photos, DP, stories and highlights — fast, free and anonymous.",
      },
    ],
  }),
  component: Index,
});

type Platform = "instagram" | "tiktok";
type IgTab = "video" | "reels" | "photo" | "dp" | "stories" | "highlights";

const IG_TABS: { key: IgTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "video", label: "Video", Icon: PlayCircle },
  { key: "reels", label: "Reels", Icon: Film },
  { key: "photo", label: "Photo", Icon: ImageIcon },
  { key: "dp", label: "DP", Icon: UserCircle2 },
  { key: "stories", label: "Stories", Icon: BookmarkIcon },
  { key: "highlights", label: "Highlights", Icon: Target },
];

const TITLES: Record<IgTab, string> = {
  video: "Instagram Video Downloader",
  reels: "Instagram Reels Downloader",
  photo: "Instagram Photo Downloader",
  dp: "Instagram DP Viewer & Downloader",
  stories: "Instagram Stories Downloader",
  highlights: "Instagram Highlights Downloader",
};

function Index() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [tab, setTab] = useState<IgTab>("video");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      setMessage("Clipboard access denied. Paste manually.");
    }
  };

  const handleClear = () => {
    setUrl("");
    setMessage(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!url.trim()) {
      setMessage("Please paste a valid link.");
      return;
    }
    const valid =
      platform === "instagram"
        ? /instagram\.com\//i.test(url)
        : /tiktok\.com\//i.test(url);
    if (!valid) {
      setMessage(`Please paste a valid ${platform === "instagram" ? "Instagram" : "TikTok"} link.`);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMessage(
        "Demo only — this UI does not actually fetch media. Backend integration required for downloads.",
      );
    }, 1200);
  };

  const heading =
    platform === "instagram" ? TITLES[tab] : "TikTok Video Downloader";

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="text-2xl font-bold">
            <span className="text-pink-500">In</span>
            <span className="text-slate-900">Down.io</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            <a href="/" className="text-indigo-600">Home</a>
            <a href="#advertise" className="text-slate-700 hover:text-indigo-600">Advertise with us</a>
            <button className="text-slate-700 hover:text-indigo-600">Language ▾</button>
          </nav>
          <button className="md:hidden text-slate-700" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-12">
        {/* Platform tabs */}
        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <button
            onClick={() => setPlatform("instagram")}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-semibold transition ${
              platform === "instagram"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Instagram className="h-4 w-4" />
            INSTAGRAM
          </button>
          <button
            onClick={() => setPlatform("tiktok")}
            className={`flex items-center justify-center gap-2 py-4 text-sm font-semibold transition ${
              platform === "tiktok"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Music2 className="h-4 w-4" />
            TIKTOK
          </button>
        </div>

        {/* Sub-tabs for Instagram */}
        {platform === "instagram" && (
          <>
            <p className="mt-8 text-center text-sm font-bold tracking-wide text-indigo-600">
              DOWNLOAD ALL INSTAGRAM STUFF HERE!
            </p>
            <div className="mt-4 grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 md:grid-cols-6">
              {IG_TABS.map(({ key, label, Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Downloader card */}
        <section className="mt-8 rounded-xl bg-slate-100 p-6 md:p-10">
          <h1 className="text-center text-2xl font-semibold text-slate-900 md:text-3xl">
            {heading}
          </h1>

          <form
            onSubmit={handleSearch}
            className="mt-6 flex flex-col gap-3 md:flex-row"
          >
            <div className="flex flex-1 items-center overflow-hidden rounded-md border border-slate-300 bg-white">
              <span className="px-3 text-slate-400">
                <Link2 className="h-5 w-5" />
              </span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste valid link here..."
                className="flex-1 bg-transparent px-2 py-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="h-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Paste
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="h-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                aria-label="Clear"
              >
                X
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-70 md:min-w-[260px]"
            >
              {loading ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Loading..." : "Search"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              {message}
            </p>
          )}
        </section>

        {/* SEO content */}
        <article className="prose prose-slate mt-12 max-w-none">
          <h2 className="text-center text-2xl font-bold text-indigo-600 md:text-3xl">
            {platform === "instagram"
              ? "Instagram Video Download"
              : "TikTok Video Download"}
          </h2>
          <p className="mt-4 text-slate-700">
            {platform === "instagram"
              ? "Instagram is one of the most popular social media platforms. While scrolling your feed you often find videos you wish to keep — but Instagram does not let you download them directly."
              : "TikTok is full of short, addictive videos. Sometimes you want to save them for offline viewing — this tool helps you grab them quickly."}
          </p>
          <p className="mt-3 text-slate-700">
            Our downloader is a web-based tool, so you don't need to install any
            additional app. It's fast, anonymous and works on any device — phone,
            tablet or desktop.
          </p>

          <h3 className="mt-8 text-xl font-semibold text-slate-900">
            How to use the downloader
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-700">
            <li>Copy the link of the post you want to download.</li>
            <li>Paste it in the box above.</li>
            <li>Click the Search button.</li>
            <li>Tap Download on the result.</li>
          </ol>

          <h3 className="mt-8 text-xl font-semibold text-slate-900">
            Features
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
            <li>Download videos, reels, photos, DP, stories and highlights.</li>
            <li>No login or signup required.</li>
            <li>Free and unlimited downloads.</li>
            <li>Works on Android, iOS, Windows and Mac.</li>
          </ul>
        </article>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} InDown.io clone — built for demo purposes.
      </footer>
    </div>
  );
}
