/**
 * Example: Integrating Tauri CSV Export with Existing Student Export
 *
 * This shows how to update your existing export functionality
 * to use the Tauri-powered CSV export system
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import {
  exportCSVToDirectory,
  exportCSVBatch,
  arrayToCSV,
  isExportAvailable,
  getExportDirectory,
} from "@/lib/tauri/csv-export";

// Example: Update existing medical incidents export
export async function exportMedicalIncidentsToCSV(incidents: unknown[]) {
  // Prepare CSV data
  const csvData = incidents.map((incident: any) => ({
    Date: new Date(incident.date).toLocaleDateString(),
    Type: incident.type,
    Severity: incident.severity,
    Description: incident.description,
    Treatment: incident.treatment,
    "Follow-up Required": incident.followUpRequired ? "Yes" : "No",
    "Parents Notified": incident.parentsNotified ? "Yes" : "No",
  }));

  const csvContent = arrayToCSV(csvData);
  const filename = "medical_incidents.csv";

  // Use Tauri export if available (desktop app)
  if (isExportAvailable()) {
    const result = await exportCSVToDirectory(filename, csvContent);
    return result;
  }

  // Fallback to browser download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    file_path: filename,
    message: "Downloaded to browser default location",
  };
}

// Example: Batch export all student data
export async function exportAllStudentData(
  students: unknown[],
  medicalIncidents: unknown[],
  disciplinaryActions: unknown[],
) {
  if (!isExportAvailable()) {
    throw new Error("Batch export only available in desktop app");
  }

  // Prepare all CSV files
  const studentsCSV = arrayToCSV(
    students.map((s: any) => ({
      ID: s.id,
      Name: s.name,
      Email: s.email,
      Class: s.className,
      House: s.houseName,
    })),
  );

  const medicalCSV = arrayToCSV(
    medicalIncidents.map((m: any) => ({
      Date: new Date(m.date).toLocaleDateString(),
      Student: m.studentName,
      Type: m.type,
      Severity: m.severity,
    })),
  );

  const disciplinaryCSV = arrayToCSV(
    disciplinaryActions.map((d: any) => ({
      Date: new Date(d.date).toLocaleDateString(),
      Student: d.studentName,
      Offense: d.offense,
      Severity: d.severity,
    })),
  );

  // Batch export
  const results = await exportCSVBatch([
    ["students.csv", studentsCSV],
    ["medical_incidents.csv", medicalCSV],
    ["disciplinary_actions.csv", disciplinaryCSV],
  ]);

  return results;
}

// Example: Usage in a React component
export function StudentExportButton({ studentId }: { studentId: string }) {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch student data
      const response = await fetch(`/api/students/${studentId}/export`);
      const data = await response.json();

      // Export using Tauri if available
      const result = await exportMedicalIncidentsToCSV(data.medicalIncidents);

      if (result.success) {
        alert(`✅ Exported successfully to: ${result.file_path}`);
      } else {
        alert(`❌ Export failed: ${result.message}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-4 py-2 bg-primary text-white rounded"
    >
      {exporting ? "Exporting..." : "Export to CSV"}
    </button>
  );
}

// Example: Add export indicator in UI
export function ExportLocationIndicator() {
  const [exportDir, setExportDir] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (isExportAvailable()) {
      getExportDirectory().then((dir: string) => {
        setExportDir(dir);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  if (!isExportAvailable()) {
    return (
      <div className="text-sm text-muted-foreground">
        📥 CSV files will be downloaded to your browser&apos;s default location
      </div>
    );
  }

  return (
    <div className="text-sm text-muted-foreground">
      📁 CSV files will be saved to:{" "}
      <code className="bg-muted px-1 rounded">{exportDir}</code>
    </div>
  );
}
