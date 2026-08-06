'use client';

import { useState } from 'react';
import { SquarePen } from 'lucide-react';
import { HackMDEditor } from '@/components/hackmd-editor';

export function EditModuleButton({ path }: { path: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-brand-gold/40 bg-brand-gold/10 px-3 py-1.5 text-sm font-medium text-brand-gold-ink transition-colors hover:bg-brand-gold/20 dark:text-brand-beige cursor-pointer"
      >
        <SquarePen className="size-4" aria-hidden />
        Edit Module
      </button>

      <HackMDEditor docPath={path} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
