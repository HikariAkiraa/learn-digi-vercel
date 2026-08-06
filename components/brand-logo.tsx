'use client';

export function BrandLogo({ className = 'size-6', alt = 'LearnDigi Logo' }: { className?: string; alt?: string }) {
  return (
    <span className="inline-flex items-center shrink-0">
      {/* Light Mode Logo (Blue) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-light.png"
        alt={alt}
        className={`block dark:hidden object-contain ${className}`}
      />
      {/* Dark Mode Logo (Cyan) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.png"
        alt={alt}
        className={`hidden dark:block object-contain ${className}`}
      />
    </span>
  );
}
