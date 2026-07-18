import "./lib/error-capture";

import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

// Nonce por resposta: gerado aqui e (a) injetado na CSP e (b) lido pelo router
// (src/router.tsx) via globalThis, que o passa ao <Scripts>/<HeadContent> do TanStack
// Start — assim TODO <script> inline de hidratação carrega o nonce e a CSP dispensa
// `'unsafe-inline'`. AsyncLocalStorage isola o nonce por request (sem race entre
// requisições concorrentes no mesmo processo).
const nonceStore = new AsyncLocalStorage<string>();
(globalThis as { __agrotorreNonce?: () => string | undefined }).__agrotorreNonce = () =>
  nonceStore.getStore();

// Content-Security-Policy escopada às origens reais do app (Supabase REST+realtime,
// CDNs de tiles/glyphs do MapLibre). `script-src` usa NONCE por resposta (sem
// `'unsafe-inline'`/`'unsafe-eval'`); o worker do MapLibre roda via `blob:`. As demais
// diretivas (frame-ancestors, object-src, base-uri, connect-src restrito) protegem.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://*.basemaps.cartocdn.com https://services.arcgisonline.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://demotiles.maplibre.org",
    `script-src 'self' 'nonce-${nonce}' blob:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "worker-src 'self' blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.basemaps.cartocdn.com https://services.arcgisonline.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://demotiles.maplibre.org",
    "upgrade-insecure-requests",
  ].join("; ");
}

const STATIC_SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  // Isolamento da janela/recurso (defesa contra XS-Leaks / cross-origin abuse).
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
};

// Anexa os headers de segurança a qualquer resposta (SSR + rotas de servidor). O
// body (stream) é repassado intacto; assets estáticos da CDN não passam por aqui
// (cobertos por vercel.json). A CSP leva o nonce daquela resposta.
function withSecurityHeaders(response: Response, nonce: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", buildCsp(nonce));
  for (const [key, value] of Object.entries(STATIC_SECURITY_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // Um nonce por resposta; o render (dentro do run) o lê via globalThis e o aplica
    // aos scripts inline; a CSP desta resposta leva o mesmo nonce.
    const nonce = randomBytes(16).toString("base64");
    try {
      const handler = await getServerEntry();
      const response = await nonceStore.run(nonce, () => handler.fetch(request, env, ctx));
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response), nonce);
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        nonce,
      );
    }
  },
};
