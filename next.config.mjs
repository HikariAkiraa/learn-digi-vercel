import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
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
