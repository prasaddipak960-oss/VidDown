import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
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
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { downloadMedia, type DownloadResult } from "@/lib/api/download.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InDown.io clone — Instagram & TikTok Downloader" },
      {
        name: "description",
        content:
          "Download Instagram and TikTok videos, reels, photos and stories — fast, free and anonymous.",
      },
      { property: "og:title", content: "InDown.io clone — Instagram & TikTok Downloader" },
      {
        property: "og:description",
        content:
          "Download Instagram and TikTok videos, reels, photos and stories — fast, free and anonymous.",
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
  const [dlProgress, setDlProgress] = useState<Record<number, number>>({});
  const [dlActive, setDlActive] = useState<Record<number, boolean>>({});

  const downloadFn = useServerFn(downloadMedia);
  const mutation = useMutation<DownloadResult, Error, string>({
    mutationFn: async (link: string) => downloadFn({ data: { url: link } }),
  });

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch {
      /* ignore */
    }
  };

  const handleClear = () => {
    setUrl("");
    mutation.reset();
    setDlProgress({});
    setDlActive({});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    const valid =
      platform === "instagram"
        ? /instagram\.com\//i.test(url)
        : /tiktok\.com\//i.test(url);
    if (!valid) {
      mutation.reset();
      alert(`Please paste a valid ${platform === "instagram" ? "Instagram" : "TikTok"} link.`);
      return;
    }
    mutation.mutate(url.trim());
  };

  const handleDownload = useCallback(
    async (index: number, mediaUrl: string, filename: string) => {
      setDlActive((prev) => ({ ...prev, [index]: true }));
      setDlProgress((prev) => ({ ...prev, [index]: 0 }));
      try {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok || !response.body) {
          throw new Error(`Download failed: ${response.status}`);
        }
        const total = parseInt(response.headers.get("Content-Length") || "0", 10);
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setDlProgress((prev) => ({ ...prev, [index]: Math.round((received / total) * 100) }));
          } else {
            setDlProgress((prev) => ({ ...prev, [index]: -1 })); // indeterminate
          }
        }
        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        setDlProgress((prev) => ({ ...prev, [index]: 100 }));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Download failed");
      } finally {
        setDlActive((prev) => ({ ...prev, [index]: false }));
      }
    },
    []
  );

  const heading =
    platform === "instagram" ? TITLES[tab] : "TikTok Video Downloader";

  const result = mutation.data;

  return (
    <div className="min-h-screen bg-white text-slate-800">
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
        <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <button
            onClick={() => { setPlatform("instagram"); mutation.reset(); }}
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
            onClick={() => { setPlatform("tiktok"); mutation.reset(); }}
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
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-blue-700 disabled:opacity-70 md:min-w-[260px]"
            >
              {mutation.isPending ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {mutation.isPending ? "Loading..." : "Search"}
            </button>
          </form>

          {mutation.isError && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{mutation.error.message}</span>
            </div>
          )}

          {result && (
            <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row">
                {result.thumbnail && (
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(result.thumbnail)}&filename=thumbnail.jpg`}
                    alt="thumbnail"
                    className="h-48 w-full rounded-md object-cover md:h-56 md:w-56"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {result.author && (
                    <p className="text-sm font-medium text-indigo-600">@{result.author}</p>
                  )}
                  {result.title && (
                    <p className="mt-1 line-clamp-3 text-sm text-slate-700">{result.title}</p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                    {result.media.length} file{result.media.length === 1 ? "" : "s"} found
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.media.map((m, i) => {
                      const ext = m.type === "video" ? "mp4" : "jpg";
                      const fname = `${result.platform}_${i + 1}.${ext}`;
                      const href = `/api/proxy?url=${encodeURIComponent(m.url)}&filename=${encodeURIComponent(fname)}`;
                      return (
                        <a
                          key={i}
                          href={href}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4" />
                          {m.type === "video" ? "Video" : "Photo"} {result.media.length > 1 ? i + 1 : ""}
                          {m.quality ? ` · ${m.quality}` : ""}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <article className="prose prose-slate mt-12 max-w-none">
          <h2 className="text-center text-2xl font-bold text-indigo-600 md:text-3xl">
            {platform === "instagram" ? "Instagram Video Download" : "TikTok Video Download"}
          </h2>
          <p className="mt-4 text-slate-700">
            Paste any public Instagram or TikTok link above and click Search.
            We fetch the media on our server and stream it back to you — no app
            install, no login, no signup.
          </p>
          <h3 className="mt-8 text-xl font-semibold text-slate-900">How to use</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-6 text-slate-700">
            <li>Copy the link of the post or video.</li>
            <li>Paste it in the box above.</li>
            <li>Click Search.</li>
            <li>Tap the Download button on the result.</li>
          </ol>
        </article>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} InDown.io clone — for personal/educational use only.
      </footer>
    </div>
  );
}
