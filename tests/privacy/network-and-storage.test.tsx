import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '../../src/app/router';
import { ScannedPdfOcrModal } from '../../src/components/preview/ScannedPdfOcrModal';
import { PDFDocument } from 'pdf-lib';
import { MergeAndImageAdapter } from '../../src/processing/adapters/merge-and-image-adapter';

describe('Privacy, Zero-Upload Guarantee & Accessibility UI Verification', () => {
  it('makes zero network requests and zero persistent storage writes during PDF processing (KPI-04, NFR-PRIV-001, NFR-PRIV-002)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const localStorageSpy = vi.spyOn(Storage.prototype, 'setItem');

    const doc1 = await PDFDocument.create();
    doc1.addPage([400, 400]);
    const bytes1 = await doc1.save();

    const doc2 = await PDFDocument.create();
    doc2.addPage([400, 400]);
    const bytes2 = await doc2.save();

    const file1 = new File([bytes1], 'private-tax-return.pdf', {
      type: 'application/pdf',
    });
    const file2 = new File([bytes2], 'private-bank-statement.pdf', {
      type: 'application/pdf',
    });

    const adapter = new MergeAndImageAdapter('merge-pdf');
    const result = await adapter.run(
      {
        jobId: 'privacy-audit-1',
        files: [file1, file2],
        options: { outputFilename: 'merged-private' },
      },
      () => {}
    );

    expect(result.outputs).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(localStorageSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    localStorageSpy.mockRestore();
  });

  it('renders the Index (Overview) page explaining the platform, features, and comparison against other platforms', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Manage, Convert, and Protect PDF Documents with Complete Privacy/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Why Choose FlowPDF Over Other Platforms/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Platform Features and PDF Tools/i,
      })
    ).toBeInTheDocument();
  });

  it('renders the open-source license and GitHub repository link in the platform footer', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('link', { name: /Contribute on GitHub/i })
    ).toHaveAttribute('href', 'https://github.com/davizofficial/FlowPDF');

    expect(
      screen.getByText(/Licensed under the MIT Open Source License\./i)
    ).toBeInTheDocument();
  });

  it('renders the Merge PDF workspace with accessible labels and local-processing notice (WCAG 2.2 AA)', () => {
    render(
      <MemoryRouter initialEntries={['/tools/merge-pdf']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: 'Merge PDF' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Your files are processed in this browser\. Document contents are not uploaded\./i
      ).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByLabelText(/Drop files here or choose files from your device/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Output Base Filename/i)
    ).toBeInTheDocument();
  });

  it('blocks direct navigation to gated tools like Redact PDF with an honest disclosure (FR-GEN-001, KPI-11)', () => {
    render(
      <MemoryRouter initialEntries={['/tools/redact-pdf']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', {
        name: /Redact PDF is Gated Pending Technical Verification/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/irreversible content-removal verification gate/i)
    ).toBeInTheDocument();
  });

  it('filters PDF tools cleanly using the header search input', () => {
    render(
      <MemoryRouter initialEntries={['/tools/merge-pdf']}>
        <AppRouter />
      </MemoryRouter>
    );

    const searchInput = screen.getByLabelText(/Search PDF tools/i);
    fireEvent.change(searchInput, { target: { value: 'compress' } });

    expect(
      screen.getAllByText(/Compress PDF/i).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('toggles the tools sidebar open and closed using the 3-line hamburger button', () => {
    render(
      <MemoryRouter initialEntries={['/tools/merge-pdf']}>
        <AppRouter />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', {
      name: /Toggle tools sidebar/i,
    });
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('renders the Scanned PDF full-screen modal with exact OCR prompt copywriting', () => {
    const onApplyOcr = vi.fn();
    const onContinueWithoutOcr = vi.fn();
    const onClose = vi.fn();

    render(
      <ScannedPdfOcrModal
        isOpen={true}
        fileName="scanned-invoice.pdf"
        onApplyOcr={onApplyOcr}
        onContinueWithoutOcr={onContinueWithoutOcr}
        onClose={onClose}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: /You are trying to convert a scanned PDF/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/To extract content of scanned documents, OCR is required\./i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Otherwise, the content of your document will be converted as an image into a non editable Excel file\./i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Do you want to apply OCR\?/i)
    ).toBeInTheDocument();

    const applyBtn = screen.getByRole('button', { name: /Apply OCR/i });
    fireEvent.click(applyBtn);
    expect(onApplyOcr).toHaveBeenCalledTimes(1);

    const continueBtn = screen.getByRole('button', {
      name: /Continue Without OCR \(Convert as Image\)/i,
    });
    fireEvent.click(continueBtn);
    expect(onContinueWithoutOcr).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
