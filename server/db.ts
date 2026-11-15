import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'pulse.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

export const PAYMENT_CATEGORIES = [
  'Peer-to-peer payments',
  'Merchant payments',
  'Recharge & bill payments',
  'Financial Services',
  'Others',
] as const;

export interface StateSeedProfile {
  state: string;
  baseTxMillions: number; // 2020 Q1 baseline millions of tx
  avgTicket2020: number; // INR
  userBaseMillions: number; // 2020 Q1 registered users in millions
  growthBias: number; // state-specific growth multiplier
  merchantShare: number; // share of merchant vs P2P
  districts: { name: string; weight: number }[];
}

export const INDIA_STATE_PROFILES: StateSeedProfile[] = [
  {
    state: 'Maharashtra',
    baseTxMillions: 310,
    avgTicket2020: 1920,
    userBaseMillions: 32.5,
    growthBias: 1.06,
    merchantShare: 0.44,
    districts: [
      { name: 'Pune', weight: 0.24 },
      { name: 'Mumbai Suburban', weight: 0.21 },
      { name: 'Thane', weight: 0.13 },
      { name: 'Nagpur', weight: 0.08 },
      { name: 'Nashik', weight: 0.07 },
      { name: 'Mumbai', weight: 0.09 },
      { name: 'Chhatrapati Sambhajinagar', weight: 0.05 },
      { name: 'Kolhapur', weight: 0.04 },
      { name: 'Solapur', weight: 0.03 },
      { name: 'Ahmednagar', weight: 0.03 },
      { name: 'Satara', weight: 0.03 },
    ],
  },
  {
    state: 'Karnataka',
    baseTxMillions: 285,
    avgTicket2020: 1780,
    userBaseMillions: 26.8,
    growthBias: 1.09,
    merchantShare: 0.49,
    districts: [
      { name: 'Bengaluru Urban', weight: 0.48 },
      { name: 'Mysuru', weight: 0.09 },
      { name: 'Belagavi', weight: 0.07 },
      { name: 'Dakshina Kannada', weight: 0.07 },
      { name: 'Dharwad', weight: 0.06 },
      { name: 'Tumakuru', weight: 0.05 },
      { name: 'Kalaburagi', weight: 0.05 },
      { name: 'Ballari', weight: 0.04 },
      { name: 'Shivamogga', weight: 0.05 },
      { name: 'Udupi', weight: 0.04 },
    ],
  },
  {
    state: 'Telangana',
    baseTxMillions: 245,
    avgTicket2020: 1980,
    userBaseMillions: 21.4,
    growthBias: 1.08,
    merchantShare: 0.45,
    districts: [
      { name: 'Hyderabad', weight: 0.37 },
      { name: 'Rangareddy', weight: 0.21 },
      { name: 'Medchal Malkajgiri', weight: 0.16 },
      { name: 'Warangal', weight: 0.06 },
      { name: 'Karimnagar', weight: 0.05 },
      { name: 'Nizamabad', weight: 0.05 },
      { name: 'Khammam', weight: 0.05 },
      { name: 'Nalgonda', weight: 0.05 },
    ],
  },
  {
    state: 'Uttar Pradesh',
    baseTxMillions: 210,
    avgTicket2020: 1890,
    userBaseMillions: 36.2,
    growthBias: 1.13,
    merchantShare: 0.39,
    districts: [
      { name: 'Lucknow', weight: 0.16 },
      { name: 'Gautam Buddha Nagar', weight: 0.15 },
      { name: 'Ghaziabad', weight: 0.12 },
      { name: 'Kanpur Nagar', weight: 0.11 },
      { name: 'Varanasi', weight: 0.10 },
      { name: 'Agra', weight: 0.09 },
      { name: 'Prayagraj', weight: 0.09 },
      { name: 'Meerut', weight: 0.07 },
      { name: 'Gorakhpur', weight: 0.06 },
      { name: 'Bareilly', weight: 0.05 },
    ],
  },
  {
    state: 'Andhra Pradesh',
    baseTxMillions: 178,
    avgTicket2020: 2040,
    userBaseMillions: 19.6,
    growthBias: 1.05,
    merchantShare: 0.41,
    districts: [
      { name: 'Visakhapatnam', weight: 0.23 },
      { name: 'NTR (Vijayawada)', weight: 0.17 },
      { name: 'Guntur', weight: 0.14 },
      { name: 'Tirupati', weight: 0.12 },
      { name: 'East Godavari', weight: 0.11 },
      { name: 'Kurnool', weight: 0.08 },
      { name: 'Ananthapuramu', weight: 0.08 },
      { name: 'Nellore', weight: 0.07 },
    ],
  },
  {
    state: 'Rajasthan',
    baseTxMillions: 162,
    avgTicket2020: 1960,
    userBaseMillions: 22.1,
    growthBias: 1.11,
    merchantShare: 0.40,
    districts: [
      { name: 'Jaipur', weight: 0.29 },
      { name: 'Jodhpur', weight: 0.13 },
      { name: 'Udaipur', weight: 0.10 },
      { name: 'Kota', weight: 0.10 },
      { name: 'Alwar', weight: 0.09 },
      { name: 'Ajmer', weight: 0.09 },
      { name: 'Bikaner', weight: 0.07 },
      { name: 'Bhilwara', weight: 0.07 },
      { name: 'Sikar', weight: 0.06 },
    ],
  },
  {
    state: 'Tamil Nadu',
    baseTxMillions: 150,
    avgTicket2020: 1840,
    userBaseMillions: 21.8,
    growthBias: 1.09,
    merchantShare: 0.46,
    districts: [
      { name: 'Chennai', weight: 0.32 },
      { name: 'Coimbatore', weight: 0.15 },
      { name: 'Chengalpattu', weight: 0.11 },
      { name: 'Madurai', weight: 0.09 },
      { name: 'Tiruchirappalli', weight: 0.08 },
      { name: 'Salem', weight: 0.07 },
      { name: 'Tiruppur', weight: 0.07 },
      { name: 'Erode', weight: 0.06 },
      { name: 'Vellore', weight: 0.05 },
    ],
  },
  {
    state: 'Madhya Pradesh',
    baseTxMillions: 138,
    avgTicket2020: 1850,
    userBaseMillions: 19.4,
    growthBias: 1.10,
    merchantShare: 0.41,
    districts: [
      { name: 'Indore', weight: 0.26 },
      { name: 'Bhopal', weight: 0.20 },
      { name: 'Jabalpur', weight: 0.11 },
      { name: 'Gwalior', weight: 0.10 },
      { name: 'Ujjain', weight: 0.09 },
      { name: 'Sagar', weight: 0.07 },
      { name: 'Rewa', weight: 0.06 },
      { name: 'Satna', weight: 0.06 },
      { name: 'Dewas', weight: 0.05 },
    ],
  },
  {
    state: 'Delhi',
    baseTxMillions: 132,
    avgTicket2020: 1880,
    userBaseMillions: 13.8,
    growthBias: 1.07,
    merchantShare: 0.48,
    districts: [
      { name: 'New Delhi', weight: 0.19 },
      { name: 'South Delhi', weight: 0.16 },
      { name: 'South West Delhi', weight: 0.13 },
      { name: 'West Delhi', weight: 0.12 },
      { name: 'North West Delhi', weight: 0.11 },
      { name: 'Central Delhi', weight: 0.10 },
      { name: 'East Delhi', weight: 0.10 },
      { name: 'South East Delhi', weight: 0.09 },
    ],
  },
  {
    state: 'West Bengal',
    baseTxMillions: 124,
    avgTicket2020: 1940,
    userBaseMillions: 20.5,
    growthBias: 1.08,
    merchantShare: 0.40,
    districts: [
      { name: 'Kolkata', weight: 0.29 },
      { name: 'North 24 Parganas', weight: 0.17 },
      { name: 'South 24 Parganas', weight: 0.11 },
      { name: 'Howrah', weight: 0.11 },
      { name: 'Hooghly', weight: 0.09 },
      { name: 'Paschim Bardhaman', weight: 0.08 },
      { name: 'Siliguri (Darjeeling)', weight: 0.08 },
      { name: 'Purba Medinipur', weight: 0.07 },
    ],
  },
  {
    state: 'Gujarat',
    baseTxMillions: 118,
    avgTicket2020: 2010,
    userBaseMillions: 18.6,
    growthBias: 1.09,
    merchantShare: 0.45,
    districts: [
      { name: 'Ahmedabad', weight: 0.30 },
      { name: 'Surat', weight: 0.24 },
      { name: 'Vadodara', weight: 0.13 },
      { name: 'Rajkot', weight: 0.11 },
      { name: 'Gandhinagar', weight: 0.07 },
      { name: 'Bhavnagar', weight: 0.05 },
      { name: 'Jamnagar', weight: 0.05 },
      { name: 'Vapi (Valsad)', weight: 0.05 },
    ],
  },
  {
    state: 'Bihar',
    baseTxMillions: 105,
    avgTicket2020: 1980,
    userBaseMillions: 19.8,
    growthBias: 1.14,
    merchantShare: 0.36,
    districts: [
      { name: 'Patna', weight: 0.29 },
      { name: 'Muzaffarpur', weight: 0.12 },
      { name: 'Gaya', weight: 0.11 },
      { name: 'Bhagalpur', weight: 0.10 },
      { name: 'Darbhanga', weight: 0.09 },
      { name: 'Purnia', weight: 0.08 },
      { name: 'Begusarai', weight: 0.07 },
      { name: 'Nalanda', weight: 0.07 },
      { name: 'Saran', weight: 0.07 },
    ],
  },
  {
    state: 'Odisha',
    baseTxMillions: 96,
    avgTicket2020: 1790,
    userBaseMillions: 13.4,
    growthBias: 1.11,
    merchantShare: 0.41,
    districts: [
      { name: 'Khordha (Bhubaneswar)', weight: 0.28 },
      { name: 'Cuttack', weight: 0.15 },
      { name: 'Ganjam', weight: 0.11 },
      { name: 'Sundargarh', weight: 0.10 },
      { name: 'Puri', weight: 0.09 },
      { name: 'Sambalpur', weight: 0.09 },
      { name: 'Balasore', weight: 0.09 },
      { name: 'Jajpur', weight: 0.09 },
    ],
  },
  {
    state: 'Haryana',
    baseTxMillions: 92,
    avgTicket2020: 1870,
    userBaseMillions: 11.9,
    growthBias: 1.10,
    merchantShare: 0.46,
    districts: [
      { name: 'Gurugram', weight: 0.31 },
      { name: 'Faridabad', weight: 0.18 },
      { name: 'Panipat', weight: 0.09 },
      { name: 'Hisar', weight: 0.08 },
      { name: 'Karnal', weight: 0.08 },
      { name: 'Sonipat', weight: 0.08 },
      { name: 'Ambala', weight: 0.06 },
      { name: 'Rohtak', weight: 0.06 },
      { name: 'Panchkula', weight: 0.06 },
    ],
  },
  {
    state: 'Kerala',
    baseTxMillions: 76,
    avgTicket2020: 1810,
    userBaseMillions: 11.4,
    growthBias: 1.07,
    merchantShare: 0.47,
    districts: [
      { name: 'Ernakulam', weight: 0.24 },
      { name: 'Thiruvananthapuram', weight: 0.17 },
      { name: 'Kozhikode', weight: 0.13 },
      { name: 'Thrissur', weight: 0.12 },
      { name: 'Malappuram', weight: 0.10 },
      { name: 'Kollam', weight: 0.08 },
      { name: 'Kottayam', weight: 0.08 },
      { name: 'Kannur', weight: 0.08 },
    ],
  },
  {
    state: 'Punjab',
    baseTxMillions: 66,
    avgTicket2020: 1990,
    userBaseMillions: 10.6,
    growthBias: 1.08,
    merchantShare: 0.43,
    districts: [
      { name: 'Ludhiana', weight: 0.23 },
      { name: 'SAS Nagar (Mohali)', weight: 0.17 },
      { name: 'Amritsar', weight: 0.15 },
      { name: 'Jalandhar', weight: 0.14 },
      { name: 'Patiala', weight: 0.11 },
      { name: 'Bathinda', weight: 0.10 },
      { name: 'Hoshiarpur', weight: 0.10 },
    ],
  },
  {
    state: 'Jharkhand',
    baseTxMillions: 61,
    avgTicket2020: 1830,
    userBaseMillions: 9.8,
    growthBias: 1.11,
    merchantShare: 0.39,
    districts: [
      { name: 'Ranchi', weight: 0.28 },
      { name: 'East Singhbhum (Jamshedpur)', weight: 0.23 },
      { name: 'Dhanbad', weight: 0.17 },
      { name: 'Bokaro', weight: 0.12 },
      { name: 'Hazaribagh', weight: 0.10 },
      { name: 'Deoghar', weight: 0.10 },
    ],
  },
  {
    state: 'Chhattisgarh',
    baseTxMillions: 54,
    avgTicket2020: 1790,
    userBaseMillions: 8.6,
    growthBias: 1.10,
    merchantShare: 0.40,
    districts: [
      { name: 'Raipur', weight: 0.31 },
      { name: 'Durg', weight: 0.20 },
      { name: 'Bilaspur', weight: 0.17 },
      { name: 'Korba', weight: 0.11 },
      { name: 'Raigarh', weight: 0.11 },
      { name: 'Rajnandgaon', weight: 0.10 },
    ],
  },
  {
    state: 'Assam',
    baseTxMillions: 48,
    avgTicket2020: 1860,
    userBaseMillions: 8.1,
    growthBias: 1.12,
    merchantShare: 0.38,
    districts: [
      { name: 'Kamrup Metropolitan (Guwahati)', weight: 0.36 },
      { name: 'Dibrugarh', weight: 0.14 },
      { name: 'Cachar', weight: 0.13 },
      { name: 'Jorhat', weight: 0.13 },
      { name: 'Nagaon', weight: 0.12 },
      { name: 'Tinsukia', weight: 0.12 },
    ],
  },
  {
    state: 'Uttarakhand',
    baseTxMillions: 34,
    avgTicket2020: 1820,
    userBaseMillions: 4.8,
    growthBias: 1.10,
    merchantShare: 0.43,
    districts: [
      { name: 'Dehradun', weight: 0.36 },
      { name: 'Haridwar', weight: 0.22 },
      { name: 'Udham Singh Nagar', weight: 0.18 },
      { name: 'Nainital', weight: 0.14 },
      { name: 'Almora', weight: 0.10 },
    ],
  },
  {
    state: 'Jammu & Kashmir',
    baseTxMillions: 26,
    avgTicket2020: 1910,
    userBaseMillions: 4.1,
    growthBias: 1.12,
    merchantShare: 0.39,
    districts: [
      { name: 'Jammu', weight: 0.34 },
      { name: 'Srinagar', weight: 0.31 },
      { name: 'Anantnag', weight: 0.12 },
      { name: 'Baramulla', weight: 0.12 },
      { name: 'Udhampur', weight: 0.11 },
    ],
  },
  {
    state: 'Himachal Pradesh',
    baseTxMillions: 21,
    avgTicket2020: 1850,
    userBaseMillions: 3.2,
    growthBias: 1.09,
    merchantShare: 0.42,
    districts: [
      { name: 'Shimla', weight: 0.26 },
      { name: 'Kangra', weight: 0.24 },
      { name: 'Solan', weight: 0.20 },
      { name: 'Mandi', weight: 0.16 },
      { name: 'Kullu', weight: 0.14 },
    ],
  },
  {
    state: 'Chandigarh',
    baseTxMillions: 18,
    avgTicket2020: 1940,
    userBaseMillions: 1.8,
    growthBias: 1.06,
    merchantShare: 0.49,
    districts: [{ name: 'Chandigarh', weight: 1.0 }],
  },
  {
    state: 'Goa',
    baseTxMillions: 15,
    avgTicket2020: 1960,
    userBaseMillions: 1.5,
    growthBias: 1.08,
    merchantShare: 0.51,
    districts: [
      { name: 'North Goa', weight: 0.56 },
      { name: 'South Goa', weight: 0.44 },
    ],
  },
  {
    state: 'Tripura',
    baseTxMillions: 8.5,
    avgTicket2020: 1800,
    userBaseMillions: 1.2,
    growthBias: 1.09,
    merchantShare: 0.38,
    districts: [
      { name: 'West Tripura', weight: 0.54 },
      { name: 'Gomati', weight: 0.24 },
      { name: 'South Tripura', weight: 0.22 },
    ],
  },
  {
    state: 'Puducherry',
    baseTxMillions: 7.4,
    avgTicket2020: 1820,
    userBaseMillions: 0.9,
    growthBias: 1.07,
    merchantShare: 0.46,
    districts: [
      { name: 'Puducherry', weight: 0.78 },
      { name: 'Karaikal', weight: 0.22 },
    ],
  },
  {
    state: 'Meghalaya',
    baseTxMillions: 6.2,
    avgTicket2020: 1900,
    userBaseMillions: 0.85,
    growthBias: 1.11,
    merchantShare: 0.39,
    districts: [
      { name: 'East Khasi Hills', weight: 0.61 },
      { name: 'West Garo Hills', weight: 0.39 },
    ],
  },
  {
    state: 'Manipur',
    baseTxMillions: 5.8,
    avgTicket2020: 1940,
    userBaseMillions: 0.82,
    growthBias: 1.07,
    merchantShare: 0.37,
    districts: [
      { name: 'Imphal West', weight: 0.58 },
      { name: 'Imphal East', weight: 0.42 },
    ],
  },
  {
    state: 'Nagaland',
    baseTxMillions: 4.9,
    avgTicket2020: 1980,
    userBaseMillions: 0.68,
    growthBias: 1.09,
    merchantShare: 0.38,
    districts: [
      { name: 'Dimapur', weight: 0.63 },
      { name: 'Kohima', weight: 0.37 },
    ],
  },
  {
    state: 'Arunachal Pradesh',
    baseTxMillions: 4.6,
    avgTicket2020: 2020,
    userBaseMillions: 0.62,
    growthBias: 1.11,
    merchantShare: 0.39,
    districts: [
      { name: 'Papum Pare', weight: 0.59 },
      { name: 'Changlang', weight: 0.41 },
    ],
  },
  {
    state: 'Dadra & Nagar Haveli and Daman & Diu',
    baseTxMillions: 4.1,
    avgTicket2020: 1750,
    userBaseMillions: 0.48,
    growthBias: 1.08,
    merchantShare: 0.44,
    districts: [
      { name: 'Dadra & Nagar Haveli', weight: 0.56 },
      { name: 'Daman', weight: 0.44 },
    ],
  },
  {
    state: 'Sikkim',
    baseTxMillions: 3.6,
    avgTicket2020: 1910,
    userBaseMillions: 0.44,
    growthBias: 1.09,
    merchantShare: 0.43,
    districts: [
      { name: 'Gangtok', weight: 0.68 },
      { name: 'Namchi', weight: 0.32 },
    ],
  },
  {
    state: 'Mizoram',
    baseTxMillions: 3.1,
    avgTicket2020: 1950,
    userBaseMillions: 0.41,
    growthBias: 1.08,
    merchantShare: 0.38,
    districts: [
      { name: 'Aizawl', weight: 0.72 },
      { name: 'Lunglei', weight: 0.28 },
    ],
  },
  {
    state: 'Ladakh',
    baseTxMillions: 1.9,
    avgTicket2020: 2050,
    userBaseMillions: 0.24,
    growthBias: 1.10,
    merchantShare: 0.41,
    districts: [
      { name: 'Leh', weight: 0.64 },
      { name: 'Kargil', weight: 0.36 },
    ],
  },
  {
    state: 'Andaman & Nicobar Islands',
    baseTxMillions: 1.8,
    avgTicket2020: 1970,
    userBaseMillions: 0.25,
    growthBias: 1.09,
    merchantShare: 0.44,
    districts: [
      { name: 'South Andaman', weight: 0.78 },
      { name: 'North & Middle Andaman', weight: 0.22 },
    ],
  },
  {
    state: 'Lakshadweep',
    baseTxMillions: 0.32,
    avgTicket2020: 1840,
    userBaseMillions: 0.045,
    growthBias: 1.06,
    merchantShare: 0.42,
    districts: [{ name: 'Lakshadweep', weight: 1.0 }],
  },
];

// Deterministic pseudo-random helper so seed data is stable and realistic
function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_count INTEGER NOT NULL,
      transaction_amount REAL NOT NULL,
      UNIQUE(state, year, quarter, transaction_type)
    );

    CREATE TABLE IF NOT EXISTS district_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      district TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      transaction_count INTEGER NOT NULL,
      transaction_amount REAL NOT NULL,
      UNIQUE(state, district, year, quarter)
    );

    CREATE TABLE IF NOT EXISTS regional_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      state TEXT NOT NULL,
      district TEXT NOT NULL DEFAULT '',
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      registered_users INTEGER NOT NULL,
      app_opens INTEGER NOT NULL,
      UNIQUE(state, district, year, quarter)
    );

    CREATE INDEX IF NOT EXISTS idx_tx_filters ON transactions(year, quarter, state);
    CREATE INDEX IF NOT EXISTS idx_dist_filters ON district_transactions(state, year, quarter);
    CREATE INDEX IF NOT EXISTS idx_users_filters ON regional_users(year, quarter, state);
  `);

  const rowCount = db.prepare('SELECT COUNT(*) as cnt FROM transactions').get() as { cnt: number };
  if (rowCount.cnt > 0) {
    return;
  }

  // Year multipliers reflecting India's UPI explosion from 2020 to 2025
  const yearFactor: Record<number, number> = {
    2020: 1.0,
    2021: 2.15,
    2022: 4.15,
    2023: 6.85,
    2024: 9.75,
    2025: 12.40,
  };

  // Quarter seasonality: Q4 Diwali / festive surge +14% above Q3
  const quarterFactor: Record<number, number> = {
    1: 0.91,
    2: 0.97,
    3: 1.05,
    4: 1.21,
  };

  // Average ticket value gradually compresses as small-ticket QR merchant payments grow
  const atvYearFactor: Record<number, number> = {
    2020: 1.0,
    2021: 0.94,
    2022: 0.88,
    2023: 0.83,
    2024: 0.79,
    2025: 0.76,
  };

  const insertTx = db.prepare(`
    INSERT INTO transactions (state, year, quarter, transaction_type, transaction_count, transaction_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertDistrict = db.prepare(`
    INSERT INTO district_transactions (state, district, year, quarter, transaction_count, transaction_amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertUser = db.prepare(`
    INSERT INTO regional_users (state, district, year, quarter, registered_users, app_opens)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const seedTransaction = db.transaction(() => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const quarters = [1, 2, 3, 4];

    INDIA_STATE_PROFILES.forEach((profile, stateIdx) => {
      years.forEach((year) => {
        quarters.forEach((quarter) => {
          const yearOffset = year - 2020;
          const growthScale = Math.pow(profile.growthBias, yearOffset * 0.45);
          const noise = 0.96 + seededNoise(stateIdx * 100 + year * 10 + quarter) * 0.08;

          const totalTx = Math.round(
            profile.baseTxMillions *
              1_000_000 *
              yearFactor[year] *
              quarterFactor[quarter] *
              growthScale *
              noise
          );

          // Festive Q4 lifts ticket size slightly for retail shopping
          const qTicketBoost = quarter === 4 ? 1.04 : 1.0;
          const avgTicket = profile.avgTicket2020 * atvYearFactor[year] * qTicketBoost;

          // Category split evolves over time: Merchant payments rise steadily from 2020->2025
          const merchantShare = Math.min(0.62, profile.merchantShare + yearOffset * 0.032);
          const rechargeShare = Math.max(0.065, 0.115 - yearOffset * 0.008);
          const finServicesShare = 0.012 + yearOffset * 0.003;
          const othersShare = 0.009;
          const p2pShare = Math.max(0.24, 1 - merchantShare - rechargeShare - finServicesShare - othersShare);

          const categoryShares: { type: string; countShare: number; ticketMultiplier: number }[] = [
            { type: 'Merchant payments', countShare: merchantShare, ticketMultiplier: 0.56 },
            { type: 'Peer-to-peer payments', countShare: p2pShare, ticketMultiplier: 1.62 },
            { type: 'Recharge & bill payments', countShare: rechargeShare, ticketMultiplier: 0.44 },
            { type: 'Financial Services', countShare: finServicesShare, ticketMultiplier: 2.35 },
            { type: 'Others', countShare: othersShare, ticketMultiplier: 0.92 },
          ];

          let stateTotalAmount = 0;

          categoryShares.forEach((cat, catIdx) => {
            const catNoise = 0.97 + seededNoise(stateIdx * 50 + year + quarter + catIdx) * 0.06;
            const catCount = Math.max(1000, Math.round(totalTx * cat.countShare * catNoise));
            const catAmount = Math.round(catCount * avgTicket * cat.ticketMultiplier);
            stateTotalAmount += catAmount;

            insertTx.run(profile.state, year, quarter, cat.type, catCount, catAmount);
          });

          // Cumulative registered users grow steadily each quarter
          const quarterIndex = yearOffset * 4 + (quarter - 1);
          const userGrowthFactor = 1 + quarterIndex * 0.088 * profile.growthBias;
          const stateUsers = Math.round(profile.userBaseMillions * 1_000_000 * userGrowthFactor);
          const stateAppOpens = Math.round(stateUsers * (16 + quarterIndex * 1.15) * (quarter === 4 ? 1.12 : 1.0));

          insertUser.run(profile.state, '', year, quarter, stateUsers, stateAppOpens);

          // District breakdown
          profile.districts.forEach((dist, dIdx) => {
            const distNoise = 0.95 + seededNoise(stateIdx * 200 + dIdx * 17 + year + quarter) * 0.10;
            const distTx = Math.max(500, Math.round(totalTx * dist.weight * distNoise));
            const distAmount = Math.round(stateTotalAmount * dist.weight * distNoise);
            const distUsers = Math.max(500, Math.round(stateUsers * dist.weight * (0.97 + distNoise * 0.05)));
            const distOpens = Math.round(distUsers * (16 + quarterIndex * 1.15));

            insertDistrict.run(profile.state, dist.name, year, quarter, distTx, distAmount);
            insertUser.run(profile.state, dist.name, year, quarter, distUsers, distOpens);
          });
        });
      });
    });
  });

  seedTransaction();
}
