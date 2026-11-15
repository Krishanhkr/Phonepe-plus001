import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db, initializeDatabase, PAYMENT_CATEGORIES } from './server/db.ts';

initializeDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

interface ParsedFilter {
  year: number | null;
  quarter: number | null;
  state: string | null;
}

function parseFilterParams(query: Request['query']): ParsedFilter {
  const yearRaw = typeof query.year === 'string' ? query.year.trim() : 'all';
  const quarterRaw = typeof query.quarter === 'string' ? query.quarter.trim() : 'all';
  const stateRaw = typeof query.state === 'string' ? query.state.trim() : 'all';

  const year = yearRaw !== 'all' && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
  const quarter = quarterRaw !== 'all' && /^[1-4]$/.test(quarterRaw) ? Number(quarterRaw) : null;
  const state = stateRaw && stateRaw.toLowerCase() !== 'all' ? stateRaw : null;

  return { year, quarter, state };
}

function buildWhereClause(
  filter: { year?: number | null; quarter?: number | null; state?: string | null },
  alias = ''
): { sql: string; params: (string | number)[] } {
  const prefix = alias ? `${alias}.` : '';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filter.year != null) {
    conditions.push(`${prefix}year = ?`);
    params.push(filter.year);
  }
  if (filter.quarter != null) {
    conditions.push(`${prefix}quarter = ?`);
    params.push(filter.quarter);
  }
  if (filter.state != null) {
    conditions.push(`${prefix}state = ?`);
    params.push(filter.state);
  }

  return {
    sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

function getLatestRegisteredUsers(year: number | null, quarter: number | null, state: string | null): {
  registeredUsers: number;
  appOpens: number;
} {
  // Determine the snapshot period for cumulative registered_users
  let snapshotYear = year;
  let snapshotQuarter = quarter;

  if (snapshotYear == null) {
    const row = db.prepare('SELECT MAX(year) as maxYear FROM regional_users').get() as { maxYear: number | null };
    snapshotYear = row?.maxYear ?? 2025;
  }
  if (snapshotQuarter == null) {
    const row = db
      .prepare('SELECT MAX(quarter) as maxQuarter FROM regional_users WHERE year = ?')
      .get(snapshotYear) as { maxQuarter: number | null };
    snapshotQuarter = row?.maxQuarter ?? 4;
  }

  const userConds = ["district = ''", 'year = ?', 'quarter = ?'];
  const userParams: (string | number)[] = [snapshotYear, snapshotQuarter];
  if (state) {
    userConds.push('state = ?');
    userParams.push(state);
  }

  const usersRow = db
    .prepare(`SELECT COALESCE(SUM(registered_users), 0) as totalUsers FROM regional_users WHERE ${userConds.join(' AND ')}`)
    .get(...userParams) as { totalUsers: number };

  const opensConds = ["district = ''"];
  const opensParams: (string | number)[] = [];
  if (year != null) {
    opensConds.push('year = ?');
    opensParams.push(year);
  }
  if (quarter != null) {
    opensConds.push('quarter = ?');
    opensParams.push(quarter);
  }
  if (state) {
    opensConds.push('state = ?');
    opensParams.push(state);
  }

  const opensRow = db
    .prepare(`SELECT COALESCE(SUM(app_opens), 0) as totalOpens FROM regional_users WHERE ${opensConds.join(' AND ')}`)
    .get(...opensParams) as { totalOpens: number };

  return {
    registeredUsers: usersRow.totalUsers,
    appOpens: opensRow.totalOpens,
  };
}

// 1. Available filter values
app.get('/api/filters', (_req: Request, res: Response) => {
  const years = (
    db.prepare('SELECT DISTINCT year FROM transactions ORDER BY year ASC').all() as { year: number }[]
  ).map((r) => r.year);

  const states = (
    db.prepare('SELECT DISTINCT state FROM transactions ORDER BY state ASC').all() as { state: string }[]
  ).map((r) => r.state);

  res.json({
    years,
    quarters: [1, 2, 3, 4],
    states,
    categories: [...PAYMENT_CATEGORIES],
  });
});

// 2. Executive Overview KPIs
app.get('/api/overview', (req: Request, res: Response) => {
  const { year, quarter, state } = parseFilterParams(req.query);
  const where = buildWhereClause({ year, quarter, state });

  const current = db
    .prepare(
      `SELECT
        COALESCE(SUM(transaction_count), 0) as totalTransactions,
        COALESCE(SUM(transaction_amount), 0) as totalAmountInr
      FROM transactions ${where.sql}`
    )
    .get(...where.params) as { totalTransactions: number; totalAmountInr: number };

  const totalAmountCr = current.totalAmountInr / 1e7;
  const avgTransactionValue =
    current.totalTransactions > 0 ? current.totalAmountInr / current.totalTransactions : 0;

  // Compute YoY Growth %
  let targetYear = year;
  if (targetYear == null) {
    const maxRow = db.prepare('SELECT MAX(year) as maxYear FROM transactions').get() as {
      maxYear: number | null;
    };
    targetYear = maxRow?.maxYear ?? 2025;
  }
  const prevYear = targetYear - 1;

  const targetWhere = buildWhereClause({ year: targetYear, quarter, state });
  const prevWhere = buildWhereClause({ year: prevYear, quarter, state });

  const targetSummary = db
    .prepare(
      `SELECT COALESCE(SUM(transaction_count), 0) as txCount, COALESCE(SUM(transaction_amount), 0) as txAmount
       FROM transactions ${targetWhere.sql}`
    )
    .get(...targetWhere.params) as { txCount: number; txAmount: number };

  const prevSummary = db
    .prepare(
      `SELECT COALESCE(SUM(transaction_count), 0) as txCount, COALESCE(SUM(transaction_amount), 0) as txAmount
       FROM transactions ${prevWhere.sql}`
    )
    .get(...prevWhere.params) as { txCount: number; txAmount: number };

  let yoyGrowthPct: number | null = null;
  let yoyAmountGrowthPct: number | null = null;
  let comparisonNote = `Baseline year (${targetYear})`;

  if (prevSummary.txCount > 0) {
    yoyGrowthPct = ((targetSummary.txCount - prevSummary.txCount) / prevSummary.txCount) * 100;
    yoyAmountGrowthPct =
      prevSummary.txAmount > 0
        ? ((targetSummary.txAmount - prevSummary.txAmount) / prevSummary.txAmount) * 100
        : null;
    const qSuffix = quarter ? ` Q${quarter}` : '';
    comparisonNote = `${targetYear}${qSuffix} vs ${prevYear}${qSuffix}`;
  }

  // Peak festive quarter insight inside current scope
  const quarterWhere = buildWhereClause({ year, state });
  const quarterlyRows = db
    .prepare(
      `SELECT year, quarter, SUM(transaction_count) as txCount
       FROM transactions ${quarterWhere.sql}
       GROUP BY year, quarter
       ORDER BY year ASC, quarter ASC`
    )
    .all(...quarterWhere.params) as { year: number; quarter: number; txCount: number }[];

  let peakQuarterLabel = 'Q4';
  let peakQuarterSurgePct = 0;

  for (let i = 1; i < quarterlyRows.length; i++) {
    const prev = quarterlyRows[i - 1];
    const curr = quarterlyRows[i];
    if (prev.txCount > 0) {
      const surge = ((curr.txCount - prev.txCount) / prev.txCount) * 100;
      if (surge > peakQuarterSurgePct) {
        peakQuarterSurgePct = surge;
        peakQuarterLabel = `${curr.year} Q${curr.quarter}`;
      }
    }
  }

  const { registeredUsers, appOpens } = getLatestRegisteredUsers(year, quarter, state);

  const periodParts: string[] = [];
  periodParts.push(state ?? 'All India');
  periodParts.push(year ? `${year}` : '2020–2025');
  periodParts.push(quarter ? `Q${quarter}` : 'All Quarters');

  res.json({
    totalTransactions: current.totalTransactions,
    totalAmountInr: current.totalAmountInr,
    totalAmountCr,
    avgTransactionValue,
    yoyGrowthPct,
    yoyAmountGrowthPct,
    registeredUsers,
    appOpens,
    comparisonNote,
    activePeriodLabel: periodParts.join(' · '),
    peakQuarterLabel,
    peakQuarterSurgePct,
  });
});

// 3. QoQ Growth Trajectory Trends
app.get('/api/trends', (req: Request, res: Response) => {
  const { year, quarter, state } = parseFilterParams(req.query);
  // Keep all quarters when user selects a specific year so QoQ curve stays meaningful;
  // if user explicitly filters quarter, show that quarter across years unless year is also set.
  const where = buildWhereClause({
    year: year ?? null,
    quarter: year != null ? null : quarter,
    state,
  });

  const rows = db
    .prepare(
      `SELECT year, quarter,
        SUM(transaction_count) as transactionCount,
        SUM(transaction_amount) / 1e7 as amountCr
       FROM transactions ${where.sql}
       GROUP BY year, quarter
       ORDER BY year ASC, quarter ASC`
    )
    .all(...where.params) as {
    year: number;
    quarter: number;
    transactionCount: number;
    amountCr: number;
  }[];

  const trends = rows.map((row, index) => {
    const prev = index > 0 ? rows[index - 1] : null;
    const qoqGrowthPct =
      prev && prev.transactionCount > 0
        ? ((row.transactionCount - prev.transactionCount) / prev.transactionCount) * 100
        : null;

    return {
      label: `${row.year} Q${row.quarter}`,
      year: row.year,
      quarter: row.quarter,
      transactionCount: row.transactionCount,
      amountCr: row.amountCr,
      qoqGrowthPct,
      isFestivePeak: row.quarter === 4,
    };
  });

  res.json(trends);
});

// 4. Category Split Breakdown
app.get('/api/categories', (req: Request, res: Response) => {
  const { year, quarter, state } = parseFilterParams(req.query);
  const where = buildWhereClause({ year, quarter, state });

  const rows = db
    .prepare(
      `SELECT transaction_type as transactionType,
        SUM(transaction_count) as transactionCount,
        SUM(transaction_amount) as totalAmountInr
       FROM transactions ${where.sql}
       GROUP BY transaction_type
       ORDER BY transactionCount DESC`
    )
    .all(...where.params) as {
    transactionType: string;
    transactionCount: number;
    totalAmountInr: number;
  }[];

  const grandTotalTx = rows.reduce((acc, r) => acc + r.transactionCount, 0);

  const categories = rows.map((r) => ({
    transactionType: r.transactionType,
    transactionCount: r.transactionCount,
    amountCr: r.totalAmountInr / 1e7,
    sharePct: grandTotalTx > 0 ? (r.transactionCount / grandTotalTx) * 100 : 0,
    avgTicketSize: r.transactionCount > 0 ? r.totalAmountInr / r.transactionCount : 0,
  }));

  res.json(categories);
});

// 5. State-wise Performance & Leaderboard
app.get('/api/states', (req: Request, res: Response) => {
  const { year, quarter } = parseFilterParams(req.query);
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'amountCr';
  const sortDir = req.query.sortDir === 'asc' ? 'asc' : 'desc';

  const where = buildWhereClause({ year, quarter }, 't');

  const txRows = db
    .prepare(
      `SELECT t.state,
        SUM(t.transaction_count) as transactionCount,
        SUM(t.transaction_amount) as totalAmountInr
       FROM transactions t ${where.sql}
       GROUP BY t.state`
    )
    .all(...where.params) as {
    state: string;
    transactionCount: number;
    totalAmountInr: number;
  }[];

  // Snapshot registered users for each state
  let snapYear = year;
  let snapQuarter = quarter;
  if (snapYear == null) {
    const maxR = db.prepare('SELECT MAX(year) as y FROM regional_users').get() as { y: number | null };
    snapYear = maxR?.y ?? 2025;
  }
  if (snapQuarter == null) {
    const maxQ = db
      .prepare('SELECT MAX(quarter) as q FROM regional_users WHERE year = ?')
      .get(snapYear) as { q: number | null };
    snapQuarter = maxQ?.q ?? 4;
  }

  const userRows = db
    .prepare(
      `SELECT state, registered_users as registeredUsers
       FROM regional_users
       WHERE district = '' AND year = ? AND quarter = ?`
    )
    .all(snapYear, snapQuarter) as { state: string; registeredUsers: number }[];
  const userMap = new Map(userRows.map((u) => [u.state, u.registeredUsers]));

  const opensWhere = buildWhereClause({ year, quarter });
  const opensExtra = opensWhere.sql ? `${opensWhere.sql} AND district = ''` : "WHERE district = ''";
  const opensRows = db
    .prepare(`SELECT state, SUM(app_opens) as appOpens FROM regional_users ${opensExtra} GROUP BY state`)
    .all(...opensWhere.params) as { state: string; appOpens: number }[];
  const opensMap = new Map(opensRows.map((o) => [o.state, o.appOpens]));

  // Top category per state
  const catRows = db
    .prepare(
      `SELECT state, transaction_type as transactionType, SUM(transaction_count) as cnt
       FROM transactions t ${where.sql}
       GROUP BY state, transaction_type
       ORDER BY cnt DESC`
    )
    .all(...where.params) as { state: string; transactionType: string; cnt: number }[];
  const topCatMap = new Map<string, string>();
  for (const row of catRows) {
    if (!topCatMap.has(row.state)) {
      topCatMap.set(row.state, row.transactionType);
    }
  }

  // YoY growth per state
  const targetYear = year ?? 2025;
  const prevYear = targetYear - 1;
  const targetWhere = buildWhereClause({ year: targetYear, quarter });
  const prevWhere = buildWhereClause({ year: prevYear, quarter });

  const curYoY = db
    .prepare(
      `SELECT state, SUM(transaction_count) as cnt FROM transactions ${targetWhere.sql} GROUP BY state`
    )
    .all(...targetWhere.params) as { state: string; cnt: number }[];
  const prevYoY = db
    .prepare(
      `SELECT state, SUM(transaction_count) as cnt FROM transactions ${prevWhere.sql} GROUP BY state`
    )
    .all(...prevWhere.params) as { state: string; cnt: number }[];

  const prevMap = new Map(prevYoY.map((p) => [p.state, p.cnt]));
  const yoyMap = new Map<string, number | null>();
  for (const c of curYoY) {
    const p = prevMap.get(c.state);
    yoyMap.set(c.state, p && p > 0 ? ((c.cnt - p) / p) * 100 : null);
  }

  let result = txRows.map((row) => ({
    state: row.state,
    transactionCount: row.transactionCount,
    amountCr: row.totalAmountInr / 1e7,
    avgTicketSize: row.transactionCount > 0 ? row.totalAmountInr / row.transactionCount : 0,
    registeredUsers: userMap.get(row.state) ?? 0,
    appOpens: opensMap.get(row.state) ?? 0,
    yoyGrowthPct: yoyMap.get(row.state) ?? null,
    topCategory: topCatMap.get(row.state) ?? 'Merchant payments',
  }));

  if (search) {
    result = result.filter(
      (r) =>
        r.state.toLowerCase().includes(search) || r.topCategory.toLowerCase().includes(search)
    );
  }

  result.sort((a, b) => {
    let valA: number | string = a.amountCr;
    let valB: number | string = b.amountCr;

    switch (sortBy) {
      case 'state':
        valA = a.state;
        valB = b.state;
        break;
      case 'transactionCount':
        valA = a.transactionCount;
        valB = b.transactionCount;
        break;
      case 'registeredUsers':
        valA = a.registeredUsers;
        valB = b.registeredUsers;
        break;
      case 'avgTicketSize':
        valA = a.avgTicketSize;
        valB = b.avgTicketSize;
        break;
      case 'yoyGrowthPct':
        valA = a.yoyGrowthPct ?? -9999;
        valB = b.yoyGrowthPct ?? -9999;
        break;
      default:
        valA = a.amountCr;
        valB = b.amountCr;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortDir === 'asc'
      ? Number(valA) - Number(valB)
      : Number(valB) - Number(valA);
  });

  res.json(result);
});

// 6. District-level Drilldown for a Selected State
app.get('/api/districts', (req: Request, res: Response) => {
  const { year, quarter, state } = parseFilterParams(req.query);
  if (!state) {
    res.json([]);
    return;
  }

  const where = buildWhereClause({ year, quarter, state });
  const rows = db
    .prepare(
      `SELECT district, state,
        SUM(transaction_count) as transactionCount,
        SUM(transaction_amount) as totalAmountInr
       FROM district_transactions ${where.sql}
       GROUP BY district, state
       ORDER BY totalAmountInr DESC`
    )
    .all(...where.params) as {
    district: string;
    state: string;
    transactionCount: number;
    totalAmountInr: number;
  }[];

  let snapYear = year;
  let snapQuarter = quarter;
  if (snapYear == null) {
    const maxR = db.prepare('SELECT MAX(year) as y FROM regional_users').get() as { y: number | null };
    snapYear = maxR?.y ?? 2025;
  }
  if (snapQuarter == null) {
    const maxQ = db
      .prepare('SELECT MAX(quarter) as q FROM regional_users WHERE year = ?')
      .get(snapYear) as { q: number | null };
    snapQuarter = maxQ?.q ?? 4;
  }

  const distUsers = db
    .prepare(
      `SELECT district, registered_users as registeredUsers
       FROM regional_users
       WHERE state = ? AND district != '' AND year = ? AND quarter = ?`
    )
    .all(state, snapYear, snapQuarter) as { district: string; registeredUsers: number }[];
  const distUserMap = new Map(distUsers.map((u) => [u.district, u.registeredUsers]));

  const stateTotalAmount = rows.reduce((sum, r) => sum + r.totalAmountInr, 0);

  const districts = rows.map((r) => ({
    district: r.district,
    state: r.state,
    transactionCount: r.transactionCount,
    amountCr: r.totalAmountInr / 1e7,
    avgTicketSize: r.transactionCount > 0 ? r.totalAmountInr / r.transactionCount : 0,
    registeredUsers: distUserMap.get(r.district) ?? 0,
    shareOfStatePct: stateTotalAmount > 0 ? (r.totalAmountInr / stateTotalAmount) * 100 : 0,
  }));

  res.json(districts);
});

// 7. Interactive Multi-State Comparison Endpoint
app.get('/api/compare', (req: Request, res: Response) => {
  const { year, quarter } = parseFilterParams(req.query);
  const statesParam = typeof req.query.states === 'string' ? req.query.states : '';
  const stateList = statesParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (stateList.length === 0) {
    res.json([]);
    return;
  }

  const items = stateList.map((st) => {
    const where = buildWhereClause({ year, quarter, state: st });
    const summary = db
      .prepare(
        `SELECT COALESCE(SUM(transaction_count), 0) as totalTransactions,
                COALESCE(SUM(transaction_amount), 0) as totalAmountInr
         FROM transactions ${where.sql}`
      )
      .get(...where.params) as { totalTransactions: number; totalAmountInr: number };

    const catRows = db
      .prepare(
        `SELECT transaction_type as transactionType,
                SUM(transaction_count) as transactionCount,
                SUM(transaction_amount) as totalAmountInr
         FROM transactions ${where.sql}
         GROUP BY transaction_type
         ORDER BY transactionCount DESC`
      )
      .all(...where.params) as {
      transactionType: string;
      transactionCount: number;
      totalAmountInr: number;
    }[];

    const categories = catRows.map((c) => ({
      transactionType: c.transactionType,
      transactionCount: c.transactionCount,
      amountCr: c.totalAmountInr / 1e7,
      sharePct:
        summary.totalTransactions > 0 ? (c.transactionCount / summary.totalTransactions) * 100 : 0,
      avgTicketSize: c.transactionCount > 0 ? c.totalAmountInr / c.transactionCount : 0,
    }));

    const trendWhere = buildWhereClause({ year, state: st });
    const trend = db
      .prepare(
        `SELECT (year || ' Q' || quarter) as label,
                SUM(transaction_amount) / 1e7 as amountCr,
                SUM(transaction_count) as transactionCount
         FROM transactions ${trendWhere.sql}
         GROUP BY year, quarter
         ORDER BY year ASC, quarter ASC`
      )
      .all(...trendWhere.params) as { label: string; amountCr: number; transactionCount: number }[];

    const targetYear = year ?? 2025;
    const curW = buildWhereClause({ year: targetYear, quarter, state: st });
    const prevW = buildWhereClause({ year: targetYear - 1, quarter, state: st });
    const curRow = db
      .prepare(`SELECT COALESCE(SUM(transaction_count), 0) as cnt FROM transactions ${curW.sql}`)
      .get(...curW.params) as { cnt: number };
    const prevRow = db
      .prepare(`SELECT COALESCE(SUM(transaction_count), 0) as cnt FROM transactions ${prevW.sql}`)
      .get(...prevW.params) as { cnt: number };

    const yoyGrowthPct =
      prevRow.cnt > 0 ? ((curRow.cnt - prevRow.cnt) / prevRow.cnt) * 100 : null;

    const { registeredUsers } = getLatestRegisteredUsers(year, quarter, st);

    return {
      state: st,
      totalTransactions: summary.totalTransactions,
      amountCr: summary.totalAmountInr / 1e7,
      avgTicketSize:
        summary.totalTransactions > 0 ? summary.totalAmountInr / summary.totalTransactions : 0,
      registeredUsers,
      yoyGrowthPct,
      categories,
      trend,
    };
  });

  res.json(items);
});

// 8. Filtered CSV / JSON Report Export
app.get('/api/export', (req: Request, res: Response) => {
  const { year, quarter, state } = parseFilterParams(req.query);
  const format = req.query.format === 'json' ? 'json' : 'csv';

  const where = buildWhereClause({ year, quarter, state });
  const rows = db
    .prepare(
      `SELECT state, year, quarter, transaction_type, transaction_count, transaction_amount,
              ROUND(transaction_amount / 10000000.0, 2) as amount_cr
       FROM transactions ${where.sql}
       ORDER BY year DESC, quarter DESC, transaction_amount DESC`
    )
    .all(...where.params) as {
    state: string;
    year: number;
    quarter: number;
    transaction_type: string;
    transaction_count: number;
    transaction_amount: number;
    amount_cr: number;
  }[];

  const fileSlug = [
    'phonepe-pulse',
    state ? state.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'all-india',
    year ?? '2020-2025',
    quarter ? `q${quarter}` : 'all-quarters',
  ].join('_');

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileSlug}.json"`);
    res.send(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          filters: { year: year ?? 'all', quarter: quarter ?? 'all', state: state ?? 'all' },
          recordCount: rows.length,
          records: rows,
        },
        null,
        2
      )
    );
    return;
  }

  const header = 'State,Year,Quarter,Category,Transaction Count,TPV (INR),TPV (INR Cr)';
  const csvLines = rows.map((r) => {
    const safeState = `"${r.state.replace(/"/g, '""')}"`;
    const safeCat = `"${r.transaction_type.replace(/"/g, '""')}"`;
    return [
      safeState,
      r.year,
      `Q${r.quarter}`,
      safeCat,
      r.transaction_count,
      r.transaction_amount.toFixed(2),
      r.amount_cr.toFixed(2),
    ].join(',');
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileSlug}.csv"`);
  res.send([header, ...csvLines].join('\n'));
});

// 9. Raw JSON / CSV File Upload Ingestion
function parseCsvLines(csvText: string): string[][] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

app.post('/api/ingest', (req: Request, res: Response) => {
  try {
    const { format, content, meta } = req.body as {
      format?: 'csv' | 'json' | 'pulse-json';
      content?: string;
      meta?: { state?: string; year?: number; quarter?: number };
    };

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'File content is required for ingestion.' });
      return;
    }

    const upsertTx = db.prepare(`
      INSERT INTO transactions (state, year, quarter, transaction_type, transaction_count, transaction_amount)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(state, year, quarter, transaction_type) DO UPDATE SET
        transaction_count = excluded.transaction_count,
        transaction_amount = excluded.transaction_amount
    `);

    const upsertDistrict = db.prepare(`
      INSERT INTO district_transactions (state, district, year, quarter, transaction_count, transaction_amount)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(state, district, year, quarter) DO UPDATE SET
        transaction_count = excluded.transaction_count,
        transaction_amount = excluded.transaction_amount
    `);

    if (format === 'csv') {
      const matrix = parseCsvLines(content);
      if (matrix.length < 2) {
        res.status(400).json({ error: 'CSV must contain a header row and at least one data row.' });
        return;
      }

      const headers = matrix[0].map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
      const isDistrictCsv = headers.includes('district');

      const idxState = headers.indexOf('state');
      const idxYear = headers.indexOf('year');
      const idxQuarter = headers.indexOf('quarter');
      const idxCount = headers.findIndex((h) => h === 'transaction_count' || h === 'transactioncount' || h === 'count');
      const idxAmount = headers.findIndex((h) => h === 'transaction_amount' || h === 'transactionamount' || h === 'amount');
      const idxType = headers.findIndex((h) => h === 'transaction_type' || h === 'transactiontype' || h === 'category');
      const idxDistrict = headers.indexOf('district');

      if (idxState === -1 || idxYear === -1 || idxQuarter === -1 || idxCount === -1 || idxAmount === -1) {
        res.status(400).json({
          error:
            'CSV headers must include state, year, quarter, transaction_count, transaction_amount (and transaction_type or district).',
        });
        return;
      }

      let processed = 0;
      const runCsv = db.transaction(() => {
        for (let i = 1; i < matrix.length; i++) {
          const row = matrix[i];
          const stateVal = row[idxState];
          const yearVal = Number(row[idxYear]);
          const qRaw = String(row[idxQuarter]).replace(/^q/i, '');
          const quarterVal = Number(qRaw);
          const countVal = Number(row[idxCount]);
          const amountVal = Number(row[idxAmount]);

          if (
            !stateVal ||
            !Number.isFinite(yearVal) ||
            ![1, 2, 3, 4].includes(quarterVal) ||
            !Number.isFinite(countVal) ||
            !Number.isFinite(amountVal)
          ) {
            continue;
          }

          if (isDistrictCsv && idxDistrict !== -1 && row[idxDistrict]) {
            upsertDistrict.run(stateVal, row[idxDistrict], yearVal, quarterVal, Math.round(countVal), amountVal);
            processed++;
          } else if (idxType !== -1 && row[idxType]) {
            upsertTx.run(stateVal, yearVal, quarterVal, row[idxType], Math.round(countVal), amountVal);
            processed++;
          }
        }
      });

      runCsv();
      if (processed === 0) {
        res.status(400).json({ error: 'No valid rows could be parsed from the uploaded CSV.' });
        return;
      }

      res.json({
        success: true,
        recordsProcessed: processed,
        targetTable: isDistrictCsv ? 'district_transactions' : 'transactions',
        message: `Upserted ${processed} CSV records into ${isDistrictCsv ? 'district_transactions' : 'transactions'}.`,
      });
      return;
    }

    // JSON or PhonePe Pulse JSON
    const parsed = JSON.parse(content);
    let processed = 0;
    let targetTable: 'transactions' | 'district_transactions' = 'transactions';

    // Case A: Official PhonePe Pulse aggregated transaction JSON (data.transactionData)
    if (parsed?.data?.transactionData && Array.isArray(parsed.data.transactionData)) {
      const stateVal = meta?.state?.trim();
      const yearVal = Number(meta?.year);
      const quarterVal = Number(meta?.quarter);

      if (!stateVal || !Number.isFinite(yearVal) || ![1, 2, 3, 4].includes(quarterVal)) {
        res.status(400).json({
          error: 'PhonePe Pulse JSON requires State, Year, and Quarter metadata.',
        });
        return;
      }

      const runPulseTx = db.transaction(() => {
        for (const item of parsed.data.transactionData) {
          const catName = String(item.name || '').trim();
          const instrument = Array.isArray(item.paymentInstruments) ? item.paymentInstruments[0] : null;
          if (!catName || !instrument) continue;
          const cnt = Number(instrument.count);
          const amt = Number(instrument.amount);
          if (Number.isFinite(cnt) && Number.isFinite(amt)) {
            upsertTx.run(stateVal, yearVal, quarterVal, catName, Math.round(cnt), amt);
            processed++;
          }
        }
      });
      runPulseTx();
    }
    // Case B: Official PhonePe Pulse district map JSON (data.hoverDataList)
    else if (parsed?.data?.hoverDataList && Array.isArray(parsed.data.hoverDataList)) {
      const stateVal = meta?.state?.trim();
      const yearVal = Number(meta?.year);
      const quarterVal = Number(meta?.quarter);
      targetTable = 'district_transactions';

      if (!stateVal || !Number.isFinite(yearVal) || ![1, 2, 3, 4].includes(quarterVal)) {
        res.status(400).json({
          error: 'PhonePe Pulse District JSON requires State, Year, and Quarter metadata.',
        });
        return;
      }

      const runPulseDist = db.transaction(() => {
        for (const item of parsed.data.hoverDataList) {
          const distName = String(item.name || '').trim();
          const metric = Array.isArray(item.metric) ? item.metric[0] : null;
          if (!distName || !metric) continue;
          const cnt = Number(metric.count);
          const amt = Number(metric.amount);
          if (Number.isFinite(cnt) && Number.isFinite(amt)) {
            upsertDistrict.run(stateVal, distName, yearVal, quarterVal, Math.round(cnt), amt);
            processed++;
          }
        }
      });
      runPulseDist();
    }
    // Case C: Array of relational records
    else if (Array.isArray(parsed)) {
      const first = parsed[0] ?? {};
      const isDist = Boolean(first.district);
      targetTable = isDist ? 'district_transactions' : 'transactions';

      const runArray = db.transaction(() => {
        for (const rec of parsed) {
          const stateVal = String(rec.state || meta?.state || '').trim();
          const yearVal = Number(rec.year ?? meta?.year);
          const quarterVal = Number(rec.quarter ?? meta?.quarter);
          const cnt = Number(rec.transaction_count ?? rec.transactionCount ?? rec.count);
          const amt = Number(rec.transaction_amount ?? rec.transactionAmount ?? rec.amount);

          if (!stateVal || !Number.isFinite(yearVal) || ![1, 2, 3, 4].includes(quarterVal) || !Number.isFinite(cnt) || !Number.isFinite(amt)) {
            continue;
          }

          if (isDist && rec.district) {
            upsertDistrict.run(stateVal, String(rec.district).trim(), yearVal, quarterVal, Math.round(cnt), amt);
            processed++;
          } else {
            const cat = String(rec.transaction_type ?? rec.transactionType ?? rec.category ?? '').trim();
            if (cat) {
              upsertTx.run(stateVal, yearVal, quarterVal, cat, Math.round(cnt), amt);
              processed++;
            }
          }
        }
      });
      runArray();
    } else {
      res.status(400).json({
        error:
          'Unrecognized JSON structure. Expected PhonePe Pulse data.transactionData, data.hoverDataList, or a record array.',
      });
      return;
    }

    if (processed === 0) {
      res.status(400).json({ error: 'No valid records found in the JSON payload.' });
      return;
    }

    res.json({
      success: true,
      recordsProcessed: processed,
      targetTable,
      message: `Ingested ${processed} records into ${targetTable}.`,
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to parse uploaded file.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PhonePe Pulse BI Server listening on http://localhost:${PORT}`);
  });
}

startServer();
