import { ArrowLeft, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { INDIA_MAP_SHAPES } from '../data/indiaMapPaths';
import { DistrictPerformanceRow, StatePerformanceRow } from '../types/analytics';
import {
  formatCompactCount,
  formatExactCurrency,
  formatIndianCrores,
  formatSignedPercent,
} from '../utils/formatters';

interface RegionalGeoSectionProps {
  statesData: StatePerformanceRow[];
  districtsData: DistrictPerformanceRow[];
  selectedState: string;
  onSelectState: (state: string) => void;
  loading: boolean;
  districtsLoading: boolean;
}

function getHeatColor(ratio: number, isSelected: boolean): string {
  if (isSelected) return '#7C3AED';
  if (ratio <= 0) return '#1E293B';
  if (ratio < 0.12) return '#2B1E4A';
  if (ratio < 0.28) return '#3E206D';
  if (ratio < 0.5) return '#5F259F';
  if (ratio < 0.75) return '#7E3AF2';
  return '#A855F7';
}

export function RegionalGeoSection({
  statesData,
  districtsData,
  selectedState,
  onSelectState,
  loading,
  districtsLoading,
}: RegionalGeoSectionProps) {
  const [mapMetric, setMapMetric] = useState<'amountCr' | 'registeredUsers'>('amountCr');
  const [leaderMetric, setLeaderMetric] = useState<'amountCr' | 'registeredUsers'>('amountCr');
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const stateLookup = useMemo(() => {
    const map = new Map<string, StatePerformanceRow>();
    for (const row of statesData) {
      map.set(row.state, row);
    }
    return map;
  }, [statesData]);

  const maxMapValue = useMemo(() => {
    let max = 0;
    for (const row of statesData) {
      const v = mapMetric === 'amountCr' ? row.amountCr : row.registeredUsers;
      if (v > max) max = v;
    }
    return max || 1;
  }, [statesData, mapMetric]);

  const top10States = useMemo(() => {
    return [...statesData]
      .sort((a, b) =>
        leaderMetric === 'amountCr'
          ? b.amountCr - a.amountCr
          : b.registeredUsers - a.registeredUsers
      )
      .slice(0, 10);
  }, [statesData, leaderMetric]);

  const hoveredRow = hoveredState ? stateLookup.get(hoveredState) ?? null : null;
  const activeStateRow = selectedState !== 'all' ? stateLookup.get(selectedState) ?? null : null;

  return (
    <section
      id="regional"
      aria-label="Regional Geo-Heatmap and Growth Leaderboard"
      className="grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      {/* Left: Interactive India Geo-Heatmap */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 lg:col-span-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              India Digital Payments Geo-Heatmap
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Click any state on the map to inspect district-level growth
            </p>
          </div>

          <div className="inline-flex items-center rounded-lg border border-slate-700/80 bg-[#0F172A]/80 p-1 shrink-0">
            <button
              type="button"
              onClick={() => setMapMetric('amountCr')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                mapMetric === 'amountCr'
                  ? 'bg-[#5F259F] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TPV (₹ Cr)
            </button>
            <button
              type="button"
              onClick={() => setMapMetric('registeredUsers')}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                mapMetric === 'registeredUsers'
                  ? 'bg-[#5F259F] text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reg. Users
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex flex-1 items-center justify-center rounded-lg border border-slate-800/80 bg-[#0F172A]/70 p-3">
          {loading && statesData.length === 0 ? (
            <div className="h-[420px] w-full animate-pulse rounded-lg bg-slate-800/40" />
          ) : (
            <svg
              viewBox="40 5 555 640"
              className="h-[400px] w-full max-w-[480px] select-none sm:h-[430px]"
              role="img"
              aria-label="Interactive India State Payment Heatmap"
            >
              {INDIA_MAP_SHAPES.map((shape) => {
                const row = stateLookup.get(shape.state);
                const val = row
                  ? mapMetric === 'amountCr'
                    ? row.amountCr
                    : row.registeredUsers
                  : 0;
                const ratio = Math.sqrt(val / maxMapValue);
                const isSelected = selectedState === shape.state;
                const isHovered = hoveredState === shape.state;
                const fill = getHeatColor(ratio, isSelected);

                return (
                  <g
                    key={shape.state}
                    onClick={() =>
                      onSelectState(isSelected ? 'all' : shape.state)
                    }
                    onMouseEnter={() => setHoveredState(shape.state)}
                    onMouseLeave={() => setHoveredState(null)}
                    className="cursor-pointer transition-opacity duration-150"
                  >
                    <path
                      d={shape.path}
                      fill={fill}
                      stroke={
                        isSelected
                          ? '#F59E0B'
                          : isHovered
                            ? '#E2E8F0'
                            : '#0F172A'
                      }
                      strokeWidth={isSelected ? 2.4 : isHovered ? 1.8 : 1.1}
                      className="transition-colors duration-150"
                    />
                    {!shape.isSmallTerritory && (
                      <text
                        x={shape.labelX}
                        y={shape.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="pointer-events-none fill-slate-200/85 font-mono text-[8.5px] font-semibold"
                      >
                        {shape.shortCode}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Hover Telemetry Overlay */}
          {hoveredRow && (
            <div className="pointer-events-none absolute top-3 left-3 z-10 w-56 rounded-lg border border-slate-700 bg-[#0F172A]/95 p-3 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-semibold text-white truncate">
                  {hoveredRow.state}
                </span>
                {hoveredRow.yoyGrowthPct != null && (
                  <span
                    className={`font-mono text-[11px] font-semibold tabular-nums ${
                      hoveredRow.yoyGrowthPct >= 0 ? 'text-[#10B981]' : 'text-rose-400'
                    }`}
                  >
                    {formatSignedPercent(hoveredRow.yoyGrowthPct)}
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="block text-slate-400">TPV</span>
                  <span className="font-mono font-semibold text-slate-100 tabular-nums">
                    {formatIndianCrores(hoveredRow.amountCr)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Transactions</span>
                  <span className="font-mono font-semibold text-slate-100 tabular-nums">
                    {formatCompactCount(hoveredRow.transactionCount)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Reg. Users</span>
                  <span className="font-mono font-semibold text-slate-100 tabular-nums">
                    {formatCompactCount(hoveredRow.registeredUsers)}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Avg Ticket</span>
                  <span className="font-mono font-semibold text-slate-100 tabular-nums">
                    {formatExactCurrency(hoveredRow.avgTicketSize)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Color Scale Legend */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-md border border-slate-800 bg-[#0F172A]/90 px-2.5 py-1.5 text-[10px] text-slate-400">
            <span>Low</span>
            <div className="flex items-center gap-0.5">
              <span className="h-2.5 w-3.5 rounded-xs bg-[#2B1E4A]" />
              <span className="h-2.5 w-3.5 rounded-xs bg-[#3E206D]" />
              <span className="h-2.5 w-3.5 rounded-xs bg-[#5F259F]" />
              <span className="h-2.5 w-3.5 rounded-xs bg-[#7E3AF2]" />
              <span className="h-2.5 w-3.5 rounded-xs bg-[#A855F7]" />
            </div>
            <span>High</span>
          </div>
        </div>
      </div>

      {/* Right: Top 10 States Leaderboard OR District-Level Drilldown */}
      <div className="flex flex-col rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5 lg:col-span-6">
        {selectedState === 'all' ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-white">
                  Top 10 States Leaderboard
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Select a state row to drill down into top districts
                </p>
              </div>

              <div className="inline-flex items-center rounded-lg border border-slate-700/80 bg-[#0F172A]/80 p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setLeaderMetric('amountCr')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    leaderMetric === 'amountCr'
                      ? 'bg-[#5F259F] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  By Volume
                </button>
                <button
                  type="button"
                  onClick={() => setLeaderMetric('registeredUsers')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    leaderMetric === 'registeredUsers'
                      ? 'bg-[#5F259F] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  By Users
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-1 flex-col gap-2.5">
              {loading && top10States.length === 0 ? (
                <div className="h-[380px] w-full animate-pulse rounded-lg bg-slate-800/50" />
              ) : (
                top10States.map((row, idx) => {
                  const maxLeader =
                    top10States[0]
                      ? leaderMetric === 'amountCr'
                        ? top10States[0].amountCr
                        : top10States[0].registeredUsers
                      : 1;
                  const currentVal =
                    leaderMetric === 'amountCr' ? row.amountCr : row.registeredUsers;
                  const barPct = maxLeader > 0 ? (currentVal / maxLeader) * 100 : 0;

                  return (
                    <button
                      key={row.state}
                      type="button"
                      onClick={() => onSelectState(row.state)}
                      className="group flex flex-col gap-1.5 rounded-lg border border-slate-800/70 bg-[#0F172A]/50 px-3.5 py-2.5 text-left hover:border-[#5F259F]/70 hover:bg-[#0F172A]/90 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono text-xs font-semibold text-slate-500 w-5 tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="truncate text-sm font-medium text-slate-100 group-hover:text-white">
                            {row.state}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                          <span className="text-slate-400 hidden sm:inline">
                            {leaderMetric === 'amountCr'
                              ? `${formatCompactCount(row.transactionCount)} txns`
                              : formatIndianCrores(row.amountCr)}
                          </span>
                          <span className="font-semibold text-white">
                            {leaderMetric === 'amountCr'
                              ? formatIndianCrores(row.amountCr)
                              : `${formatCompactCount(row.registeredUsers)} users`}
                          </span>
                          {row.yoyGrowthPct != null && (
                            <span
                              className={`w-14 text-right ${
                                row.yoyGrowthPct >= 0 ? 'text-[#10B981]' : 'text-rose-400'
                              }`}
                            >
                              {formatSignedPercent(row.yoyGrowthPct)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#5F259F] to-[#A855F7]"
                          style={{ width: `${Math.max(4, barPct)}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* District-Level Drilldown inside Selected State */
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>District-Level Drilldown</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-200 font-medium">{selectedState}</span>
                </div>
                <h2 className="mt-1 font-display text-base font-semibold text-white">
                  Top Districts in {selectedState}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onSelectState('all')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0F172A]/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to All India</span>
              </button>
            </div>

            {activeStateRow && (
              <div className="mt-3 flex flex-wrap items-center gap-4 border-y border-slate-800 py-2.5 text-xs">
                <div>
                  <span className="text-slate-400">State TPV: </span>
                  <span className="font-mono font-semibold text-white tabular-nums">
                    {formatIndianCrores(activeStateRow.amountCr)}
                  </span>
                </div>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <div>
                  <span className="text-slate-400">Users: </span>
                  <span className="font-mono font-semibold text-white tabular-nums">
                    {formatCompactCount(activeStateRow.registeredUsers)}
                  </span>
                </div>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <div>
                  <span className="text-slate-400">Top Rail: </span>
                  <span className="font-medium text-purple-300">
                    {activeStateRow.topCategory}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-1 flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {districtsLoading ? (
                <div className="h-[320px] w-full animate-pulse rounded-lg bg-slate-800/50" />
              ) : districtsData.length === 0 ? (
                <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
                  No district records found for {selectedState}.
                </div>
              ) : (
                districtsData.slice(0, 10).map((dist, idx) => (
                  <div
                    key={dist.district}
                    className="flex flex-col gap-1.5 rounded-lg border border-slate-800/70 bg-[#0F172A]/50 px-3.5 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono text-xs font-semibold text-slate-500 w-5 tabular-nums">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-100">
                          {dist.district}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs tabular-nums">
                        <span className="text-slate-400 hidden sm:inline">
                          {formatCompactCount(dist.registeredUsers)} users
                        </span>
                        <span className="font-semibold text-white">
                          {formatIndianCrores(dist.amountCr)}
                        </span>
                        <span className="w-12 text-right text-[#F59E0B]">
                          {dist.shareOfStatePct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>{formatCompactCount(dist.transactionCount)} txns</span>
                      <span>Avg {formatExactCurrency(dist.avgTicketSize)}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5F259F] to-[#10B981]"
                        style={{ width: `${Math.max(5, dist.shareOfStatePct)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
