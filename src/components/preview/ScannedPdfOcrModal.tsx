import React, { useEffect } from 'react';
import { AlertTriangle, Scan, FileSpreadsheet, X, ArrowRight } from 'lucide-react';

interface ScannedPdfOcrModalProps {
  isOpen: boolean;
  fileName?: string;
  onApplyOcr: () => void;
  onContinueWithoutOcr: () => void;
  onClose: () => void;
}

export const ScannedPdfOcrModal: React.FC<ScannedPdfOcrModalProps> = ({
  isOpen,
  fileName,
  onApplyOcr,
  onContinueWithoutOcr,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanned-pdf-ocr-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 backdrop-blur-sm p-4 sm:p-6 animate-fade-in"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-panel border-2 border-slate-300 bg-surface shadow-2xl animate-stage-1">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-amber-500/15 text-amber-700">
              <Scan className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Scanned Document Notice
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="smooth-interactive inline-flex h-8 w-8 items-center justify-center rounded-control text-slate-500 hover:bg-slate-200/80 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-amber-100 text-amber-700 border border-amber-300">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2
                id="scanned-pdf-ocr-title"
                className="font-display text-xl sm:text-2xl font-bold text-ink"
              >
                You are trying to convert a scanned PDF
              </h2>
              {fileName && (
                <p className="font-mono text-xs font-semibold text-slate-600">
                  {fileName}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-panel border-2 border-slate-200 bg-slate-50/80 p-4 space-y-2.5 text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            <p>
              To extract content of scanned documents, OCR is required.
            </p>
            <p>
              Otherwise, the content of your document will be converted as an image into a non editable Excel file.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="font-display text-base font-bold text-ink text-center sm:text-left">
              Do you want to apply OCR?
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="smooth-interactive inline-flex items-center justify-center rounded-control border-2 border-slate-300 bg-canvas px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onContinueWithoutOcr}
              className="smooth-interactive inline-flex items-center justify-center gap-1.5 rounded-control border-2 border-slate-300 bg-surface px-4 py-2.5 text-xs font-bold text-ink hover:border-primary hover:text-primary hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Continue Without OCR (Convert as Image)</span>
            </button>

            <button
              type="button"
              onClick={onApplyOcr}
              className="smooth-interactive inline-flex items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-xs font-bold text-primary-ink shadow-xs hover:bg-primary-hover hover:shadow-sm"
            >
              <Scan className="h-4 w-4" aria-hidden="true" />
              <span>Apply OCR</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
