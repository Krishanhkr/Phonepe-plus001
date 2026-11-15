import { ArrowDownRight, ArrowUpRight, IndianRupee, Layers, TrendingUp, Users } from 'lucide-react';
import { OverviewMetrics } from '../types/analytics';
import {
  formatCompactCount,
  formatExactCurrency,
  formatIndianCrores,
  formatSignedPercent,
} from '../utils/formatters';

interface KpiGridProps {
  overview: OverviewMetrics | null;
  loading: boolean;
}

export function KpiGrid({ overview, loading }: KpiGridProps) {
  if (loading && !overview) {
    return (
      <div id="overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className="h-[132px] animate-pulse rounded-xl border border-slate-800 bg-[#1E293B]/70 p-5"
          />
        ))}
      </div>
    );
  }

  if (!overview) return null;

  const isPositiveYoY = overview.yoyGrowthPct != null && overview.yoyGrowthPct >= 0;
  const isNegativeYoY = overview.yoyGrowthPct != null && overview.yoyGrowthPct < 0;

  return (
    <section
      id="overview"
      aria-label="Executive KPI Summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* Card 1: Total Transactions */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 transition-colors hover:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">Total Transactions</span>
          <Layers className="h-4 w-4 text-purple-400 shrink-0" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums sm:text-[26px]">
            {formatCompactCount(overview.totalTransactions)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-slate-300">
              {overview.totalTransactions.toLocaleString('en-IN')}
            </span>
            <span aria-hidden="true">·</span>
            <span>txns</span>
          </div>
        </div>
      </article>

      {/* Card 2: Total Payment Volume in ₹ Cr */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 transition-colors hover:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">Total Payment Volume</span>
          <IndianRupee className="h-4 w-4 text-emerald-400 shrink-0" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums sm:text-[26px]">
            {formatIndianCrores(overview.totalAmountCr)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono tabular-nums text-slate-300">
              ₹{Math.round(overview.totalAmountCr).toLocaleString('en-IN')} Cr
            </span>
            {overview.yoyAmountGrowthPct != null && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-mono font-medium tabular-nums ${
                    overview.yoyAmountGrowthPct >= 0 ? 'text-[#10B981]' : 'text-rose-400'
                  }`}
                >
                  {formatSignedPercent(overview.yoyAmountGrowthPct)} TPV YoY
                </span>
              </>
            )}
          </div>
        </div>
      </article>

      {/* Card 3: Average Transaction Value */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 transition-colors hover:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">Avg. Transaction Value</span>
          <Users className="h-4 w-4 text-amber-400 shrink-0" />
        </div>
        <div className="mt-3">
          <div className="font-mono text-2xl font-bold tracking-tight text-white tabular-nums sm:text-[26px]">
            {formatExactCurrency(overview.avgTransactionValue)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Registered Users</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-200">
              {formatCompactCount(overview.registeredUsers)}
            </span>
          </div>
        </div>
      </article>

      {/* Card 4: YoY Growth % */}
      <article className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 transition-colors hover:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-400">YoY Transaction Growth</span>
          <TrendingUp className="h-4 w-4 text-[#10B981] shrink-0" />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2.5">
            <span
              className={`font-mono text-2xl font-bold tracking-tight tabular-nums sm:text-[26px] ${
                isPositiveYoY
                  ? 'text-[#10B981]'
                  : isNegativeYoY
                    ? 'text-rose-400'
                    : 'text-slate-200'
              }`}
            >
              {formatSignedPercent(overview.yoyGrowthPct)}
            </span>
            {isPositiveYoY && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[#10B981]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Growth</span>
              </span>
            )}
            {isNegativeYoY && (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-400">
                <ArrowDownRight className="h-3.5 w-3.5" />
                <span>Decline</span>
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>{overview.comparisonNote}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#F59E0B] font-medium">
              Peak {overview.peakQuarterLabel}
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}
