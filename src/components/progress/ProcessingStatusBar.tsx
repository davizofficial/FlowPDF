import React from 'react';
import { Loader2, Square } from 'lucide-react';
import type { ProcessingProgress } from '../../processing/shared-types';

interface ProcessingStatusBarProps {
  progress: ProcessingProgress | null;
  onCancel: () => void;
}

export const ProcessingStatusBar: React.FC<ProcessingStatusBarProps> = ({
  progress,
  onCancel,
}) => {
  if (!progress) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-primary bg-surface p-4"
    >
      <div className="flex items-center gap-3">
        <Loader2
          className="h-5 w-5 animate-spin text-primary shrink-0"
          aria-hidden="true"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Stage: {progress.stage}
          </p>
          {progress.message && (
            <p className="mt-0.5 text-xs text-ink">{progress.message}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 rounded-control border border-danger bg-danger-bg px-3 py-1.5 text-xs font-semibold text-danger hover:opacity-90"
      >
        <Square className="h-3 w-3" aria-hidden="true" />
        <span>Cancel Task</span>
      </button>
    </div>
  );
};
