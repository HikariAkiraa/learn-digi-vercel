import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    // Keeps /docs pages statically prerendered even though the "Edit in CMS"
    // button reads the session. Without PPR, any page rendering <EditInCms />
    // becomes fully dynamic. See IMPLEMENTATION_PLAN.md -> "Cost of requirement 6".
    ppr: 'incremental',
  },
  async rewrites() {
    return [
      // `tinacms build` emits a static SPA to public/admin/index.html.
      // This lets admins visit /admin instead of /admin/index.html.
      { source: '/admin', destination: '/admin/index.html' },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(config);
