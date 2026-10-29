import type { ProcessingAdapter, ToolId } from '../shared-types';
import { MergeAndImageAdapter } from './merge-and-image-adapter';
import { PagesAdapter } from './pages-adapter';
import { CompressPdfAdapter } from './compress-adapter';
import { EditPdfAdapter } from './edit-adapter';
import { SecurityAdapter } from './security-adapter';
import { ConvertAdapter } from './convert-adapter';
import { OfficeAdapter } from './office-adapter';
import { WorkflowAdapter } from './workflow-adapter';

export function getAdapterForTool(
  toolId: ToolId
): ProcessingAdapter<Record<string, unknown>> {
  switch (toolId) {
    case 'merge-pdf':
    case 'jpg-to-pdf':
    case 'png-to-pdf':
    case 'image-to-pdf':
      return new MergeAndImageAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'split-pdf':
    case 'organize-pdf':
    case 'remove-pages':
    case 'extract-pages':
    case 'copy-pdf':
    case 'insert-replace-pages':
      return new PagesAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'compress-pdf':
      return new CompressPdfAdapter() as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'rotate-pdf':
    case 'add-page-numbers':
    case 'add-watermark':
    case 'crop-pdf':
      return new EditPdfAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'sanitize-metadata':
    case 'compare-pdf':
      return new SecurityAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'pdf-to-jpg':
    case 'pdf-to-png':
    case 'pdf-to-markdown':
    case 'pdf-to-text':
    case 'markdown-to-pdf':
      return new ConvertAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'word-to-pdf':
    case 'excel-to-pdf':
    case 'powerpoint-to-pdf':
    case 'html-to-pdf':
    case 'pdf-to-word':
    case 'pdf-to-excel':
    case 'pdf-to-powerpoint':
      return new OfficeAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    case 'workflow-builder':
    case 'batch-processing':
      return new WorkflowAdapter(toolId) as ProcessingAdapter<
        Record<string, unknown>
      >;

    default:
      throw new Error(
        `Tool "${toolId}" is gated by a technical review and is not active in default mode.`
      );
  }
}
