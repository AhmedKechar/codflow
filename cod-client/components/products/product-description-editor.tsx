"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { ResizableImage } from "./rte/resizable-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  Heading2, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Eraser,
  ImagePlus, Palette,
} from "lucide-react";
import { useProducts } from "@/lib/translations";
import { useLanguage } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "h-8 w-8 shrink-0 rounded-md flex items-center justify-center transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-40 pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

export function ProductDescriptionEditor({ value, onChange, disabled = false, minHeight = 160 }: Props) {
  const t = useProducts();
  const { dir } = useLanguage();
  const imageFileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: t.form.rte_placeholder ?? "Write the product description here...",
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        dir,
      },
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  function insertImageFromFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result as string }).run();
    };
    reader.readAsDataURL(file);
  }

  function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) insertImageFromFile(file);
    e.target.value = "";
  }

  return (
    <div className={cn("rounded-md border border-border overflow-hidden", disabled && "opacity-70")}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/20 px-2 py-1.5" dir={dir}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()} title={t.form.rte_undo}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()} title={t.form.rte_redo}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} disabled={disabled} title={t.form.rte_bold}>
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} disabled={disabled} title={t.form.rte_italic}>
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} disabled={disabled} title={t.form.rte_underline}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} disabled={disabled} title={t.form.rte_strikethrough}>
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} disabled={disabled} title={t.form.rte_heading}>
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} disabled={disabled} title={t.form.rte_list_bullet}>
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} disabled={disabled} title={t.form.rte_list_number}>
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} disabled={disabled} title={t.form.rte_align_left}>
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} disabled={disabled} title={t.form.rte_align_center}>
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} disabled={disabled} title={t.form.rte_align_right}>
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <span className="w-px h-5 bg-border mx-1" />
        <label
          className={cn(
            "h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
            disabled && "opacity-40 pointer-events-none"
          )}
          title={t.form.rte_text_color}
        >
          <Palette className="w-4 h-4" />
          <input
            type="color"
            disabled={disabled}
            className="w-0 h-0 opacity-0 absolute"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        <label
          className={cn(
            "h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer",
            disabled && "opacity-40 pointer-events-none"
          )}
          title={t.form.rte_insert_image}
        >
          <ImagePlus className="w-4 h-4" />
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            onChange={onImageFileChange}
            disabled={disabled}
            className="hidden"
          />
        </label>
        <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} disabled={disabled} title={t.form.rte_remove_format}>
          <Eraser className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div
        className="px-4 py-3 text-sm"
        style={{ minHeight }}
        dir={dir}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} className="prose-sm max-w-none" />
      </div>

      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: inline-start;
          height: 0;
          pointer-events: none;
          color: var(--muted-foreground);
          opacity: 0.6;
        }
        .tiptap:focus { outline: none; }
        .image-resize { width: 100%; margin: 0.5em 0; }
        .image-resize-wrap {
          position: relative;
          width: max-content;
          max-width: 100%;
          margin-inline: auto;
        }
        .image-resize-wrap img {
          display: block;
          width: var(--img-w, 100%);
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        .image-resize-handle {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 22px;
          background: var(--primary);
          border: 2px solid #fff;
          border-radius: 4px;
          cursor: ew-resize;
          touch-action: none;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        }
        .image-resize-handle.left { left: -6px; }
        .image-resize-handle.right { right: -6px; }
        .tiptap ul { list-style: disc; padding-inline-start: 1.5em; }
        .tiptap ol { list-style: decimal; padding-inline-start: 1.5em; }
        .tiptap h2 { font-size: 1.15em; font-weight: 700; margin: 0.5em 0; }
      `}</style>
    </div>
  );
}
