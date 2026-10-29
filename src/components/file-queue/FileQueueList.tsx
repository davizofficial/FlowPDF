import React, { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
  GripVertical,
} from 'lucide-react';
import { checkResourceThresholds, formatBytes } from '../../lib/format';
import { en } from '../../i18n/en';
import type { QueueItem } from '../../processing/shared-types';

interface FileQueueListProps {
  items: QueueItem[];
  allowReorder: boolean;
  disabled?: boolean;
  liveAnnouncement: string;
  onMoveItem: (index: number, direction: 'up' | 'down') => void;
  onReorderDrag?: (fromIndex: number, toIndex: number) => void;
  onRemoveItem: (sessionId: string) => void;
  onClearQueue: () => void;
  onPreviewItem: (item: QueueItem) => void;
}

function renderItemStateBadge(item: QueueItem) {
  switch (item.status) {
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Ready
        </span>
      );
    case 'password-protected':
      return (
        <span className="inline-flex items-center gap-1 rounded-control bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Password Protected
        </span>
      );
    case 'damaged':
    case 'invalid':
      return (
        <span className="inline-flex items-center gap-1 rounded-control bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
          <XCircle className="h-3 w-3" aria-hidden="true" />
          {item.status === 'damaged' ? 'Unreadable' : 'Invalid'}
        </span>
      );
    default:
      return (
        <span className="text-xs text-muted">
          Checking...
        </span>
      );
  }
}

export const FileQueueList: React.FC<FileQueueListProps> = ({
  items,
  allowReorder,
  disabled = false,
  liveAnnouncement,
  onMoveItem,
  onReorderDrag,
  onRemoveItem,
  onClearQueue,
  onPreviewItem,
}) => {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const resourceStatus = checkResourceThresholds(items);
  const readyItems = items.filter((i) => i.status === 'ready');
  const totalKnownPages = readyItems.reduce(
    (sum, i) => sum + (i.pageCount ?? 0),
    0
  );

  return (
    <section aria-labelledby="queue-section-heading">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {resourceStatus.exceedsThreshold && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-b border-warning bg-warning-bg px-5 py-3 text-xs text-warning"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Large file batch</p>
            <p className="mt-0.5">{en.warnings.batchResourceThreshold}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-subtle/60 px-5 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2
            id="queue-section-heading"
            className="text-xs font-bold text-ink"
          >
            Selected Files ({items.length})
          </h2>
          <span className="text-xs text-muted">
            {formatBytes(resourceStatus.totalBytes)}
            {totalKnownPages > 0 && ` • ${totalKnownPages} pages`}
          </span>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={onClearQueue}
          className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{en.dropzone.clearQueue}</span>
        </button>
      </div>

      <ol className="divide-y divide-border bg-surface">
        {items.map((item, idx) => {
          const isImage = item.mimeType.startsWith('image/');
          const canPreview =
            item.status === 'ready' && item.mimeType === 'application/pdf';

          return (
            <li
              key={item.sessionId}
              draggable={allowReorder && !disabled && items.length > 1}
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={(e) => {
                if (allowReorder && draggedIdx !== null && draggedIdx !== idx) {
                  e.preventDefault();
                }
              }}
              onDrop={() => {
                if (
                  allowReorder &&
                  draggedIdx !== null &&
                  draggedIdx !== idx &&
                  onReorderDrag
                ) {
                  onReorderDrag(draggedIdx, idx);
                }
                setDraggedIdx(null);
              }}
              onDragEnd={() => setDraggedIdx(null)}
              className={`group flex flex-col justify-between gap-3 px-5 py-3.5 transition-colors duration-fast hover:bg-canvas/60 sm:flex-row sm:items-center ${
                draggedIdx === idx ? 'opacity-50 bg-surface-subtle' : ''
              }`}
            >
              <div className="flex min-w-0 items-start gap-3">
                {allowReorder && items.length > 1 && (
                  <span
                    className="mt-1 hidden cursor-grab text-muted/60 group-hover:text-ink sm:inline-flex"
                    aria-hidden="true"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                )}

                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-control bg-surface-subtle text-xs font-semibold text-ink"
                  aria-label={`Queue position ${idx + 1}`}
                >
                  {idx + 1}
                </span>

                <div className="mt-0.5 text-muted">
                  {isImage ? (
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="truncate text-sm font-semibold text-ink">
                      {item.name}
                    </span>
                    {renderItemStateBadge(item)}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{formatBytes(item.sizeBytes)}</span>
                    {typeof item.pageCount === 'number' && (
                      <span>
                        {item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}
                      </span>
                    )}
                  </div>

                  {item.errorMessage && (
                    <p
                      role="alert"
                      className="mt-1 text-xs font-medium text-danger"
                    >
                      {item.errorMessage}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                {canPreview && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onPreviewItem(item)}
                    aria-label={`Preview pages of ${item.name}`}
                    className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-subtle"
                  >
                    <Eye className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    <span>Preview</span>
                  </button>
                )}

                {allowReorder && items.length > 1 && (
                  <>
                    <button
                      type="button"
                      disabled={disabled || idx === 0}
                      onClick={() => onMoveItem(idx, 'up')}
                      aria-label={`Move ${item.name} earlier in queue`}
                      className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-35"
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Up</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled || idx === items.length - 1}
                      onClick={() => onMoveItem(idx, 'down')}
                      aria-label={`Move ${item.name} later in queue`}
                      className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-35"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">Down</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemoveItem(item.sessionId)}
                  aria-label={`Remove ${item.name} from queue`}
                  className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-2 py-1 text-xs font-medium text-danger hover:bg-danger-bg"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Remove</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
