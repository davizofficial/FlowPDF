import React from 'react';
import { Link } from 'react-router-dom';
import {
  Github,
  Heart,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { en } from '../../i18n/en';

export const AppFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-ink">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Top Grid: Brand & Mission, Tools Categories, Open Source & Contribute */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 lg:col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/icons/flowpdf-app-icon.svg"
                alt=""
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-xl shadow-xs"
              />
              <span className="font-display text-lg font-extrabold tracking-tight text-ink">
                {en.brand.name}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                v.1.0
              </span>
            </div>

            <p className="text-xs font-normal text-slate-500 leading-relaxed">
              FlowPDF is a fast, privacy-first PDF and document suite running 100% inside your web browser. Zero server uploads, zero data collection.
            </p>

            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>Complete In-Browser Privacy</span>
            </div>
          </div>

          {/* Column 2: Organize & Optimize */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Organize &amp; Optimize
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link to="/tools/merge-pdf" className="hover:text-primary transition-colors">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/split-pdf" className="hover:text-primary transition-colors">
                  Split PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/compress-pdf" className="hover:text-primary transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/organize-pdf" className="hover:text-primary transition-colors">
                  Organize PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/remove-pages" className="hover:text-primary transition-colors">
                  Remove Pages
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Convert to PDF */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Convert to PDF
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link to="/tools/word-to-pdf" className="hover:text-primary transition-colors">
                  Word to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/excel-to-pdf" className="hover:text-primary transition-colors">
                  Excel to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/powerpoint-to-pdf" className="hover:text-primary transition-colors">
                  PowerPoint to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/jpg-to-pdf" className="hover:text-primary transition-colors">
                  JPG to PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/html-to-pdf" className="hover:text-primary transition-colors">
                  HTML to PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Convert from PDF & Edit */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Convert from &amp; Edit
            </p>
            <ul className="space-y-2 text-xs font-medium text-slate-600">
              <li>
                <Link to="/tools/pdf-to-word" className="hover:text-primary transition-colors">
                  PDF to Word
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-to-excel" className="hover:text-primary transition-colors">
                  PDF to Excel
                </Link>
              </li>
              <li>
                <Link to="/tools/pdf-to-jpg" className="hover:text-primary transition-colors">
                  PDF to JPG
                </Link>
              </li>
              <li>
                <Link to="/tools/rotate-pdf" className="hover:text-primary transition-colors">
                  Rotate PDF
                </Link>
              </li>
              <li>
                <Link to="/tools/protect-pdf" className="hover:text-primary transition-colors">
                  Protect PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Open Source & Community */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Open Source
            </p>

            <p className="text-xs font-normal text-slate-500 leading-relaxed">
              100% open source under the <strong>MIT License</strong>. Inspect the code, report issues, or contribute.
            </p>

            <div className="pt-1">
              <a
                href="https://github.com/davizofficial/FlowPDF"
                target="_blank"
                rel="noopener noreferrer"
                className="smooth-interactive group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-primary hover:shadow-sm"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
                <span>Contribute on GitHub</span>
                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-white" aria-hidden="true" />
              </a>
            </div>

            <p className="text-[11px] font-mono text-slate-400">
              github.com/davizofficial/FlowPDF
            </p>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Open Source License & Heart */}
        <div className="border-t border-slate-100 pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
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
