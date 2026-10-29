import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { formatBytes } from '../../lib/format';
import { triggerArtifactDownload } from '../../processing/output';
import type { ProcessingResult } from '../../processing/shared-types';

interface ResultSummaryPanelProps {
  result: ProcessingResult | null;
  onResetResult: () => void;
}

export const ResultSummaryPanel: React.FC<ResultSummaryPanelProps> = ({
  result,
  onResetResult,
}) => {
  if (!result || result.outputs.length === 0) return null;

  const primaryArtifact = result.outputs[0];
  const additionalArtifacts = result.outputs.slice(1);
  const compReport = result.metadata.compressionReport;
  const extractedPreview = result.metadata.extractedTextPreview;
  const sanitizedFields = result.metadata.sanitizedFields;

  return (
    <section
      aria-labelledby="result-summary-heading"
      className="border-t-2 border-success bg-surface px-5 py-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-start gap-2.5">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 text-success shrink-0"
            aria-hidden="true"
          />
          <div>
            <h2
              id="result-summary-heading"
              className="font-display text-sm font-bold text-ink"
            >
              Your Document Is Ready for Download
            </h2>
            <p className="text-xs text-muted">
              Processed privately in your browser.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetResult}
          className="inline-flex items-center gap-1 rounded-control border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-subtle"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          <span>Start Over</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <dl className="grid grid-cols-2 divide-x divide-border rounded-control border border-border bg-canvas sm:grid-cols-4">
        <div className="px-3.5 py-2.5">
          <dt className="text-[11px] font-medium text-muted">Original Size</dt>
          <dd className="mt-0.5 text-xs font-bold text-ink">
            {formatBytes(result.metadata.inputBytesTotal)}
          </dd>
        </div>
        <div className="px-3.5 py-2.5">
          <dt className="text-[11px] font-medium text-muted">Final Size</dt>
          <dd className="mt-0.5 text-xs font-bold text-ink">
            {formatBytes(result.metadata.outputBytesTotal)}
          </dd>
        </div>
        {typeof result.metadata.totalOutputPages === 'number' && (
          <div className="px-3.5 py-2.5">
            <dt className="text-[11px] font-medium text-muted">Total Pages</dt>
            <dd className="mt-0.5 text-xs font-bold text-ink">
              {result.metadata.totalOutputPages}
            </dd>
          </div>
        )}
        <div className="px-3.5 py-2.5">
          <dt className="text-[11px] font-medium text-muted">Output Files</dt>
          <dd className="mt-0.5 text-xs font-bold text-ink">
            {result.outputs.length}
          </dd>
        </div>
      </dl>

      {/* Compression Summary */}
      {compReport && (
        <div
          className={`rounded-control border px-3.5 py-2.5 text-xs ${
            compReport.retainedBaseline
              ? 'border-warning bg-warning-bg text-warning'
              : 'border-success/30 bg-surface-subtle text-ink'
          }`}
        >
          <p className="font-semibold">
            {compReport.retainedBaseline
              ? 'Original File Size Kept'
              : `File Size Reduced by ${formatBytes(compReport.savedBytes)} (${compReport.savingsPercent}%)`}
          </p>
          {compReport.reason && <p className="mt-1">{compReport.reason}</p>}
        </div>
      )}

      {/* Sanitized Metadata Summary */}
      {sanitizedFields && sanitizedFields.length > 0 && (
        <div className="rounded-control border border-border bg-canvas px-3.5 py-2.5 text-xs">
          <p className="font-semibold text-ink">
            Removed Document Metadata Fields:
          </p>
          <p className="mt-0.5 text-muted">
            {sanitizedFields.join(', ')}
          </p>
        </div>
      )}

      {/* Extracted Text Preview */}
      {extractedPreview && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-ink">
            Extracted Text Preview
          </p>
          <pre className="max-h-40 overflow-auto rounded-control border border-border bg-canvas p-3 font-mono text-[11px] text-ink whitespace-pre-wrap">
            {extractedPreview}
          </pre>
        </div>
      )}

      {/* Important Notes */}
      {result.warnings.length > 0 && (
        <div
          role="note"
          className="rounded-control border border-warning bg-warning-bg px-3.5 py-2.5 text-xs text-warning space-y-1"
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Important Information</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Primary Download Action */}
      <div className="flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-ink">
          <FileCheck2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
          <span className="font-semibold">{primaryArtifact.name}</span>
          <span className="text-muted">
            ({formatBytes(primaryArtifact.bytes.byteLength)})
          </span>
        </div>

        <button
          type="button"
          onClick={() => triggerArtifactDownload(primaryArtifact)}
          className="inline-flex items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-xs font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Download {primaryArtifact.name}</span>
        </button>
      </div>

      {/* Individual Files */}
      {additionalArtifacts.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold text-muted">
            Individual Files ({additionalArtifacts.length})
          </p>
          <ul className="divide-y divide-border rounded-control border border-border bg-canvas">
            {additionalArtifacts.map((art, idx) => (
              <li
                key={`${art.name}-${idx}`}
                className="flex items-center justify-between px-3 py-2 text-xs"
              >
                <span className="truncate text-ink">{art.name}</span>
                <button
                  type="button"
                  onClick={() => triggerArtifactDownload(art)}
                  className="ml-2 shrink-0 font-semibold text-primary hover:underline"
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
