import React, { useRef, useState } from 'react';
import { Upload, FilePlus2, ShieldCheck, Plus } from 'lucide-react';
import { en } from '../../i18n/en';
import type { ToolDefinition } from '../../processing/shared-types';

interface FileDropzoneProps {
  tool: ToolDefinition;
  hasExistingItems: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  tool,
  hasExistingItems,
  disabled = false,
  onFilesSelected,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const acceptAttr = [
    ...tool.acceptedExtensions,
    ...tool.acceptedMimeTypes,
  ].join(',');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      onFilesSelected(Array.from(fileList));
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const getSelectButtonLabel = () => {
    if (tool.id.includes('word')) return 'Select WORD files';
    if (tool.id.includes('excel')) return 'Select EXCEL files';
    if (tool.id.includes('powerpoint')) return 'Select POWERPOINT files';
    if (tool.id.includes('image') || tool.id.includes('jpg') || tool.id.includes('png')) return 'Select Images';
    return tool.allowMultipleFiles ? 'Select PDF files' : 'Select PDF file';
  };

  const getButtonBgClass = () => {
    switch (tool.id) {
      case 'merge-pdf':
      case 'insert-replace-pages':
      case 'copy-pdf':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25';
      case 'split-pdf':
      case 'extract-pages':
      case 'remove-pages':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25';
      case 'compress-pdf':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25';
      case 'word-to-pdf':
      case 'pdf-to-word':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25';
      case 'excel-to-pdf':
      case 'pdf-to-excel':
        return 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25';
      case 'powerpoint-to-pdf':
      case 'pdf-to-powerpoint':
        return 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/25';
      default:
        return 'bg-primary hover:bg-primary-hover text-white shadow-primary/25';
    }
  };

  if (hasExistingItems) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-6 py-3.5 transition-all duration-200 ${
          isDragOver ? 'bg-primary/10 border-primary' : ''
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-3 text-xs text-slate-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <label
              htmlFor={`file-input-${tool.id}`}
              className="cursor-pointer font-bold text-ink hover:text-primary transition-colors block"
            >
              {tool.allowMultipleFiles
                ? 'Drop more files here or choose from your device'
                : en.dropzone.prompt}
            </label>
            <span className="text-[11px] text-slate-500">
              Accepted: {tool.acceptedExtensions.join(', ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            id={`file-input-${tool.id}`}
            type="file"
            accept={acceptAttr}
            multiple={tool.allowMultipleFiles}
            disabled={disabled}
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-ink shadow-xs hover:border-primary hover:text-primary hover:bg-slate-50"
          >
            <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>
              {tool.allowMultipleFiles
                ? en.dropzone.appendLabel
                : 'Change File'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-1 flex-col items-center justify-center p-8 sm:p-14 min-h-[420px] lg:min-h-[500px] w-full text-center transition-all duration-300 ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div
        className={`w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed p-8 sm:p-14 transition-all duration-300 flex flex-col items-center justify-center space-y-6 ${
          isDragOver
            ? 'border-primary bg-primary/[0.06] scale-[1.01] shadow-xl'
            : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'
        }`}
      >
        {/* Hidden Input for Accessible File Selection */}
        <input
          ref={inputRef}
          id={`file-input-${tool.id}`}
          type="file"
          accept={acceptAttr}
          multiple={tool.allowMultipleFiles}
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
        />

        {/* The Signature Giant iLovePDF CTA Button */}
        <div className="flex flex-col items-center space-y-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className={`smooth-interactive inline-flex items-center justify-center gap-3.5 rounded-2xl px-8 sm:px-10 py-5 text-lg sm:text-xl font-bold shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer ${getButtonBgClass()}`}
          >
            <FilePlus2 className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
            <span>{getSelectButtonLabel()}</span>
          </button>

          <p className="text-sm font-semibold text-slate-500">
            or drop files here
          </p>
        </div>

        {/* Accessible Prompt Label */}
        <div className="space-y-1">
          <label
            htmlFor={`file-input-${tool.id}`}
            className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            {en.dropzone.prompt}
          </label>
        </div>

        {/* Accepted Formats & In-Browser Guarantee */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-200/80 text-xs font-medium text-slate-500">
          <span className="font-mono text-[11px] bg-slate-200/70 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
            Formats: {tool.acceptedExtensions.join(', ')}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-md">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>100% In-Browser &bull; Files never leave your device</span>
          </span>
        </div>
      </div>
    </div>
  );
};
