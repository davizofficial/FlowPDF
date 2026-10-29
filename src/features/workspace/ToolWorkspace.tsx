import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
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

      setQueue((prev) => (tool.allowMultipleFiles ? [...prev, ...newItems] : newItems));
      setLiveAnnouncement(
        `Added ${newItems.length} ${
          newItems.length === 1 ? 'file' : 'files'
        } to ${tool.name}.`
      );
    },
    [tool]
  );

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= queue.length) return;
    const next = [...queue];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setQueue(next);
    setResult(null);
    setLiveAnnouncement(
      `Moved ${moved.name} to position ${targetIdx + 1} of ${next.length}.`
    );
  };

  const handleReorderDrag = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const next = [...queue];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setQueue(next);
    setResult(null);
    setLiveAnnouncement(
      `Moved ${moved.name} to position ${toIndex + 1} of ${next.length}.`
    );
  };

  const handleRemoveItem = (sessionId: string) => {
    const removed = queue.find((i) => i.sessionId === sessionId);
    const next = queue.filter((i) => i.sessionId !== sessionId);
    setQueue(next);
    setResult(null);
    if (removed) {
      setLiveAnnouncement(
        `Removed ${removed.name}. ${next.length} files remaining.`
      );
    }
  };

  const handleClearQueue = () => {
    if (isProcessing || result) {
      const confirmed = window.confirm(
        'Clear all files and reset the current workspace?'
      );
      if (!confirmed) return;
    }
    setQueue([]);
    setPageSequence([]);
    setResult(null);
    setErrorMsg(null);
    setLiveAnnouncement('Cleared all files.');
  };

  const handleCancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProgress(null);
    setErrorMsg(en.errors.cancelled);
  };

  const readyItems = queue.filter((i) => i.status === 'ready');
  const canExecute =
    !isProcessing && readyItems.length >= tool.minFiles;

  const runProcessing = async (opts: Record<string, unknown>) => {
    setErrorMsg(null);
    setResult(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsProcessing(true);
    setProgress({
      stage: 'Reading files',
      message: 'Processing your document privately in the browser...',
    });

    try {
      const effectiveOptions: Record<string, unknown> = {
        ...opts,
      };
      if (tool.id === 'organize-pdf') {
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

  return (
    <main className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Simple, Clean Tool Heading */}
        <div className="animate-stage-1 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <ToolVisualIcon toolId={tool.id} size="md" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">
                {tool.name}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-700">
                {tool.shortDescription}
              </p>
            </div>
          </div>

          <Link
            to="/tools"
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-control border-2 border-slate-300 bg-surface px-3.5 py-2 text-xs font-bold text-ink hover:border-primary hover:text-primary"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            <span>All PDF Tools</span>
          </Link>
        </div>

        {/* Clean Two-Column Workspace */}
        <div className="animate-stage-2 grid grid-cols-1 overflow-hidden rounded-panel border-2 border-slate-300 bg-surface shadow-sm lg:grid-cols-12 min-h-[520px]">
          {/* Left Column: File Upload, Queue, and Output */}
          <div className="flex flex-col justify-between h-full lg:col-span-7 xl:col-span-8">
            <div className="flex flex-col flex-1">
              <FileDropzone
                tool={tool}
                hasExistingItems={queue.length > 0}
                disabled={isProcessing}
                onFilesSelected={handleFilesSelected}
              />

              {queue.length > 0 && (
                <div className="animate-panel-reveal">
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
                <div className="p-5">
                  <ProcessingStatusBar
                    progress={progress}
                    onCancel={handleCancelProcessing}
                  />
                </div>
              )}

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-start gap-3 border-t border-danger bg-danger-bg px-5 py-4 text-xs text-danger"
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

            {/* Simple Privacy Footer Note inside Workspace */}
            <div className="flex items-center gap-2 border-t border-border bg-canvas/70 px-5 py-3 text-xs text-muted">
              <ShieldCheck
                className="h-4 w-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>{en.brand.privacyStatement}</span>
            </div>
          </div>

          {/* Right Column: Options and Primary Action */}
          <aside
            aria-label="Options and execution"
            className="flex flex-col justify-between border-t border-border bg-surface-subtle/40 lg:col-span-5 lg:border-l lg:border-t-0 xl:col-span-4"
          >
            <form onSubmit={handleExecuteTask} className="p-5 space-y-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-sm font-bold text-ink">
                  Options
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Adjust your preferences below before processing.
                </p>
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

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!canExecute}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-sm font-semibold text-primary-ink transition-colors duration-fast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>{tool.actionLabel}</span>
                </button>
                {!canExecute && !isProcessing && (
                  <p className="mt-2 text-center text-xs text-muted">
                    {tool.minFiles >= 2
                      ? `Please select at least ${tool.minFiles} valid files to continue.`
                      : 'Please select a valid file to continue.'}
                  </p>
                )}
              </div>
            </form>

            <section
              aria-labelledby="tool-limitations-heading"
              className="border-t border-border px-5 py-4 space-y-1.5"
            >
              <h3
                id="tool-limitations-heading"
                className="text-xs font-semibold text-ink"
              >
                Notes
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-xs text-muted">
                {tool.limitations.map((limit, idx) => (
                  <li key={idx}>{limit}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>

      <PdfPagePreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <ScannedPdfOcrModal
        isOpen={isOcrPromptOpen}
        fileName={scannedFilePrompted?.name}
        onApplyOcr={handleApplyOcr}
        onContinueWithoutOcr={handleContinueWithoutOcr}
        onClose={handleCloseOcrModal}
      />
    </main>
  );
};
