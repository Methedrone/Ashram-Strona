/// <reference types="@cloudflare/workers-types" />

// GitHub OAuth callback handler.
// GitHub OAuth App callback URL musi wskazywać TUTAJ (https://babaji.org.pl/api/callback).
// Robimy wewnętrzny forward do /api/auth z zachowaniem query string,
// dzięki czemu cała logika OAuth żyje w jednym pliku.

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const target = new URL("/api/auth" + url.search, url.origin);
  return fetch(target.toString(), request);
};
