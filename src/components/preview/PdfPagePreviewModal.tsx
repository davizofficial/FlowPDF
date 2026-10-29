import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { renderPdfPageToImage } from '../../processing/adapters/pdfjs-helper';
import type { QueueItem } from '../../processing/shared-types';

interface PdfPagePreviewModalProps {
  item: QueueItem | null;
  onClose: () => void;
}

export const PdfPagePreviewModal: React.FC<PdfPagePreviewModalProps> = ({
  item,
  onClose,
}) => {
  const [pageNumber, setPageNumber] = useState(1);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const totalPages = item?.pageCount ?? 1;

  useEffect(() => {
    setPageNumber(1);
  }, [item?.sessionId]);

  useEffect(() => {
    if (!item) return;

    let cancelled = false;
    setLoading(true);
    setPreviewError(null);
    setDataUrl(null);

    (async () => {
      try {
        const bytes = new Uint8Array(await item.file.arrayBuffer());
        const rendered = await renderPdfPageToImage(bytes, pageNumber, {
          scale: 1.2,
          format: 'image/jpeg',
          quality: 0.82,
        });
        if (!cancelled) {
          setDataUrl(rendered.dataUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPreviewError(
            'Page preview is unavailable in the current environment, but all PDF actions remain ready to use.'
          );
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item, pageNumber]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-modal-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-dialog border border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2
              id="pdf-preview-modal-title"
              className="font-display text-base font-bold text-ink"
            >
              Preview: {item.name}
            </h2>
            <p className="text-xs text-muted">
              Page {pageNumber} of {totalPages}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close document preview"
            className="rounded-control border border-border p-1.5 text-muted hover:bg-surface-subtle hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-[340px] flex-1 items-center justify-center overflow-auto bg-canvas p-4">
          {loading && (
            <p role="status" className="text-xs font-medium text-muted">
              Loading page {pageNumber}...
            </p>
          )}
          {!loading && previewError && (
            <div className="max-w-md rounded-control border border-warning bg-warning-bg p-4 text-xs text-warning">
              {previewError}
            </div>
          )}
          {!loading && dataUrl && (
            <img
              src={dataUrl}
              alt={`Preview of ${item.name} page ${pageNumber}`}
              className="max-h-[65vh] w-auto border border-border bg-surface shadow-sm"
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 rounded-control border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Previous</span>
            </button>
            <span className="text-xs font-semibold text-ink">
              Page {pageNumber} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="inline-flex items-center gap-1 rounded-control border border-border bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-control bg-primary px-4 py-1.5 text-xs font-semibold text-primary-ink hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
