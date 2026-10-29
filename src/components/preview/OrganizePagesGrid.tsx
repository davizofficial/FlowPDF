import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Trash2, RotateCcw } from 'lucide-react';
import { PdfPageThumbnail } from './PdfPageThumbnail';
import type { OrganizedPageItem } from '../../processing/adapters/pages-adapter';

interface OrganizePagesGridProps {
  file: File;
  totalPages: number;
  sequence: OrganizedPageItem[];
  onChangeSequence: (next: OrganizedPageItem[], announcement: string) => void;
}

export const OrganizePagesGrid: React.FC<OrganizePagesGridProps> = ({
  file,
  totalPages,
  sequence,
  onChangeSequence,
}) => {
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sequence.length) return;
    const next = [...sequence];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    onChangeSequence(
      next,
      `Moved source page ${moved.originalPageIndex + 1} to position ${targetIdx + 1}.`
    );
  };

  const handleRotate = (index: number) => {
    const next = sequence.map((item, idx) =>
      idx === index
        ? { ...item, rotationDelta: (item.rotationDelta + 90) % 360 }
        : item
    );
    const pageNum = sequence[index].originalPageIndex + 1;
    const newAngle = next[index].rotationDelta;
    onChangeSequence(
      next,
      `Rotated source page ${pageNum} to ${newAngle} degrees.`
    );
  };

  const handleRemove = (index: number) => {
    if (sequence.length <= 1) return;
    const removed = sequence[index];
    const next = sequence.filter((_, idx) => idx !== index);
    onChangeSequence(
      next,
      `Removed source page ${removed.originalPageIndex + 1}. ${next.length} pages remaining.`
    );
  };

  const handleReset = () => {
    const initial: OrganizedPageItem[] = Array.from(
      { length: totalPages },
      (_, idx) => ({
        originalPageIndex: idx,
        rotationDelta: 0,
      })
    );
    onChangeSequence(initial, 'Reset all pages to original order and rotation.');
  };

  return (
    <div className="space-y-3 rounded-panel border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <h3 className="font-display text-sm font-bold text-ink">
            Visual Page Organizer ({sequence.length} of {totalPages} pages kept)
          </h3>
          <p className="text-xs text-muted">
            Reorder pages, rotate individual pages by 90°, or click the trash button to delete unwanted pages.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="smooth-interactive inline-flex items-center gap-1 rounded-control border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-subtle"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reset All Pages</span>
        </button>
      </div>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sequence.map((item, idx) => {
          const sourcePageOneBased = item.originalPageIndex + 1;
          return (
            <li
              key={`${item.originalPageIndex}-${idx}`}
              className="smooth-interactive flex flex-col justify-between rounded-control border border-border bg-canvas p-2.5 hover:border-primary/40"
            >
              <div className="flex items-center justify-between pb-2">
                <span className="rounded-control bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink border border-border">
                  Page {sourcePageOneBased}
                </span>
                {item.rotationDelta !== 0 && (
                  <span className="rounded-control bg-warning-bg px-1.5 py-0.5 font-mono text-[11px] font-semibold text-warning">
                    +{item.rotationDelta}°
                  </span>
                )}
              </div>

              <div className="my-1">
                <PdfPageThumbnail
                  file={file}
                  pageNumber={sourcePageOneBased}
                  rotationDeg={item.rotationDelta}
                />
              </div>

              <div className="mt-2 flex items-center justify-between gap-1 border-t border-border pt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'left')}
                    aria-label={`Move source page ${sourcePageOneBased} earlier`}
                    className="rounded-control border border-border bg-surface p-1 text-ink hover:bg-surface-subtle disabled:opacity-40"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sequence.length - 1}
                    onClick={() => handleMove(idx, 'right')}
                    aria-label={`Move source page ${sourcePageOneBased} later`}
                    className="rounded-control border border-border bg-surface p-1 text-ink hover:bg-surface-subtle disabled:opacity-40"
                  >
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleRotate(idx)}
                    aria-label={`Rotate source page ${sourcePageOneBased} by 90 degrees`}
                    className="rounded-control border border-border bg-surface p-1 text-ink hover:bg-surface-subtle"
                  >
                    <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={sequence.length <= 1}
                    onClick={() => handleRemove(idx)}
                    aria-label={`Remove source page ${sourcePageOneBased}`}
                    title={
                      sequence.length <= 1
                        ? 'At least one page must remain in the PDF'
                        : `Delete Page ${sourcePageOneBased}`
                    }
                    className="rounded-control border border-border bg-surface p-1 text-danger hover:bg-danger-bg disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
