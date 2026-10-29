import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, X } from 'lucide-react';
import { getAvailableTools } from '../../registry/tools';
import { ToolVisualIcon } from '../../components/icons/ToolVisualIcon';
import { en } from '../../i18n/en';

export const ToolsDirectoryPage: React.FC = () => {
  const availableTools = getAvailableTools();
  const [filterText, setFilterText] = useState('');

  const displayedTools = filterText.trim()
    ? availableTools.filter((tool) => {
        const q = filterText.trim().toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q) ||
          tool.acceptedExtensions.some((ext) => ext.toLowerCase().includes(q))
        );
      })
    : availableTools;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Banner */}
      <section className="animate-stage-1 rounded-panel border-2 border-slate-300 bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All-in-One PDF Workspace ({availableTools.length} Active Tools)</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              PDF Workspace and Tools
            </h1>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
              Select the exact PDF utility you need below to open its dedicated workspace. {en.brand.privacyStatement}
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label htmlFor="workspace-tools-filter" className="sr-only">
              Filter PDF workspace tools
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="workspace-tools-filter"
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Find a tool (e.g. Word, Split, Sign)..."
                className="w-full rounded-control border-2 border-slate-300 bg-canvas py-2 pl-10 pr-8 text-xs font-medium text-ink placeholder:text-slate-500 focus:border-primary focus:bg-surface focus:outline-none"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  aria-label="Clear tool filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Unified PDF Tools Grid (Single Unified Platform Without Category Dividers) */}
      <section aria-label="All PDF tools" className="animate-stage-2">
        {displayedTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.route}
                className="smooth-interactive group flex flex-col justify-between rounded-panel border-2 border-slate-300 bg-surface p-5 shadow-xs hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <ToolVisualIcon toolId={tool.id} size="md" />
                      <h2 className="font-display text-base font-bold text-ink group-hover:text-primary">
                        {tool.name}
                      </h2>
                    </div>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">
                    {tool.shortDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-control bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                    {tool.acceptedExtensions.join(', ')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-control bg-primary/10 px-2.5 py-1 font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-ink">
                    <span>Open {tool.name}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-panel border-2 border-slate-300 bg-surface p-8 text-center space-y-3">
            <p className="font-display text-base font-bold text-ink">
              No PDF tool matched &ldquo;{filterText}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => setFilterText('')}
              className="smooth-interactive inline-flex items-center rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-ink hover:bg-primary-hover"
            >
              Show All {availableTools.length} Tools
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
