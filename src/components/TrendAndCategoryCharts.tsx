import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScriptableContext,
  Tooltip,
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { CategoryBreakdown, TrendPoint } from '../types/analytics';
import { formatCompactCount, formatIndianCrores, formatSignedPercent } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend
);

interface TrendAndCategoryChartsProps {
  trends: TrendPoint[];
  categories: CategoryBreakdown[];
  loading: boolean;
  peakQuarterLabel: string;
  peakQuarterSurgePct: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Merchant payments': '#7C3AED',
  'Peer-to-peer payments': '#5F259F',
  'Recharge & bill payments': '#10B981',
  'Financial Services': '#F59E0B',
  Others: '#64748B',
};

export function TrendAndCategoryCharts({
  trends,
  categories,
  loading,
  peakQuarterLabel,
  peakQuarterSurgePct,
}: TrendAndCategoryChartsProps) {
  const [metricMode, setMetricMode] = useState<'amountCr' | 'transactionCount'>('amountCr');

  const lineChartData = useMemo(() => {
    const labels = trends.map((t) => t.label);
    const values = trends.map((t) =>
      metricMode === 'amountCr' ? Math.round(t.amountCr) : t.transactionCount
    );

    return {
      labels,
      datasets: [
        {
          label: metricMode === 'amountCr' ? 'TPV (₹ Cr)' : 'Transactions',
          data: values,
          borderColor: '#8B5CF6',
          borderWidth: 2.5,
          tension: 0.34,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return 'rgba(95, 37, 159, 0.18)';
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(95, 37, 159, 0.38)');
            gradient.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
            return gradient;
          },
          pointRadius: trends.map((t) => (t.isFestivePeak ? 5 : 3)),
          pointHoverRadius: 7,
          pointBackgroundColor: trends.map((t) => (t.isFestivePeak ? '#F59E0B' : '#A78BFA')),
          pointBorderColor: trends.map((t) => (t.isFestivePeak ? '#0F172A' : '#1E293B')),
          pointBorderWidth: 2,
        },
      ],
    };
  }, [trends, metricMode]);

  const lineChartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          padding: 12,
          cornerRadius: 8,
          titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 600 },
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            label: (ctx) => {
              const point = trends[ctx.dataIndex];
              if (!point) return '';
              const primaryVal =
                metricMode === 'amountCr'
                  ? `TPV: ${formatIndianCrores(point.amountCr)}`
                  : `Txns: ${formatCompactCount(point.transactionCount)}`;
              return primaryVal;
            },
            afterLabel: (ctx) => {
              const point = trends[ctx.dataIndex];
              if (!point) return '';
              const qoq =
                point.qoqGrowthPct != null
                  ? `QoQ: ${formatSignedPercent(point.qoqGrowthPct)}`
                  : 'Baseline quarter';
              return point.isFestivePeak ? `${qoq}  ·  Festive Q4 Surge` : qoq;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'JetBrains Mono', size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'JetBrains Mono', size: 11 },
            callback: (val) => {
              const num = Number(val);
              return metricMode === 'amountCr'
                ? num >= 1e5
                  ? `₹${(num / 1e5).toFixed(1)}L Cr`
                  : `₹${Math.round(num / 1000)}K Cr`
                : formatCompactCount(num);
            },
          },
        },
      },
    }),
    [trends, metricMode]
  );

  const donutChartData = useMemo(() => {
    return {
      labels: categories.map((c) => c.transactionType),
      datasets: [
        {
          data: categories.map((c) => c.transactionCount),
          backgroundColor: categories.map(
            (c) => CATEGORY_COLORS[c.transactionType] ?? '#475569'
          ),
          borderColor: '#0F172A',
          borderWidth: 3,
          hoverOffset: 6,
        },
      ],
    };
  }, [categories]);

  const donutOptions = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#F8FAFC',
          bodyColor: '#CBD5E1',
          padding: 12,
          cornerRadius: 8,
          bodyFont: { family: 'JetBrains Mono', size: 12 },
          callbacks: {
            label: (ctx) => {
              const cat = categories[ctx.dataIndex];
              if (!cat) return '';
              return ` ${cat.sharePct.toFixed(1)}% · ${formatCompactCount(
                cat.transactionCount
              )} txns · ${formatIndianCrores(cat.amountCr)}`;
            },
          },
        },
      },
    }),
    [categories]
  );

  const totalCatTx = useMemo(
    () => categories.reduce((sum, c) => sum + c.transactionCount, 0),
    [categories]
  );

  return (
    <section
      id="trends"
      aria-label="Trend Line and Category Breakdown"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      {/* 60% Left: QoQ Growth Trajectory Line Chart */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 lg:col-span-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              Quarter-over-Quarter Growth Trajectory
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              <span>Seasonal festive Q4 surges highlighted in amber</span>
              {peakQuarterSurgePct > 0 && (
                <>
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium text-[#F59E0B]">
                    Peak {peakQuarterLabel} (+{peakQuarterSurgePct.toFixed(1)}% QoQ)
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Segmented Metric Toggle */}
          <div className="inline-flex items-center rounded-lg border border-slate-700/80 bg-[#0F172A]/80 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setMetricMode('amountCr')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                metricMode === 'amountCr'
                  ? 'bg-[#5F259F] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TPV (₹ Cr)
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('transactionCount')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                metricMode === 'transactionCount'
                  ? 'bg-[#5F259F] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Transactions
            </button>
          </div>
        </div>

        <div className="mt-5 h-[280px] w-full">
          {loading && trends.length === 0 ? (
            <div className="h-full w-full animate-pulse rounded-lg bg-slate-800/60" />
          ) : trends.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No quarterly trend data available for this selection.
            </div>
          ) : (
            <Line data={lineChartData} options={lineChartOptions} />
          )}
        </div>
      </div>

      {/* 40% Right: Category Split Breakdown Donut */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 lg:col-span-5">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            Payment Category Split
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Share by transaction volume across payment rails
          </p>
        </div>

        {loading && categories.length === 0 ? (
          <div className="mt-5 h-[280px] w-full animate-pulse rounded-lg bg-slate-800/60" />
        ) : categories.length === 0 ? (
          <div className="mt-5 flex h-[280px] items-center justify-center text-sm text-slate-400">
            No category records match the active filters.
          </div>
        ) : (
          <div className="mt-4 flex flex-1 flex-col justify-between gap-4 sm:flex-row lg:flex-col xl:flex-row xl:items-center">
            <div className="relative mx-auto h-[195px] w-[195px] shrink-0">
              <Doughnut data={donutChartData} options={donutOptions} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-medium text-slate-400">Total Txns</span>
                <span className="font-mono text-base font-bold text-white tabular-nums">
                  {formatCompactCount(totalCatTx)}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2.5">
              {categories.map((cat) => {
                const swatch = CATEGORY_COLORS[cat.transactionType] ?? '#475569';
                return (
                  <div
                    key={cat.transactionType}
                    className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2 last:border-b-0 last:pb-0 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                      <span className="truncate text-slate-200 font-medium">
                        {cat.transactionType}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 font-mono tabular-nums">
                      <span className="text-slate-400">
                        {formatIndianCrores(cat.amountCr)}
                      </span>
                      <span className="w-11 text-right font-semibold text-white">
                        {cat.sharePct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
