import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  url: z.string().trim().min(1).max(2000),
});

export type MediaItem = {
  type: "video" | "image";
  url: string;
  thumbnail?: string;
  quality?: string;
};

export type DownloadResult = {
  platform: "instagram" | "tiktok";
  title?: string;
  author?: string;
  thumbnail?: string;
  media: MediaItem[];
};

function detectPlatform(url: string): "instagram" | "tiktok" | null {
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i.test(url)) return "tiktok";
  if (/instagram\.com/i.test(url)) return "instagram";
  return null;
}

async function fetchTikTok(url: string): Promise<DownloadResult> {
  const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const res = await fetch(api, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`TikTok API error ${res.status}`);
  const json = (await res.json()) as {
    code: number;
    msg?: string;
    data?: {
      title?: string;
      cover?: string;
      origin_cover?: string;
      play?: string;
      hdplay?: string;
      wmplay?: string;
      images?: string[];
      author?: { nickname?: string; unique_id?: string };
    };
  };
  if (json.code !== 0 || !json.data) {
    throw new Error(json.msg || "TikTok fetch failed");
  }
  const d = json.data;
  const media: MediaItem[] = [];
  if (d.images && d.images.length > 0) {
    for (const img of d.images) media.push({ type: "image", url: img });
  } else {
    if (d.hdplay) media.push({ type: "video", url: d.hdplay, quality: "HD (no watermark)" });
    if (d.play) media.push({ type: "video", url: d.play, quality: "SD (no watermark)" });
    if (d.wmplay) media.push({ type: "video", url: d.wmplay, quality: "With watermark" });
  }
  return {
    platform: "tiktok",
    title: d.title,
    author: d.author?.nickname || d.author?.unique_id,
    thumbnail: d.cover || d.origin_cover,
    media,
  };
}

function extractShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

async function fetchInstagram(url: string): Promise<DownloadResult> {
  const shortcode = extractShortcode(url);
  if (!shortcode) {
    throw new Error("Could not parse Instagram URL. Use a post/reel link.");
  }
  // Use Instagram's public embed page; works for public posts/reels server-side.
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Instagram embed fetch failed (${res.status})`);
  const html = await res.text();

  const media: MediaItem[] = [];
  let thumbnail: string | undefined;
  let title: string | undefined;
  let author: string | undefined;

  // Try to find embedded JSON via "contextJSON"
  const ctxMatch = html.match(/window\.__additionalDataLoaded\([^,]+,\s*(\{.+?\})\);<\/script>/s);
  let parsed: any = null;
  if (ctxMatch) {
    try {
      parsed = JSON.parse(ctxMatch[1]);
    } catch {
      /* ignore */
    }
  }
  if (!parsed) {
    const gqlMatch = html.match(/"gql_data":\s*(\{.+?\})\s*,\s*"server_checks"/s);
    if (gqlMatch) {
      try {
        parsed = JSON.parse(gqlMatch[1]);
      } catch {
        /* ignore */
      }
    }
  }

  const node =
    parsed?.shortcode_media ||
    parsed?.graphql?.shortcode_media ||
    parsed?.items?.[0];

  if (node) {
    thumbnail = node.display_url || node.image_versions2?.candidates?.[0]?.url;
    author = node.owner?.username || node.user?.username;
    title =
      node.edge_media_to_caption?.edges?.[0]?.node?.text ||
      node.caption?.text;

    const sides = node.edge_sidecar_to_children?.edges || node.carousel_media;
    if (sides && Array.isArray(sides)) {
      for (const e of sides) {
        const n = e.node || e;
        if (n.is_video || n.video_versions) {
          const v = n.video_url || n.video_versions?.[0]?.url;
          if (v) media.push({ type: "video", url: v });
        } else {
          const i = n.display_url || n.image_versions2?.candidates?.[0]?.url;
          if (i) media.push({ type: "image", url: i });
        }
      }
    } else if (node.is_video || node.video_versions) {
      const v = node.video_url || node.video_versions?.[0]?.url;
      if (v) media.push({ type: "video", url: v });
    } else if (thumbnail) {
      media.push({ type: "image", url: thumbnail });
    }
  }

  // Fallback regex on HTML if JSON parsing yielded nothing
  if (media.length === 0) {
    const videoMatch = html.match(/"video_url":"([^"]+)"/);
    if (videoMatch) {
      media.push({ type: "video", url: videoMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/") });
    }
    const imgMatch = html.match(/"display_url":"([^"]+)"/);
    if (imgMatch) {
      const u = imgMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
      thumbnail = thumbnail || u;
      if (media.length === 0) media.push({ type: "image", url: u });
    }
  }

  if (media.length === 0) {
    throw new Error(
      "Could not extract media. The post may be private, age-restricted, or Instagram changed its embed format.",
    );
  }

  return { platform: "instagram", title, author, thumbnail, media };
}

export const downloadMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const platform = detectPlatform(data.url);
    if (!platform) {
      throw new Error("Unsupported URL. Paste an Instagram or TikTok link.");
    }
    try {
      if (platform === "tiktok") return await fetchTikTok(data.url);
      return await fetchInstagram(data.url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      throw new Error(msg);
    }
  });
