export type FeatureStatus =
  | 'available'
  | 'experimental'
  | 'research'
  | 'in-development'
  | 'planned'
  | 'restricted'
  | 'blocked'
  | 'deprecated';

export type ToolCategoryId =
  | 'organize'
  | 'compress-repair'
  | 'convert-to-pdf'
  | 'convert-from-pdf'
  | 'edit'
  | 'security'
  | 'ai-language'
  | 'workflows';

export type PriorityPhase = 'P0' | 'P1' | 'P2' | 'P3';

export type ToolId =
  | 'merge-pdf'
  | 'split-pdf'
  | 'organize-pdf'
  | 'remove-pages'
  | 'extract-pages'
  | 'copy-pdf'
  | 'scan-to-pdf'
  | 'compress-pdf'
  | 'repair-pdf'
  | 'ocr-pdf'
  | 'optimize-scan'
  | 'jpg-to-pdf'
  | 'png-to-pdf'
  | 'image-to-pdf'
  | 'word-to-pdf'
  | 'powerpoint-to-pdf'
  | 'excel-to-pdf'
  | 'html-to-pdf'
  | 'markdown-to-pdf'
  | 'pdf-to-jpg'
  | 'pdf-to-png'
  | 'pdf-to-word'
  | 'pdf-to-powerpoint'
  | 'pdf-to-excel'
  | 'pdf-to-pdfa'
  | 'pdf-to-markdown'
  | 'pdf-extract'
  | 'pdf-to-text'
  | 'rotate-pdf'
  | 'add-page-numbers'
  | 'add-watermark'
  | 'crop-pdf'
  | 'edit-pdf'
  | 'pdf-forms'
  | 'annotate-pdf'
  | 'insert-replace-pages'
  | 'protect-pdf'
  | 'unlock-pdf'
  | 'redact-pdf'
  | 'compare-pdf'
  | 'sanitize-metadata'
  | 'ai-summarizer'
  | 'pdf-translation'
  | 'ask-pdf'
  | 'ocr-assisted-conversion'
  | 'workflow-builder'
  | 'batch-processing';

export interface ToolDefinition {
  id: ToolId;
  catalogueId: string;
  name: string;
  category: ToolCategoryId;
  route: string;
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
  outputMimeTypes: string[];
  status: FeatureStatus;
  priority: PriorityPhase;
  hasTechnicalGate: boolean;
  shortDescription: string;
  actionLabel: string;
  limitations: string[];
  allowMultipleFiles: boolean;
  minFiles: number;
  gateReason?: string;
}

export type QueueItemStatus = 'validating' | 'ready' | 'invalid' | 'password-protected' | 'damaged';

export interface QueueItem {
  sessionId: string;
  file: File;
  name: string;
  sizeBytes: number;
  mimeType: string;
  status: QueueItemStatus;
  pageCount?: number;
  errorMessage?: string;
  dimensions?: { width: number; height: number };
}

export type ProcessingStage =
  | 'Reading files'
  | 'Validating input structure'
  | 'Preparing pages'
  | 'Processing document'
  | 'Checking output integrity'
  | 'Preparing download';

export interface ProcessingProgress {
  stage: ProcessingStage;
  completed?: number;
  total?: number;
  message?: string;
}

export interface OutputArtifact {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  pageCount?: number;
}

export interface CompressionReport {
  inputBytes: number;
  outputBytes: number;
  savedBytes: number;
  savingsPercent: number;
  retainedBaseline: boolean;
  profileUsed: string;
  reason?: string;
}

export interface ProcessingResult {
  outputs: OutputArtifact[];
  warnings: string[];
  metadata: {
    totalOutputPages?: number;
    inputBytesTotal: number;
    outputBytesTotal: number;
    compressionReport?: CompressionReport;
    extractedTextPreview?: string;
    sanitizedFields?: string[];
    durationMs?: number;
    [key: string]: unknown;
  };
}

export interface ProcessingInput<TOptions = Record<string, unknown>> {
  jobId: string;
  files: File[];
  options: TOptions;
  signal?: AbortSignal;
}

export interface ProcessingAdapter<TOptions = Record<string, unknown>> {
  readonly toolId: ToolId;
  validate(input: ProcessingInput<TOptions>): Promise<void>;
  run(
    input: ProcessingInput<TOptions>,
    onProgress: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult>;
}
