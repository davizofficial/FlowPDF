import React from 'react';
import type { ToolId } from '../../processing/shared-types';

interface ToolVisualIconProps {
  toolId: ToolId;
  active?: boolean;
  size?: 'sm' | 'md';
}

function getToolAccentClasses(toolId: ToolId, active: boolean): string {
  if (active) {
    return 'bg-white/20 text-white border border-white/35 shadow-xs';
  }

  switch (toolId) {
    case 'merge-pdf':
    case 'insert-replace-pages':
    case 'copy-pdf':
      return 'bg-blue-600 text-white border border-blue-700 shadow-xs group-hover:bg-blue-700';

    case 'split-pdf':
    case 'extract-pages':
    case 'organize-pdf':
      return 'bg-indigo-600 text-white border border-indigo-700 shadow-xs group-hover:bg-indigo-700';

    case 'remove-pages':
      return 'bg-rose-600 text-white border border-rose-700 shadow-xs group-hover:bg-rose-700';

    case 'compress-pdf':
      return 'bg-emerald-600 text-white border border-emerald-700 shadow-xs group-hover:bg-emerald-700';

    case 'jpg-to-pdf':
    case 'png-to-pdf':
    case 'image-to-pdf':
    case 'pdf-to-jpg':
    case 'pdf-to-png':
      return 'bg-amber-600 text-white border border-amber-700 shadow-xs group-hover:bg-amber-700';

    case 'word-to-pdf':
    case 'pdf-to-word':
      return 'bg-sky-600 text-white border border-sky-700 shadow-xs group-hover:bg-sky-700';

    case 'excel-to-pdf':
    case 'pdf-to-excel':
      return 'bg-green-600 text-white border border-green-700 shadow-xs group-hover:bg-green-700';

    case 'powerpoint-to-pdf':
    case 'pdf-to-powerpoint':
      return 'bg-orange-600 text-white border border-orange-700 shadow-xs group-hover:bg-orange-700';

    case 'markdown-to-pdf':
    case 'html-to-pdf':
    case 'pdf-to-markdown':
    case 'pdf-to-text':
      return 'bg-cyan-600 text-white border border-cyan-700 shadow-xs group-hover:bg-cyan-700';

    case 'rotate-pdf':
    case 'add-page-numbers':
    case 'add-watermark':
    case 'crop-pdf':
      return 'bg-violet-600 text-white border border-violet-700 shadow-xs group-hover:bg-violet-700';

    case 'protect-pdf':
    case 'unlock-pdf':
    case 'sanitize-metadata':
    case 'compare-pdf':
      return 'bg-primary text-white border border-primary-hover shadow-xs group-hover:bg-primary-hover';

    case 'workflow-builder':
    case 'batch-processing':
    default:
      return 'bg-teal-600 text-white border border-teal-700 shadow-xs group-hover:bg-teal-700';
  }
}

export const ToolVisualIcon: React.FC<ToolVisualIconProps> = ({
  toolId,
  active = false,
  size = 'sm',
}) => {
  const containerClasses =
    size === 'md'
      ? 'h-10 w-10 rounded-control'
      : 'h-7 w-7 rounded-control';

  const bgClasses = getToolAccentClasses(toolId, active);

  const renderGraphic = () => {
    switch (toolId) {
      case 'merge-pdf':
        // Two mini pages on left + right merging into one central page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="4" width="8" height="10.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4.5 7.5h4M4.5 10h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <rect x="17.5" y="4" width="8" height="10.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M19.5 7.5h4M19.5 10h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M12.5 9.2h3M14 7.7v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M9 16.5l5 3 5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="9.5" y="18.5" width="9" height="6.5" rx="1.2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        );

      case 'split-pdf':
        // Single page split by a dashed scissor cut line into two halves separating
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 4.5h12l4 4V12H6V4.5z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M2.5 14h23" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2.2 2.2" strokeLinecap="round" />
            <rect x="4.5" y="16.5" width="8" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="15.5" y="16.5" width="8" height="7.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        );

      case 'organize-pdf':
        // 2x2 page grid with swap arrows
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="4" y="4" width="8" height="9" rx="1.2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <rect x="16" y="4" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="4" y="15" width="8" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
            <rect x="16" y="15" width="8" height="9" rx="1.2" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.5 8.5h3M14.2 6.8l1.6 1.7-1.6 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 19.5h-3M13.8 17.8l-1.6 1.7 1.6 1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'remove-pages':
        // Document sheet with a prominent X removal badge
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 4h10l4 4v15a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 015 23V5.5A1.5 1.5 0 016.5 4z" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="19" cy="19" r="5.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17 17l4 4M21 17l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      case 'extract-pages':
        // Stack of pages with one highlighted page lifting out via upward arrow
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="4" y="9" width="11" height="14" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <rect x="12" y="4.5" width="11.5" height="14" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.8 14V8.5M15.3 10.8l2.5-2.5 2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'copy-pdf':
        // Two identical overlapping PDF pages
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="5" y="7" width="11" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="11.5" y="4.5" width="11" height="15" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14.5 9.5h5M14.5 12.5h5M14.5 15.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'jpg-to-pdf':
      case 'png-to-pdf':
      case 'image-to-pdf':
        // Image frame (sun + mountains) converting into a PDF page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="5" width="11" height="10" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="6.2" cy="8" r="1" fill="currentColor" />
            <path d="M4.5 13.5l3-3 2.2 2.2 1.8-1.5 1.5 2.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 10h3.5m0 0l-1.5-1.5M19 10l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="13.5" width="10" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.5 17.5h5M17.5 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'pdf-to-jpg':
      case 'pdf-to-png':
        // PDF page converting into an image frame
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="4.5" width="10" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 8h5M5.5 11h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M14.5 10h3.5m0 0l-1.5-1.5M18 10l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14" y="14" width="11" height="10" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.2" cy="17.2" r="1" fill="currentColor" />
            <path d="M15.5 22.5l3-3 2 2 2-1.8 1.5 2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'pdf-to-markdown':
      case 'pdf-to-text':
        // PDF page converting to structured text/markdown lines
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="5" width="9.5" height="12" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 8.5h4.5M5.5 11.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M14 11h3m0 0l-1.3-1.3M17 11l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="14" width="10" height="9.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.2 20.5v-3.5l1.8 2 1.8-2v3.5M23 17v3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'markdown-to-pdf':
        // Markdown badge converting into a PDF document
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="5.5" width="10.5" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 12V8l1.8 2 1.8-2v4M10.8 8.2v3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 10h3m0 0l-1.3-1.3M17.5 10l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="13.5" width="10" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.5 17.5h5M17.5 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'word-to-pdf':
        // Word 'W' document converting into a PDF page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="4.5" width="10.5" height="11.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 8l1.2 4.5L7.8 9l1.6 3.5L10.6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 10.5h3m0 0l-1.3-1.3M17.5 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="13.5" width="10" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.5 17.5h5M17.5 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'pdf-to-word':
        // PDF page converting into a Word 'W' document
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="4.5" width="10" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 8h5M5 11h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M14 10.5h3m0 0l-1.3-1.3M17 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14.5" y="13" width="11" height="11" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17 16.5l1.3 4.5 1.7-3.5 1.7 3.5 1.3-4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'excel-to-pdf':
        // Spreadsheet grid converting into a PDF page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="5" width="10.5" height="10.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M2.5 10.2h10.5M7.8 5v10.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M14.5 10.5h3m0 0l-1.3-1.3M17.5 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="13.5" width="10" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.5 17.5h5M17.5 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'pdf-to-excel':
        // PDF page converting into a spreadsheet grid
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="4.5" width="10" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 8h5M5 11h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M14 10.5h3m0 0l-1.3-1.3M17 10.5l-1.3 1.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14.5" y="13.5" width="11" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14.5 18.8h11M20 13.5V24" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        );

      case 'powerpoint-to-pdf':
        // Presentation slide converting into a PDF page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="5" width="11" height="9" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 8.5h5M8 14v2.5M6 16.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M15 10h2.8m0 0l-1.2-1.2M17.8 10l-1.2 1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15.5" y="13.5" width="10" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M18 17.5h5M18 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'pdf-to-powerpoint':
        // PDF page converting into a presentation slide
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="2.5" y="4.5" width="10" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 8h5M5 11h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M14 10h2.8m0 0l-1.2-1.2M16.8 10l-1.2 1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="14.5" y="13.5" width="11" height="8.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 22v2.5M17.5 24.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'html-to-pdf':
        // HTML code brackets </> converting into a PDF page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M6 7.5L3.5 10 6 12.5M10.5 7.5L13 10l-2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.5 10h2.8m0 0l-1.2-1.2M17.3 10l-1.2 1.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="15" y="13.5" width="10.5" height="10.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.5 17.5h5.5M17.5 20.5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'insert-replace-pages':
        // A highlighted page slotting into the middle of a document stack
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="4" y="4.5" width="11" height="19" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <rect x="13" y="8.5" width="11" height="11" rx="1.4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 14h6m-6 0l2.2-2.2M11 14l2.2 2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'compare-pdf':
        // Two side-by-side pages with comparison diff lines
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="5" width="9.5" height="18" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5.5 9.5h4.5M5.5 13h4.5M5.5 16.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="15.5" y="5" width="9.5" height="18" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M18 9.5h4.5M18 13h3M18 16.5h4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        );

      case 'compress-pdf':
        // Document sheet with four inward compression arrows squeezing the page
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="8" y="6.5" width="12" height="15" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M11 11.5h6M11 14.5h6M11 17.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M2.5 14h3.5m0 0L4.2 12.2M6 14l-1.8 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25.5 14H22m0 0l1.8-1.8M22 14l1.8 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'rotate-pdf':
        // Tilted/rotating page with circular 90-degree rotation arc arrow
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="7" y="7" width="12" height="15" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 3.5a9.5 9.5 0 019.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M21.2 11.2L23.5 13.5 25.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'add-page-numbers':
        // Page with a highlighted [#1] badge in bottom corner
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="5" y="4" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 8.5h7M8 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="13.5" y="15" width="9.5" height="8.5" rx="1.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M17.2 17.5h1.5v4M16.8 21.5h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case 'add-watermark':
        // Page with diagonal watermark stamp across center
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="5.5" y="3.5" width="17" height="21" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8.5 18.5l11-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M8.5 14l6.5-5.2M13 19.5l6.5-5.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
          </svg>
        );

      case 'crop-pdf':
        // Interlocking L-shaped crop brackets around a document
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M7 3.5v16a1.5 1.5 0 001.5 1.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M3.5 7h16A1.5 1.5 0 0121 8.5v16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <rect x="9.5" y="9.5" width="9" height="9" rx="1" fill="currentColor" fillOpacity="0.18" />
          </svg>
        );

      case 'sanitize-metadata':
        // Document with a privacy shield badge
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M5.5 4h11l3.5 3.5v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 4v18a1.5 1.5 0 001.5 1.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M18.5 12l5.5 2.2v4.2c0 3.3-2.3 5.5-5.5 6.6-3.2-1.1-5.5-3.3-5.5-6.6v-4.2L18.5 12z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        );

      case 'workflow-builder':
        // Connected multi-step pipeline nodes (1 -> 2 -> 3)
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <rect x="3" y="4.5" width="7.5" height="6.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <rect x="17.5" y="10.5" width="7.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
            <rect x="6" y="17.5" width="8.5" height="6.5" rx="1.4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M10.5 7.8h4.5a2 2 0 012 2v1M17.5 14h-4a2 2 0 00-2 2v1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'batch-processing':
      default:
        // Stacked multi-document cascade with completion checkmark
        return (
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5" aria-hidden="true">
            <path d="M7 6.5h13a1.5 1.5 0 011.5 1.5v11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M5 9.5h13a1.5 1.5 0 011.5 1.5v11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <rect x="3.5" y="12" width="13.5" height="12" rx="1.5" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.6" />
            <path d="M7.5 18l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`smooth-interactive inline-flex shrink-0 items-center justify-center ${containerClasses} ${bgClasses}`}
    >
      {renderGraphic()}
    </span>
  );
};
