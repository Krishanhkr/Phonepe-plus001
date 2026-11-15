import { useCallback, useEffect, useState } from 'react';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import { FilterRibbon } from './components/FilterRibbon';
import { IngestModal } from './components/IngestModal';
import { KpiGrid } from './components/KpiGrid';
import { RegionalGeoSection } from './components/RegionalGeoSection';
import { StatePerformanceTable } from './components/StatePerformanceTable';
import { TopNav } from './components/TopNav';
import { TrendAndCategoryCharts } from './components/TrendAndCategoryCharts';
import {
  CategoryBreakdown,
  DashboardFilters,
  DistrictPerformanceRow,
  FilterOptionsResponse,
  OverviewMetrics,
  StatePerformanceRow,
  TrendPoint,
} from './types/analytics';

const INITIAL_FILTERS: DashboardFilters = {
  year: 'all',
  quarter: 'all',
  state: 'all',
};

export default function App() {
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse>({
    years: [2020, 2021, 2022, 2023, 2024, 2025],
    quarters: [1, 2, 3, 4],
    states: [],
    categories: [],
  });

  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [statesData, setStatesData] = useState<StatePerformanceRow[]>([]);
  const [districtsData, setDistrictsData] = useState<DistrictPerformanceRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [comparedStates, setComparedStates] = useState<string[]>([
    'Maharashtra',
    'Karnataka',
    'Haryana',
  ]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);

  // Load filter metadata
  useEffect(() => {
    fetch('/api/filters')
      .then((res) => res.json())
      .then((data: FilterOptionsResponse) => setFilterOptions(data))
      .catch(() => {
        // Fallback options already initialized
      });
  }, [refreshKey]);

  // Load main dashboard analytics
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const params = new URLSearchParams({
      year: filters.year,
      quarter: filters.quarter,
      state: filters.state,
    });
    const stateListParams = new URLSearchParams({
      year: filters.year,
      quarter: filters.quarter,
    });

    try {
      const [ovRes, trRes, catRes, stRes] = await Promise.all([
        fetch(`/api/overview?${params.toString()}`),
        fetch(`/api/trends?${params.toString()}`),
        fetch(`/api/categories?${params.toString()}`),
        fetch(`/api/states?${stateListParams.toString()}`),
      ]);

      if (!ovRes.ok || !trRes.ok || !catRes.ok || !stRes.ok) {
        throw new Error('Failed to load analytics from SQLite server.');
      }

      const [ovJson, trJson, catJson, stJson] = await Promise.all([
        ovRes.json(),
        trRes.json(),
        catRes.json(),
        stRes.json(),
      ]);

      setOverview(ovJson);
      setTrends(trJson);
      setCategories(catJson);
      setStatesData(stJson);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to fetch dashboard analytics.'
      );
    } finally {
      setLoading(false);
    }
  }, [filters.year, filters.quarter, filters.state, refreshKey]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Load district drilldown whenever a specific state is selected
  useEffect(() => {
    if (filters.state === 'all') {
      setDistrictsData([]);
      return;
    }

    let cancelled = false;
    setDistrictsLoading(true);
    const params = new URLSearchParams({
      year: filters.year,
      quarter: filters.quarter,
      state: filters.state,
    });

    fetch(`/api/districts?${params.toString()}`)
      .then((res) => res.json())
      .then((data: DistrictPerformanceRow[]) => {
        if (!cancelled) setDistrictsData(data);
      })
      .catch(() => {
        if (!cancelled) setDistrictsData([]);
      })
      .finally(() => {
        if (!cancelled) setDistrictsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filters.year, filters.quarter, filters.state, refreshKey]);

  const handleFilterChange = (next: Partial<DashboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleToggleCompareState = (stateName: string) => {
    setComparedStates((prev) => {
      if (prev.includes(stateName)) {
        return prev.filter((s) => s !== stateName);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), stateName];
      }
      return [...prev, stateName];
    });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <TopNav filters={filters} onOpenIngest={() => setIngestOpen(true)} />

      <FilterRibbon
        filters={filters}
        years={filterOptions.years}
        states={filterOptions.states}
        activePeriodLabel={
          overview?.activePeriodLabel ?? 'All India · 2020–2025 · All Quarters'
        }
        comparedCount={comparedStates.length}
        onChangeFilter={handleFilterChange}
        onResetFilters={handleResetFilters}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {errorMsg && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-xs text-rose-200">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="rounded-md border border-rose-400/50 px-3 py-1 font-medium hover:bg-rose-900/50 cursor-pointer"
            >
              Retry Query
            </button>
          </div>
        )}

        {/* Row 1: Executive KPI Summary Cards */}
        <KpiGrid overview={overview} loading={loading} />

        {/* Row 2: 60% QoQ Trajectory Line + 40% Payment Category Donut */}
        <TrendAndCategoryCharts
          trends={trends}
          categories={categories}
          loading={loading}
          peakQuarterLabel={overview?.peakQuarterLabel ?? 'Q4'}
          peakQuarterSurgePct={overview?.peakQuarterSurgePct ?? 0}
        />

        {/* Row 3: Interactive India Geo-Heatmap + Top 10 Leaderboard / District Drilldown */}
        <RegionalGeoSection
          statesData={statesData}
          districtsData={districtsData}
          selectedState={filters.state}
          onSelectState={(state) => handleFilterChange({ state })}
          loading={loading}
          districtsLoading={districtsLoading}
        />

        {/* Row 4: Searchable & Sortable State/District Performance Ledger */}
        <StatePerformanceTable
          statesData={statesData}
          districtsData={districtsData}
          selectedState={filters.state}
          comparedStates={comparedStates}
          onSelectState={(state) => handleFilterChange({ state })}
          onToggleCompareState={handleToggleCompareState}
          onOpenCompare={() => setCompareOpen(true)}
          loading={loading}
        />
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0F172A] py-5">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span>PhonePe Pulse · Digital Payments &amp; User Growth Analytics</span>
          <span>SQLite Relational Engine · 36 States &amp; UTs · 2020–2025 Quarterly Series</span>
        </div>
      </footer>

      <ComparisonDrawer
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        allStates={filterOptions.states}
        comparedStates={comparedStates}
        onSetComparedStates={setComparedStates}
        filters={filters}
      />

      <IngestModal
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        states={filterOptions.states}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
