import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { FileDropzone } from '../../components/file-queue/FileDropzone';
import { FileQueueList } from '../../components/file-queue/FileQueueList';
import { ToolOptionsForm } from '../../components/forms/ToolOptionsForm';
import { OrganizePagesGrid } from '../../components/preview/OrganizePagesGrid';
import { PdfPagePreviewModal } from '../../components/preview/PdfPagePreviewModal';
import { PdfVisualPagesPanel } from '../../components/preview/PdfVisualPagesPanel';
import { ScannedPdfOcrModal } from '../../components/preview/ScannedPdfOcrModal';
import { ToolVisualIcon } from '../../components/icons/ToolVisualIcon';
import { ProcessingStatusBar } from '../../components/progress/ProcessingStatusBar';
import { ResultSummaryPanel } from '../../components/feedback/ResultSummaryPanel';
import { inspectAndValidateFile } from '../../processing/validation';
import { executeProcessingJob } from '../../processing/workers/worker-client';
import { detectScannedPdf } from '../../processing/adapters/pdfjs-helper';
import { en } from '../../i18n/en';
import type { OrganizedPageItem } from '../../processing/adapters/pages-adapter';
import type {
  ProcessingProgress,
  ProcessingResult,
  QueueItem,
  ToolDefinition,
} from '../../processing/shared-types';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({ tool }) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [options, setOptions] = useState<Record<string, unknown>>({});
  const [pageSequence, setPageSequence] = useState<OrganizedPageItem[]>([]);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isOcrPromptOpen, setIsOcrPromptOpen] = useState(false);
  const [scannedFilePrompted, setScannedFilePrompted] = useState<File | null>(null);

  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQueue([]);
    setOptions({});
    setPageSequence([]);
    setResult(null);
    setErrorMsg(null);
    setProgress(null);
    setIsOcrPromptOpen(false);
    setScannedFilePrompted(null);
  }, [tool.id]);

  useEffect(() => {
    if (tool.id !== 'organize-pdf') return;
    const firstReady = queue.find((item) => item.status === 'ready');
    if (!firstReady || !firstReady.pageCount) {
      setPageSequence([]);
      return;
    }
    const initial: OrganizedPageItem[] = Array.from(
      { length: firstReady.pageCount },
      (_, idx) => ({
        originalPageIndex: idx,
        rotationDelta: 0,
      })
    );
    setPageSequence(initial);
  }, [tool.id, queue]);

  const handleFilesSelected = useCallback(
    async (incomingFiles: File[]) => {
      setErrorMsg(null);
      setResult(null);

      const filesToInspect = tool.allowMultipleFiles
        ? incomingFiles
        : incomingFiles.slice(0, 1);

      const newItems: QueueItem[] = await Promise.all(
        filesToInspect.map(async (file, index) => {
          const sessionId = `item-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}-${index}`;
          const inspection = await inspectAndValidateFile(file, tool);
          return {
            sessionId,
            file,
            name: file.name,
            sizeBytes: file.size,
            mimeType: inspection.mimeType,
            status: inspection.status,
            pageCount: inspection.pageCount,
            dimensions: inspection.dimensions,
            errorMessage: inspection.errorMessage,
          };
        })
      );

      setQueue((prev) => {
        if (!tool.allowMultipleFiles) {
          return newItems;
        }
        return [...prev, ...newItems];
      });

      setLiveAnnouncement(
        `${newItems.length} file${
          newItems.length === 1 ? '' : 's'
        } added to queue.`
      );
    },
    [tool]
  );

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    setQueue((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setResult(null);
  };

  const handleReorderDrag = (sourceIndex: number, targetIndex: number) => {
    setQueue((prev) => {
      if (sourceIndex === targetIndex) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(sourceIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setResult(null);
  };

  const handleRemoveItem = (sessionId: string) => {
    setQueue((prev) => prev.filter((i) => i.sessionId !== sessionId));
    setResult(null);
  };

  const handleClearQueue = () => {
    setQueue([]);
    setResult(null);
    setErrorMsg(null);
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const readyItems = queue.filter((i) => i.status === 'ready');
  const canExecute =
    readyItems.length >= tool.minFiles &&
    (!tool.allowMultipleFiles || readyItems.length <= 50) &&
    !isProcessing;

  const runProcessing = async (effectiveOpts: Record<string, unknown>) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsProcessing(true);
    setProgress({
      stage: 'Reading files',
      message: 'Processing document in browser memory...',
    });

    try {
      const effectiveOptions = { ...effectiveOpts };
      if (tool.id === 'organize-pdf' && pageSequence.length > 0) {
        effectiveOptions.pageSequence = pageSequence;
      }

      const jobResult = await executeProcessingJob(
        tool.id,
        {
          jobId: `job-${Date.now()}`,
          files: readyItems.map((i) => i.file),
          options: effectiveOptions,
          signal: controller.signal,
        },
        (prog) => {
          setProgress(prog);
        }
      );

      setResult(jobResult);
      setLiveAnnouncement(
        `${tool.name} completed. Your file is ready for download.`
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsProcessing(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleExecuteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResult(null);

    if (readyItems.length < tool.minFiles) {
      setErrorMsg(
        tool.minFiles >= 2
          ? en.errors.mergeMinItems
          : en.errors.emptyQueue
      );
      return;
    }

    // Scanned PDF detection check for PDF to Excel (.xlsx)
    if (
      tool.id === 'pdf-to-excel' &&
      !options.convertAsImage &&
      readyItems.length > 0
    ) {
      try {
        const fileBytes = new Uint8Array(
          await readyItems[0].file.arrayBuffer()
        );
        const scanCheck = await detectScannedPdf(fileBytes);
        if (scanCheck.isScanned) {
          setScannedFilePrompted(readyItems[0].file);
          setIsOcrPromptOpen(true);
          return;
        }
      } catch {
        // Fallback to normal execution if inspection is blocked
      }
    }

    await runProcessing(options);
  };

  const handleApplyOcr = () => {
    setIsOcrPromptOpen(false);
    navigate('/tools/ocr-pdf');
  };

  const handleContinueWithoutOcr = async () => {
    setIsOcrPromptOpen(false);
    setOptions((prev) => ({ ...prev, convertAsImage: true }));
    await runProcessing({ ...options, convertAsImage: true });
  };

  const handleCloseOcrModal = () => {
    setIsOcrPromptOpen(false);
  };

  const getActionBtnClasses = () => {
    if (!canExecute) {
      return 'bg-slate-200 text-slate-400 cursor-not-allowed';
    }
    switch (tool.id) {
      case 'merge-pdf':
      case 'insert-replace-pages':
      case 'copy-pdf':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 active:scale-[0.99]';
      case 'split-pdf':
      case 'extract-pages':
      case 'remove-pages':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 active:scale-[0.99]';
      case 'compress-pdf':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.99]';
      case 'word-to-pdf':
      case 'pdf-to-word':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 active:scale-[0.99]';
      case 'excel-to-pdf':
      case 'pdf-to-excel':
        return 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25 active:scale-[0.99]';
      case 'powerpoint-to-pdf':
      case 'pdf-to-powerpoint':
        return 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/25 active:scale-[0.99]';
      default:
        return 'bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/25 active:scale-[0.99]';
    }
  };

  return (
    <main className="flex-1 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* iLovePDF Clean Tool Header */}
        <div className="animate-stage-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <ToolVisualIcon toolId={tool.id} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight whitespace-nowrap">
                  {tool.name}
                </h1>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{en.brand.privacyStatement}</span>
                </div>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-normal text-slate-500 w-full leading-relaxed">
                {tool.shortDescription}
              </p>
            </div>
          </div>

          <Link
            to="/tools"
            className="smooth-interactive inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-primary hover:text-primary hover:bg-slate-50"
          >
            <LayoutGrid className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>All PDF Tools</span>
          </Link>
        </div>

        {/* Clean Two-Column Workspace (Canvas + Right Sidebar) */}
        <div className="animate-stage-2 grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-12 min-h-[540px]">
          {/* Left Column: File Upload Canvas, Queue, and Output */}
          <div className="flex flex-col justify-between h-full lg:col-span-7 xl:col-span-8">
            <div className="flex flex-col flex-1">
              <FileDropzone
                tool={tool}
                hasExistingItems={queue.length > 0}
                disabled={isProcessing}
                onFilesSelected={handleFilesSelected}
              />

              {queue.length > 0 && (
                <div className="animate-panel-reveal p-4 sm:p-6 space-y-5">
                  <FileQueueList
                    items={queue}
                    allowReorder={tool.allowMultipleFiles}
                    disabled={isProcessing}
                    liveAnnouncement={liveAnnouncement}
                    onMoveItem={handleMoveItem}
                    onReorderDrag={handleReorderDrag}
                    onRemoveItem={handleRemoveItem}
                    onClearQueue={handleClearQueue}
                    onPreviewItem={(item) => setPreviewItem(item)}
                  />

                  <PdfVisualPagesPanel
                    toolId={tool.id}
                    items={queue}
                    options={options}
                    onChangeOptions={(next) => {
                      setOptions(next);
                      setResult(null);
                    }}
                    onInspectFile={(item) => setPreviewItem(item)}
                  />
                </div>
              )}

              {tool.id === 'organize-pdf' &&
                readyItems.length > 0 &&
                readyItems[0].pageCount && (
                  <div className="p-5">
                    <OrganizePagesGrid
                      file={readyItems[0].file}
                      totalPages={readyItems[0].pageCount}
                      sequence={pageSequence}
                      onChangeSequence={(next, msg) => {
                        setPageSequence(next);
                        setResult(null);
                        setLiveAnnouncement(msg);
                      }}
                    />
                  </div>
                )}

              {isProcessing && (
                <div className="p-6">
                  <ProcessingStatusBar
                    progress={progress}
                    onCancel={handleCancelProcessing}
                  />
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-3 border-t border-danger bg-danger-bg px-6 py-4 text-xs text-danger"
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-bold">Unable to complete action</p>
                    <p className="mt-0.5">{errorMsg}</p>
                    <p className="mt-1 text-ink">
                      Your original files remain unchanged. Please review your settings and try again.
                    </p>
                  </div>
                </div>
              )}

              <ResultSummaryPanel
                result={result}
                onResetResult={() => setResult(null)}
              />
            </div>

            {/* In-Browser Privacy Footer Guarantee */}
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-6 py-3 text-xs text-slate-500 font-medium">
              <ShieldCheck
                className="h-4 w-4 text-emerald-600 shrink-0"
                aria-hidden="true"
              />
              <span>{en.brand.privacyStatement}</span>
            </div>
          </div>

          {/* Right Column: iLovePDF Style Docked Options Sidebar & Big Action Button */}
          <aside
            aria-label="Options and execution"
            className="flex flex-col justify-between border-t border-slate-200 bg-slate-50/70 lg:col-span-5 lg:border-l lg:border-t-0 xl:col-span-4"
          >
            <form onSubmit={handleExecuteTask} className="p-6 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" aria-hidden="true" />
                    <h2 className="font-display text-sm font-bold text-ink">
                      {tool.name} Options
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    {readyItems.length} file{readyItems.length === 1 ? '' : 's'} ready
                  </span>
                </div>

                <ToolOptionsForm
                  tool={tool}
                  options={options}
                  disabled={isProcessing}
                  onChangeOptions={(next) => {
                    setOptions(next);
                    setResult(null);
                  }}
                />
              </div>

              {/* The Signature Big Action Button at the Bottom */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  type="submit"
                  disabled={!canExecute}
                  className={`smooth-interactive inline-flex w-full items-center justify-center gap-2.5 rounded-xl px-6 py-4 text-base font-bold transition-all duration-200 ${getActionBtnClasses()}`}
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>{tool.actionLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                {!canExecute && !isProcessing && (
                  <p className="text-center text-xs font-medium text-slate-500">
                    {tool.minFiles >= 2
                      ? `Select at least ${tool.minFiles} files to execute.`
                      : 'Select a valid document to execute.'}
                  </p>
                )}
              </div>
            </form>
          </aside>
        </div>

        {/* Scanned PDF Modal */}
        <ScannedPdfOcrModal
          isOpen={isOcrPromptOpen}
          fileName={scannedFilePrompted?.name || ''}
          onApplyOcr={handleApplyOcr}
          onContinueWithoutOcr={handleContinueWithoutOcr}
          onClose={handleCloseOcrModal}
        />

        {/* Page Preview Modal */}
        {previewItem && (
          <PdfPagePreviewModal
            item={previewItem}
            onClose={() => setPreviewItem(null)}
          />
        )}
      </div>
    </main>
  );
};
