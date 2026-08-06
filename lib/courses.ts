import type { LucideIcon } from 'lucide-react';
import { Binary, Cpu, CircuitBoard, Code2, Radio, Waves } from 'lucide-react';

export interface Course {
  /** Must match the top-level folder name under content/docs. */
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Free-text, shown on the card. */
  level: 'Dasar' | 'Menengah' | 'Lanjut';
  modules: number;
  /** Tailwind class applied to the card's accent rail. */
  accent: string;
}

/**
 * Course metadata is hardcoded rather than derived from the page tree on
 * purpose: the landing page needs blurbs, icons and ordering that do not belong
 * in MDX frontmatter. Adding a course = add an entry here + a folder under
 * content/docs with a matching slug.
 */
export const courses: Course[] = [
  {
    slug: 'sistem-digital-dasar',
    title: 'Sistem Digital Dasar',
    description:
      'Gerbang logika, aljabar Boolean, penyederhanaan K-Map, dan rangkaian kombinasional.',
    icon: Binary,
    level: 'Dasar',
    modules: 8,
    accent: 'bg-brand-cyan',
  },
  {
    slug: 'pemrograman-dasar',
    title: 'Pemrograman Dasar',
    description:
      'Alur kendali, struktur data dasar, dan praktik menulis program yang bisa dibaca orang lain.',
    icon: Code2,
    level: 'Dasar',
    modules: 10,
    accent: 'bg-brand-gold',
  },
  {
    slug: 'rangkaian-sekuensial',
    title: 'Rangkaian Sekuensial',
    description: 'Flip-flop, register geser, counter, dan perancangan finite state machine.',
    icon: CircuitBoard,
    level: 'Menengah',
    modules: 7,
    accent: 'bg-brand-navy',
  },
  {
    slug: 'mikroprosesor',
    title: 'Mikroprosesor & Mikrokontroler',
    description: 'Arsitektur, set instruksi, pemetaan memori, dan antarmuka periferal.',
    icon: Cpu,
    level: 'Menengah',
    modules: 9,
    accent: 'bg-brand-teal',
  },
  {
    slug: 'sistem-komunikasi',
    title: 'Sistem Komunikasi Digital',
    description: 'Modulasi, encoding kanal, dan pengukuran kualitas sinyal di lab.',
    icon: Radio,
    level: 'Lanjut',
    modules: 6,
    accent: 'bg-brand-beige',
  },
  {
    slug: 'pengolahan-sinyal',
    title: 'Pengolahan Sinyal Digital',
    description: 'Sampling, transformasi Fourier diskrit, dan perancangan filter FIR/IIR.',
    icon: Waves,
    level: 'Lanjut',
    modules: 6,
    accent: 'bg-brand-cyan',
  },
];

export function getCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}
