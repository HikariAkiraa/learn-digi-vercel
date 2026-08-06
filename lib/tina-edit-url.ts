/**
 * Maps a Fumadocs page back to its TinaCMS edit screen.
 *
 * Fumadocs gives us `page.path` — the virtual path relative to the content
 * directory, e.g. `basic-digital-system/gerbang-logika.mdx`.
 *
 * Tina's admin SPA is a hash router:
 *   /admin/index.html#/collections/edit/<collectionName>/<documentPath>
 *
 * `TINA_DOC_PATH_INCLUDES_EXTENSION` exists because Tina has shipped both
 * conventions. If a generated link lands on Tina's "document not found" screen,
 * flip this constant — that is the only thing that needs to change.
 */
const TINA_COLLECTION = 'docs';
const TINA_DOC_PATH_INCLUDES_EXTENSION = false;

export function tinaEditUrl(virtualPath: string): string {
  const normalised = virtualPath.replace(/\\/g, '/').replace(/^\/+/, '');

  const documentPath = TINA_DOC_PATH_INCLUDES_EXTENSION
    ? (normalised.endsWith('.mdx') ? normalised : `${normalised}.mdx`)
    : normalised.replace(/\.mdx?$/, '');

  return `/admin/index.html#/~/docs/${documentPath}`;
}

/** Link straight to Tina's "new document" form for the docs collection. */
export function tinaNewDocUrl(): string {
  return `/admin/index.html#/collections/new/${TINA_COLLECTION}`;
}
