import { ArrowDown, ArrowUp, ArrowUpDown, Check, GitCompareArrows, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DistrictPerformanceRow, StatePerformanceRow } from '../types/analytics';
import {
  formatCompactCount,
  formatExactCurrency,
  formatIndianCrores,
  formatSignedPercent,
} from '../utils/formatters';

type SortField =
  | 'state'
  | 'transactionCount'
  | 'amountCr'
  | 'avgTicketSize'
  | 'registeredUsers'
  | 'yoyGrowthPct';

interface StatePerformanceTableProps {
  statesData: StatePerformanceRow[];
  districtsData: DistrictPerformanceRow[];
  selectedState: string;
  comparedStates: string[];
  onSelectState: (state: string) => void;
  onToggleCompareState: (state: string) => void;
  onOpenCompare: () => void;
  loading: boolean;
}

export function StatePerformanceTable({
  statesData,
  districtsData,
  selectedState,
  comparedStates,
  onSelectState,
  onToggleCompareState,
  onOpenCompare,
  loading,
}: StatePerformanceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('amountCr');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [tableTab, setTableTab] = useState<'states' | 'districts'>('states');

  const activeTab = selectedState !== 'all' && tableTab === 'districts' ? 'districts' : 'states';

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'state' ? 'asc' : 'desc');
    }
  };

  const filteredStates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? statesData.filter(
          (r) =>
            r.state.toLowerCase().includes(q) ||
            r.topCategory.toLowerCase().includes(q)
        )
      : [...statesData];

    list.sort((a, b) => {
      let va: string | number = a[sortBy] ?? -99999;
      let vb: string | number = b[sortBy] ?? -99999;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === 'asc' ? Number(va) - Number(vb) : Number(vb) - Number(va);
    });

    return list;
  }, [statesData, searchQuery, sortBy, sortDir]);

  const filteredDistricts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q
      ? districtsData.filter((d) => d.district.toLowerCase().includes(q))
      : districtsData;
  }, [districtsData, searchQuery]);

  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-purple-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-purple-400" />
    );
  };

  return (
    <section
      id="ledger"
      aria-label="State-wise TPV and User Count Ledger"
      className="rounded-xl border border-slate-800/90 bg-[#1E293B]/80 backdrop-blur-md p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-base font-semibold text-white">
              Regional Performance Ledger
            </h2>
            {selectedState !== 'all' && (
              <div className="inline-flex items-center rounded-lg border border-slate-700/80 bg-[#0F172A]/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setTableTab('states')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'states'
                      ? 'bg-[#5F259F] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All States
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab('districts')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'districts'
                      ? 'bg-[#5F259F] text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {selectedState} Districts
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Select up to 3 states to compare side-by-side, or click a state name to drill into districts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {comparedStates.length > 0 && (
            <button
              type="button"
              onClick={onOpenCompare}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5F259F] px-3 py-2 text-xs font-semibold text-white hover:bg-[#7334B8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
              <span>Compare ({comparedStates.length}/3)</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'districts'
                  ? `Search ${selectedState} districts...`
                  : 'Search state or category...'
              }
              aria-label="Search table rows"
              className="w-full rounded-lg border border-slate-700/80 bg-[#0F172A]/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#5F259F] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800/90">
        {activeTab === 'states' ? (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0F172A]/90 text-slate-400">
                <th className="w-10 px-3 py-3 text-center font-medium">Cmp</th>
                <th className="px-3 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('state')}
                    className="inline-flex items-center gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>State / UT</span>
                    {renderSortIcon('state')}
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('transactionCount')}
                    className="inline-flex items-center justify-end gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>Transactions</span>
                    {renderSortIcon('transactionCount')}
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('amountCr')}
                    className="inline-flex items-center justify-end gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>TPV (₹ Cr)</span>
                    {renderSortIcon('amountCr')}
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('avgTicketSize')}
                    className="inline-flex items-center justify-end gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>Avg. Ticket</span>
                    {renderSortIcon('avgTicketSize')}
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('registeredUsers')}
                    className="inline-flex items-center justify-end gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>Reg. Users</span>
                    {renderSortIcon('registeredUsers')}
                  </button>
                </th>
                <th className="px-3 py-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('yoyGrowthPct')}
                    className="inline-flex items-center justify-end gap-1.5 hover:text-white cursor-pointer"
                  >
                    <span>YoY Growth</span>
                    {renderSortIcon('yoyGrowthPct')}
                  </button>
                </th>
                <th className="px-3 py-3 font-medium hidden lg:table-cell">Primary Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading && filteredStates.length === 0 ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="h-[42px] bg-[#0F172A]/30">
                    <td colSpan={8} className="px-3">
                      <div className="h-4 w-full animate-pulse rounded bg-slate-800/70" />
                    </td>
                  </tr>
                ))
              ) : filteredStates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No states match "{searchQuery}". Clear search to view all regions.
                  </td>
                </tr>
              ) : (
                filteredStates.map((row) => {
                  const isChecked = comparedStates.includes(row.state);
                  const isActiveState = selectedState === row.state;

                  return (
                    <tr
                      key={row.state}
                      className={`h-[42px] transition-colors ${
                        isActiveState
                          ? 'bg-[#5F259F]/20 hover:bg-[#5F259F]/25'
                          : 'bg-[#0F172A]/30 hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleCompareState(row.state)}
                          aria-label={`Select ${row.state} for comparison`}
                          className={`inline-flex h-4 w-4 items-center justify-center rounded border transition-colors cursor-pointer ${
                            isChecked
                              ? 'border-[#5F259F] bg-[#5F259F] text-white'
                              : 'border-slate-600 bg-transparent hover:border-slate-400'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                      <td className="px-3 font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectState(isActiveState ? 'all' : row.state);
                            if (!isActiveState) setTableTab('districts');
                          }}
                          className="text-left text-slate-100 hover:text-purple-300 transition-colors cursor-pointer"
                        >
                          {row.state}
                        </button>
                      </td>
                      <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                        {formatCompactCount(row.transactionCount)}
                      </td>
                      <td className="px-3 text-right font-mono font-semibold tabular-nums text-white">
                        {formatIndianCrores(row.amountCr)}
                      </td>
                      <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                        {formatExactCurrency(row.avgTicketSize)}
                      </td>
                      <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                        {formatCompactCount(row.registeredUsers)}
                      </td>
                      <td
                        className={`px-3 text-right font-mono font-medium tabular-nums ${
                          row.yoyGrowthPct == null
                            ? 'text-slate-400'
                            : row.yoyGrowthPct >= 0
                              ? 'text-[#10B981]'
                              : 'text-rose-400'
                        }`}
                      >
                        {formatSignedPercent(row.yoyGrowthPct)}
                      </td>
                      <td className="px-3 text-slate-400 hidden lg:table-cell">
                        {row.topCategory}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0F172A]/90 text-slate-400">
                <th className="w-12 px-3 py-3 text-center font-medium">Rank</th>
                <th className="px-3 py-3 font-medium">District ({selectedState})</th>
                <th className="px-3 py-3 text-right font-medium">Transactions</th>
                <th className="px-3 py-3 text-right font-medium">TPV (₹ Cr)</th>
                <th className="px-3 py-3 text-right font-medium">Avg. Ticket</th>
                <th className="px-3 py-3 text-right font-medium">Reg. Users</th>
                <th className="px-3 py-3 text-right font-medium">State Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredDistricts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No matching districts found in {selectedState}.
                  </td>
                </tr>
              ) : (
                filteredDistricts.map((dist, idx) => (
                  <tr
                    key={dist.district}
                    className="h-[42px] bg-[#0F172A]/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-3 text-center font-mono text-slate-500 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 font-medium text-slate-100">{dist.district}</td>
                    <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatCompactCount(dist.transactionCount)}
                    </td>
                    <td className="px-3 text-right font-mono font-semibold tabular-nums text-white">
                      {formatIndianCrores(dist.amountCr)}
                    </td>
                    <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatExactCurrency(dist.avgTicketSize)}
                    </td>
                    <td className="px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatCompactCount(dist.registeredUsers)}
                    </td>
                    <td className="px-3 text-right font-mono font-medium tabular-nums text-[#F59E0B]">
                      {dist.shareOfStatePct.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
