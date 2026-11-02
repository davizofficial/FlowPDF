import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck, X } from 'lucide-react';
import { getAvailableTools } from '../../registry/tools';
import { ToolVisualIcon } from '../../components/icons/ToolVisualIcon';
import { en } from '../../i18n/en';

export const ToolsDirectoryPage: React.FC = () => {
  const availableTools = getAvailableTools();
  const [filterText, setFilterText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: 'All Tools', count: availableTools.length },
    {
      id: 'organize',
      label: 'Organize',
      count: availableTools.filter((t) => t.category === 'organize').length,
    },
    {
      id: 'compress-repair',
      label: 'Optimize',
      count: availableTools.filter((t) => t.category === 'compress-repair').length,
    },
    {
      id: 'convert-to-pdf',
      label: 'Convert to PDF',
      count: availableTools.filter((t) => t.category === 'convert-to-pdf').length,
    },
    {
      id: 'convert-from-pdf',
      label: 'Convert from PDF',
      count: availableTools.filter((t) => t.category === 'convert-from-pdf').length,
    },
    {
      id: 'edit',
      label: 'Edit',
      count: availableTools.filter((t) => t.category === 'edit').length,
    },
    {
      id: 'security',
      label: 'Security',
      count: availableTools.filter((t) => t.category === 'security').length,
    },
  ];

  const displayedTools = availableTools.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!filterText.trim()) return true;
    const q = filterText.trim().toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.shortDescription.toLowerCase().includes(q) ||
      tool.acceptedExtensions.some((ext) => ext.toLowerCase().includes(q))
    );
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header Banner */}
      <section className="animate-stage-1 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All-in-One PDF Workspace ({availableTools.length} Active Tools)</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              PDF Workspace and Tools
            </h1>
            <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
              Select the exact PDF utility you need below to open its dedicated workspace. {en.brand.privacyStatement}
            </p>
          </div>

          <div className="w-full lg:w-80">
            <label htmlFor="workspace-tools-filter" className="sr-only">
              Filter PDF workspace tools
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="workspace-tools-filter"
                type="search"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Find a tool (e.g. Word, Split, Excel)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-10 pr-8 text-xs font-medium text-ink placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none transition-colors"
              />
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText('')}
                  aria-label="Clear tool filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-100 mt-6 scrollbar-none">
          {filterTabs.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`smooth-interactive inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold shrink-0 transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4-Column Vibrant PDF Tools Grid */}
      <section aria-label="All PDF tools" className="animate-stage-2">
        {displayedTools.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {displayedTools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.route}
                className="smooth-interactive group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <ToolVisualIcon toolId={tool.id} size="lg" />
                    <span className="rounded-control bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                      {tool.acceptedExtensions[0] || '.pdf'}
                    </span>
                  </div>

                  <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                    {tool.name}
                  </h2>
                  <p className="mt-1.5 text-xs font-normal text-slate-500 leading-relaxed line-clamp-3">
                    {tool.shortDescription}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400">
                    {tool.acceptedExtensions.join(', ')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
            <p className="font-display text-base font-bold text-ink">
              No PDF tool matched &ldquo;{filterText}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterText('');
                setSelectedCategory('all');
              }}
              className="smooth-interactive inline-flex items-center rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-ink hover:bg-primary-hover"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
