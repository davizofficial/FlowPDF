/**
 * FlowPDF Centralized English UI Copy
 * Clear, formal, and easy-to-understand English with a focus on document privacy.
 */
export const en = {
  brand: {
    name: 'FlowPDF',
    tagline: 'Private PDF Workspace',
    privacyBadge: 'Private Browser Processing',
    privacyStatement:
      'Your files are processed in this browser. Document contents are not uploaded.',
    noStorageNote:
      'All documents remain on your device and are never sent to any external server.',
  },
  dropzone: {
    prompt: 'Drop files here or choose files from your device.',
    buttonLabel: 'Choose Files',
    appendLabel: 'Add More Files',
    clearQueue: 'Clear All',
    reviewOrder: 'Review the file order before merging.',
  },
  warnings: {
    compressionLossy: 'Compression may reduce image quality. Keep the original file.',
    compressionFallback:
      'The compressed output is larger. The valid, uncompressed result has been retained.',
    compressionEqual:
      'The selected compression pass did not reduce file size. The valid baseline has been retained.',
    damagedOrProtectedPdf:
      'This PDF could not be read. It may be damaged or password-protected.',
    permanentRemoval:
      'This action permanently removes selected content. Review the output carefully before sharing.',
    cropNotRedaction:
      'Cropping adjusts visible page margins. It does not permanently erase hidden content outside the crop area and is not a substitute for secure redaction.',
    metadataSanitizeLimit:
      'This tool clears standard document metadata fields (Title, Author, Subject, Keywords, Creator, Producer) in a new copy.',
    batchResourceThreshold:
      'The selected files exceed 150 MiB or 50 files. Processing may take additional time.',
    signatureInvalidation:
      'Modifying or merging a signed PDF invalidates existing digital signatures.',
  },
  stages: {
    reading: 'Reading files',
    validating: 'Validating input structure',
    preparing: 'Preparing pages',
    processing: 'Processing document',
    checking: 'Checking output integrity',
    ready: 'Preparing download',
  },
  errors: {
    emptyQueue: 'Please select at least one valid file before continuing.',
    mergeMinItems: 'Please select at least two valid files to merge into a PDF.',
    unsupportedFormat: 'Unsupported file format. Please choose an accepted file type.',
    zeroPageOutput: 'This configuration would produce an empty (0-page) document, which is not permitted.',
    invalidRangeSyntax:
      'Please enter valid page numbers or ranges (for example: 1, 3-5, 8) within the document page count.',
    outputValidationFailed:
      'The generated file failed verification and could not be downloaded.',
    cancelled: 'Processing was cancelled. Your original files remain unchanged.',
  },
} as const;

export type TranslationDictionary = typeof en;
