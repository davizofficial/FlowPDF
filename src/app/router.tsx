import React, { useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useParams,
  Link,
} from 'react-router-dom';
import { Lock, ArrowLeft, LayoutGrid } from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader';
import { ToolSidebar } from '../components/layout/ToolSidebar';
import { AppFooter } from '../components/layout/AppFooter';
import { ToolWorkspace } from '../features/workspace/ToolWorkspace';
import { ToolsDirectoryPage } from '../features/workspace/ToolsDirectoryPage';
import { HomePage } from '../features/home/HomePage';
import {
  getAvailableToolById,
  getToolById,
} from '../registry/tools';
import type { ToolId } from '../processing/shared-types';

const ToolRouteView: React.FC = () => {
  const { toolId = '' } = useParams<{ toolId: string }>();
  const availableTool = getAvailableToolById(toolId);
  const anyTool = getToolById(toolId);

  if (availableTool) {
    return <ToolWorkspace tool={availableTool} />;
  }

  if (anyTool) {
    return (
      <main className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-panel border-2 border-warning bg-surface p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-warning">
            <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold uppercase">
              Status: {anyTool.status.toUpperCase()}
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {anyTool.name} is Gated Pending Technical Verification
          </h1>
          <p className="text-sm font-medium text-slate-700">
            To protect your privacy and document quality, this tool remains restricted until all in-browser security and accuracy checks are completed.
          </p>
          {anyTool.gateReason && (
            <div className="rounded-control border border-warning bg-warning-bg p-3 text-xs font-medium text-warning">
              <strong>Reason:</strong> {anyTool.gateReason}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/tools"
              className="smooth-interactive inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-primary-ink hover:bg-primary-hover"
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Open PDF Workspace</span>
            </Link>
            <Link
              to="/"
              className="smooth-interactive inline-flex items-center gap-1.5 rounded-control border-2 border-slate-300 bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:border-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to Platform Overview</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <Navigate to="/tools" replace />;
};

export const AppRouter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Determine activeToolId from pathname so header & sidebar stay persistent without remounting
  const toolMatch = location.pathname.match(/^\/tools\/([^/]+)/);
  const matchedToolId = toolMatch ? toolMatch[1] : undefined;
  const availableTool = matchedToolId
    ? getAvailableToolById(matchedToolId)
    : undefined;
  const activeToolId: ToolId | undefined = availableTool?.id;

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.scrollTo === 'function' &&
      !window.navigator?.userAgent?.includes('jsdom')
    ) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <AppHeader
        activeToolId={activeToolId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />

      <div className="flex flex-1 flex-col lg:flex-row">
        <ToolSidebar
          activeToolId={activeToolId}
          isOpen={isSidebarOpen}
        />

        <div className="relative flex-1 min-w-0 overflow-x-hidden flex flex-col justify-between">
          <div className="flex-1">
            {/* Top smooth route transition indicator bar */}
            <div
              key={`bar-${location.pathname}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-primary/80 animate-route-bar"
            />

            {/* Main page transition container */}
            <div
              key={location.pathname}
              className="animate-page-transition"
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route path="/tools" element={<ToolsDirectoryPage />} />
                <Route path="/tools/:toolId" element={<ToolRouteView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>

          <AppFooter />
        </div>
      </div>
    </div>
  );
};
