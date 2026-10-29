import type {
  OutputArtifact,
  ProcessingAdapter,
  ProcessingInput,
  ProcessingProgress,
  ProcessingResult,
  ToolId,
} from '../shared-types';
import { deconflictBatchFilenames, sanitizeFilename } from '../../lib/format';
import { packageArtifactsAsZip, verifyOutputArtifact } from '../output';
import { EditPdfAdapter, type EditPdfOptions } from './edit-adapter';
import { SecurityAdapter } from './security-adapter';
import { CompressPdfAdapter, type CompressPdfOptions } from './compress-adapter';
import { en } from '../../i18n/en';

export type ChainableStepToolId =
  | 'rotate-pdf'
  | 'add-page-numbers'
  | 'add-watermark'
  | 'sanitize-metadata'
  | 'compress-pdf';

export interface WorkflowStepConfig {
  id: string;
  toolId: ChainableStepToolId;
  options: Record<string, unknown>;
}

export interface WorkflowAndBatchOptions {
  outputFilename?: string;
  // Workflow Builder
  steps?: WorkflowStepConfig[];
  // Batch Processing
  batchToolId?: ChainableStepToolId;
  batchToolOptions?: Record<string, unknown>;
  packageAsZip?: boolean;
}

export const MAX_WORKFLOW_STEPS = 4;

function createSubAdapter(
  toolId: ChainableStepToolId
): ProcessingAdapter<Record<string, unknown>> {
  switch (toolId) {
    case 'rotate-pdf':
    case 'add-page-numbers':
    case 'add-watermark':
      return new EditPdfAdapter(toolId) as ProcessingAdapter<Record<string, unknown>>;
    case 'sanitize-metadata':
      return new SecurityAdapter(toolId) as ProcessingAdapter<Record<string, unknown>>;
    case 'compress-pdf':
      return new CompressPdfAdapter() as ProcessingAdapter<Record<string, unknown>>;
  }
}

export class WorkflowAdapter implements ProcessingAdapter<WorkflowAndBatchOptions> {
  readonly toolId: ToolId;

  constructor(toolId: ToolId) {
    this.toolId = toolId;
  }

  async validate(input: ProcessingInput<WorkflowAndBatchOptions>): Promise<void> {
    if (!input.files || input.files.length === 0) {
      throw new Error(en.errors.emptyQueue);
    }

    if (this.toolId === 'workflow-builder') {
      const steps = input.options.steps ?? [];
      if (steps.length === 0) {
        throw new Error('Add at least one processing step to the workflow.');
      }
      if (steps.length > MAX_WORKFLOW_STEPS) {
        throw new Error(
          `Workflow Builder supports at most ${MAX_WORKFLOW_STEPS} chained steps per run (FR-WF-002).`
        );
      }
    }
  }

  async run(
    input: ProcessingInput<WorkflowAndBatchOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    const startTime = performance.now();
    await this.validate(input);

    if (this.toolId === 'workflow-builder') {
      const steps = input.options.steps ?? [];
      const initialFile = input.files[0];
      const inputBytesTotal = initialFile.size;
      let currentFile = initialFile;
      const warnings: string[] = [];

      for (let s = 0; s < steps.length; s++) {
        if (input.signal?.aborted) throw new Error(en.errors.cancelled);
        const step = steps[s];

        onProgress({
          stage: 'Processing document',
          completed: s,
          total: steps.length,
          message: `Step ${s + 1} of ${steps.length}: Running ${step.toolId}...`,
        });

        try {
          const subAdapter = createSubAdapter(step.toolId);
          const stepResult = await subAdapter.run(
            {
              jobId: `${input.jobId}-step-${s + 1}`,
              files: [currentFile],
              options: step.options,
              signal: input.signal,
            },
            () => {
              // Keep high-level step progress
            }
          );

          warnings.push(...stepResult.warnings);
          const primaryOut = stepResult.outputs[0];
          if (!primaryOut) {
            throw new Error(`Step ${s + 1} (${step.toolId}) produced no output.`);
          }

          currentFile = new File([primaryOut.bytes], primaryOut.name, {
            type: primaryOut.mimeType,
          });
        } catch (err) {
          throw new Error(
            `Workflow halted at Step ${s + 1} (${step.toolId}): ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        }
      }

      const finalBytes = new Uint8Array(await currentFile.arrayBuffer());
      const outName = sanitizeFilename(
        input.options.outputFilename ||
          `${initialFile.name.replace(/\.pdf$/i, '')}-workflow`,
        '.pdf'
      );

      const artifact: OutputArtifact = {
        name: outName,
        mimeType: 'application/pdf',
        bytes: finalBytes,
      };

      const check = await verifyOutputArtifact(artifact);
      if (!check.valid) {
        throw new Error(check.error || en.errors.outputValidationFailed);
      }
      artifact.pageCount = check.pageCount;

      return {
        outputs: [artifact],
        warnings: Array.from(new Set(warnings)),
        metadata: {
          totalOutputPages: check.pageCount,
          executedSteps: steps.map((s) => s.toolId),
          inputBytesTotal,
          outputBytesTotal: finalBytes.byteLength,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    if (this.toolId === 'batch-processing') {
      const batchToolId: ChainableStepToolId =
        input.options.batchToolId ?? 'rotate-pdf';
      const batchOptions: EditPdfOptions & CompressPdfOptions =
        input.options.batchToolOptions ?? {};
      const subAdapter = createSubAdapter(batchToolId);

      const succeededArtifacts: OutputArtifact[] = [];
      const perFileResults: Array<{
        fileName: string;
        status: 'succeeded' | 'failed';
        message?: string;
      }> = [];
      const warnings: string[] = [];
      let inputBytesTotal = 0;

      const candidateNames = deconflictBatchFilenames(
        input.files.map((f) =>
          sanitizeFilename(
            `${f.name.replace(/\.pdf$/i, '')}-${batchToolId.replace('-pdf', '')}`,
            '.pdf'
          )
        )
      );

      for (let i = 0; i < input.files.length; i++) {
        if (input.signal?.aborted) throw new Error(en.errors.cancelled);
        const file = input.files[i];
        inputBytesTotal += file.size;

        onProgress({
          stage: 'Processing document',
          completed: i,
          total: input.files.length,
          message: `Batch processing ${file.name} (${i + 1} of ${input.files.length})...`,
        });

        try {
          const res = await subAdapter.run(
            {
              jobId: `${input.jobId}-batch-${i + 1}`,
              files: [file],
              options: {
                ...batchOptions,
                outputFilename: candidateNames[i],
              },
              signal: input.signal,
            },
            () => {}
          );

          const out = res.outputs[0];
          if (out) {
            out.name = candidateNames[i];
            succeededArtifacts.push(out);
            perFileResults.push({ fileName: file.name, status: 'succeeded' });
          } else {
            perFileResults.push({
              fileName: file.name,
              status: 'failed',
              message: 'No output artifact returned.',
            });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          perFileResults.push({
            fileName: file.name,
            status: 'failed',
            message: msg,
          });
          warnings.push(`File "${file.name}" failed: ${msg}`);
        }
      }

      if (succeededArtifacts.length === 0) {
        throw new Error(
          'All files in the batch failed processing. Review individual file error messages.'
        );
      }

      const outputs: OutputArtifact[] = [...succeededArtifacts];
      if (succeededArtifacts.length > 1 && (input.options.packageAsZip ?? true)) {
        const zipArtifact = await packageArtifactsAsZip(
          succeededArtifacts,
          sanitizeFilename(
            input.options.outputFilename || 'flowpdf-batch-outputs',
            '.zip'
          )
        );
        outputs.unshift(zipArtifact);
      }

      const outputBytesTotal = succeededArtifacts.reduce(
        (acc, a) => acc + a.bytes.byteLength,
        0
      );

      return {
        outputs,
        warnings,
        metadata: {
          batchSummary: {
            total: input.files.length,
            succeeded: succeededArtifacts.length,
            failed: input.files.length - succeededArtifacts.length,
            items: perFileResults,
          },
          inputBytesTotal,
          outputBytesTotal,
          durationMs: Math.round(performance.now() - startTime),
        },
      };
    }

    throw new Error(`Unsupported workflow tool: ${this.toolId}`);
  }
}

/**
 * FR-WF-003:
 * Exports workflow steps as a pure JSON string containing only tool IDs and configuration options.
 * Never embeds document bytes, filenames, or secrets.
 */
export function serializeWorkflowTemplate(steps: WorkflowStepConfig[]): string {
  const safeSteps = steps.slice(0, MAX_WORKFLOW_STEPS).map((step, idx) => ({
    id: `step-${idx + 1}`,
    toolId: step.toolId,
    options: filterNonSensitiveOptions(step.options),
  }));
  return JSON.stringify(
    {
      schema: 'flowpdf-workflow-v1',
      steps: safeSteps,
    },
    null,
    2
  );
}

function filterNonSensitiveOptions(
  options: Record<string, unknown>
): Record<string, unknown> {
  const forbiddenKeys = new Set([
    'files',
    'bytes',
    'password',
    'outputFilename',
  ]);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(options)) {
    if (!forbiddenKeys.has(k) && typeof v !== 'function') {
      clean[k] = v;
    }
  }
  return clean;
}
