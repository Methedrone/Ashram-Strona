/// <reference types="@cloudflare/workers-types" />

// GitHub OAuth proxy dla Sveltia CMS.
// CORS: GitHub /access_token nie wysyła CORS headers — wymiana code→token
// MUSI isć server-to-server, nie z przeglądarki (§1 skill).
// Hash router: redirect MUSI iść do /admin/#/signin/<base64> (§2 skill).

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const siteId = url.host;                                    // babaji.org.pl
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  // === ETAP 1: Sveltia otworzyła nas z PKCE (?provider=github&site_id=...)
  // Przekierowujemy użytkownika do GitHub authorize
  if (!code) {
    const gh = new URL("https://github.com/login/oauth/authorize");
    gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
    gh.searchParams.set("redirect_uri", `https://${siteId}/api/callback`);
    gh.searchParams.set("scope", "repo,user");
    if (state) gh.searchParams.set("state", state);
    return Response.redirect(gh.toString(), 302);
  }

  // === ETAP 2: GitHub przekierowało nas z powrotem (?code=...&state=...)
  // Wymieniamy code na access_token (server-side, bez CORS)
  if (!env.GITHUB_CLIENT_SECRET) {
    return new Response("GITHUB_CLIENT_SECRET not configured", { status: 500 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `https://${siteId}/api/callback`,
      state: state ?? "",
    }),
  });

  if (!tokenRes.ok) {
    return new Response(`GitHub token exchange failed: ${tokenRes.status}`, {
      status: 502,
    });
  }

  const data = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!data.access_token) {
    return new Response(`No access_token: ${data.error ?? "unknown"}`, {
      status: 400,
    });
  }

  // === ETAP 3: redirect z powrotem do Sveltia
  // KRYTYCZNE: MUSI być /admin/#/signin/... z hashem — Sveltia czyta hash routerem.
  // Bez # → 404 z CF (bo /signin/X to nie plik).
  const encoded = btoa(JSON.stringify({ token: data.access_token }));
  return Response.redirect(`https://${siteId}/admin/#/signin/${encoded}`, 302);
};
