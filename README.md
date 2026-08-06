# Learn Digi

Dokumentasi praktikum Laboratorium Digital.
Next.js 16 (App Router) · Fumadocs 16 · TinaCMS 3 (self-hosted) · Auth.js v5 · Tailwind CSS v4.

## Mulai cepat

```bash
npm install
copy .env.example .env.local
npx auth secret
npm run dev
```

Buka http://localhost:3000. CMS lokal ada di http://localhost:3000/admin/index.html
(tanpa login — `TINA_PUBLIC_IS_LOCAL=true` melewati autentikasi).

## Script

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Database Tina in-memory, tanpa login, draft terlihat |
| `npm run dev:cms` | Simulasi produksi: login Google + Redis + commit ke GitHub |
| `npm run build` | `tinacms build && next build` |
| `npm run typecheck` | `tsc --noEmit` |

## Menambah admin

Satu tempat saja: `ALLOWED_ADMIN_EMAILS` di `.env.local` (lokal) dan di
Vercel → Settings → Environment Variables (produksi). Dipisah koma. Nilai
kosong berarti **tidak ada** yang punya akses.

## Alur publikasi

Setiap dokumen punya frontmatter `draft`. Selama `draft: true`, halaman tidak
punya URL, tidak muncul di sidebar, dan tidak terindeks pencarian. Ubah ke
`false` lewat CMS → Tina commit ke GitHub → Vercel deploy → halaman tayang.

## Dokumentasi lengkap

Arsitektur, keputusan desain, batasan yang diketahui, dan checklist deploy ada
di [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md).
