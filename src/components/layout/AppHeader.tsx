import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, X, LayoutGrid } from 'lucide-react';
import { en } from '../../i18n/en';
import { getAvailableTools } from '../../registry/tools';
import type { ToolId } from '../../processing/shared-types';

interface AppHeaderProps {
  activeToolId?: ToolId;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeToolId,
  searchQuery,
  onSearchChange,
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:h-16 sm:px-6 sm:py-0">
        {/* Left Section: Brand Logo + All Tools link right next to it with spacing */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white focus-visible:rounded-control shrink-0"
          >
            <img
              src="/icons/flowpdf-app-icon.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8 shrink-0 rounded-xl ring-1 ring-white/30"
            />
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap">
              {en.brand.name}
            </span>
          </Link>

          <Link
            to="/tools"
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors shrink-0"
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="whitespace-nowrap">All Tools</span>
          </Link>
        </div>

        {/* Right Section: Search Input and Privacy Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Search */}
          <div
            role="search"
            className="relative w-full max-w-[190px] sm:max-w-xs"
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
              className="w-full rounded-xl border border-white/25 bg-white/15 py-1.5 pl-8 pr-8 text-xs text-white placeholder:text-white/70 focus:border-white focus:bg-white focus:text-ink focus:placeholder:text-slate-400 focus:outline-none transition-colors"
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
              <div className="absolute left-0 right-0 top-full mt-2 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-surface text-ink py-1 shadow-2xl z-40">
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
                      <p className="line-clamp-1 text-[11px] text-slate-500">
                        {tool.shortDescription}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="px-3.5 py-2.5 text-xs text-slate-500 font-medium">
                    No matching PDF tool found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Privacy Guarantee Badge */}
          <div
            className="hidden items-center gap-1.5 text-xs text-white/85 md:inline-flex shrink-0 font-medium"
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
