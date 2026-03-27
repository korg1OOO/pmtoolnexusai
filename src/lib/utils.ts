import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date value as DD-MMM-YYYY (e.g. 27-Mar-2026).
 * Accepts a Date object, ISO string, or any value parseable by new Date().
 * Returns a fallback string if the value is null/undefined/invalid.
 */
export function formatDate(value: string | Date | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return fallback;
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format a number as a full comma-separated USD amount (e.g. $1,234,567.00).
 * No K/M abbreviations — always the full amount per PMCC contract reporting style.
 */
export function formatCurrency(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value as number)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value as number);
}

/**
 * Download a CSV file from a 2D array of rows.
 * @param rows - Array of arrays. First row is treated as the header.
 * @param filename - Filename without extension.
 */
export function exportToCSV(rows: (string | number | boolean | null | undefined)[][], filename: string): void {
  const escape = (v: string | number | boolean | null | undefined): string => {
    const str = v === null || v === undefined ? "" : String(v);
    // Wrap in quotes if it contains a comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
