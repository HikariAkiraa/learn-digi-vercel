# Learn Digi — Implementation Plan

Digital Laboratory Practicum Documentation Website
Next.js 16 (App Router) · Fumadocs 16 · TinaCMS 3 (self-hosted) · Auth.js v5 · Tailwind CSS v4 · Vercel

---

## 0. Read this first — three things that shape the whole design

These are architectural facts, not preferences. They were settled before any code was written because each one would have forced a rewrite if discovered later.

### 0.1 TinaCloud cannot enforce an `.env` whitelist

Requirement 4 asks for admin access controlled *strictly* by `ALLOWED_ADMIN_EMAILS`. TinaCloud manages collaborators in its own dashboard; there is no hook to override that from an environment variable. Self-hosting the Tina backend is therefore not a preference here — it is the only configuration that satisfies the requirement.

The cost is real: a Redis index, a GitHub PAT, and roughly four extra files. That cost is paid in section 4.

### 0.2 True Fumadocs-layout visual preview is not achievable cheaply

TinaCMS visual editing renders the page through Tina's GraphQL client **at runtime**. Fumadocs MDX compiles MDX **at build time** through Vite/Rolldown. A live split-pane that shows the real Fumadocs layout would require a second, parallel rendering pipeline that compiles MDX client-side — and that pipeline will drift from the real one, silently, exactly when a custom component is involved.

This build therefore uses Tina's standard `/admin` editor: form and rich-text on the left, Tina's own preview on the right. Requirement 6 (the deep-link "Edit in CMS" button) is fully implemented and gives most of the workflow benefit. See section 9 for what it would take to go further.

### 0.3 Requirement 6 has a rendering cost you should decide on knowingly

"Conditionally render server-side based on session" means calling `auth()`, which reads cookies, which opts a route out of static generation. Left unmanaged, every `/docs/*` page becomes dynamic.

The mitigation is in the code: `<EditInCms>` sits inside a `<Suspense>` boundary and `next.config.mjs` enables `experimental.ppr: 'incremental'`. The static shell prerenders; only the button streams. If you would rather not run experimental PPR, remove that flag and accept dynamic rendering — the pages are small and this is not a traffic-heavy site, so it is a defensible choice. What is *not* defensible is leaving it unexamined.

---

## 1. Step-by-step implementation plan

| # | Step | Files |
| --- | --- | --- |
| 1 | Install dependencies, scaffold config | `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs` |
| 2 | Define the content source and draft filter | `source.config.ts`, `lib/source.ts` |
| 3 | Theme Fumadocs with the brand palette | `app/global.css` |
| 4 | Google auth + `.env` whitelist | `auth.ts`, `lib/admin.ts`, `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/login/page.tsx` |
| 5 | Self-hosted Tina backend | `tina/config.ts`, `tina/database.ts`, `tina/auth-provider.ts`, `pages/api/tina/[...routes].ts`, `app/api/cms-token/route.ts` |
| 6 | Public pages | `app/(home)/page.tsx`, `app/(home)/courses/page.tsx`, `lib/courses.ts`, `lib/layout.shared.tsx` |
| 7 | Docs layout + Edit in CMS | `app/docs/layout.tsx`, `app/docs/[[...slug]]/page.tsx`, `components/edit-in-cms.tsx`, `lib/tina-edit-url.ts` |
| 8 | Seed content, verify draft filtering | `content/docs/**` |
| 9 | Provision Upstash + GitHub PAT, deploy | Vercel dashboard |

---

## 2. Terminal commands

### 2.1 Install

```bash
cd D:\Project\WebServer\learn-digi-vercel
npm install
```

`package.json` is already written, so a bare `npm install` is enough. For reference, this is what it pulls in:

```bash
# Framework
npm i next@^16 react@^19 react-dom@^19

# Fumadocs
npm i fumadocs-ui fumadocs-core fumadocs-mdx

# TinaCMS (self-hosted)
npm i tinacms @tinacms/datalayer tinacms-gitprovider-github
npm i upstash-redis-level @upstash/redis
npm i -D @tinacms/cli

# Auth
npm i next-auth@beta jose

# Styling + misc
npm i -D tailwindcss@^4 @tailwindcss/postcss postcss
npm i lucide-react zod
npm i -D typescript @types/node @types/react @types/react-dom @types/mdx cross-env
```

> `cross-env` is not optional on Windows. `TINA_PUBLIC_IS_LOCAL=true tinacms dev` is a Unix-ism and fails in `cmd.exe` and PowerShell.

### 2.2 Environment

```bash
copy .env.example .env.local     # Windows
# cp .env.example .env.local     # macOS / Linux

npx auth secret                  # writes AUTH_SECRET into .env.local
```

Then fill in `ALLOWED_ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

### 2.3 Run

```bash
npm run dev        # local: in-memory Tina DB, no auth, drafts visible
npm run dev:cms    # rehearse production: real Google login + Redis + GitHub commits
npm run build      # tinacms build && next build
npm run typecheck  # tsc --noEmit
```

### 2.4 Google OAuth client

Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → Web application.

Authorised redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://<your-domain>/api/auth/callback/google
```

### 2.5 Upstash Redis

Vercel dashboard → Storage → Marketplace → Upstash → Redis. Connect it to the project; Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically. Copy both into `.env.local` if you want to run `npm run dev:cms`.

### 2.6 GitHub token

GitHub → Settings → Developer settings → Personal access tokens.
Fine-grained: **Contents: Read and write** on this repository only. Classic: `repo` scope.

---

## 3. Deliverable 3 — `tina/config.ts`

Full file at [`tina/config.ts`](./tina/config.ts). The parts that matter:

**Content lands where Fumadocs expects it.** The collection's `path` is `content/docs`, identical to `dir` in `source.config.ts`. Tina writes MDX, git stores it, Fumadocs reads it. One copy of the content, no sync job.

**The `draft` field.** A `boolean` on the docs collection, with `defaultItem` setting `draft: true` so every new document starts unpublished. Publishing is always a deliberate act.

**`ui.router`** gives the editor a working "view page" link, stripping `index` so `content/docs/setup/index.mdx` maps to `/docs/setup` rather than `/docs/setup/index`.

**A `meta` collection** exposes Fumadocs' `meta.json` sidebar-ordering files to the CMS, so an admin can reorder modules without touching the repo.

### The one thing that will bite you

Tina parses MDX into its own AST. **Any JSX component in a document that has no matching `template` in the rich-text field will render as "unsupported element" in the editor.**

Templates are currently defined for `Callout`, `Step`, and `SafetyNote`. The seed content also uses `Cards`, `Card`, `Tabs`, `Tab`, `Files`, `Folder`, `File` and `Steps` — those render correctly on the public site but will show as unsupported blocks inside Tina until you add templates for them. Adding one looks like this:

```ts
{
  name: 'Cards',
  label: 'Card grid',
  fields: [{ name: 'children', label: 'Cards', type: 'rich-text' }],
}
```

Rule of thumb: every entry in `components/mdx.tsx` needs a twin in `mdxTemplates`. Keep the two lists side by side when you edit either.

---

## 4. Deliverable 4 — auth and whitelist

Four files, one rule.

### `lib/admin.ts` — the single source of truth

```ts
export function isAllowedAdmin(email?: string | null): boolean {
  if (!email) return false;
  const allowed = getAllowedAdmins();
  if (allowed.length === 0) return false;   // fails closed
  return allowed.includes(email.trim().toLowerCase());
}
```

An empty or misspelled `ALLOWED_ADMIN_EMAILS` grants **nobody** access. A typo locks you out rather than letting the internet in — that is the correct direction to fail.

This module has no runtime-specific imports, so the same function runs in edge middleware, in Server Components, and in the Node-runtime Tina backend. There is exactly one definition of "admin" in the codebase.

### `auth.ts` — two gates, not one

```ts
async signIn({ profile }) {
  if (profile?.email_verified !== true) return false;
  return isAllowedAdmin(profile.email);
},

async jwt({ token }) {
  token.isAdmin = isAllowedAdmin(token.email);   // re-checked every request
  return token;
},
```

The `signIn` gate stops a non-whitelisted account from ever receiving a session cookie. The `jwt` gate re-evaluates the whitelist on **every request** — so removing an address from the env var and redeploying revokes access immediately, rather than whenever that person's JWT happens to expire. Checking `email_verified` matters too: without it, a Google Workspace account with an unverified alias could in principle present a whitelisted address.

### `middleware.ts` — the perimeter

Matcher: `/admin`, `/admin/:path*`, `/api/tina/:path*`, `/api/cms-token`.

Including `/admin/:path*` is what closes the obvious hole: `tinacms build` writes a static SPA to `public/admin/index.html`, and middleware runs before public files are served, so requesting the `.html` directly does not bypass the gate.

API routes get a JSON `401` rather than a redirect — redirecting a GraphQL `POST` to an HTML login page produces an unreadable error in the Tina client.

### `pages/api/tina/[...routes].ts` — the real boundary

Middleware is defence in depth. This is the actual authorization check, and it does not trust the session cookie:

```
Browser (Tina SPA)
  └─ GET /api/cms-token          → auth() + isAllowedAdmin() → signed JWT, 15 min
      └─ POST /api/tina/gql      → Authorization: Bearer <jwt>
          └─ jwtVerify(issuer, audience) + isAllowedAdmin(payload.email)
```

**Why a separate signed token instead of reading the NextAuth cookie in the backend:** the Tina handler is a Node function receiving a raw `IncomingMessage`, and NextAuth's cookie name and encryption differ between v4 and v5. A token we sign ourselves with an explicit issuer and audience is stable, verifiable in one line, and independent of NextAuth internals. It also means the whitelist is enforced twice — once when minting, once when verifying — so the effective revocation window is a single request, not the 15-minute token lifetime.

---

## 5. Deliverable 5 — draft filtering + conditional Edit button

### Drafts are filtered at the input layer

```ts
// lib/source.ts
const publicSource = update(docs.toFumadocsSource())
  .files((files) =>
    files.filter((file) => {
      if (file.type === 'meta') return true;   // keep sidebar ordering files
      if (showDrafts) return true;             // dev only
      return file.data.draft !== true;
    }),
  )
  .build();

export const source = loader({ baseUrl: '/docs', source: publicSource });
```

This runs **before** the page tree is built, before slugs are assigned, before the search index is generated. The consequences fall out automatically rather than needing to be remembered in three places:

| Surface | Why drafts are excluded |
| --- | --- |
| Routing | `source.getPage()` returns `undefined` → `notFound()` |
| `generateStaticParams` | Draft slugs are never emitted, so no route is prerendered |
| Sidebar / page tree | The file never entered the tree |
| Search | `createFromSource(source)` indexes the same filtered source |

There is no "render it, then hide it" step that could leak content through a cached response or an RSC payload.

Drafts stay visible under `next dev` so an editor can preview. Set `HIDE_DRAFTS=true` to reproduce production behaviour exactly and confirm a page 404s.

**Known rough edge:** if a `meta.json` lists a page that is currently a draft, Fumadocs logs a warning in dev about a missing page. Harmless, but noisy. Use `"..."` in the `pages` array for in-progress sections to avoid it.

### The Edit button

```tsx
// components/edit-in-cms.tsx — async Server Component
export async function EditInCms({ path }: { path: string }) {
  const session = await auth();
  if (!isAllowedAdmin(session?.user?.email)) return null;

  return <a href={tinaEditUrl(path)}>Edit di CMS</a>;
}
```

```tsx
// app/docs/[[...slug]]/page.tsx
<Suspense fallback={null}>
  <EditInCms path={page.path} />
</Suspense>
```

The anchor is never serialised into the HTML for a non-admin — there is no hidden element to reveal with devtools. `page.path` is the virtual path relative to the content directory (`sistem-digital-dasar/gerbang-logika.mdx`), which `lib/tina-edit-url.ts` maps onto Tina's hash route:

```
/admin/index.html#/collections/edit/docs/sistem-digital-dasar/gerbang-logika
```

> **If that link lands on Tina's "document not found" screen,** flip `TINA_DOC_PATH_INCLUDES_EXTENSION` to `true` in `lib/tina-edit-url.ts`. Tina has shipped both conventions across versions and that constant is the only thing that needs to change.

---

## 6. Deliverable 6 — `app/global.css`

Full file at [`app/global.css`](./app/global.css). Structure:

1. `@import 'tailwindcss'` → `fumadocs-ui/css/neutral.css` → `fumadocs-ui/css/preset.css` → our overrides. **Order matters**: Fumadocs declares its defaults in an `@theme` block for light and a `.dark` block for dark. Ours must come after to win on source order.
2. `@theme static` brand tokens → generates real utilities: `bg-brand-cyan`, `text-brand-gold`, `border-brand-navy`.
3. `@theme` light-mode `--color-fd-*` overrides.
4. `.dark` dark-mode `--color-fd-*` overrides.

### Mapping

| Fumadocs variable | Dark | Light |
| --- | --- | --- |
| `--color-fd-background` | `#141519` | `#FAF8F3` |
| `--color-fd-foreground` | `#EDE8DF` | `#0B2942` |
| `--color-fd-primary` | `#03EAFF` | `#0369A1` |
| `--color-fd-muted-foreground` | `#8BA8A6` | `#5A6B6A` |
| `--color-fd-secondary-foreground` | `#F3D49C` | `#0B2942` |
| `--color-fd-accent` | `#1B2A33` | `#EBE4D4` |
| `--color-fd-border` | `#2A2D36` | `#E3DCCD` |
| `--color-fd-card` | `#191B21` | `#FFFFFF` |

### Two deliberate departures from the brief

Both are in the CSS as comments so a future maintainer sees the reasoning, and both are one-line reversions if you disagree.

**(a) `#F3D49C` is not the body text colour.** At 12.8:1 on `#141519` it is legible, but a fully saturated beige across a 2,000-word practicum module is tiring. Body copy is `#EDE8DF` — same warm cast, desaturated — and `#F3D49C` carries headings, inline code, and `secondary-foreground`, where it reads as an accent.

**(b) Gold does not carry text in light mode.** `#D4A017` on `#FAF8F3` is roughly **2.2:1**, well under the 4.5:1 AA floor. In light mode gold survives as decoration (rules, badges, icon fills, borders); where it must carry text, `--color-brand-gold-ink` (`#63490C`, 8.0:1) stands in.

### Measured contrast

| Pair | Ratio | WCAG |
| --- | --- | --- |
| `#EDE8DF` on `#141519` | 14.9:1 | AAA |
| `#8BA8A6` on `#141519` | 7.2:1 | AAA |
| `#F3D49C` on `#141519` | 12.8:1 | AAA |
| `#03EAFF` on `#141519` | 12.4:1 | AAA |
| `#0B2942` on `#FAF8F3` | 14.0:1 | AAA |
| `#5A6B6A` on `#FAF8F3` | 5.3:1 | AA |
| `#0369A1` on `#FAF8F3` | 5.6:1 | AA |
| `#D4A017` on `#FAF8F3` | 2.2:1 | **fails** — decoration only |
| `#63490C` on `#FAF8F3` | 8.0:1 | AAA — gold-ink substitute |

The "classic elegant yet technical" register comes from a Source Serif display face for headings against Inter for body, a faint engineering-paper grid (`.tech-grid`), thin gold section rules (`.rule-gold`), and small-caps eyebrow labels (`.eyebrow`).

---

## 7. Editing workflow, end to end

```
Admin reads /docs/sistem-digital-dasar/gerbang-logika
  │  server checks session → email in ALLOWED_ADMIN_EMAILS → button rendered
  ▼
Clicks "Edit di CMS"
  ▼
/admin/index.html#/collections/edit/docs/sistem-digital-dasar/gerbang-logika
  │  middleware: session? isAdmin? ──no──► /login
  ▼  yes
Tina SPA loads that document
  │  GET /api/cms-token → signed JWT (15 min)
  │  POST /api/tina/gql → Bearer JWT → verified + whitelist re-checked
  ▼
Edits, toggles draft → false, saves
  ▼
Tina commits MDX to GitHub via the PAT
  ▼
Vercel deploy hook → next build → page is live (~1 min)
```

---

## 8. Deployment checklist

1. Push to GitHub, import the repo into Vercel.
2. Add every variable from `.env.example` to Vercel → Settings → Environment Variables, with `TINA_PUBLIC_IS_LOCAL=false`.
3. Connect Upstash Redis (Vercel → Storage → Marketplace).
4. Add the production callback URL to the Google OAuth client.
5. Commit `tina/tina-lock.json` — the production build needs it. `.gitignore` is already set up to keep it.
6. Deploy. Verify in this order:
   - `/` renders with the correct palette in both themes
   - `/docs/sistem-digital-dasar/k-map` returns **404** (the seeded draft)
   - `/admin` redirects a signed-out visitor to `/login`
   - a non-whitelisted Google account is rejected with `?error=AccessDenied`
   - a whitelisted account reaches the Tina editor and can save

---

## 9. Known limitations — worth knowing before you build on this

| # | Limitation | Mitigation |
| --- | --- | --- |
| 1 | Tina's preview is Tina's own, not the Fumadocs layout | Deep-link Edit button + `ui.router` "view page" link cover most of the gap. True live preview = a parallel client-side MDX pipeline; budget days, not hours. |
| 2 | JSX components need templates in `tina/config.ts` or they show as "unsupported" | Keep `mdxTemplates` and `components/mdx.tsx` in sync. This is the most likely thing to confuse an editor. |
| 3 | Publishing a draft requires a full Vercel rebuild (~1 min) | Acceptable for course content. If you ever need instant publishing, that means runtime content fetching, which means abandoning build-time MDX. |
| 4 | `pages/api/tina/[...routes].ts` is the only Pages Router file | Deliberate. `TinaNodeBackend` is a Node `(req, res)` handler; an App Router adapter would mean maintaining body streaming for no gain. Both routers coexist fine. |
| 5 | The navbar admin button flashes a skeleton on first paint | It is a client component precisely so reading the session does not make every page dynamic. It is a convenience affordance; the actual gate is `middleware.ts`. |
| 6 | Concurrent edits to the same file can conflict at the git layer | Inherent to any git-backed CMS. With a handful of lab admins the risk is low. If it becomes a problem, TinaCloud's editorial workflow (branch-per-edit) solves it — at the cost of section 0.1. |
| 7 | Redis is a cache, not the source of truth | If the index drifts, it can be rebuilt from git. Losing Redis loses no content. |

---

## 10. File map

```
learn-digi-vercel/
├─ app/
│  ├─ global.css                       ← deliverable 6: @theme, light + dark
│  ├─ layout.tsx                       RootProvider, fonts
│  ├─ (home)/
│  │  ├─ layout.tsx                    HomeLayout (navbar)
│  │  ├─ page.tsx                      hero + courses + tools/SOP
│  │  └─ courses/page.tsx              course grid
│  ├─ docs/
│  │  ├─ layout.tsx                    DocsLayout, draft-free page tree
│  │  └─ [[...slug]]/page.tsx          ← deliverable 5: MDX + Edit in CMS
│  ├─ login/page.tsx                   Google sign-in
│  └─ api/
│     ├─ auth/[...nextauth]/route.ts   ← deliverable 4
│     ├─ cms-token/route.ts            signed short-lived CMS token
│     └─ search/route.ts               Orama index (draft-free)
├─ pages/api/tina/[...routes].ts       ← deliverable 4: Tina backend + authz
├─ tina/
│  ├─ config.ts                        ← deliverable 3: schema + draft field
│  ├─ database.ts                      GitHub provider + Upstash Redis
│  └─ auth-provider.ts                 browser-side auth bridge
├─ lib/
│  ├─ admin.ts                         single source of truth for the whitelist
│  ├─ source.ts                        ← deliverable 5: draft filtering
│  ├─ tina-edit-url.ts                 page path → Tina edit URL
│  ├─ layout.shared.tsx                navbar options
│  └─ courses.ts                       course metadata
├─ components/
│  ├─ edit-in-cms.tsx                  ← deliverable 5: server-side gate
│  ├─ admin-nav-button.tsx             navbar login/CMS control
│  ├─ mdx.tsx                          MDX component registry
│  └─ safety-note.tsx                  K3 callout
├─ content/docs/**                     MDX (incl. one seeded draft)
├─ source.config.ts                    Fumadocs MDX + draft frontmatter field
├─ middleware.ts                       ← deliverable 4: route gate
├─ auth.ts                             ← deliverable 4: NextAuth config
├─ next.config.mjs                     createMDX, /admin rewrite, PPR
└─ .env.example                        every variable, documented
```
