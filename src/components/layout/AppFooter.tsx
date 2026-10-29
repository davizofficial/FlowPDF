import React from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Github,
  Heart,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { en } from '../../i18n/en';

export const AppFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t-2 border-slate-300 bg-surface text-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Top Grid: Brand & Mission, Open Source & Contribute, Key Tools */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-12">
          {/* Column 1: Brand & Mission (5 cols) */}
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center gap-2.5">
              <img
                src="/icons/flowpdf-app-icon.svg"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-control shadow-xs"
              />
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                {en.brand.name}
              </span>
              <span className="rounded-pill bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                v.1.0 Open Source
              </span>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-sm">
              FlowPDF is a modern, privacy-first document platform engineered for complete confidentiality. Every tool processes your files directly in your web browser.
            </p>
          </div>

          {/* Column 2: Open Source & Contribute on GitHub (4 cols) */}
          <div className="space-y-3 lg:col-span-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <GitBranch className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Open Source &amp; Community</span>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              This application is 100% open source under the <strong>MIT License</strong>. You can inspect the code, suggest improvements, report issues, or contribute new features.
            </p>

            <div className="pt-1">
              <a
                href="https://github.com/davizofficial/FlowPDF"
                target="_blank"
                rel="noopener noreferrer"
                className="smooth-interactive group inline-flex items-center gap-2 rounded-control bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary hover:shadow-sm"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>Contribute on GitHub</span>
                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-white" aria-hidden="true" />
              </a>
            </div>

            <p className="text-[11px] font-mono text-slate-500">
              Repository: github.com/davizofficial/FlowPDF
            </p>
          </div>

          {/* Column 3: Quick Navigation (3 cols) */}
          <div className="space-y-3 lg:col-span-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Quick Navigation</span>
            </div>

            <ul className="space-y-2 text-xs font-semibold text-slate-600">
              <li>
                <Link
                  to="/"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span>Platform Overview</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/tools"
                  className="hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>PDF Workspace (All Tools)</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/merge-pdf"
                  className="hover:text-primary transition-colors"
                >
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/word-to-pdf"
                  className="hover:text-primary transition-colors"
                >
                  Word to PDF
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/pdf-to-excel"
                  className="hover:text-primary transition-colors"
                >
                  PDF to Excel
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/compress-pdf"
                  className="hover:text-primary transition-colors"
                >
                  Compress PDF
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Open Source License & Heart */}
        <div className="border-t border-slate-200 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>FlowPDF • Licensed under the MIT Open Source License.</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>Free for personal and commercial use.</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <span>Built for privacy with</span>
            <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 inline" aria-label="love" />
            <span>by the open source community.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
