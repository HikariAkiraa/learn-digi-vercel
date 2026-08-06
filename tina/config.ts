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
 * IMPORTANT: Every Fumadocs component used in MDX needs a matching template
 * below, and a matching entry in components/mdx.tsx.
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
    label: 'Practicum Step',
    fields: [
      { name: 'title', label: 'Step Title', type: 'string' as const },
      { name: 'children', label: 'Instructions', type: 'rich-text' as const },
    ],
  },
  {
    name: 'SafetyNote',
    label: 'Safety Note',
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
  label: 'Practicum Modules',
  path: CONTENT_ROOT,
  format: 'mdx',

  ui: {
    allowedActions: {
      create: true,
      delete: true,
    },
    router: ({ document }) => {
      const segments = (document._sys.breadcrumbs ?? []).filter(
        (segment) => segment !== 'index',
      );
      return `/docs/${segments.join('/')}`;
    },

    filename: {
      slugify: (values) =>
        String(values?.title ?? 'new-module')
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
      label: 'Title',
      isTitle: true,
      required: true,
    },
    {
      type: 'string',
      name: 'description',
      label: 'Short Description',
      description: 'Appears under title and in search results.',
      ui: { component: 'textarea' },
    },
    {
      type: 'boolean',
      name: 'draft',
      label: 'Draft (Unpublished)',
      description:
        'ON = Page hidden from public site and search. OFF = Published after build.',
    },
    {
      type: 'string',
      name: 'course',
      label: 'Course',
      description: 'Must match slug in lib/courses.ts.',
      options: [
        { value: 'dasar-sistem-digital', label: 'Dasar Sistem Digital' },
        { value: 'pemrograman-dasar', label: 'Pemrograman Dasar' },
      ],
    },
    {
      type: 'string',
      name: 'icon',
      label: 'Sidebar Icon',
      description: 'Lucide icon name, e.g. "CircuitBoard". Leave blank if none.',
    },
    {
      type: 'boolean',
      name: 'full',
      label: 'Full Width',
      description: 'Hide Table of Contents on the right and use full width.',
    },
    {
      type: 'rich-text',
      name: 'body',
      label: 'Module Content',
      isBody: true,
      templates: mdxTemplates,
    },
  ],
};

const metaCollection: Collection = {
  name: 'meta',
  label: 'Sidebar Order (meta.json)',
  path: CONTENT_ROOT,
  format: 'json',
  match: { include: '**/meta' },
  ui: { allowedActions: { create: true, delete: true } },
  fields: [
    { type: 'string', name: 'title', label: 'Folder Name in Sidebar' },
    { type: 'string', name: 'description', label: 'Description' },
    { type: 'string', name: 'icon', label: 'Icon (Lucide)' },
    {
      type: 'boolean',
      name: 'root',
      label: 'Make Root (Standalone Tab)',
    },
    {
      type: 'boolean',
      name: 'defaultOpen',
      label: 'Open by Default',
    },
    {
      type: 'string',
      name: 'pages',
      label: 'Page Order',
      list: true,
      description:
        'File name without extension, or "..." for remaining files. Example: ["index", "module-1", "..."]',
    },
  ],
};

export default defineConfig({
  contentApiUrlOverride: '/api/tina/gql',
  clientId: null,
  token: null,

  branch: process.env.GITHUB_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? 'main',

  authProvider: isLocal ? new LocalAuthProvider() : new WhitelistAuthProvider(),

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'media',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [docsCollection, metaCollection],
  },
});
