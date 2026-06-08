import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const target = url.searchParams.get("url");
        const filename = url.searchParams.get("filename") || "download";
        if (!target || !/^https?:\/\//i.test(target)) {
          return new Response("Invalid url", { status: 400 });
        }
        try {
          const upstream = await fetch(target, {
            headers: { "User-Agent": "Mozilla/5.0", Referer: "https://www.instagram.com/" },
          });
          if (!upstream.ok || !upstream.body) {
            return new Response(`Upstream error ${upstream.status}`, { status: 502 });
          }
          const contentType = upstream.headers.get("content-type") || "application/octet-stream";
          return new Response(upstream.body, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Disposition": `attachment; filename="${filename}"`,
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          return new Response("Proxy failed", { status: 500 });
        }
      },
    },
  },
});
