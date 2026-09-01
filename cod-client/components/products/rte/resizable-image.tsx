"use client";

import { useRef } from "react";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";
import Image from "@tiptap/extension-image";

const MIN_WIDTH = 10;

function ResizableImageNodeView({ node, selected, updateAttributes }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ base: number; width: number; dir: 1 | -1 } | null>(null);
  const width = (node.attrs.width as number) ?? 100;

  function startDrag(e: React.PointerEvent<HTMLDivElement>, dir: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    drag.current = { base: e.clientX, width, dir };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !containerRef.current) return;
    const tiptap = containerRef.current.closest(".tiptap");
    const base = tiptap?.clientWidth ?? 0;
    if (!base) return;
    const deltaPx = (e.clientX - drag.current.base) * drag.current.dir;
    const pct = deltaPx / base;
    const next = Math.round(Math.min(100, Math.max(MIN_WIDTH, drag.current.width + pct * 100)));
    updateAttributes({ width: next });
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  return (
    <NodeViewWrapper className="image-resize">
      <div
        ref={containerRef}
        className="image-resize-wrap"
        style={{ ["--img-w" as string]: `${width}%` }}
      >
        <img src={node.attrs.src} alt={node.attrs.alt ?? ""} data-drag-handle />
        {selected && (
          <>
            <div
              role="slider"
              aria-label="resize"
              contentEditable={false}
              draggable={false}
              onPointerDown={(e) => startDrag(e, -1)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="image-resize-handle left"
            />
            <div
              role="slider"
              aria-label="resize"
              contentEditable={false}
              draggable={false}
              onPointerDown={(e) => startDrag(e, 1)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="image-resize-handle right"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});
