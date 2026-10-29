import React, { useState } from 'react';
import { Trash2, Check, Eye, RotateCw } from 'lucide-react';
import { PdfPageThumbnail } from './PdfPageThumbnail';
import { parsePageRanges } from '../../lib/format';
import type { QueueItem, ToolId } from '../../processing/shared-types';

interface PdfVisualPagesPanelProps {
  toolId: ToolId;
  items: QueueItem[];
  options: Record<string, unknown>;
  onChangeOptions: (next: Record<string, unknown>) => void;
  onInspectFile: (item: QueueItem) => void;
}

function parseSelectedOneBasedPages(spec: string, totalPages: number): Set<number> {
  if (!spec.trim()) return new Set();
  const parsed = parsePageRanges(spec, totalPages);
  if (!parsed.valid) return new Set();
  return new Set(parsed.pages.map((zeroIdx) => zeroIdx + 1));
}

function serializeOneBasedPages(pages: Set<number>): string {
  return Array.from(pages)
    .sort((a, b) => a - b)
    .join(', ');
}

export const PdfVisualPagesPanel: React.FC<PdfVisualPagesPanelProps> = ({
  toolId,
  items,
  options,
  onChangeOptions,
  onInspectFile,
}) => {
  const [showAllPages, setShowAllPages] = useState(false);

  const pdfItems = items.filter(
    (item) =>
      item.status === 'ready' &&
      (item.mimeType === 'application/pdf' ||
        item.name.toLowerCase().endsWith('.pdf') ||
        item.mimeType.startsWith('image/'))
  );

  if (pdfItems.length === 0 || toolId === 'organize-pdf') {
    return null;
  }

  // Multi-file visual overview for Merge PDF / Image to PDF / Insert-Replace / Compare
  if (pdfItems.length > 1) {
    return (
      <div className="border-t border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-ink">
              Uploaded Document Visual Preview ({pdfItems.length} files)
            </h3>
            <p className="text-xs text-muted">
              Cover page preview for each uploaded document in your current order.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {pdfItems.map((item, idx) => (
            <div
              key={item.sessionId}
              className="flex flex-col justify-between rounded-control border border-border bg-canvas p-2.5"
            >
              <div className="flex items-center justify-between gap-1 pb-2">
                <span className="rounded-control bg-primary px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary-ink">
                  File #{idx + 1}
                </span>
                <span className="text-[11px] font-medium text-muted">
                  {item.pageCount ?? 1} {item.pageCount === 1 ? 'page' : 'pages'}
                </span>
              </div>

              <PdfPageThumbnail file={item.file} pageNumber={1} />

              <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-border">
                <span className="truncate text-[11px] font-semibold text-ink">
                  {item.name}
                </span>
                {item.mimeType === 'application/pdf' && (
                  <button
                    type="button"
                    onClick={() => onInspectFile(item)}
                    className="shrink-0 rounded-control border border-border bg-surface p-1 text-primary hover:bg-surface-subtle"
                    title={`Inspect ${item.name}`}
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Single PDF file page-by-page interactive visual grid
  const primaryItem = pdfItems[0];
  const totalPages = Math.max(1, primaryItem.pageCount ?? 1);
  const maxVisible = showAllPages ? totalPages : Math.min(totalPages, 12);
  const pageNumbers = Array.from({ length: maxVisible }, (_, i) => i + 1);

  const isRemoveTool = toolId === 'remove-pages';
  const isExtractTool = toolId === 'extract-pages';
  const isRotateTool = toolId === 'rotate-pdf';

  const currentSpec =
    (options.targetPagesSpec as string | undefined) ??
    (isRemoveTool ? (totalPages > 1 ? '1' : '') : isExtractTool ? '1' : '');

  const selectedSet =
    isRemoveTool || isExtractTool
      ? parseSelectedOneBasedPages(currentSpec, totalPages)
      : new Set<number>();

  const rotationRangeSpec = (options.pageRangeSpec as string | undefined) ?? '';
  const rotatedSet = isRotateTool
    ? rotationRangeSpec.trim() === ''
      ? new Set(Array.from({ length: totalPages }, (_, i) => i + 1))
      : parseSelectedOneBasedPages(rotationRangeSpec, totalPages)
    : new Set<number>();
  const activeRotationAngle = isRotateTool
    ? Number(options.rotationDegrees ?? 90)
    : 0;

  const handleTogglePageSelection = (pageNum: number) => {
    if (isRemoveTool) {
      if (totalPages <= 1) return;
      const next = new Set(selectedSet);
      if (next.has(pageNum)) {
        next.delete(pageNum);
      } else {
        // Prevent removing every single page in the PDF
        if (next.size + 1 >= totalPages) {
          return;
        }
        next.add(pageNum);
      }
      onChangeOptions({
        ...options,
        targetPagesSpec: serializeOneBasedPages(next),
      });
      return;
    }

    if (isExtractTool) {
      const next = new Set(selectedSet);
      if (next.has(pageNum)) {
        if (next.size <= 1) return;
        next.delete(pageNum);
      } else {
        next.add(pageNum);
      }
      onChangeOptions({
        ...options,
        targetPagesSpec: serializeOneBasedPages(next),
      });
    }
  };

  return (
    <div className="border-t border-border bg-surface p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">
            {isRemoveTool
              ? `Select Pages to Remove (${selectedSet.size} of ${totalPages} marked for deletion)`
              : isExtractTool
              ? `Select Pages to Extract (${selectedSet.size} of ${totalPages} selected)`
              : `Document Pages Preview (${totalPages} ${
                  totalPages === 1 ? 'page' : 'pages'
                })`}
          </h3>
          <p className="text-xs text-muted">
            {isRemoveTool
              ? totalPages <= 1
                ? 'This PDF has only 1 page. Upload a multi-page PDF to remove individual pages.'
                : 'Click any page card below to mark or unmark it for removal. At least one page must be kept.'
              : isExtractTool
              ? 'Click any page card below to include or exclude it from the extracted PDF.'
              : 'Visual preview of your uploaded PDF pages.'}
          </p>
        </div>

        {primaryItem.mimeType === 'application/pdf' && (
          <button
            type="button"
            onClick={() => onInspectFile(primaryItem)}
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-control border border-border bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
          >
            <Eye className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>Large Page Viewer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {pageNumbers.map((pageNum) => {
          const isMarkedRemove = isRemoveTool && selectedSet.has(pageNum);
          const isMarkedExtract = isExtractTool && selectedSet.has(pageNum);
          const pageRot =
            isRotateTool && rotatedSet.has(pageNum) ? activeRotationAngle : 0;

          return (
            <div
              key={pageNum}
              onClick={() => {
                if (isRemoveTool || isExtractTool) {
                  handleTogglePageSelection(pageNum);
                }
              }}
              className={`smooth-interactive flex flex-col justify-between rounded-control border p-2.5 ${
                isRemoveTool || isExtractTool ? 'cursor-pointer' : ''
              } ${
                isMarkedRemove
                  ? 'border-danger bg-danger-bg/40'
                  : isMarkedExtract
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-canvas hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 pb-2">
                <span className="rounded-control bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink border border-border">
                  Page {pageNum}
                </span>

                {isMarkedRemove && (
                  <span className="rounded-control bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Remove
                  </span>
                )}
                {isMarkedExtract && (
                  <span className="rounded-control bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-ink">
                    Extract
                  </span>
                )}
                {pageRot !== 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-control bg-surface-subtle px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    <RotateCw className="h-2.5 w-2.5" aria-hidden="true" />
                    +{pageRot}°
                  </span>
                )}
              </div>

              <div
                className={`relative ${
                  isMarkedRemove ? 'opacity-55' : 'opacity-100'
                }`}
              >
                <PdfPageThumbnail
                  file={primaryItem.file}
                  pageNumber={pageNum}
                  rotationDeg={pageRot}
                />
              </div>

              {(isRemoveTool || isExtractTool) && (
                <button
                  type="button"
                  disabled={isRemoveTool && totalPages <= 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePageSelection(pageNum);
                  }}
                  aria-label={
                    isRemoveTool
                      ? `${isMarkedRemove ? 'Keep' : 'Remove'} page ${pageNum}`
                      : `${isMarkedExtract ? 'Deselect' : 'Select'} page ${pageNum}`
                  }
                  className={`mt-2 inline-flex w-full items-center justify-center gap-1 rounded-control px-2 py-1.5 text-xs font-semibold transition-colors ${
                    isMarkedRemove
                      ? 'bg-danger text-white hover:bg-danger/90'
                      : isRemoveTool
                      ? 'border border-border bg-surface text-danger hover:bg-danger-bg disabled:opacity-40'
                      : isMarkedExtract
                      ? 'bg-primary text-primary-ink'
                      : 'border border-border bg-surface text-ink hover:bg-surface-subtle'
                  }`}
                >
                  {isRemoveTool ? (
                    <>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isMarkedRemove ? 'Marked to Delete' : 'Delete Page'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isMarkedExtract ? 'Selected' : 'Select Page'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 12 && (
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => setShowAllPages((prev) => !prev)}
            className="rounded-control border border-border bg-canvas px-4 py-1.5 text-xs font-semibold text-ink hover:bg-surface-subtle"
          >
            {showAllPages
              ? 'Show First 12 Pages'
              : `Show All ${totalPages} Pages`}
          </button>
        </div>
      )}
    </div>
  );
};
