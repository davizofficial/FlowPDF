import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, X } from 'lucide-react';
import { en } from '../../i18n/en';
import { getAvailableTools } from '../../registry/tools';
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
  const availableTools = getAvailableTools();

  const filteredTools = searchQuery.trim()
    ? availableTools.filter((tool) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-primary-hover/80 bg-primary text-white shadow-sm">
      <div className="flex w-full flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 sm:h-14 sm:flex-nowrap sm:gap-4 sm:px-5 sm:py-0">
        {/* Left Section: 3-Line Sidebar Toggle Button + Brand Logo */}
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
            className="flex items-center gap-2 text-white focus-visible:rounded-control"
          >
            <img
              src="/icons/flowpdf-app-icon.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-control ring-1 ring-white/30"
            />
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
              {en.brand.name}
            </span>
          </Link>
        </div>

        {/* Center/Right Search Input */}
        <div
          role="search"
          className="relative w-full sm:max-w-xs md:max-w-sm lg:max-w-md sm:flex-1"
        >
          <label htmlFor="global-tool-search" className="sr-only">
            Search PDF tools
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
            aria-hidden="true"
          />
          <input
            id="global-tool-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search PDF tools..."
            className="w-full rounded-control border border-white/25 bg-white/15 py-1.5 pl-9 pr-8 text-xs text-white placeholder:text-white/70 focus:border-white focus:bg-white focus:text-ink focus:placeholder:text-slate-400 focus:outline-none"
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

        {/* Right Section on Desktop: Privacy Notice */}
        <div
          className="hidden items-center gap-1.5 text-xs text-white/85 lg:inline-flex shrink-0 font-medium"
          role="note"
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
          <span>{en.brand.privacyStatement}</span>
        </div>
      </div>
    </header>
  );
};
