'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Save,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Palette,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Minus,
  Quote,
  Upload,
  Columns,
  Code2,
  Eye,
  Check,
  AlertCircle,
  FileText,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Undo2,
  Redo2,
  Link,
  Image as ImageIcon,
  MessageSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HackMDEditorProps {
  docPath: string;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'split' | 'code' | 'preview';

export function HackMDEditor({ docPath, isOpen, onClose }: HackMDEditorProps) {
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [splitPercentage, setSplitPercentage] = useState<number>(50);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const [initialDraft, setInitialDraft] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [frontmatterMeta, setFrontmatterMeta] = useState<{
    title: string;
    description: string;
    draft: boolean;
    icon: string;
  }>({
    title: '',
    description: '',
    draft: false,
    icon: '',
  });

  const isDraggingRef = useRef<boolean>(false);
  const mainContainerRef = useRef<HTMLElement>(null);

  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoAction = useRef<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tablePickerPos, setTablePickerPos] = useState({ top: 0, left: 0 });
  const [tableHoverGrid, setTableHoverGrid] = useState({ rows: 1, cols: 1 });
  const tablePickerButtonRef = useRef<HTMLButtonElement>(null);

  const isDirty =
    content !== initialContent ||
    frontmatterMeta.draft !== initialDraft ||
    frontmatterMeta.title !== initialTitle;

  const handleMouseDownSplitter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current || !mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const newPercentage = Math.min(80, Math.max(20, (offsetX / rect.width) * 100));
      setSplitPercentage(newPercentage);
    }

    function handleMouseUp() {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Record snapshot into history stack
  const recordHistorySnapshot = useCallback((newText: string) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const currentStack = historyStackRef.current;
    const currentIndex = historyIndexRef.current;

    // Don't push duplicate consecutive snapshots
    if (currentIndex >= 0 && currentStack[currentIndex] === newText) {
      return;
    }

    const newStack = currentStack.slice(0, currentIndex + 1);
    newStack.push(newText);

    if (newStack.length > 100) {
      newStack.shift();
    }

    historyStackRef.current = newStack;
    historyIndexRef.current = newStack.length - 1;
  }, []);

  // Update content and push to history
  const updateContent = useCallback(
    (newText: string) => {
      setContent(newText);
      recordHistorySnapshot(newText);
    },
    [recordHistorySnapshot]
  );

  // Handle Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      isUndoRedoAction.current = true;
      const targetText = historyStackRef.current[historyIndexRef.current];
      setContent(targetText);
    }
  }, []);

  // Handle Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current += 1;
      isUndoRedoAction.current = true;
      const targetText = historyStackRef.current[historyIndexRef.current];
      setContent(targetText);
    }
  }, []);

  // Fetch document content when modal opens & strip Frontmatter YAML from editor
  useEffect(() => {
    if (!isOpen || !docPath) return;

    setLoading(true);
    setError('');

    fetch(`/api/read-doc?path=${encodeURIComponent(docPath)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const fullText = data.content || '';
          const match = fullText.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*/);

          let bodyText = fullText;
          let meta = {
            title: docPath.split('/').pop()?.replace(/\.mdx?$/, '') || 'Untitled Document',
            description: '',
            draft: false,
            icon: '',
          };

          if (match) {
            const yamlStr = match[1];
            bodyText = fullText.slice(match[0].length);

            const titleMatch = yamlStr.match(/title:\s*['"]?(.*?)['"]?\s*$/m);
            const descMatch = yamlStr.match(/description:\s*['"]?(.*?)['"]?\s*$/m);
            const draftMatch = yamlStr.match(/draft:\s*(true|false)\s*$/m);
            const iconMatch = yamlStr.match(/icon:\s*['"]?(.*?)['"]?\s*$/m);

            meta = {
              title: titleMatch ? titleMatch[1] : meta.title,
              description: descMatch ? descMatch[1] : '',
              draft: draftMatch ? draftMatch[1] === 'true' : false,
              icon: iconMatch ? iconMatch[1] : '',
            };
          }

          setFrontmatterMeta(meta);
          setContent(bodyText);
          setInitialContent(bodyText);
          setInitialDraft(meta.draft);
          setInitialTitle(meta.title);
          historyStackRef.current = [bodyText];
          historyIndexRef.current = 0;
        } else {
          setError(data.error || 'Failed to load document content');
        }
      })
      .catch(() => setError('Connection error while fetching document'))
      .finally(() => setLoading(false));
  }, [isOpen, docPath]);

  // Execute Save document with Draft vs Publish choice
  const executeSave = useCallback(
    async (isDraft: boolean) => {
      if (!docPath || saving) return false;

      setSaving(true);
      setError('');
      setSaveMessage('');

      const titleVal = frontmatterMeta.title || docPath.split('/').pop()?.replace(/\.mdx?$/, '') || 'Untitled Document';
      const descVal = frontmatterMeta.description || '';
      const iconVal = frontmatterMeta.icon || '';

      const fullContentToSave = `---
title: '${titleVal.replace(/'/g, "\\'")}'
description: '${descVal.replace(/'/g, "\\'")}'
draft: ${isDraft}
icon: '${iconVal}'
---

${content.trim()}`;

      try {
        const res = await fetch('/api/save-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docPath, content: fullContentToSave }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setInitialContent(content);
          setInitialDraft(isDraft);
          setInitialTitle(titleVal);
          setFrontmatterMeta((prev) => ({ ...prev, draft: isDraft, title: titleVal }));
          setSaveMessage(isDraft ? 'Draft saved' : 'Document published');
          router.refresh();
          setTimeout(() => setSaveMessage(''), 3000);
          setShowSaveModal(false);
          setShowUnsavedModal(false);
          return true;
        } else {
          setError(data.error || 'Failed to save document');
        }
      } catch (err) {
        setError('Connection error while saving');
      } finally {
        setSaving(false);
      }
      return false;
    },
    [docPath, content, frontmatterMeta, saving, router]
  );

  // Close attempt handler with unsaved changes check
  const handleCloseAttempt = useCallback(() => {
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Keyboard shortcut Ctrl+S, Ctrl+Z, Ctrl+Y handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          setShowSaveModal(true);
        } else if (e.key === 'z') {
          if (e.shiftKey) {
            e.preventDefault();
            handleRedo();
          } else {
            e.preventDefault();
            handleUndo();
          }
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleUndo, handleRedo]);

  // Formatting helpers for text insertion with history tracking
  function insertFormat(prefix: string, suffix: string = '', defaultText: string = '') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultText;

    const newText = content.substring(0, start) + prefix + selectedText + suffix + content.substring(end);
    updateContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  }

  // Smart Text Alignment Handler (prevents tag nesting and enables smooth toggling)
  function applyAlignment(align: 'left' | 'center' | 'right') {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let start = textarea.selectionStart;
    let end = textarea.selectionEnd;
    let selectedText = content.substring(start, end);

    // If no text selected, select current line block
    if (!selectedText) {
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = content.indexOf('\n', end);
      const actualEnd = lineEnd === -1 ? content.length : lineEnd;
      selectedText = content.substring(lineStart, actualEnd);
      start = lineStart;
      end = actualEnd;
    }

    // Strip existing alignment tags & outer paragraph wrappers completely
    const cleanText = selectedText
      .replace(/^<(?:p|div)\s+align=["'][^"']+["']>\s*/gi, '')
      .replace(/\s*<\/(?:p|div)>$/gi, '')
      .trim();

    let replacement = cleanText;
    if (align !== 'left' && cleanText) {
      replacement = `<div align="${align}">${cleanText}</div>`;
    }

    const newText = content.substring(0, start) + replacement + content.substring(end);
    updateContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  }

  const handleSelectTitle = useCallback(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, []);

  function toggleColorPicker() {
    if (!showColorPicker && colorPickerButtonRef.current) {
      const rect = colorPickerButtonRef.current.getBoundingClientRect();
      setColorPickerPos({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 40),
      });
    }
    setShowColorPicker(!showColorPicker);
    setShowTablePicker(false);
  }

  function toggleTablePicker() {
    if (!showTablePicker && tablePickerButtonRef.current) {
      const rect = tablePickerButtonRef.current.getBoundingClientRect();
      setTablePickerPos({
        top: rect.bottom + 8,
        left: Math.max(16, rect.left - 20),
      });
      setTableHoverGrid({ rows: 1, cols: 1 });
    }
    setShowTablePicker(!showTablePicker);
    setShowColorPicker(false);
  }

  function insertCustomTable(rows: number, cols: number) {
    let headerRow = '|';
    let dividerRow = '|';
    for (let c = 1; c <= cols; c++) {
      headerRow += ` Header ${c} |`;
      dividerRow += ' --- |';
    }
    let bodyRows = '';
    for (let r = 1; r <= rows; r++) {
      let rowStr = '|';
      for (let c = 1; c <= cols; c++) {
        rowStr += ` Cell |`;
      }
      bodyRows += `\n${rowStr}`;
    }
    const tableMarkdown = `\n${headerRow}\n${dividerRow}${bodyRows}\n`;
    insertFormat(tableMarkdown, '', '');
    setShowTablePicker(false);
  }

  // File upload for image insertion
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        insertFormat(`![Image](${data.url})`, '', '');
      } else {
        setError(data.error || 'Image upload failed.');
      }
    } catch (err) {
      setError('Connection error during image upload.');
    } finally {
      setUploading(false);
    }
  }

  // Handle Tab key indentation and formatting keyboard shortcuts in textarea
  function handleKeyDownTextarea(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        insertFormat('**', '**', 'bold text');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        insertFormat('*', '*', 'italic text');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        insertFormat('<u>', '</u>', 'underlined text');
        return;
      }
      if (key === 'k') {
        e.preventDefault();
        insertFormat('[', '](https://)', 'Link text');
        return;
      }
      if (key === 'x' && e.shiftKey) {
        e.preventDefault();
        insertFormat('~~', '~~', 'strikethrough');
        return;
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Remove 4 spaces or tab if present
        if (content.substring(start - 4, start) === '    ') {
          const newText = content.substring(0, start - 4) + content.substring(start);
          updateContent(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(Math.max(0, start - 4), Math.max(0, end - 4));
          }, 0);
        } else if (content.substring(start - 1, start) === '\t') {
          const newText = content.substring(0, start - 1) + content.substring(start);
          updateContent(newText);
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(Math.max(0, start - 1), Math.max(0, end - 1));
          }, 0);
        }
      } else {
        // Insert 4 spaces / tab indentation for paragraph
        const indentStr = '    ';
        const newText = content.substring(0, start) + indentStr + content.substring(end);
        updateContent(newText);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + indentStr.length, start + indentStr.length);
        }, 0);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-fd-background text-fd-foreground animate-in fade-in">
      {/* Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-fd-border bg-fd-card px-4 shadow-sm">
        {/* Left Section: File Icon + Title Input + Draft Status Pill */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <FileText className="size-4 text-fd-primary shrink-0" />

          {/* Editable Module Title Input */}
          <div className="flex items-center gap-1.5 min-w-0 max-w-md">
            <input
              ref={titleInputRef}
              type="text"
              value={frontmatterMeta.title}
              onChange={(e) => {
                setFrontmatterMeta((prev) => ({ ...prev, title: e.target.value }));
              }}
              onFocus={(e) => e.target.select()}
              placeholder="Untitled Module..."
              className="font-display text-sm font-bold tracking-tight text-fd-foreground bg-transparent border-b border-transparent hover:border-fd-border focus:border-fd-primary focus:bg-fd-accent/40 rounded px-1.5 py-0.5 focus:outline-none transition-all w-full truncate cursor-pointer focus:cursor-text"
              title={`Click to rename (${docPath})`}
            />
            <button
              type="button"
              onClick={handleSelectTitle}
              className="p-1 rounded text-fd-muted-foreground/60 hover:text-fd-primary hover:bg-fd-accent/50 transition-colors cursor-pointer shrink-0"
              title="Click to rename (select all text)"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-fd-border shrink-0" />

          {/* Status Pill Badge */}
          {frontmatterMeta.draft ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20 whitespace-nowrap shrink-0">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Draft (Editor Private)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500 border border-emerald-500/20 whitespace-nowrap shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Public
            </span>
          )}
        </div>

        {/* Right Section: Save Status + View Switcher + Save + Close */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Save Status Indicator */}
          {saving ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-fd-primary animate-pulse whitespace-nowrap">
              <Sparkles className="size-3.5" /> Saving...
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500 whitespace-nowrap">
              <AlertCircle className="size-3.5" /> Unsaved changes
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500 whitespace-nowrap">
              <Check className="size-3.5" /> Saved
            </span>
          )}

          {saveMessage && (
            <span className="text-xs font-semibold text-emerald-500 animate-in fade-in whitespace-nowrap">
              {saveMessage}
            </span>
          )}

          <div className="h-4 w-px bg-fd-border" />

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 rounded-lg border border-fd-border bg-fd-background p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-fd-primary text-fd-primary-foreground font-semibold shadow-xs'
                  : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/50'
              }`}
            >
              <Columns className="size-3.5" />
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === 'code'
                  ? 'bg-fd-primary text-fd-primary-foreground font-semibold shadow-xs'
                  : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/50'
              }`}
            >
              <Code2 className="size-3.5" />
              Code
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-fd-primary text-fd-primary-foreground font-semibold shadow-xs'
                  : 'text-fd-muted-foreground hover:text-fd-foreground hover:bg-fd-accent/50'
              }`}
            >
              <Eye className="size-3.5" />
              Preview
            </button>
          </div>

          {/* Save & Close Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-4 py-1.5 text-xs font-semibold text-fd-primary-foreground transition-all hover:bg-fd-primary/90 disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Save className="size-3.5" />
              Save (Ctrl+S)
            </button>
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="rounded-lg p-1.5 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
              title="Close Editor"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Exact HackMD Formatting Toolbar */}
      <div className="flex shrink-0 items-center gap-1 border-b border-fd-border bg-fd-card/90 px-4 py-1.5 text-fd-muted-foreground shadow-xs overflow-x-auto">
        {/* Group 1: Undo & Redo */}
        <ToolbarButton icon={Undo2} title="Undo (Ctrl+Z)" onClick={handleUndo} />
        <ToolbarButton icon={Redo2} title="Redo (Ctrl+Y)" onClick={handleRedo} />

        <div className="mx-2 h-4 w-px bg-fd-border shrink-0" />

        {/* Group 2: Text Formatting (B, I, U, S, H, Alignments, Color) */}
        <ToolbarButton icon={Bold} title="Bold (Ctrl+B)" onClick={() => insertFormat('**', '**', 'bold text')} />
        <ToolbarButton icon={Italic} title="Italic (Ctrl+I)" onClick={() => insertFormat('*', '*', 'italic text')} />
        <ToolbarButton icon={UnderlineIcon} title="Underline (Ctrl+U)" onClick={() => insertFormat('<u>', '</u>', 'underlined text')} />
        <ToolbarButton icon={Strikethrough} title="Strikethrough (Ctrl+Shift+X)" onClick={() => insertFormat('~~', '~~', 'strikethrough')} />
        <ToolbarButton icon={Heading} title="Heading (# Heading)" onClick={() => insertFormat('## ', '', 'Heading')} />

        <ToolbarButton icon={AlignLeft} title="Align Left" onClick={() => applyAlignment('left')} />
        <ToolbarButton icon={AlignCenter} title="Align Center" onClick={() => applyAlignment('center')} />
        <ToolbarButton icon={AlignRight} title="Align Right" onClick={() => applyAlignment('right')} />

        {/* Text Color Picker Button */}
        <button
          ref={colorPickerButtonRef}
          type="button"
          onClick={toggleColorPicker}
          className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
          title="Text Color Picker"
        >
          <Palette className="size-4 text-fd-primary" />
        </button>

        <div className="mx-2 h-4 w-px bg-fd-border shrink-0" />

        {/* Group 3: Code, Callout Quote, Bullet List, Numbered List, Checklist */}
        <ToolbarButton icon={Code} title="Code (`code` or ```)" onClick={() => insertFormat('`', '`', 'code')} />
        <ToolbarButton icon={Quote} title="Callout Quote (> note)" onClick={() => insertFormat('\n> [!NOTE]\n> ', '', 'Important note details')} />
        <ToolbarButton icon={List} title="Unordered Bullet List (- item)" onClick={() => insertFormat('\n- ', '', 'List item')} />
        <ToolbarButton icon={ListOrdered} title="Ordered Numbered List (1. item)" onClick={() => insertFormat('\n1. ', '', 'Numbered item')} />
        <ToolbarButton icon={CheckSquare} title="Checklist / Task (- [ ] item)" onClick={() => insertFormat('\n- [ ] ', '', 'Task item')} />

        <div className="mx-2 h-4 w-px bg-fd-border shrink-0" />

        {/* Group 4: Link, Image Upload, Table, Line */}
        <ToolbarButton icon={Link} title="Insert Link ([text](url))" onClick={() => insertFormat('[', '](https://)', 'Link text')} />
        
        <label className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors" title="Upload & Insert Image">
          <ImageIcon className="size-4" />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* Custom Interactive Table Grid Button */}
        <button
          ref={tablePickerButtonRef}
          type="button"
          onClick={toggleTablePicker}
          className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
          title="Insert Custom Grid Table (Max 6x6)"
        >
          <TableIcon className="size-4 text-fd-primary" />
        </button>

        <ToolbarButton icon={Minus} title="Horizontal Divider Line (---)" onClick={() => insertFormat('\n---\n', '', '')} />
      </div>

      {/* Floating Color Palette Overlay */}
      {showColorPicker && (
        <div
          className="fixed z-[100] flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/95 backdrop-blur-md px-3.5 py-2 shadow-2xl animate-in fade-in zoom-in-95"
          style={{ top: `${colorPickerPos.top}px`, left: `${colorPickerPos.left}px` }}
        >
          {[
            { name: 'Cyan', hex: '#03eaff' },
            { name: 'Gold', hex: '#f59e0b' },
            { name: 'Emerald', hex: '#10b981' },
            { name: 'Rose', hex: '#f43f5e' },
            { name: 'Purple', hex: '#a855f7' },
            { name: 'Blue', hex: '#3b82f6' },
            { name: 'Red', hex: '#ef4444' },
            { name: 'White', hex: '#ffffff' },
          ].map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => {
                insertFormat(`<span style={{ color: '${c.hex}' }}>`, '</span>', 'colored text');
                setShowColorPicker(false);
              }}
              className="size-5 rounded-full border border-fd-border transition-transform hover:scale-125 cursor-pointer shadow-xs"
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Floating 6x6 Interactive Table Grid Picker Overlay */}
      {showTablePicker && (
        <div
          className="fixed z-[100] flex flex-col rounded-xl border border-fd-border bg-fd-card/95 backdrop-blur-md p-3 shadow-2xl animate-in fade-in zoom-in-95"
          style={{ top: `${tablePickerPos.top}px`, left: `${tablePickerPos.left}px` }}
        >
          <div className="text-[11px] font-semibold text-fd-muted-foreground mb-2 text-center uppercase tracking-wider">
            Insert Table Grid
          </div>
          <div className="grid grid-cols-6 gap-1.5 bg-fd-muted/30 p-2 rounded-lg border border-fd-border/50">
            {[1, 2, 3, 4, 5, 6].map((r) =>
              [1, 2, 3, 4, 5, 6].map((c) => {
                const isSelected = r <= tableHoverGrid.rows && c <= tableHoverGrid.cols;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onMouseEnter={() => setTableHoverGrid({ rows: r, cols: c })}
                    onClick={() => insertCustomTable(r, c)}
                    className={`size-5 rounded transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-fd-primary border-fd-primary shadow-xs scale-105'
                        : 'bg-fd-card border-fd-border/70 hover:bg-fd-accent'
                    }`}
                  />
                );
              })
            )}
          </div>
          <div className="text-center text-xs font-bold text-fd-foreground mt-2.5">
            {tableHoverGrid.rows} × {tableHoverGrid.cols} Table
          </div>
        </div>
      )}

      {error && (
        <div className="bg-fd-error/10 border-b border-fd-error/40 px-4 py-2 text-xs font-medium text-fd-error">
          {error}
        </div>
      )}

      {/* Main HackMD Dual-Column Container with Draggable Splitter */}
      <main ref={mainContainerRef} className="flex flex-1 overflow-hidden relative select-none">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3 text-fd-muted-foreground">
              <Sparkles className="size-5 text-fd-primary animate-spin" />
              <span>Loading Markdown document...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Left Column: Code Editor */}
            {(viewMode === 'split' || viewMode === 'code') && (
              <div
                className="flex flex-col border-r border-fd-border"
                style={{ width: viewMode === 'split' ? `${splitPercentage}%` : '100%' }}
              >
                <div className="flex items-center justify-between border-b border-fd-border bg-fd-muted/30 px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-fd-muted-foreground">
                  <span>Markdown / MDX Editor</span>
                  <span>{content.split('\n').length} lines</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContent(val);
                    recordHistorySnapshot(val);
                  }}
                  onKeyDown={handleKeyDownTextarea}
                  placeholder="Write your MDX documentation content here..."
                  className="flex-1 resize-none bg-fd-background p-4 font-mono text-sm leading-relaxed text-fd-foreground focus:outline-none select-text"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Draggable Vertical Splitter Bar */}
            {viewMode === 'split' && (
              <div
                onMouseDown={handleMouseDownSplitter}
                className="w-2.5 hover:w-3 bg-fd-border/70 hover:bg-fd-primary/80 transition-colors cursor-col-resize shrink-0 flex items-center justify-center group z-20 shadow-xs"
                title="Drag to resize columns"
              >
                <div className="h-8 w-1 rounded-full bg-fd-muted-foreground/50 group-hover:bg-fd-primary-foreground transition-colors" />
              </div>
            )}

            {/* Right Column: Live Rendered Preview */}
            {(viewMode === 'split' || viewMode === 'preview') && (
              <div
                className="flex flex-col select-text"
                style={{ width: viewMode === 'split' ? `${100 - splitPercentage}%` : '100%' }}
              >
                <div className="flex items-center justify-between border-b border-fd-border bg-fd-muted/30 px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-fd-muted-foreground">
                  <span>Live Rendered Preview</span>
                  <span className="text-fd-primary font-medium">Real-time</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-fd-card p-6">
                  <LivePreviewRenderer content={content} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Save Options Modal (Draft vs Publish) */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-fd-border pb-3">
              <div className="flex items-center gap-2 text-fd-foreground font-semibold text-base">
                <Save className="size-5 text-fd-primary" />
                <span>Save Module Document</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg p-1 text-fd-muted-foreground hover:bg-fd-accent cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-fd-muted-foreground leading-relaxed">
              Select the publication status for this module:
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => executeSave(true)}
                disabled={saving}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer group space-y-1 ${
                  frontmatterMeta.draft
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-fd-border bg-fd-card hover:bg-fd-accent/50 hover:border-fd-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-fd-foreground group-hover:text-fd-primary">
                    📝 Save as Draft
                  </span>
                  <div className="flex items-center gap-1.5">
                    {frontmatterMeta.draft && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                        Current Status
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                      Editor Private
                    </span>
                  </div>
                </div>
                <p className="text-xs text-fd-muted-foreground leading-relaxed">
                  Only visible to editors and not published to public readers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => executeSave(false)}
                disabled={saving}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer group space-y-1 ${
                  !frontmatterMeta.draft
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-fd-border bg-fd-card hover:bg-fd-accent/50 hover:border-fd-primary/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-fd-foreground group-hover:text-fd-primary">
                    🚀 Publish
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!frontmatterMeta.draft && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500 text-black">
                        Current Status
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                      Public
                    </span>
                  </div>
                </div>
                <p className="text-xs text-fd-muted-foreground leading-relaxed">
                  The document will be published immediately and readable by all public users.
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-1.5 rounded-lg border border-fd-border text-xs font-semibold text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Close Confirmation Modal */}
      {showUnsavedModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-fd-border bg-fd-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-fd-border pb-3">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-base">
                <AlertCircle className="size-5" />
                <span>Unsaved Changes</span>
              </div>
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="rounded-lg p-1 text-fd-muted-foreground hover:bg-fd-accent cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-fd-muted-foreground leading-relaxed">
              You have unsaved edits in this module. What would you like to do?
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={async () => {
                  const ok = await executeSave(true);
                  if (ok) onClose();
                }}
                disabled={saving}
                className="w-full text-left px-4 py-3 rounded-xl border border-fd-border bg-fd-card hover:bg-fd-accent/50 text-xs font-semibold text-fd-foreground transition-all cursor-pointer flex items-center justify-between"
              >
                <span>📝 Save Draft & Exit</span>
                <span className="text-[10px] text-amber-500 font-medium">Editor Only</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const ok = await executeSave(false);
                  if (ok) onClose();
                }}
                disabled={saving}
                className="w-full text-left px-4 py-3 rounded-xl border border-fd-primary/40 bg-fd-primary/10 hover:bg-fd-primary/20 text-xs font-semibold text-fd-foreground transition-all cursor-pointer flex items-center justify-between"
              >
                <span>🚀 Publish & Exit</span>
                <span className="text-[10px] text-emerald-500 font-medium">Public</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 text-xs font-semibold text-red-500 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>❌ Discard Changes & Exit</span>
                <span className="text-[10px] opacity-75">Discard Edits</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowUnsavedModal(false)}
                className="px-4 py-1.5 rounded-lg border border-fd-border text-xs font-semibold text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer transition-colors"
              >
                Cancel (Return to Editing)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ icon: Icon, title, onClick }: { icon: any; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded p-1 text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground cursor-pointer"
      title={title}
    >
      <Icon className="size-4" />
    </button>
  );
}

/**
 * Clean inline formatter supporting bold (**), italic (*), underline (<u>), strikethrough (~~), code (`), and text colors (<span style="color: ...">)
 */
function renderInlineFormatted(text: string): React.ReactNode {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~|<u>.*?<\/u>|<ins>.*?<\/ins>|<span style=\{\{\s*color:\s*['"][^'"]+['"]\s*\}\}>.*?<\/span>|<span style=["']color:\s*[^"']+["']>.*?<\/span>|<span color=["'][^"']+["']>.*?<\/span>)/gi);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-fd-foreground">{renderInlineFormatted(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic">{renderInlineFormatted(part.slice(1, -1))}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="rounded bg-fd-muted px-1.5 py-0.5 font-mono text-xs text-brand-gold-ink dark:text-brand-beige border border-fd-border">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <del key={i} className="line-through text-fd-muted-foreground">{renderInlineFormatted(part.slice(2, -2))}</del>;
    }
    if ((part.toLowerCase().startsWith('<u>') && part.toLowerCase().endsWith('</u>')) || (part.toLowerCase().startsWith('<ins>') && part.toLowerCase().endsWith('</ins>'))) {
      const inner = part.toLowerCase().startsWith('<u>') ? part.slice(3, -4) : part.slice(5, -6);
      return <u key={i} className="underline decoration-fd-primary underline-offset-4">{renderInlineFormatted(inner)}</u>;
    }
    const colorMatch = part.match(/^<span (?:style=\{\{\s*color:\s*['"]([^'"]+)['"]\s*\}\}|style=["']color:\s*([^"']+)["']|color=["']([^"']+)["'])>(.*?)<\/span>$/i);
    if (colorMatch) {
      const colorHex = colorMatch[1] || colorMatch[2] || colorMatch[3];
      const inner = colorMatch[4];
      return <span key={i} style={{ color: colorHex }}>{renderInlineFormatted(inner)}</span>;
    }
    return part;
  });
}

/**
 * Clean live preview renderer parsing MDX/Markdown tables, lists, callouts & formatting
 */
function LivePreviewRenderer({ content }: { content: string }) {
  const cleanContent = content.replace(/^---[\s\S]*?---\n?/, '');

  return (
    <article className="prose dark:prose-invert max-w-none text-fd-foreground space-y-4">
      {cleanContent.split(/\n\n+/).map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="font-display text-3xl font-bold tracking-tight mb-4 text-fd-foreground">{renderInlineFormatted(trimmed.slice(2))}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="font-display text-2xl font-semibold tracking-tight mt-6 mb-3 text-fd-foreground">{renderInlineFormatted(trimmed.slice(3))}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="font-display text-xl font-semibold mt-4 mb-2 text-fd-foreground">{renderInlineFormatted(trimmed.slice(4))}</h3>;
        }

        // Horizontal Divider Line (--- or *** or ___)
        if (trimmed === '---' || trimmed === '***' || trimmed === '___' || /^[-*_]{3,}$/.test(trimmed)) {
          return <hr key={idx} className="my-6 border-t-2 border-fd-border" />;
        }

        // Table Detection (| Column 1 | Column 2 |)
        if (trimmed.includes('|') && trimmed.split('\n').filter((l) => l.trim().startsWith('|')).length >= 2) {
          const lines = trimmed.split('\n').filter((l) => l.trim().startsWith('|'));
          const dataLines = lines.filter((l) => !l.includes('---'));
          if (dataLines.length > 0) {
            const headerCells = dataLines[0]
              .split('|')
              .map((c) => c.trim())
              .filter((c, i, a) => (i > 0 && i < a.length - 1) || c !== '');
            const bodyRows = dataLines.slice(1).map((row) =>
              row
                .split('|')
                .map((c) => c.trim())
                .filter((c, i, a) => (i > 0 && i < a.length - 1) || c !== '')
            );

            return (
              <div key={idx} className="my-6 overflow-x-auto rounded-lg border border-fd-border shadow-sm">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="border-b border-fd-border bg-fd-muted/60 font-semibold text-fd-foreground">
                    <tr>
                      {headerCells.map((cell, cIdx) => (
                        <th key={cIdx} className="border-r last:border-r-0 border-fd-border px-4 py-2.5">
                          {renderInlineFormatted(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fd-border bg-fd-card">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-fd-accent/30 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="border-r last:border-r-0 border-fd-border px-4 py-2.5 text-fd-foreground">
                            {renderInlineFormatted(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Unordered List (- Item)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '));
          return (
            <ul key={idx} className="my-3 list-disc pl-6 space-y-1.5 text-fd-foreground">
              {items.map((item, iIdx) => (
                <li key={iIdx}>{renderInlineFormatted(item.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Callout notes
        if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="my-4 rounded-r-lg border-l-4 border-fd-primary bg-fd-primary/10 p-3.5 text-sm text-fd-foreground shadow-sm">
              {renderInlineFormatted(trimmed.replace(/^>\s*(\[!NOTE\])?\s*/g, ''))}
            </blockquote>
          );
        }

        // Code block
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n');
          const codeText = lines.slice(1, -1).join('\n') || lines.slice(1).join('\n');
          return (
            <pre key={idx} className="my-4 rounded-lg border border-fd-border bg-fd-muted p-4 font-mono text-xs overflow-x-auto text-fd-foreground shadow-sm">
              <code>{codeText}</code>
            </pre>
          );
        }

        // Image ![alt](url)
        const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imgMatch) {
          return (
            <div key={idx} className="my-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgMatch[2]} alt={imgMatch[1]} className="max-h-96 rounded-lg border border-fd-border object-contain shadow-md" />
            </div>
          );
        }

        // Alignment & Color Combination Parsing (<p align="center"> & <span style="color: ...">)
        let blockText = trimmed;
        let blockAlignClass = '';

        const alignMatch = blockText.match(/<(?:p|div)\s+align=["'](left|center|right)["']>/i);
        if (alignMatch) {
          const alignDir = alignMatch[1].toLowerCase();
          blockAlignClass = alignDir === 'center' ? 'text-center' : alignDir === 'right' ? 'text-right' : 'text-left';
          blockText = blockText
            .replace(/<(?:p|div)\s+align=["'][^"']+["']>\s*/gi, '')
            .replace(/\s*<\/(?:p|div)>/gi, '')
            .trim();
        }

        // Regular / Aligned Paragraph with Tab Indentation support
        const isIndented = block.startsWith('    ') || block.startsWith('\t');
        return (
          <p key={idx} className={`my-3 text-base leading-relaxed text-fd-foreground ${blockAlignClass} ${isIndented ? 'pl-8 font-normal' : ''}`}>
            {renderInlineFormatted(blockText)}
          </p>
        );
      })}
    </article>
  );
}
