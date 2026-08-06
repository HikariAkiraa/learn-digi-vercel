'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteModuleButton({ path }: { path: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch('/api/delete-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docPath: path }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfirm(false);

        // Find sibling module in DOM to navigate to (prevent 404)
        let fallbackUrl = '/docs';
        const sidebarEl = document.querySelector('#nd-sidebar') || document.querySelector('aside');
        if (sidebarEl) {
          const currentNorm = path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.mdx?$/, '');
          const allLinks = Array.from(sidebarEl.querySelectorAll('a[href*="/docs/"]')) as HTMLAnchorElement[];

          const currentIndex = allLinks.findIndex((link) => {
            const href = link.getAttribute('href') || '';
            return href.includes(currentNorm) || currentNorm.includes(href.replace('/docs/', ''));
          });

          if (currentIndex !== -1) {
            // Pick previous sibling, or next sibling
            const sibling = allLinks[currentIndex - 1] || allLinks[currentIndex + 1];
            if (sibling && sibling.getAttribute('href')) {
              fallbackUrl = sibling.getAttribute('href')!;
            }
          } else if (allLinks.length > 0 && allLinks[0].getAttribute('href')) {
            fallbackUrl = allLinks[0].getAttribute('href')!;
          }
        }

        window.location.href = fallbackUrl;
      } else {
        setError(data.error || 'Failed to delete document');
      }
    } catch (err) {
      setError('Connection error while deleting document');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20 cursor-pointer"
        title="Delete this module document"
      >
        <Trash2 className="size-4" aria-hidden />
        Delete Module
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-fd-border pb-3">
              <div className="flex items-center gap-2 text-red-500 font-semibold text-base">
                <AlertTriangle className="size-5" />
                <span>Delete Module Document</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg p-1 text-fd-muted-foreground hover:bg-fd-accent cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-fd-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-mono text-fd-foreground font-semibold">{path}</span>? This action cannot be undone.
            </p>

            {error && (
              <div className="text-xs font-semibold text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-1.5 rounded-lg border border-fd-border text-xs font-semibold text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="size-3.5" />
                {deleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
