import { getAdapterForTool } from '../adapters';
import type {
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
  ToolId,
} from '../shared-types';
import type { WorkerJobMessage, WorkerJobRequest } from './pdf.worker';

const CANVAS_DEPENDENT_TOOLS = new Set<ToolId>([
  'pdf-to-jpg',
  'pdf-to-png',
  'pdf-to-markdown',
  'pdf-to-text',
  'pdf-to-word',
  'pdf-to-excel',
  'pdf-to-powerpoint',
  'compare-pdf',
  'compress-pdf',
]);

/**
 * Executes a document processing job inside a dedicated Web Worker when supported,
 * with clean cancellation and automatic fallback for DOM-canvas tools or test environments (C3.3).
 */
export async function executeProcessingJob(
  toolId: ToolId,
  input: ProcessingInput<Record<string, unknown>>,
  onProgress: (progress: ProcessingProgress) => void
): Promise<ProcessingResult> {
  const canUseWorker =
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    !CANVAS_DEPENDENT_TOOLS.has(toolId) &&
    import.meta.env.MODE !== 'test';

  if (!canUseWorker) {
    const adapter = getAdapterForTool(toolId);
    return adapter.run(input, onProgress);
  }

  return new Promise<ProcessingResult>((resolve, reject) => {
    let worker: Worker | null = null;

    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    if (input.signal?.aborted) {
      reject(new Error('Processing was cancelled. Your source files remain untouched.'));
      return;
    }

    const onAbort = () => {
      cleanup();
      reject(new Error('Processing was cancelled. Your source files remain untouched.'));
    };

    input.signal?.addEventListener('abort', onAbort, { once: true });

    (async () => {
      try {
        worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), {
          type: 'module',
        });

        worker.onmessage = (event: MessageEvent<WorkerJobMessage>) => {
          const data = event.data;
          if (data.jobId !== input.jobId) return;

          if (data.type === 'progress') {
            onProgress(data.progress);
          } else if (data.type === 'success') {
            input.signal?.removeEventListener('abort', onAbort);
            cleanup();
            resolve(data.result as ProcessingResult);
          } else if (data.type === 'error') {
            input.signal?.removeEventListener('abort', onAbort);
            cleanup();
            reject(new Error(data.error));
          }
        };

        worker.onerror = async () => {
          // Recoverable fallback if bundler Worker initialization fails
          input.signal?.removeEventListener('abort', onAbort);
          cleanup();
          try {
            const adapter = getAdapterForTool(toolId);
            const fallbackResult = await adapter.run(input, onProgress);
            resolve(fallbackResult);
          } catch (fallbackErr) {
            reject(fallbackErr);
          }
        };

        const serializedFiles = await Promise.all(
          input.files.map(async (f) => ({
            name: f.name,
            type: f.type,
            bytes: await f.arrayBuffer(),
          }))
        );

        const req: WorkerJobRequest = {
          jobId: input.jobId,
          toolId,
          files: serializedFiles,
          options: input.options,
        };

        worker.postMessage(
          req,
          serializedFiles.map((f) => f.bytes)
        );
      } catch {
        cleanup();
        try {
          const adapter = getAdapterForTool(toolId);
          const fallbackResult = await adapter.run(input, onProgress);
          resolve(fallbackResult);
        } catch (fallbackErr) {
          reject(fallbackErr);
        }
      }
    })();
  });
}
