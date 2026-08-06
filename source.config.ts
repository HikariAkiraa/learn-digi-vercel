import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    // Extends Fumadocs' built-in frontmatter (title, description, icon, full, ...)
    // with the fields TinaCMS writes.
    schema: frontmatterSchema.extend({
      draft: z.boolean().default(false),
      course: z.string().optional(),
    }),
  },
  meta: {
    schema: metaSchema.extend({
      description: z.string().optional(),
    }),
  },
});

export default defineConfig();
