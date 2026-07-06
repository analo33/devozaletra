const { Readable } = require("node:stream");

const MAX_MEDIA_BYTES = 500 * 1024 * 1024;
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

module.exports = async function handler(request, response) {
  if (request.method === "POST") return findInstagramMedia(request, response);
  if (request.method === "GET") return proxyInstagramMedia(request, response);
  response.setHeader("Allow", "GET, POST");
  return response.status(405).json({ error: "Método no permitido." });
};

async function findInstagramMedia(request, response) {
  try {
    const target = parseInstagramUrl(request.body?.url);
    const page = await fetch(target, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!page.ok) throw new Error("Instagram no permitió abrir esa publicación.");
    const html = await page.text();
    const mediaUrl = extractVideoUrl(html);
    if (!mediaUrl) throw new Error("No encontramos un vídeo público. Comprueba que sea un Reel o publicación pública.");
    validateMediaUrl(mediaUrl);

    return response.status(200).json({
      proxyUrl: `/api/instagram?media=${encodeURIComponent(mediaUrl)}`,
    });
  } catch (error) {
    return response.status(422).json({ error: error.message || "No se pudo leer la publicación." });
  }
}

async function proxyInstagramMedia(request, response) {
  try {
    const mediaUrl = String(request.query.media || "");
    validateMediaUrl(mediaUrl);
    const media = await fetch(mediaUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/126 Safari/537.36",
        Referer: "https://www.instagram.com/",
      },
    });
    if (!media.ok || !media.body) throw new Error("Instagram rechazó la descarga del vídeo.");

    const size = Number(media.headers.get("content-length") || 0);
    if (size > MAX_MEDIA_BYTES) throw new Error("El vídeo es demasiado grande.");
    response.status(200);
    response.setHeader("Content-Type", media.headers.get("content-type") || "video/mp4");
    if (size) response.setHeader("Content-Length", String(size));
    response.setHeader("Cache-Control", "private, max-age=300");
    await new Promise((resolve, reject) => {
      const stream = Readable.fromWeb(media.body);
      stream.once("error", reject);
      response.once("finish", resolve);
      response.once("close", resolve);
      stream.pipe(response);
    });
  } catch (error) {
    if (!response.headersSent) response.status(422).json({ error: error.message || "No se pudo descargar el vídeo." });
    else response.end();
  }
}

function parseInstagramUrl(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    throw new Error("El enlace de Instagram no es válido.");
  }
  if (url.protocol !== "https:" || !INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) {
    throw new Error("Solo se aceptan enlaces HTTPS de instagram.com.");
  }
  if (!/^\/(?:p|reel|tv)\//.test(url.pathname)) {
    throw new Error("El enlace debe apuntar a una publicación o Reel.");
  }
  url.search = "";
  url.hash = "";
  return url.toString();
}

function extractVideoUrl(html) {
  const metaTags = html.match(/<meta\s[^>]*>/gi) || [];
  for (const tag of metaTags) {
    const property = readAttribute(tag, "property") || readAttribute(tag, "name");
    if (["og:video", "og:video:secure_url"].includes(property?.toLowerCase())) {
      const content = readAttribute(tag, "content");
      if (content) return decodeHtml(content);
    }
  }

  const jsonMatch = html.match(/["']video_url["']\s*:\s*["']([^"']+)["']/i);
  if (!jsonMatch) return null;
  return decodeHtml(jsonMatch[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/"));
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2] || null;
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/&#47;/g, "/")
    .replace(/&quot;/g, '"');
}

function validateMediaUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Instagram devolvió una dirección de vídeo no válida.");
  }
  const host = url.hostname.toLowerCase();
  const allowed = url.protocol === "https:" && (host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net"));
  if (!allowed) throw new Error("Instagram devolvió un servidor de vídeo no reconocido.");
  return url;
}
