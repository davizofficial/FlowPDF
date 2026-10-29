import React from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import {
  MAX_WORKFLOW_STEPS,
  serializeWorkflowTemplate,
  type ChainableStepToolId,
  type WorkflowStepConfig,
} from '../../processing/adapters/workflow-adapter';
import { en } from '../../i18n/en';
import type { ToolDefinition } from '../../processing/shared-types';

interface ToolOptionsFormProps {
  tool: ToolDefinition;
  options: Record<string, unknown>;
  disabled?: boolean;
  onChangeOptions: (next: Record<string, unknown>) => void;
}

const STEP_LABELS: Record<ChainableStepToolId, string> = {
  'rotate-pdf': 'Rotate Pages (90° Clockwise)',
  'add-page-numbers': 'Add Page Numbers (Bottom Center)',
  'add-watermark': 'Add Watermark ("CONFIDENTIAL")',
  'sanitize-metadata': 'Remove Standard Metadata',
  'compress-pdf': 'Compress PDF (High Quality)',
};

export const ToolOptionsForm: React.FC<ToolOptionsFormProps> = ({
  tool,
  options,
  disabled = false,
  onChangeOptions,
}) => {
  const updateOption = (key: string, value: unknown) => {
    onChangeOptions({ ...options, [key]: value });
  };

  const isImageMergeTool =
    tool.id === 'merge-pdf' ||
    tool.id === 'jpg-to-pdf' ||
    tool.id === 'png-to-pdf' ||
    tool.id === 'image-to-pdf';

  const workflowSteps =
    (options.steps as WorkflowStepConfig[] | undefined) ?? [
      { id: 'step-1', toolId: 'sanitize-metadata', options: {} },
      {
        id: 'step-2',
        toolId: 'add-page-numbers',
        options: { pageNumberPosition: 'bottom-center', pageNumberFormat: 'page-n-of-total' },
      },
    ];

  const handleAddWorkflowStep = (toolId: ChainableStepToolId) => {
    if (workflowSteps.length >= MAX_WORKFLOW_STEPS) return;
    const defaultStepOpts: Record<string, unknown> =
      toolId === 'rotate-pdf'
        ? { rotationDegrees: 90 }
        : toolId === 'add-watermark'
        ? { watermarkText: 'CONFIDENTIAL', watermarkOpacity: 0.2 }
        : toolId === 'compress-pdf'
        ? { profile: 'high-quality' }
        : {};
    const next: WorkflowStepConfig[] = [
      ...workflowSteps,
      {
        id: `step-${Date.now()}-${workflowSteps.length + 1}`,
        toolId,
        options: defaultStepOpts,
      },
    ];
    updateOption('steps', next);
  };

  const handleRemoveWorkflowStep = (index: number) => {
    const next = workflowSteps.filter((_, i) => i !== index);
    updateOption('steps', next);
  };

  const handleExportWorkflowConfig = () => {
    const json = serializeWorkflowTemplate(workflowSteps);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flowpdf-workflow-template.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Output Base Filename */}
      <div>
        <label
          htmlFor="option-output-filename"
          className="block text-xs font-semibold text-ink"
        >
          Output Base Filename
        </label>
        <input
          id="option-output-filename"
          type="text"
          disabled={disabled}
          value={(options.outputFilename as string) ?? ''}
          onChange={(e) => updateOption('outputFilename', e.target.value)}
          placeholder={`flowpdf-${tool.id}`}
          className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none"
        />
      </div>

      {/* Merge & Image-to-PDF Options */}
      {isImageMergeTool && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-page-size"
              className="block text-xs font-semibold text-ink"
            >
              Page Size
            </label>
            <select
              id="option-page-size"
              disabled={disabled}
              value={
                (options.pageSize as string) ??
                (tool.id === 'merge-pdf' ? 'original' : 'A4')
              }
              onChange={(e) => updateOption('pageSize', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:bg-surface focus:outline-none"
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="Letter">US Letter (8.5 × 11 in)</option>
              <option value="original">Keep Original Page Dimensions</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="option-orientation"
                className="block text-xs font-semibold text-ink"
              >
                Orientation
              </label>
              <select
                id="option-orientation"
                disabled={disabled}
                value={(options.orientation as string) ?? 'auto'}
                onChange={(e) => updateOption('orientation', e.target.value)}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="auto">Automatic</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="option-margin-mm"
                className="block text-xs font-semibold text-ink"
              >
                Margin
              </label>
              <select
                id="option-margin-mm"
                disabled={disabled}
                value={String(options.marginMm ?? 10)}
                onChange={(e) => updateOption('marginMm', Number(e.target.value))}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="0">None (0 mm)</option>
                <option value="10">Standard (10 mm)</option>
                <option value="20">Wide (20 mm)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="option-bg-color"
              className="block text-xs font-semibold text-ink"
            >
              Background Color for Transparent Images
            </label>
            <select
              id="option-bg-color"
              disabled={disabled}
              value={(options.backgroundColor as string) ?? '#FFFFFF'}
              onChange={(e) => updateOption('backgroundColor', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="#FFFFFF">White (Default)</option>
              <option value="#F5F4F0">Soft Neutral</option>
            </select>
          </div>
        </div>
      )}

      {/* Split PDF Options */}
      {tool.id === 'split-pdf' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-split-mode"
              className="block text-xs font-semibold text-ink"
            >
              Split Method
            </label>
            <select
              id="option-split-mode"
              disabled={disabled}
              value={(options.splitMode as string) ?? 'ranges'}
              onChange={(e) => updateOption('splitMode', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="ranges">Custom Page Ranges</option>
              <option value="fixed-count">Fixed Number of Pages per File</option>
              <option value="single-pages">Separate File for Each Page</option>
            </select>
          </div>

          {((options.splitMode as string) ?? 'ranges') === 'ranges' && (
            <div>
              <label
                htmlFor="option-split-ranges"
                className="block text-xs font-semibold text-ink"
              >
                Page Ranges
              </label>
              <input
                id="option-split-ranges"
                type="text"
                disabled={disabled}
                value={(options.rangeSpec as string) ?? '1'}
                onChange={(e) => updateOption('rangeSpec', e.target.value)}
                placeholder="For example: 1-2, 3-5"
                className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
              />
              <p className="mt-1 text-[11px] text-muted">
                Separate each range with a comma to create individual files.
              </p>
            </div>
          )}

          {options.splitMode === 'fixed-count' && (
            <div>
              <label
                htmlFor="option-fixed-count"
                className="block text-xs font-semibold text-ink"
              >
                Pages per File
              </label>
              <input
                id="option-fixed-count"
                type="number"
                min={1}
                max={500}
                disabled={disabled}
                value={Number(options.fixedPageCount ?? 2)}
                onChange={(e) =>
                  updateOption('fixedPageCount', Math.max(1, Number(e.target.value)))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
              />
            </div>
          )}
        </div>
      )}

      {/* Remove Pages / Extract Pages Options */}
      {(tool.id === 'remove-pages' || tool.id === 'extract-pages') && (
        <div className="space-y-2 border-t border-border pt-3">
          <label
            htmlFor="option-target-pages"
            className="block text-xs font-semibold text-ink"
          >
            {tool.id === 'remove-pages'
              ? 'Pages to Remove'
              : 'Pages to Extract'}
          </label>
          <input
            id="option-target-pages"
            type="text"
            disabled={disabled}
            value={(options.targetPagesSpec as string) ?? '1'}
            onChange={(e) => updateOption('targetPagesSpec', e.target.value)}
            placeholder="For example: 1, 3-5"
            className="w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
          />
          <p className="text-[11px] text-muted">
            Enter page numbers or ranges separated by commas (such as 1, 3-5).
          </p>
        </div>
      )}

      {/* Copy PDF Options */}
      {tool.id === 'copy-pdf' && (
        <div className="space-y-2 border-t border-border pt-3">
          <label
            htmlFor="option-copy-mode"
            className="block text-xs font-semibold text-ink"
          >
            Copy Type
          </label>
          <select
            id="option-copy-mode"
            disabled={disabled}
            value={(options.copyMode as string) ?? 'exact-bytes'}
            onChange={(e) => updateOption('copyMode', e.target.value)}
            className="w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
          >
            <option value="exact-bytes">
              Exact Duplicate (Preserves all original data)
            </option>
            <option value="rewrite-structure">
              Clean Structure Copy (Refreshes PDF structure)
            </option>
          </select>
        </div>
      )}

      {/* Insert / Replace Pages Options */}
      {tool.id === 'insert-replace-pages' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-insert-replace-mode"
              className="block text-xs font-semibold text-ink"
            >
              Operation Mode
            </label>
            <select
              id="option-insert-replace-mode"
              disabled={disabled}
              value={(options.insertReplaceMode as string) ?? 'insert'}
              onChange={(e) => updateOption('insertReplaceMode', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="insert">Insert Pages from Second PDF</option>
              <option value="replace">Replace Selected Pages in Main PDF</option>
            </select>
          </div>

          {((options.insertReplaceMode as string) ?? 'insert') === 'insert' ? (
            <div>
              <label
                htmlFor="option-insert-after-page"
                className="block text-xs font-semibold text-ink"
              >
                Insert After Page Number (0 = Before Page 1)
              </label>
              <input
                id="option-insert-after-page"
                type="number"
                min={0}
                max={5000}
                disabled={disabled}
                value={Number(options.insertAfterPage ?? 1)}
                onChange={(e) =>
                  updateOption('insertAfterPage', Math.max(0, Number(e.target.value)))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="option-replace-pages"
                className="block text-xs font-semibold text-ink"
              >
                Pages in Main PDF to Replace
              </label>
              <input
                id="option-replace-pages"
                type="text"
                disabled={disabled}
                value={(options.targetPagesSpec as string) ?? '1'}
                onChange={(e) => updateOption('targetPagesSpec', e.target.value)}
                placeholder="For example: 1 or 2-3"
                className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
              />
            </div>
          )}
        </div>
      )}

      {/* Compress PDF Options */}
      {tool.id === 'compress-pdf' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="rounded-control border border-warning bg-warning-bg p-2.5 text-xs text-warning">
            {en.warnings.compressionLossy}
          </div>
          <div>
            <label
              htmlFor="option-compression-profile"
              className="block text-xs font-semibold text-ink"
            >
              Compression Level
            </label>
            <select
              id="option-compression-profile"
              disabled={disabled}
              value={(options.profile as string) ?? 'high-quality'}
              onChange={(e) => updateOption('profile', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="high-quality">
                High Quality (Preserves text sharpness)
              </option>
              <option value="balanced">
                Balanced (Reduces image size)
              </option>
              <option value="smallest-file">
                Smallest File Size (Maximum reduction)
              </option>
              <option value="no-recompression">
                No Compression (Keep original size)
              </option>
            </select>
          </div>
        </div>
      )}

      {/* PDF to JPG / PNG Options */}
      {(tool.id === 'pdf-to-jpg' || tool.id === 'pdf-to-png') && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-render-scale"
              className="block text-xs font-semibold text-ink"
            >
              Image Quality & Resolution
            </label>
            <select
              id="option-render-scale"
              disabled={disabled}
              value={String(options.renderScale ?? 1.5)}
              onChange={(e) => updateOption('renderScale', Number(e.target.value))}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="1">Standard (72 DPI)</option>
              <option value="1.5">High Quality (108 DPI, Default)</option>
              <option value="2">Maximum Detail (144 DPI)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="option-image-range"
              className="block text-xs font-semibold text-ink"
            >
              Pages to Export (Optional)
            </label>
            <input
              id="option-image-range"
              type="text"
              disabled={disabled}
              value={(options.pageRangeSpec as string) ?? ''}
              onChange={(e) => updateOption('pageRangeSpec', e.target.value)}
              placeholder="All pages (or enter e.g. 1-3)"
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
            />
          </div>
        </div>
      )}

      {/* Rotate PDF Options */}
      {tool.id === 'rotate-pdf' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-rotation-degrees"
              className="block text-xs font-semibold text-ink"
            >
              Rotation Angle
            </label>
            <select
              id="option-rotation-degrees"
              disabled={disabled}
              value={String(options.rotationDegrees ?? 90)}
              onChange={(e) =>
                updateOption('rotationDegrees', Number(e.target.value))
              }
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            >
              <option value="90">90° Clockwise</option>
              <option value="180">180° Upside Down</option>
              <option value="270">90° Counter-Clockwise</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="option-rotate-range"
              className="block text-xs font-semibold text-ink"
            >
              Pages to Rotate (Optional)
            </label>
            <input
              id="option-rotate-range"
              type="text"
              disabled={disabled}
              value={(options.pageRangeSpec as string) ?? ''}
              onChange={(e) => updateOption('pageRangeSpec', e.target.value)}
              placeholder="All pages (or enter e.g. 1, 3-4)"
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 font-mono text-xs text-ink"
            />
          </div>
        </div>
      )}

      {/* Add Page Numbers Options */}
      {tool.id === 'add-page-numbers' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="option-pagenum-pos"
                className="block text-xs font-semibold text-ink"
              >
                Position
              </label>
              <select
                id="option-pagenum-pos"
                disabled={disabled}
                value={(options.pageNumberPosition as string) ?? 'bottom-center'}
                onChange={(e) => updateOption('pageNumberPosition', e.target.value)}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="bottom-center">Bottom Center</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="option-pagenum-format"
                className="block text-xs font-semibold text-ink"
              >
                Format
              </label>
              <select
                id="option-pagenum-format"
                disabled={disabled}
                value={
                  (options.pageNumberFormat as string) ?? 'page-n-of-total'
                }
                onChange={(e) => updateOption('pageNumberFormat', e.target.value)}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="page-n-of-total">Page 1 of N</option>
                <option value="page-n">Page 1</option>
                <option value="n">1</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="option-start-num"
                className="block text-xs font-semibold text-ink"
              >
                Starting Number
              </label>
              <input
                id="option-start-num"
                type="number"
                min={1}
                disabled={disabled}
                value={Number(options.startNumber ?? 1)}
                onChange={(e) =>
                  updateOption('startNumber', Math.max(1, Number(e.target.value)))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="option-pagenum-size"
                className="block text-xs font-semibold text-ink"
              >
                Font Size (pt)
              </label>
              <input
                id="option-pagenum-size"
                type="number"
                min={7}
                max={28}
                disabled={disabled}
                value={Number(options.fontSize ?? 10)}
                onChange={(e) =>
                  updateOption('fontSize', Math.max(7, Number(e.target.value)))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Watermark Options */}
      {tool.id === 'add-watermark' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <label
              htmlFor="option-watermark-text"
              className="block text-xs font-semibold text-ink"
            >
              Watermark Text
            </label>
            <input
              id="option-watermark-text"
              type="text"
              disabled={disabled}
              value={(options.watermarkText as string) ?? 'CONFIDENTIAL'}
              onChange={(e) => updateOption('watermarkText', e.target.value)}
              className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="option-watermark-opacity"
                className="block text-xs font-semibold text-ink"
              >
                Transparency
              </label>
              <select
                id="option-watermark-opacity"
                disabled={disabled}
                value={String(options.watermarkOpacity ?? 0.22)}
                onChange={(e) =>
                  updateOption('watermarkOpacity', Number(e.target.value))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="0.15">Light (15%)</option>
                <option value="0.22">Medium (22%)</option>
                <option value="0.4">Strong (40%)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="option-watermark-rot"
                className="block text-xs font-semibold text-ink"
              >
                Orientation
              </label>
              <select
                id="option-watermark-rot"
                disabled={disabled}
                value={String(options.watermarkRotation ?? 35)}
                onChange={(e) =>
                  updateOption('watermarkRotation', Number(e.target.value))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 text-xs text-ink"
              >
                <option value="35">Diagonal Up (+35°)</option>
                <option value="0">Horizontal (0°)</option>
                <option value="-35">Diagonal Down (-35°)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Crop PDF Options */}
      {tool.id === 'crop-pdf' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="rounded-control border border-warning bg-warning-bg p-2.5 text-xs text-warning">
            {en.warnings.cropNotRedaction}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label
                htmlFor="option-crop-top"
                className="block text-xs font-semibold text-ink"
              >
                Top Margin (mm)
              </label>
              <input
                id="option-crop-top"
                type="number"
                min={0}
                max={80}
                value={Number(options.cropTopMm ?? 10)}
                onChange={(e) => updateOption('cropTopMm', Number(e.target.value))}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="option-crop-bottom"
                className="block text-xs font-semibold text-ink"
              >
                Bottom Margin (mm)
              </label>
              <input
                id="option-crop-bottom"
                type="number"
                min={0}
                max={80}
                value={Number(options.cropBottomMm ?? 10)}
                onChange={(e) =>
                  updateOption('cropBottomMm', Number(e.target.value))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="option-crop-left"
                className="block text-xs font-semibold text-ink"
              >
                Left Margin (mm)
              </label>
              <input
                id="option-crop-left"
                type="number"
                min={0}
                max={80}
                value={Number(options.cropLeftMm ?? 10)}
                onChange={(e) => updateOption('cropLeftMm', Number(e.target.value))}
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="option-crop-right"
                className="block text-xs font-semibold text-ink"
              >
                Right Margin (mm)
              </label>
              <input
                id="option-crop-right"
                type="number"
                min={0}
                max={80}
                value={Number(options.cropRightMm ?? 10)}
                onChange={(e) =>
                  updateOption('cropRightMm', Number(e.target.value))
                }
                className="mt-1 w-full rounded-control border border-border bg-canvas px-2.5 py-2 font-mono text-xs text-ink"
              />
            </div>
          </div>
        </div>
      )}


      {/* Sanitize Metadata Disclosure */}
      {tool.id === 'sanitize-metadata' && (
        <div className="border-t border-border pt-3">
          <div className="rounded-control border border-border bg-canvas p-2.5 text-xs text-muted">
            {en.warnings.metadataSanitizeLimit}
          </div>
        </div>
      )}

      {/* Workflow Builder Options */}
      {tool.id === 'workflow-builder' && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">
              Selected Steps ({workflowSteps.length} of {MAX_WORKFLOW_STEPS})
            </span>
            <button
              type="button"
              onClick={handleExportWorkflowConfig}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span>Save Template</span>
            </button>
          </div>

          <ol className="space-y-1.5">
            {workflowSteps.map((step, idx) => (
              <li
                key={step.id}
                className="flex items-center justify-between rounded-control border border-border bg-canvas px-3 py-2 text-xs"
              >
                <span className="font-medium text-ink">
                  {idx + 1}. {STEP_LABELS[step.toolId]}
                </span>
                <button
                  type="button"
                  disabled={workflowSteps.length <= 1}
                  onClick={() => handleRemoveWorkflowStep(idx)}
                  aria-label={`Remove workflow step ${idx + 1}`}
                  className="text-danger hover:opacity-80 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>

          {workflowSteps.length < MAX_WORKFLOW_STEPS && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(Object.keys(STEP_LABELS) as ChainableStepToolId[]).map((stepTool) => (
                <button
                  key={stepTool}
                  type="button"
                  onClick={() => handleAddWorkflowStep(stepTool)}
                  className="inline-flex items-center gap-1 rounded-control border border-border bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-surface-subtle"
                >
                  <Plus className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span>{STEP_LABELS[stepTool].split(' (')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Batch Processing Options */}
      {tool.id === 'batch-processing' && (
        <div className="space-y-2 border-t border-border pt-3">
          <label
            htmlFor="option-batch-tool"
            className="block text-xs font-semibold text-ink"
          >
            Action to Apply to All Files
          </label>
          <select
            id="option-batch-tool"
            disabled={disabled}
            value={(options.batchToolId as string) ?? 'sanitize-metadata'}
            onChange={(e) => {
              const nextTool = e.target.value as ChainableStepToolId;
              const defaultOpts =
                nextTool === 'rotate-pdf'
                  ? { rotationDegrees: 90 }
                  : nextTool === 'add-watermark'
                  ? { watermarkText: 'CONFIDENTIAL', watermarkOpacity: 0.22 }
                  : nextTool === 'compress-pdf'
                  ? { profile: 'high-quality' }
                  : {};
              onChangeOptions({
                ...options,
                batchToolId: nextTool,
                batchToolOptions: defaultOpts,
              });
            }}
            className="w-full rounded-control border border-border bg-canvas px-3 py-2 text-xs text-ink"
          >
            {(Object.keys(STEP_LABELS) as ChainableStepToolId[]).map((k) => (
              <option key={k} value={k}>
                {STEP_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
