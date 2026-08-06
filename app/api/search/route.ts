import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

/**
 * Search index.
 *
 * Built from the same draft-filtered `source` the pages use, so a draft can
 * never surface as a search hit. That is a consequence of filtering at the
 * loader input rather than at render time — there is no separate place to
 * remember to exclude drafts.
 */
export const { GET } = createFromSource(source);
