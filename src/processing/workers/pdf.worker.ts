import { getAdapterForTool } from '../adapters';
import type { ProcessingProgress, ToolId } from '../shared-types';

export interface WorkerJobRequest {
  jobId: string;
  toolId: ToolId;
  files: Array<{
    name: string;
    type: string;
    bytes: ArrayBuffer;
  }>;
  options: Record<string, unknown>;
}

export type WorkerJobMessage =
  | {
      type: 'progress';
      jobId: string;
      progress: ProcessingProgress;
    }
  | {
      type: 'success';
      jobId: string;
      result: {
        outputs: Array<{
          name: string;
          mimeType: string;
          bytes: Uint8Array;
          pageCount?: number;
        }>;
        warnings: string[];
        metadata: Record<string, unknown>;
      };
    }
  | {
      type: 'error';
      jobId: string;
      error: string;
    };

self.onmessage = async (event: MessageEvent<WorkerJobRequest>) => {
  const { jobId, toolId, files, options } = event.data;

  try {
    const reconstructedFiles = files.map(
      (f) => new File([f.bytes], f.name, { type: f.type })
    );
    const adapter = getAdapterForTool(toolId);

    const result = await adapter.run(
      {
        jobId,
        files: reconstructedFiles,
        options,
      },
      (progress) => {
        const msg: WorkerJobMessage = {
          type: 'progress',
          jobId,
          progress,
        };
        self.postMessage(msg);
      }
    );

    const successMsg: WorkerJobMessage = {
      type: 'success',
      jobId,
      result,
    };
    self.postMessage(successMsg);
  } catch (err) {
    const errorMsg: WorkerJobMessage = {
      type: 'error',
      jobId,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(errorMsg);
  }
};
