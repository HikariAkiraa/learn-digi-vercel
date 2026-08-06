import { docs } from 'collections/server';
import { loader, update } from 'fumadocs-core/source';

/**
 * Draft filtering.
 *
 * `update().files()` removes draft pages at the *input* layer — before the page
 * tree is built, before slugs are assigned, before the search index is
 * generated. A `draft: true` page therefore has no URL, appears in no sidebar,
 * and matches no search query. There is no "render it then hide it" step that
 * could leak the content.
 *
 * Drafts stay visible on `next dev` so an editor can preview before publishing.
 * Set HIDE_DRAFTS=true locally to reproduce production behaviour exactly.
 */
const showDrafts =
  process.env.NODE_ENV === 'development' && process.env.HIDE_DRAFTS !== 'true';

const publicSource = update(docs.toFumadocsSource())
  .files((files) =>
    files.filter((file) => {
      // meta.json files describe ordering; always keep them.
      if (file.type === 'meta') return true;
      if (showDrafts) return true;

      return file.data.draft !== true;
    }),
  )
  .build();

export const source = loader({
  baseUrl: '/docs',
  source: publicSource,
});

/**
 * Unfiltered loader — drafts included.
 *
 * Nothing public may use this. It exists so you can later add an admin-only
 * preview route (e.g. /preview/[[...slug]]) that reads drafts behind an
 * isAllowedAdmin() check, without weakening `source`.
 */
export const draftSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export type DocsPage = ReturnType<typeof source.getPage>;
