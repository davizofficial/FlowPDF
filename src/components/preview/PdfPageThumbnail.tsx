import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { renderPdfPageToImage } from '../../processing/adapters/pdfjs-helper';

interface PdfPageThumbnailProps {
  file: File;
  pageNumber: number;
  rotationDeg?: number;
  className?: string;
}

export const PdfPageThumbnail: React.FC<PdfPageThumbnailProps> = ({
  file,
  pageNumber,
  rotationDeg = 0,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrlToRevoke: string | null = null;

    const loadThumbnail = async (): Promise<void> => {
      try {
        if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          objectUrlToRevoke = url;
          if (!cancelled) setDataUrl(url);
          return;
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const rendered = await renderPdfPageToImage(bytes, pageNumber, {
          scale: 0.75,
          format: 'image/jpeg',
          quality: 0.8,
        });
        if (!cancelled && rendered.dataUrl) {
          setDataUrl(rendered.dataUrl);
        }
      } catch {
        if (!cancelled) {
          setDataUrl(null);
        }
      }
    };

    void loadThumbnail();
    return () => {
      cancelled = true;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [file, pageNumber]);

  return (
    <div
      className={`relative flex aspect-[1/1.38] w-full items-center justify-center overflow-hidden rounded-control border border-border bg-white shadow-xs ${className}`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Page ${pageNumber} of ${file.name}`}
          style={{
            transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
          }}
          className="h-full w-full object-contain transition-transform duration-200"
        />
      ) : (
        <div
          style={{
            transform: rotationDeg ? `rotate(${rotationDeg}deg)` : undefined,
          }}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-white p-3 text-center transition-transform duration-200"
        >
          <div className="w-full border-t-4 border-primary/80 pt-2 flex flex-col items-center gap-1">
            <FileText className="h-6 w-6 text-primary/70" aria-hidden="true" />
            <span className="font-display text-xs font-bold text-ink">
              Page {pageNumber}
            </span>
            <div className="mt-1 w-4/5 space-y-1">
              <div className="h-1.5 w-full rounded-full bg-border" />
              <div className="h-1.5 w-5/6 rounded-full bg-border" />
              <div className="h-1.5 w-2/3 rounded-full bg-border" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
