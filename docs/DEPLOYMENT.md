# Deploying this app — the SPA-routing gotcha

This is a client-side-routed single-page app (React Router, see `src/routes/AppRoutes.tsx`). `npm run build` produces one `index.html` plus a JS/CSS bundle in `dist/` — routes like `/profile`, `/orders/42`, `/restaurants/7` are **not real files on the server**, they only exist once React Router has loaded and taken over in the browser.

## The symptom

Clicking links inside the app always works (React Router intercepts the navigation client-side, no server request happens). But a **hard refresh, or typing/bookmarking a URL like `https://pureeats.in/profile` directly**, sends a real HTTP request straight to whatever's hosting the site. If the host only knows about actual files and has no fallback rule, it returns a genuine 404 from the server itself — React never gets a chance to load and show anything, including its own in-app "not found" page.

The service worker (`vite-plugin-pwa`, `registerType: 'autoUpdate'`) doesn't rescue this on its own either unless it's configured to — `vite.config.ts` now sets `workbox.navigateFallback: '/index.html'`, so once the service worker is installed and controlling the page, it serves the cached shell for any navigation request instead of hitting the network. That's a real safety net (and matters for flaky/offline connections), but it only kicks in **after** the service worker has installed on that browser — the very first visit, or any host/CDN-level check that runs before the service worker is invoked, still needs the fix below.

## The actual fix: a server-side SPA rewrite

Whatever serves `dist/`, it needs a rule: *"if the request doesn't match a real file, serve `index.html` instead (with a 200, not a redirect)."* Pick whichever matches your host:

**Nginx**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache** (`.htaccess` in the same directory as `index.html`)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**Vercel** (`vercel.json` at the repo root)
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

**Netlify** (`public/_redirects`, or `netlify.toml`)
```
/*  /index.html  200
```

**Cloudflare Pages** — same `_redirects` file as Netlify, or a `_redirects`/Pages Functions rule in the dashboard.

**AWS S3 + CloudFront** — S3 static website hosting alone can't do this (its "error document" returns a real 404 status, which browsers/CDNs may not treat the same as a success). Configure a CloudFront **custom error response**: for HTTP error code 403 and 404, response page path `/index.html`, HTTP response code `200`.

**IIS** (`web.config` at the site root)
```xml
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

None of this repo's own files currently configure any of the above — there's no `vercel.json`/`netlify.toml`/nginx config checked in, so whichever of these actually applies depends on how `pureeats.in` is deployed. Add the matching one once that's confirmed.
