/**
 * Trend Street — CSV Formula Injection (CWE-1236) Defense Utility.
 * Neutralizes spreadsheet calculation operators (=, +, -, @, tab, CR)
 * to protect administrators opening customer/order/inventory CSV exports
 * in Microsoft Excel, Apple Numbers, or Google Sheets.
 */

const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Escapes a single cell value for CSV export:
 * 1. Converts null/undefined to empty string.
 * 2. If the string starts with a formula trigger (=, +, -, @, \t, \r), prefixes with a single quote (').
 * 3. Encloses in double quotes and escapes any existing double quotes as `""`.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Neutralize formula injection triggers (checking both initial char and trimmed char for space bypasses)
  const trimmed = str.trimStart();
  if (
    (str.length > 0 && FORMULA_TRIGGERS.has(str.charAt(0))) ||
    (trimmed.length > 0 && FORMULA_TRIGGERS.has(trimmed.charAt(0)))
  ) {
    str = `'${str}`;
  }

  // Escape existing double quotes
  const escaped = str.replace(/"/g, '""');

  return `"${escaped}"`;
}

/**
 * Generates safe CSV string from a header row and 2D array of row values.
 */
export function generateSafeCsv(headers: string[], rows: unknown[][]): string {
  const safeHeaders = headers.map(escapeCsvCell).join(",");
  const safeRows = rows.map((row) => row.map(escapeCsvCell).join(","));
  return [safeHeaders, ...safeRows].join("\r\n");
}

/**
 * Formats a download filename with date string, e.g. "trendstreet-inventory-2026-10-26.csv".
 */
export function getSafeExportFilename(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  return `trendstreet-${cleanPrefix}-${dateStr}.csv`;
}
