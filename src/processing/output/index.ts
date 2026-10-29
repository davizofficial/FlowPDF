import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import type { OutputArtifact } from '../shared-types';
import { deconflictBatchFilenames } from '../../lib/format';
import { hasPdfMagicHeader } from '../validation';

/**
 * FR-GEN-004 & NFR-REL-001:
 * Independently verifies generated output artifacts before enabling download.
 */
export async function verifyOutputArtifact(
  artifact: OutputArtifact
): Promise<{ valid: boolean; pageCount?: number; error?: string }> {
  if (!artifact.bytes || artifact.bytes.byteLength === 0) {
    return { valid: false, error: 'Generated output is empty (0 bytes).' };
  }

  if (artifact.mimeType === 'application/pdf') {
    if (!hasPdfMagicHeader(artifact.bytes)) {
      return { valid: false, error: 'Generated PDF is missing a valid %PDF- header.' };
    }
    try {
      const reloaded = await PDFDocument.load(artifact.bytes, {
        updateMetadata: false,
      });
      const count = reloaded.getPageCount();
      if (count <= 0) {
        return { valid: false, error: 'Generated PDF contains 0 pages.' };
      }
      return { valid: true, pageCount: count };
    } catch (err) {
      return {
        valid: false,
        error: `Generated PDF failed structural reload: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }
  }

  return { valid: true, pageCount: artifact.pageCount };
}

/**
 * FR-WF-006 & FR-PAGES-006:
 * Packages multiple OutputArtifacts into a single ZIP archive safely,
 * deconflicting duplicate names and stripping any path traversal characters.
 */
export async function packageArtifactsAsZip(
  artifacts: OutputArtifact[],
  zipFilename = 'flowpdf-outputs.zip'
): Promise<OutputArtifact> {
  const zip = new JSZip();
  const safeNames = deconflictBatchFilenames(
    artifacts.map((a) => a.name.replace(/^.*[\\/]/, '').replace(/\.\./g, ''))
  );

  artifacts.forEach((artifact, idx) => {
    zip.file(safeNames[idx], artifact.bytes);
  });

  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return {
    name: zipFilename,
    mimeType: 'application/zip',
    bytes: zipBytes,
  };
}

/**
 * FR-GEN-005 & NFR-PRIV-002:
 * Triggers a local browser download using a temporary Blob URL and revokes it afterwards.
 */
export function triggerArtifactDownload(artifact: OutputArtifact): void {
  const blob = new Blob([artifact.bytes], { type: artifact.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = artifact.name;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 5000);
}
