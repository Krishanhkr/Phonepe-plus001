import { Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { DashboardFilters, StateComparisonItem } from '../types/analytics';
import {
  formatCompactCount,
  formatExactCurrency,
  formatIndianCrores,
  formatSignedPercent,
} from '../utils/formatters';

interface ComparisonDrawerProps {
  open: boolean;
  onClose: () => void;
  allStates: string[];
  comparedStates: string[];
  onSetComparedStates: (states: string[]) => void;
  filters: DashboardFilters;
}

const COMPARE_PALETTE = ['#8B5CF6', '#10B981', '#F59E0B'];

export function ComparisonDrawer({
  open,
  onClose,
  allStates,
  comparedStates,
  onSetComparedStates,
  filters,
}: ComparisonDrawerProps) {
  const [items, setItems] = useState<StateComparisonItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addCandidate, setAddCandidate] = useState('');

  useEffect(() => {
    if (!open || comparedStates.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      states: comparedStates.join(','),
      year: filters.year,
      quarter: filters.quarter,
    });

    fetch(`/api/compare?${params.toString()}`)
      .then((res) => res.json())
      .then((data: StateComparisonItem[]) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, comparedStates, filters.year, filters.quarter]);

  const availableToAdd = useMemo(
    () => allStates.filter((s) => !comparedStates.includes(s)),
    [allStates, comparedStates]
  );

  const chartData = useMemo(() => {
    if (items.length === 0) return { labels: [], datasets: [] };
    const labels = items[0].trend.map((t) => t.label);
    const datasets = items.map((item, idx) => ({
      label: item.state,
      data: item.trend.map((t) => Math.round(t.amountCr)),
      borderColor: COMPARE_PALETTE[idx % COMPARE_PALETTE.length],
      backgroundColor: COMPARE_PALETTE[idx % COMPARE_PALETTE.length],
      borderWidth: 2,
      tension: 0.32,
      pointRadius: 2.5,
    }));

    return { labels, datasets };
  }, [items]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="State Comparison Drawer"
    >
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-[#0F172A] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              State Benchmark Comparison
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Compare up to 3 states side-by-side · {filters.year === 'all' ? '2020–2025' : filters.year}{' '}
              · {filters.quarter === 'all' ? 'All Quarters' : `Q${filters.quarter}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison drawer"
            className="rounded-lg border border-slate-800 bg-[#1E293B] p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selected States Control Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 bg-[#1E293B]/50 px-6 py-3">
          {comparedStates.map((st, idx) => (
            <div
              key={st}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-[#0F172A] px-2.5 py-1 text-xs font-medium text-slate-100"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COMPARE_PALETTE[idx % COMPARE_PALETTE.length] }}
              />
              <span>{st}</span>
              <button
                type="button"
                onClick={() =>
                  onSetComparedStates(comparedStates.filter((s) => s !== st))
                }
                aria-label={`Remove ${st}`}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {comparedStates.length < 3 && (
            <div className="flex items-center gap-1.5">
              <select
                value={addCandidate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    onSetComparedStates([...comparedStates, val]);
                    setAddCandidate('');
                  }
                }}
                aria-label="Add state to comparison"
                className="rounded-md border border-slate-700 bg-[#1E293B] px-2.5 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">+ Add state...</option>
                {availableToAdd.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {comparedStates.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-14 text-center">
              <p className="text-sm font-medium text-slate-200">
                No states selected for comparison
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Choose a state above or use the checkboxes in the Regional Performance Ledger.
              </p>
              <button
                type="button"
                onClick={() =>
                  onSetComparedStates(['Maharashtra', 'Karnataka', 'Haryana'])
                }
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#5F259F] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#7334B8] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Load Top Benchmark (MH, KA, HR)</span>
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-xl bg-slate-800/60" />
              <div className="h-56 animate-pulse rounded-xl bg-slate-800/60" />
            </div>
          ) : (
            <>
              {/* Side-by-side Metrics Matrix */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#1E293B]/60">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="px-4 py-3 text-left font-medium">Metric</th>
                      {items.map((item, idx) => (
                        <th key={item.state} className="px-4 py-3 text-right font-semibold text-white">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: COMPARE_PALETTE[idx % COMPARE_PALETTE.length] }}
                            />
                            {item.state}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                    <tr>
                      <td className="px-4 py-2.5 font-sans text-slate-300">TPV (₹ Cr)</td>
                      {items.map((item) => (
                        <td key={item.state} className="px-4 py-2.5 text-right font-semibold text-white">
                          {formatIndianCrores(item.amountCr)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans text-slate-300">Transactions</td>
                      {items.map((item) => (
                        <td key={item.state} className="px-4 py-2.5 text-right text-slate-200">
                          {formatCompactCount(item.totalTransactions)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans text-slate-300">Avg. Ticket Size</td>
                      {items.map((item) => (
                        <td key={item.state} className="px-4 py-2.5 text-right text-slate-200">
                          {formatExactCurrency(item.avgTicketSize)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans text-slate-300">Registered Users</td>
                      {items.map((item) => (
                        <td key={item.state} className="px-4 py-2.5 text-right text-slate-200">
                          {formatCompactCount(item.registeredUsers)}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-sans text-slate-300">YoY Tx Growth</td>
                      {items.map((item) => (
                        <td
                          key={item.state}
                          className={`px-4 py-2.5 text-right font-semibold ${
                            item.yoyGrowthPct == null
                              ? 'text-slate-400'
                              : item.yoyGrowthPct >= 0
                                ? 'text-[#10B981]'
                                : 'text-rose-400'
                          }`}
                        >
                          {formatSignedPercent(item.yoyGrowthPct)}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Multi-State TPV Trend Chart */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B]/60 p-4">
                <h3 className="font-display text-sm font-semibold text-white">
                  Quarterly TPV Trajectory Comparison (₹ Cr)
                </h3>
                <div className="mt-4 h-[220px] w-full">
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#CBD5E1', boxWidth: 10, font: { size: 11 } },
                        },
                      },
                      scales: {
                        x: {
                          grid: { color: 'rgba(148,163,184,0.08)' },
                          ticks: { color: '#94A3B8', font: { size: 10 }, maxTicksLimit: 8 },
                        },
                        y: {
                          grid: { color: 'rgba(148,163,184,0.08)' },
                          ticks: {
                            color: '#94A3B8',
                            font: { size: 10 },
                            callback: (v) => `₹${Math.round(Number(v) / 1000)}K Cr`,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Category Mix Comparison */}
              <div className="rounded-xl border border-slate-800 bg-[#1E293B]/60 p-4 space-y-3">
                <h3 className="font-display text-sm font-semibold text-white">
                  Merchant vs. P2P Share Split
                </h3>
                {items.map((item) => {
                  const merchant =
                    item.categories.find((c) => c.transactionType === 'Merchant payments')
                      ?.sharePct ?? 0;
                  const p2p =
                    item.categories.find((c) => c.transactionType === 'Peer-to-peer payments')
                      ?.sharePct ?? 0;
                  const other = Math.max(0, 100 - merchant - p2p);

                  return (
                    <div key={item.state} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{item.state}</span>
                        <span className="font-mono tabular-nums text-slate-400">
                          Merchant {merchant.toFixed(1)}% · P2P {p2p.toFixed(1)}% · Other {other.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="bg-[#7C3AED]"
                          style={{ width: `${merchant}%` }}
                          title={`Merchant: ${merchant.toFixed(1)}%`}
                        />
                        <div
                          className="bg-[#10B981]"
                          style={{ width: `${p2p}%` }}
                          title={`P2P: ${p2p.toFixed(1)}%`}
                        />
                        <div
                          className="bg-[#F59E0B]"
                          style={{ width: `${other}%` }}
                          title={`Other: ${other.toFixed(1)}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
