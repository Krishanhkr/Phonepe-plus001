import { GitCompareArrows, RotateCcw } from 'lucide-react';
import { DashboardFilters, QuarterValue, YearValue } from '../types/analytics';

interface FilterRibbonProps {
  filters: DashboardFilters;
  years: number[];
  states: string[];
  activePeriodLabel: string;
  comparedCount: number;
  onChangeFilter: (next: Partial<DashboardFilters>) => void;
  onResetFilters: () => void;
  onOpenCompare: () => void;
}

export function FilterRibbon({
  filters,
  years,
  states,
  activePeriodLabel,
  comparedCount,
  onChangeFilter,
  onResetFilters,
  onOpenCompare,
}: FilterRibbonProps) {
  const isFiltered =
    filters.year !== 'all' || filters.quarter !== 'all' || filters.state !== 'all';

  return (
    <section
      aria-label="Dashboard Filters"
      className="border-b border-slate-800/80 bg-[#0F172A]/75"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3.5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        {/* Title & Active Slice Summary */}
        <div className="flex flex-col gap-0.5">
          <h1 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
            Digital Payments &amp; User Growth Analytics
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Active Scope</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-200">{activePeriodLabel}</span>
          </div>
        </div>

        {/* Multi-Level Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#1E293B] px-3 py-1.5 text-xs">
            <span className="text-slate-400 whitespace-nowrap">Year</span>
            <select
              aria-label="Filter by Year"
              value={filters.year}
              onChange={(e) => onChangeFilter({ year: e.target.value as YearValue })}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#1E293B] text-slate-100">
                All (2020–2025)
              </option>
              {years.map((yr) => (
                <option key={yr} value={String(yr)} className="bg-[#1E293B] text-slate-100">
                  {yr}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#1E293B] px-3 py-1.5 text-xs">
            <span className="text-slate-400 whitespace-nowrap">Quarter</span>
            <select
              aria-label="Filter by Quarter"
              value={filters.quarter}
              onChange={(e) => onChangeFilter({ quarter: e.target.value as QuarterValue })}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#1E293B] text-slate-100">
                All Quarters
              </option>
              <option value="1" className="bg-[#1E293B] text-slate-100">
                Q1 (Jan–Mar)
              </option>
              <option value="2" className="bg-[#1E293B] text-slate-100">
                Q2 (Apr–Jun)
              </option>
              <option value="3" className="bg-[#1E293B] text-slate-100">
                Q3 (Jul–Sep)
              </option>
              <option value="4" className="bg-[#1E293B] text-slate-100">
                Q4 (Oct–Dec)
              </option>
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#1E293B] px-3 py-1.5 text-xs">
            <span className="text-slate-400 whitespace-nowrap">State</span>
            <select
              aria-label="Filter by State"
              value={filters.state}
              onChange={(e) => onChangeFilter({ state: e.target.value })}
              className="max-w-[175px] truncate bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#1E293B] text-slate-100">
                All India
              </option>
              {states.map((st) => (
                <option key={st} value={st} className="bg-[#1E293B] text-slate-100">
                  {st}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onOpenCompare}
            className="inline-flex items-center gap-2 rounded-lg border border-[#5F259F]/60 bg-[#5F259F]/20 px-3 py-1.5 text-xs font-medium text-purple-200 hover:bg-[#5F259F]/35 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <GitCompareArrows className="h-3.5 w-3.5 text-purple-300" />
            <span>Compare States</span>
            <span className="font-mono tabular-nums text-purple-100">({comparedCount})</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
