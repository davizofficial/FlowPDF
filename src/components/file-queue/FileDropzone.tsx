import React, { useRef, useState } from 'react';
import { Upload, FilePlus2 } from 'lucide-react';
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

  if (hasExistingItems) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 bg-slate-50/80 px-5 py-3 transition-all duration-200 ${
          isDragOver ? 'bg-primary/10 border-primary' : ''
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-2.5 text-xs text-slate-700">
          <div className="flex h-7 w-7 items-center justify-center rounded-control bg-primary/10 text-primary">
            <Upload className="h-4 w-4" aria-hidden="true" />
          </div>
          <label
            htmlFor={`file-input-${tool.id}`}
            className="cursor-pointer font-bold text-ink"
          >
            {tool.allowMultipleFiles
              ? 'Drag more files here or choose from device'
              : en.dropzone.prompt}
          </label>
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
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-control border-2 border-slate-300 bg-surface px-3 py-1.5 text-xs font-bold text-ink hover:border-primary hover:text-primary hover:bg-slate-50"
          >
            <FilePlus2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
      className={`flex flex-1 flex-col items-center justify-center p-6 sm:p-10 min-h-[380px] lg:min-h-[460px] w-full text-center transition-all duration-300 ${
        disabled ? 'opacity-60 pointer-events-none' : ''
      }`}
    >
      <div
        className={`w-full max-w-lg mx-auto rounded-dialog border-2 border-dashed p-8 sm:p-12 transition-all duration-300 flex flex-col items-center justify-center space-y-4 shadow-xs ${
          isDragOver
            ? 'border-primary bg-primary/[0.08] scale-[1.01] shadow-md'
            : 'border-slate-300 bg-slate-50/70 hover:border-primary/60 hover:bg-primary/[0.03]'
        }`}
      >
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border-2 border-primary/20 shadow-xs">
          <Upload className="h-8 w-8 transition-transform duration-300" aria-hidden="true" />
          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        <div className="space-y-1.5 max-w-md">
          <label
            htmlFor={`file-input-${tool.id}`}
            className="block cursor-pointer font-display text-lg sm:text-xl font-bold text-ink"
          >
            {en.dropzone.prompt}
          </label>
          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Drag and drop {tool.allowMultipleFiles ? 'documents' : 'your file'} directly into the box, or browse
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
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
            className="smooth-interactive inline-flex items-center gap-2 rounded-control bg-primary px-6 py-3 text-sm font-bold text-primary-ink shadow-sm hover:bg-primary-hover hover:shadow-md hover:-translate-y-0.5"
          >
            <FilePlus2 className="h-4.5 w-4.5" aria-hidden="true" />
            <span>{en.dropzone.buttonLabel}</span>
          </button>
        </div>

        <div className="pt-2 text-xs font-mono font-semibold text-slate-500">
          Accepted: {tool.acceptedExtensions.join(', ')}
        </div>
      </div>
    </div>
  );
};
