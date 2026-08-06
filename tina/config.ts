import { defineConfig, LocalAuthProvider, type Collection } from 'tinacms';
import { WhitelistAuthProvider } from './auth-provider';

/**
 * TinaCMS — self-hosted configuration.
 *
 * Content is written straight into `content/docs`, which is the directory
 * `source.config.ts` hands to Fumadocs MDX. There is no sync step and no second
 * copy of the content: Tina commits MDX to git, Vercel rebuilds, Fumadocs reads
 * the same files. One source of truth.
 */

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === 'true';

/** Must match `dir` in source.config.ts. */
const CONTENT_ROOT = 'content/docs';

/**
 * Rich-text templates.
 *
 * IMPORTANT, and the most common way this setup breaks: Tina parses MDX into
 * its own AST. Any JSX component that appears in a document but is *not*
 * declared here will fail to parse, and Tina will show "unsupported element"
 * instead of the content. Every Fumadocs component you intend to use inside
 * MDX needs a matching template below, and a matching entry in
 * components/mdx.tsx so it renders on the public site.
 */
const mdxTemplates = [
  {
    name: 'Callout',
    label: 'Callout',
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'string' as const,
        options: ['info', 'warn', 'error', 'success'],
      },
      { name: 'title', label: 'Title', type: 'string' as const },
      { name: 'children', label: 'Body', type: 'rich-text' as const },
    ],
  },
  {
    name: 'Step',
    label: 'Step (praktikum)',
    fields: [
      { name: 'title', label: 'Step title', type: 'string' as const },
      { name: 'children', label: 'Instructions', type: 'rich-text' as const },
    ],
  },
  {
    name: 'SafetyNote',
    label: 'Safety / K3 note',
    fields: [
      {
        name: 'level',
        label: 'Severity',
        type: 'string' as const,
        options: ['caution', 'warning', 'danger'],
      },
      { name: 'children', label: 'Body', type: 'rich-text' as const },
    ],
  },
];

const docsCollection: Collection = {
  name: 'docs',
  label: 'Modul Praktikum',
  path: CONTENT_ROOT,
  format: 'mdx',

  ui: {
    /**
     * "View page" link inside the Tina editor. Fumadocs treats `index.mdx` as
     * the folder root, so strip it to get the real URL.
     */
    router: ({ document }) => {
      const segments = (document._sys.breadcrumbs ?? []).filter(
        (segment) => segment !== 'index',
      );
      return `/docs/${segments.join('/')}`;
    },

    /** New documents start unpublished. Publishing is always an explicit act. */
    defaultItem: () => ({
      draft: true,
      title: 'Modul Baru',
    }),

    filename: {
      // Slugify what the editor types so URLs stay clean.
      slugify: (values) =>
        String(values?.title ?? 'modul-baru')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''),
    },
  },

  fields: [
    {
      type: 'string',
      name: 'title',
      label: 'Judul',
      isTitle: true,
      required: true,
    },
    {
      type: 'string',
      name: 'description',
      label: 'Deskripsi singkat',
      description: 'Muncul di bawah judul dan di hasil pencarian.',
      ui: { component: 'textarea' },
    },
    {
      /* ------------------------------------------------------------------
         The draft switch.

         lib/source.ts drops every file with draft: true before Fumadocs builds
         the page tree — so a draft has no URL, no sidebar entry, and no search
         index entry. Toggling this to false and saving commits to git, which
         triggers the Vercel deploy that publishes it.
      ------------------------------------------------------------------ */
      type: 'boolean',
      name: 'draft',
      label: 'Draft (belum dipublikasikan)',
      description:
        'ON = halaman tersembunyi total dari situs publik, sidebar, dan pencarian. OFF = tayang setelah deploy selesai (~1 menit).',
    },
    {
      type: 'string',
      name: 'course',
      label: 'Mata praktikum',
      description: 'Harus cocok dengan slug di lib/courses.ts.',
      options: [
        { value: 'sistem-digital-dasar', label: 'Sistem Digital Dasar' },
        { value: 'pemrograman-dasar', label: 'Pemrograman Dasar' },
        { value: 'rangkaian-sekuensial', label: 'Rangkaian Sekuensial' },
        { value: 'mikroprosesor', label: 'Mikroprosesor & Mikrokontroler' },
        { value: 'sistem-komunikasi', label: 'Sistem Komunikasi Digital' },
        { value: 'pengolahan-sinyal', label: 'Pengolahan Sinyal Digital' },
      ],
    },
    {
      type: 'string',
      name: 'icon',
      label: 'Ikon sidebar',
      description: 'Nama ikon Lucide, mis. "CircuitBoard". Kosongkan jika tidak perlu.',
    },
    {
      type: 'boolean',
      name: 'full',
      label: 'Lebar penuh',
      description: 'Sembunyikan daftar isi di kanan dan gunakan lebar penuh.',
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Isi modul',
      isBody: true,
      templates: mdxTemplates,
    },
  ],
};

/**
 * Fumadocs reads meta.json files to order and group the sidebar. Exposing them
 * to Tina means admins can reorder modules without touching the repo.
 */
const metaCollection: Collection = {
  name: 'meta',
  label: 'Urutan Sidebar (meta.json)',
  path: CONTENT_ROOT,
  format: 'json',
  match: { include: '**/meta' },
  ui: { allowedActions: { create: true, delete: true } },
  fields: [
    { type: 'string', name: 'title', label: 'Nama folder di sidebar' },
    { type: 'string', name: 'description', label: 'Deskripsi' },
    { type: 'string', name: 'icon', label: 'Ikon (Lucide)' },
    {
      type: 'boolean',
      name: 'root',
      label: 'Jadikan root (tab tersendiri)',
    },
    {
      type: 'boolean',
      name: 'defaultOpen',
      label: 'Terbuka secara default',
    },
    {
      type: 'string',
      name: 'pages',
      label: 'Urutan halaman',
      list: true,
      description:
        'Nama file tanpa ekstensi, atau "..." untuk sisanya. Contoh: ["index", "gerbang-logika", "..."].',
    },
  ],
};

export default defineConfig({
  /**
   * Point the browser client at our own backend instead of TinaCloud.
   * `clientId` and `token` stay null — there is no TinaCloud project.
   */
  contentApiUrlOverride: '/api/tina/gql',
  clientId: null,
  token: null,

  branch: process.env.GITHUB_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? 'main',

  /**
   * Local dev skips auth entirely (`tinacms dev` runs an in-memory database).
   * In production the whitelist provider takes over — see ./auth-provider.ts.
   */
  authProvider: isLocal ? new LocalAuthProvider() : new WhitelistAuthProvider(),

  build: {
    // Emits the admin SPA to public/admin/index.html.
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'media',
      publicFolder: 'public',
    },
  },

  /**
   * No `search` block on purpose. Tina's search indexer is a TinaCloud
   * feature and would fail against a self-hosted backend. Site search is
   * Fumadocs' own Orama index (app/api/search/route.ts), which has the added
   * benefit of being built from the same draft-filtered source as the pages.
   */

  schema: {
    collections: [docsCollection, metaCollection],
  },
});
