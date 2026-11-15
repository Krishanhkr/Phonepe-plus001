import { CheckCircle2, FileCode2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';
import { IngestResponse } from '../types/analytics';

interface IngestModalProps {
  open: boolean;
  onClose: () => void;
  states: string[];
  onSuccess: () => void;
}

const SAMPLE_CSV = `state,year,quarter,transaction_type,transaction_count,transaction_amount
Maharashtra,2025,4,Merchant payments,2150000000,1985000000000
Maharashtra,2025,4,Peer-to-peer payments,1420000000,3680000000000
Karnataka,2025,4,Merchant payments,2090000000,1810000000000`;

const SAMPLE_PULSE_JSON = JSON.stringify(
  {
    success: true,
    code: 'SUCCESS',
    data: {
      transactionData: [
        {
          name: 'Merchant payments',
          paymentInstruments: [{ type: 'TOTAL', count: 685000000, amount: 592000000000 }],
        },
        {
          name: 'Peer-to-peer payments',
          paymentInstruments: [{ type: 'TOTAL', count: 445000000, amount: 1120000000000 }],
        },
        {
          name: 'Recharge & bill payments',
          paymentInstruments: [{ type: 'TOTAL', count: 94000000, amount: 61500000000 }],
        },
      ],
    },
  },
  null,
  2
);

export function IngestModal({ open, onClose, states, onSuccess }: IngestModalProps) {
  const [format, setFormat] = useState<'csv' | 'pulse-json'>('csv');
  const [rawContent, setRawContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [metaState, setMetaState] = useState('Haryana');
  const [metaYear, setMetaYear] = useState('2025');
  const [metaQuarter, setMetaQuarter] = useState('4');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const previewInfo = useMemo(() => {
    if (!rawContent.trim()) return null;
    if (format === 'csv') {
      const lines = rawContent
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      return {
        detectedType: 'Tabular CSV',
        count: Math.max(0, lines.length - 1),
        headers: lines[0] ?? '',
      };
    }
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed?.data?.transactionData) {
        return {
          detectedType: 'PhonePe Pulse Aggregated JSON (transactionData)',
          count: parsed.data.transactionData.length,
          headers: 'name · paymentInstruments[0].count · amount',
        };
      }
      if (parsed?.data?.hoverDataList) {
        return {
          detectedType: 'PhonePe Pulse District Map JSON (hoverDataList)',
          count: parsed.data.hoverDataList.length,
          headers: 'district · metric[0].count · amount',
        };
      }
      if (Array.isArray(parsed)) {
        return {
          detectedType: 'JSON Record Array',
          count: parsed.length,
          headers: Object.keys(parsed[0] ?? {}).join(' · '),
        };
      }
    } catch {
      return { detectedType: 'Invalid JSON syntax', count: 0, headers: '' };
    }
    return { detectedType: 'Unrecognized JSON schema', count: 0, headers: '' };
  }, [rawContent, format]);

  if (!open) return null;

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);
    setResult(null);

    if (file.name.toLowerCase().endsWith('.json')) {
      setFormat('pulse-json');
    } else {
      setFormat('csv');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawContent(String(reader.result ?? ''));
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!rawContent.trim()) {
      setErrorMsg('Please upload a file or paste sample data first.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          content: rawContent,
          meta: {
            state: metaState,
            year: Number(metaYear),
            quarter: Number(metaQuarter),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to ingest data.');
      } else {
        setResult(data as IngestResponse);
        onSuccess();
      }
    } catch {
      setErrorMsg('Network error while ingesting data.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Raw JSON and CSV Data Ingestion"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-[#0F172A] shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Raw JSON / CSV Data Ingestion
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Upsert PhonePe Pulse repository JSON or tabular CSV rows directly into SQLite
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close ingestion modal"
            className="rounded-lg border border-slate-800 bg-[#1E293B] p-2 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Format Toggle + Sample Loaders */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center rounded-lg border border-slate-700 bg-[#1E293B] p-1">
              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setErrorMsg(null);
                  setResult(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  format === 'csv' ? 'bg-[#5F259F] text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>CSV Table</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('pulse-json');
                  setErrorMsg(null);
                  setResult(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  format === 'pulse-json'
                    ? 'bg-[#5F259F] text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>PhonePe Pulse JSON</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setRawContent(SAMPLE_CSV);
                  setFileName('sample_transactions.csv');
                  setErrorMsg(null);
                  setResult(null);
                }}
                className="rounded-md border border-slate-700 bg-[#1E293B] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                Load Sample CSV
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('pulse-json');
                  setRawContent(SAMPLE_PULSE_JSON);
                  setFileName('pulse_haryana_2025_q4.json');
                  setErrorMsg(null);
                  setResult(null);
                }}
                className="rounded-md border border-slate-700 bg-[#1E293B] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
              >
                Load Sample Pulse JSON
              </button>
            </div>
          </div>

          {/* Metadata Selectors for PhonePe Pulse Nested JSON */}
          {format === 'pulse-json' && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-[#1E293B]/60 p-3.5 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-400">Target State</span>
                <select
                  value={metaState}
                  onChange={(e) => setMetaState(e.target.value)}
                  className="rounded-md border border-slate-700 bg-[#0F172A] px-2.5 py-1.5 text-slate-100 focus:outline-none"
                >
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-400">Target Year</span>
                <select
                  value={metaYear}
                  onChange={(e) => setMetaYear(e.target.value)}
                  className="rounded-md border border-slate-700 bg-[#0F172A] px-2.5 py-1.5 text-slate-100 focus:outline-none"
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025].map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-slate-400">Target Quarter</span>
                <select
                  value={metaQuarter}
                  onChange={(e) => setMetaQuarter(e.target.value)}
                  className="rounded-md border border-slate-700 bg-[#0F172A] px-2.5 py-1.5 text-slate-100 focus:outline-none"
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={String(q)}>
                      Q{q}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {/* File Upload Dropzone */}
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-[#1E293B]/40 px-4 py-5 text-center hover:border-[#5F259F] transition-colors">
            <Upload className="h-6 w-6 text-purple-400" />
            <span className="mt-2 text-xs font-medium text-slate-200">
              {fileName ? `Selected: ${fileName}` : 'Choose a .csv or .json file from disk'}
            </span>
            <span className="mt-1 text-[11px] text-slate-400">
              Supports transactions CSV, district CSV, or PhonePe Pulse JSON payloads
            </span>
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Raw Payload Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Payload Content</span>
              {previewInfo && (
                <span className="text-slate-400">
                  {previewInfo.detectedType} ·{' '}
                  <span className="font-mono font-semibold text-slate-200">
                    {previewInfo.count}
                  </span>{' '}
                  rows detected
                </span>
              )}
            </div>
            <textarea
              rows={7}
              value={rawContent}
              onChange={(e) => {
                setRawContent(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={
                format === 'csv'
                  ? 'state,year,quarter,transaction_type,transaction_count,transaction_amount'
                  : '{"data": {"transactionData": [...]}}'
              }
              className="w-full rounded-lg border border-slate-700 bg-[#020617] p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:border-[#5F259F] focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-2.5 text-xs text-rose-200">
              {errorMsg}
            </div>
          )}

          {result && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-2 text-xs font-medium text-slate-300 hover:text-white cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5F259F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7334B8] disabled:opacity-50 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>{submitting ? 'Ingesting...' : 'Commit to SQLite'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
