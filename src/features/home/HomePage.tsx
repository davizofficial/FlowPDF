import React from 'react';
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
  const availableTools = getAvailableTools();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-14">
      {/* 1. Hero / Platform Introduction */}
      <section className="animate-stage-1 rounded-panel border-2 border-slate-300 bg-surface p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Private Browser-Based PDF Platform</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Manage, Convert, and Protect PDF Documents with Complete Privacy
          </h1>

          <p className="text-base font-medium text-slate-700 leading-relaxed">
            FlowPDF is an all-in-one PDF workspace designed for professionals, students, and organizations that value data confidentiality. Merge, split, compress, edit, convert, and protect documents directly in your browser without uploading a single byte to external servers.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/tools"
              className="smooth-interactive inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-primary-ink hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-sm"
            >
              <span>Open PDF Workspace</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <a
              href="#platform-features"
              className="smooth-interactive inline-flex items-center gap-2 rounded-control border-2 border-slate-300 bg-canvas px-4 py-2.5 text-sm font-semibold text-ink hover:-translate-y-0.5 hover:border-primary hover:bg-surface-subtle"
            >
              <span>Explore All {availableTools.length} Active Tools</span>
            </a>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3 border-t border-slate-200">
            <div className="flex items-center gap-2.5 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Zero External Server Uploads</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{availableTools.length} Ready-to-Use PDF Utilities</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-bold text-ink">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>No Registration or Usage Quotas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Advantages Over Other Platforms */}
      <section aria-labelledby="advantages-heading" className="animate-stage-2 space-y-6">
        <div className="max-w-2xl space-y-2">
          <h2
            id="advantages-heading"
            className="font-display text-2xl font-bold text-ink"
          >
            Why Choose FlowPDF Over Other Platforms
          </h2>
          <p className="text-sm font-medium text-slate-700">
            Standard online PDF tools process your files on remote servers. FlowPDF brings the entire document engine directly to your browser for superior privacy and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PLATFORM_ADVANTAGES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="smooth-interactive rounded-panel border-2 border-slate-300 bg-surface p-6 space-y-3 shadow-xs hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-control border shadow-xs ${item.accentClass}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-base font-bold text-ink">
                  {item.title}
                </h3>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlighted Comparison Table */}
        <div className="overflow-hidden rounded-panel border-2 border-primary/40 bg-surface shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-primary px-5 py-4 text-primary-ink">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
              <h3 className="font-display text-sm sm:text-base font-bold text-white">
                Platform Comparison: FlowPDF vs. Conventional Online PDF Tools
              </h3>
            </div>
            <span className="rounded-pill bg-white/15 px-3 py-0.5 text-[11px] font-bold text-white border border-white/25">
              Privacy &amp; Performance Benchmark
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="py-3.5 px-5 font-bold text-ink bg-slate-200/80">
                    Feature / Aspect
                  </th>
                  <th className="py-3.5 px-5 font-extrabold text-primary bg-primary/15 border-x-2 border-primary/25">
                    FlowPDF Platform
                  </th>
                  <th className="py-3.5 px-5 font-bold text-slate-800 bg-slate-200/80">
                    Conventional Online PDF Platforms
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.criterion} className="transition-colors hover:bg-primary/[0.04]">
                    <td className="py-3.5 px-5 font-bold text-ink bg-surface">
                      {row.criterion}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-primary bg-primary/[0.09] border-x-2 border-primary/25">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>{row.flowpdf}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-semibold text-slate-700 bg-slate-100/80">
                      {row.others}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Unified Platform Features & PDF Tools Directory (No Category Dividers) */}
      <section
        id="platform-features"
        aria-labelledby="features-heading"
        className="animate-stage-3 space-y-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <h2
              id="features-heading"
              className="font-display text-2xl font-bold text-ink"
            >
              Platform Features and PDF Tools
            </h2>
            <p className="text-sm font-medium text-slate-700">
              All {availableTools.length} PDF and document tools are unified in one workspace. Select any tool below to open it directly.
            </p>
          </div>
          <Link
            to="/tools"
            className="smooth-interactive inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-bold text-primary-ink hover:bg-primary-hover"
          >
            <span>View Full PDF Workspace</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {availableTools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.route}
              className="smooth-interactive group flex flex-col justify-between rounded-panel border-2 border-slate-300 bg-surface p-5 shadow-xs hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ToolVisualIcon toolId={tool.id} size="md" />
                    <h3 className="font-display text-base font-bold text-ink group-hover:text-primary">
                      {tool.name}
                    </h3>
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
      </section>
    </main>
  );
};
