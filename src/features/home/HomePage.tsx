import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  ArrowRight,
  Layers,
  Sliders,
} from 'lucide-react';
import { getAvailableTools } from '../../registry/tools';
import { ToolVisualIcon } from '../../components/icons/ToolVisualIcon';

const PLATFORM_ADVANTAGES = [
  {
    icon: ShieldCheck,
    title: 'Complete Document Privacy',
    description:
      'Conventional online PDF platforms require you to upload confidential contracts, financial statements, and personal records to remote cloud servers. FlowPDF processes every page directly inside your web browser so your files never leave your device.',
    accentClass: 'bg-blue-600 text-white border-blue-700',
  },
  {
    icon: Zap,
    title: 'Instant Speed Without Upload Queues',
    description:
      'Because your documents do not travel across the internet to a remote server and back, merging, splitting, compressing, and converting large PDF files starts immediately without waiting for uploads or downloads.',
    accentClass: 'bg-amber-600 text-white border-amber-700',
  },
  {
    icon: Layers,
    title: 'No Account, Watermarks, or Task Quotas',
    description:
      'Many PDF websites restrict you to a few tasks per day, cap page counts, or add promotional watermarks unless you purchase a subscription. FlowPDF offers unrestricted access with clean, professional output.',
    accentClass: 'bg-emerald-600 text-white border-emerald-700',
  },
  {
    icon: Sliders,
    title: 'Verified Document Integrity',
    description:
      'Every tool verifies page structure, dimensions, and file size before generating your download. During compression, if a re-encoded file is not smaller than your original document, FlowPDF automatically preserves your original file.',
    accentClass: 'bg-violet-600 text-white border-violet-700',
  },
];

const COMPARISON_ROWS = [
  {
    criterion: 'Document Processing',
    flowpdf: 'Processed directly inside your browser',
    others: 'Uploaded to external third-party servers',
  },
  {
    criterion: 'Confidential File Privacy',
    flowpdf: 'Files never leave your device',
    others: 'Files transmitted and stored on remote cloud infrastructure',
  },
  {
    criterion: 'Upload & Download Waiting Time',
    flowpdf: 'None (instant execution)',
    others: 'Depends on internet upload and server queue speed',
  },
  {
    criterion: 'Account Registration',
    flowpdf: 'No registration or sign-in required',
    others: 'Often required for batch tasks or larger files',
  },
  {
    criterion: 'Watermarks & Daily Limits',
    flowpdf: 'No added watermarks and no daily task limits',
    others: 'Free tiers often enforce daily quotas or watermarks',
  },
  {
    criterion: 'Multi-Step Workflows & Batch Processing',
    flowpdf: 'Included for free in the workspace',
    others: 'Typically locked behind paid subscriptions',
  },
];

export const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const availableTools = getAvailableTools();

  const filteredTools =
    selectedCategory === 'all'
      ? availableTools
      : availableTools.filter((tool) => tool.category === selectedCategory);

  const filterTabs = [
    { id: 'all', label: 'All Tools', count: availableTools.length },
    {
      id: 'organize',
      label: 'Organize PDF',
      count: availableTools.filter((t) => t.category === 'organize').length,
    },
    {
      id: 'compress-repair',
      label: 'Optimize PDF',
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
      label: 'Edit PDF',
      count: availableTools.filter((t) => t.category === 'edit').length,
    },
    {
      id: 'security',
      label: 'Security',
      count: availableTools.filter((t) => t.category === 'security').length,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-12">
      {/* 1. Hero / Platform Introduction (iLovePDF Clean Centered Style) */}
      <section className="animate-stage-1 pt-4 pb-2 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Private In-Browser Document Workspace</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-ink max-w-4xl mx-auto leading-tight">
          Manage, Convert, and Protect PDF Documents with Complete Privacy
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg font-normal text-slate-600 leading-relaxed">
          Every tool you need to work with PDFs in one place. All are 100% FREE and easy to use. Merge, split, compress, convert, rotate, and protect documents directly inside your browser without uploading files to external servers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-1 text-xs sm:text-sm font-semibold text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Zero External Server Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>{availableTools.length} Browser-Based PDF Tools</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>No Registration or Limits</span>
          </div>
        </div>
      </section>

      {/* 2. Unified Platform Features & PDF Tools Directory (iLovePDF Style 4-Col Grid) */}
      <section
        id="platform-features"
        aria-labelledby="features-heading"
        className="animate-stage-2 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2
              id="features-heading"
              className="font-display text-2xl font-bold text-ink"
            >
              Platform Features and PDF Tools
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
              All {availableTools.length} PDF and document tools are unified in one workspace. Select any tool below to open it directly.
            </p>
          </div>

          <Link
            to="/tools"
            className="smooth-interactive inline-flex items-center gap-1.5 self-start sm:self-auto rounded-control bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-ink shadow-xs hover:bg-primary-hover"
          >
            <span>View All Tools</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Category Filter Pills (iLovePDF Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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

        {/* The 4-Column Vibrant Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.route}
              className="smooth-interactive group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
            >
              <div>
                {/* Card Top: Distinct Vibrant Document Icon */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <ToolVisualIcon toolId={tool.id} size="lg" />
                  <span className="rounded-control bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                    {tool.acceptedExtensions[0] || '.pdf'}
                  </span>
                </div>

                {/* Card Body: Title & Friendly Description */}
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-xs font-normal text-slate-500 leading-relaxed line-clamp-3">
                  {tool.shortDescription}
                </p>
              </div>

              {/* Card Footer: Subtle Action Cue */}
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
      </section>

      {/* 3. Key Advantages Over Other Platforms (Placed Cleanly Below the Tools Grid) */}
      <section aria-labelledby="advantages-heading" className="animate-stage-3 space-y-6 pt-6 border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Why Millions Value In-Browser Processing</span>
          </div>
          <h2
            id="advantages-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-ink"
          >
            Why Choose FlowPDF Over Other Platforms
          </h2>
          <p className="text-xs sm:text-sm font-normal text-slate-600">
            Standard online PDF tools process your files on remote servers. FlowPDF brings the entire document engine directly to your browser for superior privacy and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 pt-2">
          {PLATFORM_ADVANTAGES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="smooth-interactive rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-300"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-xs ${item.accentClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-ink">
                  {item.title}
                </h3>
                <p className="text-xs font-normal text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlighted Comparison Table */}
        <div className="overflow-hidden rounded-2xl border-2 border-primary/30 bg-surface shadow-sm mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-5 py-3.5 text-primary-ink">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                Platform Comparison: FlowPDF vs. Conventional Online PDF Tools
              </h3>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-bold text-white border border-white/25">
              Privacy &amp; Performance Benchmark
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-5 font-bold text-ink">
                    Feature / Aspect
                  </th>
                  <th className="py-3 px-5 font-extrabold text-primary bg-primary/10 border-x border-primary/20">
                    FlowPDF Platform
                  </th>
                  <th className="py-3 px-5 font-bold text-slate-700">
                    Conventional Online PDF Platforms
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.criterion} className="transition-colors hover:bg-slate-50/80">
                    <td className="py-3 px-5 font-bold text-ink bg-surface">
                      {row.criterion}
                    </td>
                    <td className="py-3 px-5 font-bold text-primary bg-primary/[0.05] border-x border-primary/20">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{row.flowpdf}</span>
                      </span>
                    </td>
                    <td className="py-3 px-5 font-normal text-slate-600">
                      {row.others}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
};
