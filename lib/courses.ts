import fs from 'fs';
import path from 'path';
import type { LucideIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export interface Course {
  /** Must match the top-level folder name under content/docs. */
  slug: string;
  /** Guaranteed working route URL for this course card. */
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconName: string;
  /** Optional image / PNG logo URL (e.g. Cloudinary). */
  image?: string;
  /** Free-text, shown on the card. */
  level: 'Basic' | 'Intermediate' | 'Advanced' | string;
  modules: number;
  /** Tailwind class applied to the card's accent rail. */
  accent: string;
  /** Tailwind hover border color matching the card accent color. */
  hoverBorder: string;
}

const defaultAccents = [
  'bg-cyan-400',
  'bg-amber-400',
  'bg-emerald-400',
  'bg-purple-400',
  'bg-rose-400',
  'bg-indigo-400',
  'bg-red-400',
  'bg-teal-400',
];

export function getHoverBorderClass(accent: string): string {
  if (accent.includes('cyan')) return 'hover:border-cyan-400';
  if (accent.includes('amber') || accent.includes('gold')) return 'hover:border-amber-400';
  if (accent.includes('emerald')) return 'hover:border-emerald-400';
  if (accent.includes('purple')) return 'hover:border-purple-400';
  if (accent.includes('rose')) return 'hover:border-rose-400';
  if (accent.includes('indigo')) return 'hover:border-indigo-400';
  if (accent.includes('red')) return 'hover:border-red-400';
  if (accent.includes('navy')) return 'hover:border-sky-500';
  if (accent.includes('teal')) return 'hover:border-teal-400';
  return 'hover:border-cyan-400';
}

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'docs');

/**
 * Dynamically discover course folders under content/docs so creating/deleting
 * folders automatically updates the course cards on the web without 404s.
 */
export function getCourses(): Course[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];

  const entries = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true });

  const courseFolders = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== 'setup' && !entry.name.startsWith('.'),
  );

  return courseFolders.map((dir, index) => {
    const folderSlug = dir.name;
    const folderPath = path.join(CONTENT_ROOT, folderSlug);

    // Read meta.json if present
    const metaPath = path.join(folderPath, 'meta.json');
    let meta: {
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
      level?: string;
      accent?: string;
    } = {};

    if (fs.existsSync(metaPath)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      } catch (e) {}
    }

    // Count .mdx files and find the first page fallback to prevent 404s
    let mdxCount = 0;
    let href = `/docs/${folderSlug}`;
    try {
      const files = fs.readdirSync(folderPath).filter(
        (f) => f.endsWith('.mdx') && !f.startsWith('.'),
      );
      mdxCount = files.length;

      const hasIndex = files.some((f) => f.toLowerCase() === 'index.mdx');
      if (hasIndex) {
        href = `/docs/${folderSlug}`;
      } else if (files.length > 0) {
        const firstMdx = files[0].replace(/\.mdx?$/, '');
        href = `/docs/${folderSlug}/${firstMdx}`;
      } else {
        href = `/docs`;
      }
    } catch (e) {}

    // Resolve icon
    const iconName = meta.icon || 'BookOpen';
    const IconComponent =
      (LucideIcons as Record<string, any>)[iconName] || LucideIcons.BookOpen;

    const formattedTitle =
      meta.title ||
      folderSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const accent = meta.accent || defaultAccents[index % defaultAccents.length];

    return {
      slug: folderSlug,
      href,
      title: formattedTitle,
      description: meta.description || `Practicum modules and learning materials for ${formattedTitle}.`,
      icon: IconComponent,
      iconName,
      image: meta.image || undefined,
      level: meta.level || 'Basic',
      modules: mdxCount,
      accent,
      hoverBorder: getHoverBorderClass(accent),
    };
  });
}

export const courses = getCourses();

export function getCourse(slug: string): Course | undefined {
  return getCourses().find((course) => course.slug === slug);
}
