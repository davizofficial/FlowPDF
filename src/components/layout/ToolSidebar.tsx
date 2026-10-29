import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, ChevronRight } from 'lucide-react';
import { getAvailableTools } from '../../registry/tools';
import { ToolVisualIcon } from '../icons/ToolVisualIcon';
import type { ToolId } from '../../processing/shared-types';

interface ToolSidebarProps {
  activeToolId?: ToolId;
  isOpen: boolean;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeToolId,
  isOpen,
}) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isToolsHub = location.pathname === '/tools';
  const availableTools = getAvailableTools();

  return (
    <aside
      id="flowpdf-tools-sidebar"
      aria-label="PDF tools sidebar"
      hidden={!isOpen}
      className={`smooth-interactive bg-surface ${
        isOpen
          ? 'w-full border-b-2 border-slate-300 lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r-2 opacity-100 animate-fade-in'
          : 'hidden w-0 opacity-0 overflow-hidden'
      }`}
    >
      <div className="max-h-[70vh] overflow-y-auto lg:sticky lg:top-14 lg:max-h-[calc(100vh-3.5rem)] px-3.5 py-4 space-y-4">
        {/* Primary Platform Navigation Links */}
        <div className="space-y-1.5 border-b border-slate-200 pb-3">
          <Link
            to="/"
            aria-current={isHome ? 'page' : undefined}
            className={`smooth-interactive flex items-center gap-2.5 rounded-control border px-3 py-2 text-xs font-bold ${
              isHome
                ? 'border-primary bg-primary text-primary-ink shadow-xs'
                : 'border-slate-200 bg-canvas text-ink hover:border-primary/50 hover:bg-surface-subtle hover:translate-x-0.5'
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control ${
                isHome
                  ? 'bg-white/20 text-primary-ink border border-white/30'
                  : 'bg-primary text-white border border-primary-hover'
              }`}
            >
              <Home className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>Platform Overview</span>
          </Link>

          <Link
            to="/tools"
            aria-current={isToolsHub ? 'page' : undefined}
            className={`smooth-interactive flex items-center gap-2.5 rounded-control border px-3 py-2 text-xs font-bold ${
              isToolsHub
                ? 'border-primary bg-primary text-primary-ink shadow-xs'
                : 'border-slate-200 bg-canvas text-ink hover:border-primary/50 hover:bg-surface-subtle hover:translate-x-0.5'
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control ${
                isToolsHub
                  ? 'bg-white/20 text-primary-ink border border-white/30'
                  : 'bg-indigo-600 text-white border border-indigo-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>PDF Workspace ({availableTools.length} Tools)</span>
          </Link>
        </div>

        {/* Unified Tool List Without Category Separators */}
        <nav aria-label="Available PDF tools" className="space-y-1.5">
          {availableTools.map((tool) => {
            const isCurrent =
              !isHome && !isToolsHub && tool.id === activeToolId;
            return (
              <Link
                key={tool.id}
                to={tool.route}
                aria-current={isCurrent ? 'page' : undefined}
                className={`smooth-interactive group flex items-center justify-between gap-2.5 rounded-control border px-2.5 py-1.5 text-xs ${
                  isCurrent
                    ? 'border-primary bg-primary font-bold text-primary-ink shadow-xs'
                    : 'border-slate-200/80 bg-surface font-semibold text-ink hover:border-primary/50 hover:bg-surface-subtle hover:translate-x-0.5'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <ToolVisualIcon
                    toolId={tool.id}
                    active={isCurrent}
                    size="sm"
                  />
                  <span className="truncate">{tool.name}</span>
                </span>
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                    isCurrent
                      ? 'text-primary-ink opacity-100'
                      : 'text-slate-500 opacity-70 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100'
                  }`}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
