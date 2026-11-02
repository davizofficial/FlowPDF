import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  X,
  ChevronDown,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { en } from '../../i18n/en';
import { getAvailableTools, TOOL_CATEGORIES } from '../../registry/tools';
import { ToolVisualIcon } from '../icons/ToolVisualIcon';
import type { ToolId } from '../../processing/shared-types';

interface AppHeaderProps {
  activeToolId?: ToolId;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeToolId,
  searchQuery,
  onSearchChange,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'convert' | 'all' | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const availableTools = getAvailableTools();

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const filteredTools = searchQuery.trim()
    ? availableTools.filter((tool) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q)
        );
      })
    : [];

  const convertToPdfTools = availableTools.filter((t) =>
    ['word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf', 'jpg-to-pdf', 'png-to-pdf', 'html-to-pdf', 'markdown-to-pdf'].includes(t.id)
  );

  const convertFromPdfTools = availableTools.filter((t) =>
    ['pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'pdf-to-jpg', 'pdf-to-png', 'pdf-to-text', 'pdf-to-markdown'].includes(t.id)
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b border-primary-hover/80 bg-primary text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:h-16 sm:px-5 sm:py-0">
        {/* Left Section: 3-Line Sidebar Toggle + Brand Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle tools sidebar"
            aria-expanded={isSidebarOpen}
            aria-controls="flowpdf-tools-sidebar"
            title={isSidebarOpen ? 'Hide tools sidebar' : 'Show tools sidebar'}
            className="smooth-interactive inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M4 6.5h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-transform duration-200"
              />
              <path
                d={isSidebarOpen ? 'M4 12h11' : 'M4 12h16'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-200"
              />
              <path
                d="M4 17.5h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-transform duration-200"
              />
            </svg>
          </button>

          <Link
            to="/"
            className="flex items-center gap-2.5 text-white focus-visible:rounded-control"
          >
            <img
              src="/icons/flowpdf-app-icon.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-control ring-1 ring-white/30"
            />
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
              {en.brand.name}
            </span>
          </Link>
        </div>

        {/* Center Section: iLovePDF Style Top Navigation Links */}
        <nav
          ref={dropdownRef}
          aria-label="Main Navigation"
          className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold uppercase tracking-wider text-white/90"
        >
          <Link
            to="/tools/merge-pdf"
            className="smooth-interactive rounded-control px-2.5 py-1.5 hover:bg-white/15 hover:text-white"
          >
            Merge PDF
          </Link>

          <Link
            to="/tools/split-pdf"
            className="smooth-interactive rounded-control px-2.5 py-1.5 hover:bg-white/15 hover:text-white"
          >
            Split PDF
          </Link>

          <Link
            to="/tools/compress-pdf"
            className="smooth-interactive rounded-control px-2.5 py-1.5 hover:bg-white/15 hover:text-white"
          >
            Compress PDF
          </Link>

          {/* Convert PDF Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown((prev) => (prev === 'convert' ? null : 'convert'))
              }
              aria-expanded={openDropdown === 'convert'}
              className={`smooth-interactive inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 hover:bg-white/15 hover:text-white ${
                openDropdown === 'convert' ? 'bg-white/20 text-white' : ''
              }`}
            >
              <span>Convert PDF</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openDropdown === 'convert' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {openDropdown === 'convert' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[480px] rounded-dialog border border-slate-200 bg-surface p-4 text-ink shadow-2xl z-50 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  {/* Convert to PDF */}
                  <div className="space-y-2 border-r border-slate-100 pr-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Convert to PDF
                    </p>
                    <div className="space-y-1">
                      {convertToPdfTools.map((tool) => (
                        <Link
                          key={tool.id}
                          to={tool.route}
                          className="flex items-center gap-2 rounded-control p-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-primary"
                        >
                          <ToolVisualIcon toolId={tool.id} size="sm" />
                          <span>{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Convert from PDF */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Convert from PDF
                    </p>
                    <div className="space-y-1">
                      {convertFromPdfTools.map((tool) => (
                        <Link
                          key={tool.id}
                          to={tool.route}
                          className="flex items-center gap-2 rounded-control p-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-primary"
                        >
                          <ToolVisualIcon toolId={tool.id} size="sm" />
                          <span>{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* All PDF Tools Mega Menu Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown((prev) => (prev === 'all' ? null : 'all'))
              }
              aria-expanded={openDropdown === 'all'}
              className={`smooth-interactive inline-flex items-center gap-1 rounded-control px-2.5 py-1.5 hover:bg-white/15 hover:text-white ${
                openDropdown === 'all' ? 'bg-white/20 text-white' : ''
              }`}
            >
              <span>All PDF Tools</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  openDropdown === 'all' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {openDropdown === 'all' && (
              <div className="absolute right-0 top-full mt-2 w-[720px] max-h-[80vh] overflow-y-auto rounded-dialog border border-slate-200 bg-surface p-5 text-ink shadow-2xl z-50 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="font-display text-sm font-bold text-ink">
                      All PDF Tools Directory ({availableTools.length} Utilities)
                    </span>
                  </div>
                  <Link
                    to="/tools"
                    onClick={() => setOpenDropdown(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>View All Tools</span>
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>

                <div className="grid grid-cols-3 gap-5">
                  {TOOL_CATEGORIES.slice(0, 6).map((cat) => {
                    const catTools = availableTools.filter(
                      (t) => t.category === cat.id
                    );
                    if (catTools.length === 0) return null;
                    return (
                      <div key={cat.id} className="space-y-1.5">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          {cat.label}
                        </p>
                        <div className="space-y-1">
                          {catTools.map((tool) => (
                            <Link
                              key={tool.id}
                              to={tool.route}
                              className="flex items-center gap-2 rounded-control p-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-primary"
                            >
                              <ToolVisualIcon toolId={tool.id} size="sm" />
                              <span className="truncate">{tool.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right Section: Search Input & Privacy Badge */}
        <div className="flex items-center gap-3">
          <div
            role="search"
            className="relative w-full max-w-[200px] sm:max-w-xs"
          >
            <label htmlFor="global-tool-search" className="sr-only">
              Search PDF tools
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/70"
              aria-hidden="true"
            />
            <input
              id="global-tool-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search PDF tools..."
              className="w-full rounded-control border border-white/25 bg-white/15 py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-white/70 focus:border-white focus:bg-white focus:text-ink focus:placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear tool search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}

            {searchQuery.trim() !== '' && (
              <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto rounded-panel border-2 border-slate-300 bg-surface text-ink py-1 shadow-xl z-40">
                {filteredTools.length > 0 ? (
                  filteredTools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={tool.route}
                      onClick={() => onSearchChange('')}
                      aria-current={tool.id === activeToolId ? 'page' : undefined}
                      className="block px-3.5 py-2 text-xs hover:bg-slate-100"
                    >
                      <p className="font-bold text-ink">{tool.name}</p>
                      <p className="line-clamp-1 text-[11px] text-slate-600">
                        {tool.shortDescription}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="px-3.5 py-2.5 text-xs text-slate-600 font-medium">
                    No matching PDF tool found.
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="hidden items-center gap-1.5 text-xs text-white/85 xl:inline-flex shrink-0 font-medium"
            role="note"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{en.brand.privacyStatement}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
