/**
 * Tauri CSV Export Utilities
 *
 * TypeScript bindings for Rust-powered CSV export functionality
 * with SQLite-backed settings storage
 */

import { invoke } from "@tauri-apps/api/core";

export interface ExportResult {
  success: boolean;
  file_path: string;
  message: string;
}

export interface ExportSettings {
  export_directory: string;
  auto_open: boolean;
  include_timestamp: boolean;
}

/**
 * Export CSV data to the configured directory
 *
 * @param filename - Name of the CSV file (e.g., "students.csv")
 * @param csvContent - CSV content as a string
 * @returns ExportResult with success status and file path
 *
 * @example
 * ```ts
 * const result = await exportCSVToDirectory("students.csv", csvData);
 * if (result.success) {
 *   console.log(`Exported to: ${result.file_path}`);
 * }
 * ```
 */
export async function exportCSVToDirectory(
  filename: string,
  csvContent: string,
): Promise<ExportResult> {
  try {
    return await invoke<ExportResult>("export_csv_to_directory", {
      filename,
      csvContent,
    });
  } catch (error) {
    return {
      success: false,
      file_path: "",
      message: `Export failed: ${error}`,
    };
  }
}

/**
 * Export multiple CSV files in a batch operation
 *
 * @param exports - Array of [filename, content] tuples
 * @returns Array of ExportResults for each file
 *
 * @example
 * ```ts
 * const results = await exportCSVBatch([
 *   ["students.csv", studentData],
 *   ["teachers.csv", teacherData],
 * ]);
 * ```
 */
export async function exportCSVBatch(
  exports: [string, string][],
): Promise<ExportResult[]> {
  try {
    return await invoke<ExportResult[]>("export_csv_batch", {
      exports,
    });
  } catch (error) {
    console.error("Batch export failed:", error);
    return exports.map(() => ({
      success: false,
      file_path: "",
      message: `Export failed: ${error}`,
    }));
  }
}

/**
 * Get the current export directory path
 *
 * @returns The configured export directory path
 */
export async function getExportDirectory(): Promise<string> {
  try {
    return await invoke<string>("get_export_directory");
  } catch (error) {
    console.error("Failed to get export directory:", error);
    return "./exports";
  }
}

/**
 * Open the export directory in the system file explorer
 */
export async function openExportDirectory(): Promise<void> {
  try {
    await invoke("open_export_directory");
  } catch (error) {
    console.error("Failed to open export directory:", error);
    throw error;
  }
}

/**
 * Get current export settings from SQLite database
 *
 * @returns Current export settings
 */
export async function getExportSettings(): Promise<ExportSettings> {
  try {
    return await invoke<ExportSettings>("get_settings");
  } catch (error) {
    console.error("Failed to get settings:", error);
    // Return defaults
    return {
      export_directory: "./exports",
      auto_open: false,
      include_timestamp: true,
    };
  }
}

/**
 * Update export settings in SQLite database
 *
 * @param settings - New settings to save
 *
 * @example
 * ```ts
 * await updateExportSettings({
 *   export_directory: "C:/MyExports",
 *   auto_open: true,
 *   include_timestamp: false,
 * });
 * ```
 */
export async function updateExportSettings(
  settings: ExportSettings,
): Promise<void> {
  try {
    await invoke("update_settings", { settings });
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw error;
  }
}

/**
 * Reset export settings to defaults
 *
 * @returns Default settings
 */
export async function resetExportSettings(): Promise<ExportSettings> {
  try {
    return await invoke<ExportSettings>("reset_settings");
  } catch (error) {
    console.error("Failed to reset settings:", error);
    throw error;
  }
}

/**
 * Open a folder picker dialog to select export directory
 * Updates settings automatically if a folder is selected
 *
 * @returns Selected directory path or null if cancelled
 *
 * @example
 * ```ts
 * const newDir = await selectExportDirectory();
 * if (newDir) {
 *   console.log(`Export directory changed to: ${newDir}`);
 * }
 * ```
 */
export async function selectExportDirectory(): Promise<string | null> {
  try {
    return await invoke<string | null>("select_export_directory");
  } catch (error) {
    console.error("Failed to select directory:", error);
    throw error;
  }
}

/**
 * Check if running in Tauri environment
 * CSV export features only work in Tauri app
 */
export function isExportAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

/**
 * Helper to convert data array to CSV string
 *
 * @param data - Array of objects to convert
 * @param headers - Optional custom headers (defaults to object keys)
 * @returns CSV string
 *
 * @example
 * ```ts
 * const data = [
 *   { name: "John", age: 30 },
 *   { name: "Jane", age: 25 },
 * ];
 * const csv = arrayToCSV(data);
 * await exportCSVToDirectory("data.csv", csv);
 * ```
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[],
): string {
  if (data.length === 0) return "";

  const cols = headers || Object.keys(data[0]);
  const headerRow = cols.map(escapeCSVField).join(",");

  const rows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col];
        return escapeCSVField(String(value ?? ""));
      })
      .join(","),
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Escape CSV field for proper formatting
 */
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
