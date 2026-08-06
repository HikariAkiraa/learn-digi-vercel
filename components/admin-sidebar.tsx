'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, FilePlus, X } from 'lucide-react';

export function AdminSidebarBanner() {
  const [hoverGap, setHoverGap] = useState<{
    show: boolean;
    top: number;
    left: number;
    width: number;
    folderPath: string;
    targetSlug: string;
    position: 'before' | 'after';
  }>({
    show: false,
    top: 0,
    left: 0,
    width: 0,
    folderPath: 'dasar-sistem-digital',
    targetSlug: '',
    position: 'after',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const pathname = usePathname() || '';

  // Extract default folder slug from pathname (/docs/dasar-sistem-digital/... -> dasar-sistem-digital)
  const pathParts = pathname.split('/').filter(Boolean);
  const currentFolder = pathParts.length > 1 ? pathParts[1] : (pathParts[0] !== 'docs' ? pathParts[0] : 'dasar-sistem-digital');

  useEffect(() => {
    const sidebarEl = document.querySelector('#nd-sidebar') || document.querySelector('aside');
    if (!sidebarEl) return;

    function handleMouseMove(e: MouseEvent) {
      if (!sidebarEl) return;
      const sidebarRect = sidebarEl.getBoundingClientRect();

      // Bounds check within sidebar container
      if (
        e.clientX < sidebarRect.left ||
        e.clientX > sidebarRect.right ||
        e.clientY < sidebarRect.top ||
        e.clientY > sidebarRect.bottom
      ) {
        setHoverGap((prev) => (prev.show ? { ...prev, show: false } : prev));
        return;
      }

      // Check search bar / top header bounds in sidebar to prevent hover line overlapping search bar
      const searchBarEl = sidebarEl.querySelector('button, [role="search"], input, .fumadocs-search, a[href*="search"]');
      if (searchBarEl) {
        const searchRect = searchBarEl.getBoundingClientRect();
        if (e.clientY <= searchRect.bottom + 8) {
          setHoverGap((prev) => (prev.show ? { ...prev, show: false } : prev));
          return;
        }
      }

      // Find all sidebar links / items
      const itemEls = Array.from(sidebarEl.querySelectorAll('a[href*="/docs/"]'));
      let foundGap = false;

      for (let i = 0; i < itemEls.length; i++) {
        const itemEl = itemEls[i] as HTMLElement;
        const rect = itemEl.getBoundingClientRect();
        const href = itemEl.getAttribute('href') || '';
        const parts = href.split('/').filter(Boolean);

        // Correct folder & slug extraction: /docs/dasar-sistem-digital/module-1 -> folder is dasar-sistem-digital, slug is module-1
        let folder = currentFolder;
        let slug = '';
        if (parts.length >= 2 && parts[1] !== 'docs') {
          folder = parts[1];
          slug = parts[2] || parts[1];
        } else if (parts.length === 1 && parts[0] !== 'docs') {
          folder = parts[0];
          slug = parts[0];
        }

        // Check top edge of item (insert before)
        if (Math.abs(e.clientY - rect.top) <= 8) {
          setHoverGap({
            show: true,
            top: rect.top,
            left: rect.left,
            width: rect.width,
            folderPath: folder,
            targetSlug: slug,
            position: 'before',
          });
          foundGap = true;
          break;
        }
        // Check bottom edge of item (insert after)
        if (Math.abs(e.clientY - rect.bottom) <= 8) {
          setHoverGap({
            show: true,
            top: rect.bottom,
            left: rect.left,
            width: rect.width,
            folderPath: folder,
            targetSlug: slug,
            position: 'after',
          });
          foundGap = true;
          break;
        }
      }

      if (!foundGap) {
        setHoverGap((prev) => (prev.show ? { ...prev, show: false } : prev));
      }
    }

    // Attach drag-and-drop to native sidebar items
    function attachDragListeners() {
      if (!sidebarEl) return;
      const links = Array.from(sidebarEl.querySelectorAll('a[href*="/docs/"]')) as HTMLElement[];

      links.forEach((link) => {
        link.setAttribute('draggable', 'true');

        link.ondragstart = (e) => {
          const href = link.getAttribute('href') || '';
          const parts = href.split('/').filter(Boolean);
          const folderPath = parts.length >= 2 && parts[1] !== 'docs' ? parts[1] : currentFolder;
          const pageSlug = parts.length > 2 ? parts[2] : parts[1] || '';

          if (e.dataTransfer) {
            e.dataTransfer.setData('application/json', JSON.stringify({ folderPath, pageSlug }));
            e.dataTransfer.effectAllowed = 'move';
          }
          link.style.opacity = '0.4';
        };

        link.ondragend = () => {
          link.style.opacity = '1';
          link.style.border = '';
        };

        link.ondragover = (e) => {
          e.preventDefault();
          link.style.border = '2px dashed var(--color-fd-primary, #03eaff)';
        };

        link.ondragleave = () => {
          link.style.border = '';
        };

        link.ondrop = async (e) => {
          e.preventDefault();
          link.style.border = '';

          try {
            const dataStr = e.dataTransfer?.getData('application/json');
            if (!dataStr) return;
            const data = JSON.parse(dataStr);

            const targetHref = link.getAttribute('href') || '';
            const targetParts = targetHref.split('/').filter(Boolean);
            const targetFolder = targetParts.length >= 2 && targetParts[1] !== 'docs' ? targetParts[1] : currentFolder;
            const targetSlug = targetParts.length > 2 ? targetParts[2] : targetParts[1] || '';

            if (!data.pageSlug || data.folderPath !== targetFolder || data.pageSlug === targetSlug) {
              return;
            }

            const res = await fetch('/api/reorder-docs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                folderPath: targetFolder,
                draggedSlug: data.pageSlug,
                targetSlug,
              }),
            });

            if (res.ok) {
              window.location.reload();
            }
          } catch (err) {
            console.error('Drag drop error:', err);
          }
        };
      });
    }

    function handleScroll() {
      setHoverGap((prev) => (prev.show ? { ...prev, show: false } : prev));
    }

    const timer = setTimeout(attachDragListeners, 400);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    window.addEventListener('wheel', handleScroll, { capture: true, passive: true });
    sidebarEl.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('wheel', handleScroll, { capture: true });
      sidebarEl.removeEventListener('scroll', handleScroll);
    };
  }, [currentFolder, router]);

  async function handleCreateModule() {
    if (!newTitle.trim()) {
      setError('Module title is required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/create-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderPath: hoverGap.folderPath || currentFolder,
          title: newTitle,
          targetSlug: hoverGap.targetSlug,
          position: hoverGap.position,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setHoverGap((prev) => ({ ...prev, show: false }));
        // Brief 300ms delay allows Next.js dev server file watcher to re-index disk edit before reloading page
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        setError(data.error || 'Failed to create module');
      }
    } catch (err) {
      setError('Connection error while creating module');
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {/* Floating Hover Plus Line Indicator — pointer-events-none allows uninterrupted mouse wheel scrolling! */}
      {hoverGap.show && (
        <div
          className="fixed z-[120] pointer-events-none flex items-center justify-center transition-all animate-in fade-in duration-150"
          style={{
            top: `${hoverGap.top - 10}px`,
            left: `${hoverGap.left}px`,
            width: `${hoverGap.width}px`,
            height: '20px',
          }}
        >
          <div className="w-full h-full flex items-center relative group pointer-events-none">
            <div className="w-full h-[1px] bg-fd-primary/80 border-t border-dashed border-fd-primary/80 shadow-xs pointer-events-none" />
            <button
              type="button"
              onClick={() => {
                setNewTitle('');
                setError('');
                setShowCreateModal(true);
              }}
              className="pointer-events-auto absolute left-1/2 -translate-x-1/2 size-5 rounded-full bg-fd-primary text-fd-primary-foreground flex items-center justify-center shadow-md hover:scale-125 transition-transform cursor-pointer"
              title="Click to insert new module here"
            >
              <Plus className="size-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* Create Module Pop-up Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-fd-border pb-3">
              <div className="flex items-center gap-2 text-fd-foreground font-semibold text-base">
                <FilePlus className="size-5 text-fd-primary" />
                <span>Create New Module</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-fd-muted-foreground hover:bg-fd-accent cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-fd-muted-foreground leading-relaxed">
              Enter title for module to insert into <span className="font-mono font-semibold text-fd-foreground">{hoverGap.folderPath || currentFolder}</span>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-fd-foreground">Module Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateModule();
                }}
                placeholder="e.g. Module 2 - Digital Logic Circuits"
                className="w-full rounded-xl border border-fd-border bg-fd-background px-3.5 py-2 text-sm text-fd-foreground focus:border-fd-primary focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-xs font-semibold text-red-500 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 rounded-lg border border-fd-border text-xs font-semibold text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateModule}
                disabled={creating}
                className="px-4 py-1.5 rounded-lg bg-fd-primary hover:bg-fd-primary/90 text-xs font-semibold text-fd-primary-foreground cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="size-3.5" />
                {creating ? 'Creating...' : 'Create Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
