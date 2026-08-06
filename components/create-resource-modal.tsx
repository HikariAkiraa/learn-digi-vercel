'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, FilePlus, FileDown, Download, Upload, Check, Pencil, Paperclip } from 'lucide-react';
import { useRouter } from 'next/navigation';

const iconOptions = [
  { name: 'FileDown', icon: FileDown, label: 'Simbol File Down' },
  { name: 'Download', icon: Download, label: 'Simbol Download' },
];

const categoryOptions = ['Dokumen', 'Installer'];

const accentOptions = [
  { name: 'Cyan', value: 'bg-cyan-400', colorHex: '#22d3ee' },
  { name: 'Amber', value: 'bg-amber-400', colorHex: '#fbbf24' },
  { name: 'Emerald', value: 'bg-emerald-400', colorHex: '#34d399' },
  { name: 'Purple', value: 'bg-purple-400', colorHex: '#c084fc' },
  { name: 'Rose', value: 'bg-rose-400', colorHex: '#fb7185' },
  { name: 'Indigo', value: 'bg-indigo-400', colorHex: '#818cf8' },
  { name: 'Red', value: 'bg-red-400', colorHex: '#f87171' },
  { name: 'Teal', value: 'bg-teal-400', colorHex: '#2dd4bf' },
];

export interface ResourceInitialData {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: string;
  category?: string;
  accent?: string;
  icon?: string;
}

interface CreateResourceModalProps {
  initialResource?: ResourceInitialData;
  triggerButton?: React.ReactNode;
}

export function CreateResourceModal({ initialResource, triggerButton }: CreateResourceModalProps) {
  const isEdit = !!initialResource;

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(initialResource?.title || '');
  const [description, setDescription] = useState(initialResource?.description || '');
  const [fileUrl, setFileUrl] = useState(initialResource?.fileUrl || '');
  const [fileName, setFileName] = useState(initialResource?.fileName || '');
  const [fileSize, setFileSize] = useState(initialResource?.fileSize || '');
  const [category, setCategory] = useState(initialResource?.category || 'Dokumen');
  const [icon, setIcon] = useState(initialResource?.icon || 'FileDown');
  const [accent, setAccent] = useState(initialResource?.accent || 'bg-cyan-400');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  function openModal() {
    if (initialResource) {
      setTitle(initialResource.title);
      setDescription(initialResource.description);
      setFileUrl(initialResource.fileUrl);
      setFileName(initialResource.fileName || '');
      setFileSize(initialResource.fileSize || '');
      setCategory(initialResource.category || 'Dokumen');
      setIcon(initialResource.icon || 'FileDown');
      setAccent(initialResource.accent || 'bg-cyan-400');
    }
    setError('');
    setIsOpen(true);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-resource', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFileUrl(data.url);
        setFileName(data.fileName || file.name);
        setFileSize(data.fileSize || '');
      } else {
        setError(data.error || 'Failed to upload attachment file.');
      }
    } catch (err) {
      setError('A connection error occurred while uploading the file.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Resource title cannot be empty.');
      return;
    }
    if (!fileUrl.trim()) {
      setError('Attachment file is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: isEdit ? initialResource.id : undefined,
          title,
          description,
          fileUrl,
          fileName,
          fileSize,
          category,
          accent,
          icon,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsOpen(false);
        if (!isEdit) {
          setTitle('');
          setDescription('');
          setFileUrl('');
          setFileName('');
          setFileSize('');
        }
        router.refresh();
      } else {
        setError(data.error || 'Failed to save resource.');
      }
    } catch (err) {
      setError('A connection error occurred while saving the resource.');
    } finally {
      setLoading(false);
    }
  }

  const modalJSX = (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-fd-border bg-fd-card px-6 py-4">
          <div className="flex items-center gap-2.5">
            {isEdit ? (
              <Pencil className="size-5 text-brand-gold" />
            ) : (
              <FilePlus className="size-5 text-fd-primary" />
            )}
            <h3 className="font-display text-xl font-semibold text-fd-card-foreground">
              {isEdit ? 'Edit Resource' : 'Add New Resource'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-left">
          {error && (
            <div className="mb-4 rounded-md border border-fd-error/45 bg-fd-error/10 p-3 text-sm text-fd-error">
              {error}
            </div>
          )}

          <form id="create-resource-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Resource Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Quartus II Web Edition v13.0"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Short Description
              </label>
              <textarea
                rows={3}
                placeholder="Brief explanation of software utility, installer, or lab document..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Attachment File (Upload File / Enter Download URL) *
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    placeholder="/uploads/resources/file.pdf or https://..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full rounded-lg border border-fd-border bg-fd-background pl-9 pr-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
                  />
                  <Paperclip className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-fd-border bg-fd-accent px-3 py-2 text-xs font-semibold text-fd-foreground transition-colors hover:bg-fd-accent/80 shrink-0">
                  <Upload className="size-3.5 text-fd-primary" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {fileUrl && (
                <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-fd-border bg-fd-background p-2.5">
                  <FileDown className="size-5 text-fd-primary shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs font-medium text-fd-foreground">{fileName || fileUrl}</p>
                    <p className="flex items-center gap-2 text-[11px] text-fd-muted-foreground">
                      <span className="flex items-center gap-1 text-fd-primary font-medium">
                        <Check className="size-3" /> Ready for download
                      </span>
                      {fileSize && <span>· {fileSize}</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-2">
                Category
              </label>
              <div className="flex gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                      category === cat
                        ? 'border-fd-primary bg-fd-primary/10 text-fd-primary font-semibold'
                        : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-2">
                Select Symbol / Icon
              </label>
              <div className="flex gap-2">
                {iconOptions.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-fd-primary bg-fd-primary/10 text-fd-primary font-semibold'
                          : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40'
                      }`}
                    >
                      <IconComp className="size-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-2">
                Card Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {accentOptions.map((opt) => {
                  const isSelected = accent === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAccent(opt.value)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-fd-primary bg-fd-primary/10 text-fd-primary font-semibold'
                          : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40'
                      }`}
                    >
                      <span
                        className="size-3.5 rounded-full border border-black/20 shadow-sm shrink-0"
                        style={{ backgroundColor: opt.colorHex }}
                        aria-hidden
                      />
                      {opt.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-fd-border bg-fd-card px-6 py-4">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-resource-form"
            disabled={loading || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Add Resource'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {triggerButton ? (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal();
          }}
          className="inline-block cursor-pointer"
        >
          {triggerButton}
        </span>
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-semibold text-fd-primary-foreground shadow-sm transition-transform hover:-translate-y-px cursor-pointer"
        >
          <Plus className="size-4" />
          Add New Resource
        </button>
      )}

      {isOpen && mounted ? createPortal(modalJSX, document.body) : null}
    </>
  );
}
