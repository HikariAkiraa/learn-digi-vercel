'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, FolderPlus, Binary, Code2, CircuitBoard, Cpu, Radio, Waves, Wrench, ShieldCheck, BookOpen, Image as ImageIcon, Upload, Check, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

const iconOptions = [
  { name: 'Binary', icon: Binary },
  { name: 'Code2', icon: Code2 },
  { name: 'CircuitBoard', icon: CircuitBoard },
  { name: 'Cpu', icon: Cpu },
  { name: 'Radio', icon: Radio },
  { name: 'Waves', icon: Waves },
  { name: 'Wrench', icon: Wrench },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'BookOpen', icon: BookOpen },
];

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

export interface CourseInitialData {
  slug: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  level?: 'Basic' | 'Intermediate' | 'Advanced' | string;
  accent?: string;
}

interface CreateCourseModalProps {
  initialCourse?: CourseInitialData;
  triggerButton?: React.ReactNode;
}

export function CreateCourseModal({ initialCourse, triggerButton }: CreateCourseModalProps) {
  const isEdit = !!initialCourse;

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(initialCourse?.title || '');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [icon, setIcon] = useState(initialCourse?.icon || 'BookOpen');
  const [image, setImage] = useState(initialCourse?.image || '');
  const [level, setLevel] = useState<'Basic' | 'Intermediate' | 'Advanced'>(
    (initialCourse?.level as any) || 'Basic'
  );
  const [accent, setAccent] = useState(initialCourse?.accent || 'bg-brand-cyan');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  function openModal() {
    if (initialCourse) {
      setTitle(initialCourse.title);
      setDescription(initialCourse.description);
      setIcon(initialCourse.icon || 'BookOpen');
      setImage(initialCourse.image || '');
      setLevel((initialCourse.level as any) || 'Basic');
      setAccent(initialCourse.accent || 'bg-brand-cyan');
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
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImage(data.url);
      } else {
        setError(data.error || 'Failed to upload logo image.');
      }
    } catch (err) {
      setError('A connection error occurred while uploading the logo.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Course title cannot be empty.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/create-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          editSlug: isEdit ? initialCourse.slug : undefined,
          title,
          description,
          icon,
          image,
          level,
          accent,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsOpen(false);
        if (!isEdit) {
          setTitle('');
          setDescription('');
          setImage('');
        }
        router.refresh();
      } else {
        setError(data.error || 'Failed to save course.');
      }
    } catch (err) {
      setError('A connection error occurred while saving the course.');
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
              <FolderPlus className="size-5 text-fd-primary" />
            )}
            <h3 className="font-display text-xl font-semibold text-fd-card-foreground">
              {isEdit ? 'Edit Laboratory Course' : 'Create New Laboratory Course'}
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

          <form id="create-course-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Course / Subject Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Sequential Circuits"
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
                placeholder="Brief summary of course topics and learning objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Logo / PNG Image (Cloudinary URL / File Upload)
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="https://res.cloudinary.com/demo/image/upload/v1234/logo.png or /uploads/logos/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full rounded-lg border border-fd-border bg-fd-background pl-9 pr-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
                  />
                  <ImageIcon className="absolute left-3 top-2.5 size-4 text-fd-muted-foreground" />
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-fd-border bg-fd-accent px-3 py-2 text-xs font-semibold text-fd-foreground transition-colors hover:bg-fd-accent/80">
                  <Upload className="size-3.5 text-fd-primary" />
                  {uploading ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
              {image && (
                <div className="mt-2.5 flex items-center gap-2.5 rounded-lg border border-fd-border bg-fd-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Preview" className="size-8 object-contain rounded bg-fd-card p-0.5 border border-fd-border" />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-xs font-medium text-fd-foreground">{image}</p>
                    <p className="flex items-center gap-1 text-[11px] text-fd-primary font-medium">
                      <Check className="size-3" /> Logo active for course card
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground">
                Difficulty Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="mt-1.5 w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2 text-sm text-fd-foreground shadow-sm focus:border-fd-primary focus:outline-none"
              >
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-2">
                Select Fallback Icon (If No Image Provided)
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = icon === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIcon(item.name)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-fd-primary bg-fd-primary/10 text-fd-primary'
                          : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-primary/40'
                      }`}
                    >
                      <IconComp className="size-4" />
                      {item.name}
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
            form="create-course-form"
            disabled={loading || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-5 py-2 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Course'}
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
          Add New Course
        </button>
      )}

      {isOpen && mounted ? createPortal(modalJSX, document.body) : null}
    </>
  );
}
