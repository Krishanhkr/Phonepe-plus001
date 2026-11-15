import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { DashboardFilters } from '../types/analytics';

interface TopNavProps {
  filters: DashboardFilters;
  onOpenIngest: () => void;
}

export function TopNav({ filters, onOpenIngest }: TopNavProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      year: filters.year,
      quarter: filters.quarter,
      state: filters.state,
    });
    window.location.href = `/api/export?${params.toString()}`;
    setExportMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0F172A]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#overview"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5F259F] rounded-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5F259F] text-white font-display font-bold text-base shadow-sm">
            पे
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            PhonePe Pulse
          </span>
        </a>

        {/* Zone 2: Concise single-line section navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#overview"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors duration-150"
          >
            Overview
          </a>
          <a
            href="#trends"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors duration-150"
          >
            Trends
          </a>
          <a
            href="#regional"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors duration-150"
          >
            Regional Map
          </a>
          <a
            href="#ledger"
            className="whitespace-nowrap shrink-0 hover:text-white transition-colors duration-150"
          >
            State Ledger
          </a>
        </nav>

        {/* Zone 3: Primary actions */}
        <div className="flex items-center gap-2.5 shrink-0 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#1E293B] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-300" />
              <span>Export</span>
            </button>

            {exportMenuOpen && (
              <div
                onMouseLeave={() => setExportMenuOpen(false)}
                className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-[#1E293B] p-1.5 shadow-xl z-40"
              >
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Download CSV</span>
                  <span className="font-mono text-[11px] text-slate-400">.csv</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <span>Download JSON</span>
                  <span className="font-mono text-[11px] text-slate-400">.json</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenIngest}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5F259F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7334B8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Ingest Data</span>
          </button>
        </div>
      </div>
    </header>
  );
}
