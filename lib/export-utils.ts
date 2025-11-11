/**
 * Export Utilities for Student Management
 * Functions to export medical incidents and disciplinary actions to various formats
 */

interface MedicalIncident {
  id: string;
  studentId: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  description: string;
  treatment: string | null;
  followUpRequired: boolean;
  followUpNotes: string | null;
  parentNotified: boolean;
  reportedBy: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface DisciplinaryAction {
  id: string;
  studentId: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  description: string;
  actionTaken: string | null;
  witnesses: string | null;
  resolution: string | null;
  parentMeetingRequired: boolean;
  parentMeetingDate: string | null;
  reportedBy: string;
  reporter?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Export medical incidents to CSV format
 */
export function exportMedicalIncidentsToCSV(
  incidents: MedicalIncident[],
  studentName: string,
): void {
  if (!incidents || incidents.length === 0) {
    alert("No medical incidents to export");
    return;
  }

  const headers = [
    "Date",
    "Type",
    "Severity",
    "Description",
    "Treatment",
    "Follow-up Required",
    "Follow-up Notes",
    "Parent Notified",
    "Reported By",
    "Created At",
  ];

  const rows = incidents.map((incident) => [
    new Date(incident.incidentDate).toLocaleDateString(),
    incident.incidentType,
    incident.severity,
    `"${incident.description.replace(/"/g, '""')}"`,
    incident.treatment ? `"${incident.treatment.replace(/"/g, '""')}"` : "",
    incident.followUpRequired ? "Yes" : "No",
    incident.followUpNotes
      ? `"${incident.followUpNotes.replace(/"/g, '""')}"`
      : "",
    incident.parentNotified ? "Yes" : "No",
    incident.reporter?.name || "Unknown",
    new Date(incident.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadCSV(
    csvContent,
    `${studentName.replace(/\s+/g, "_")}_medical_incidents_${new Date().toISOString().split("T")[0]}.csv`,
  );
}

/**
 * Export disciplinary actions to CSV format
 */
export function exportDisciplinaryActionsToCSV(
  actions: DisciplinaryAction[],
  studentName: string,
): void {
  if (!actions || actions.length === 0) {
    alert("No disciplinary actions to export");
    return;
  }

  const headers = [
    "Date",
    "Type",
    "Severity",
    "Description",
    "Action Taken",
    "Witnesses",
    "Resolution",
    "Parent Meeting Required",
    "Parent Meeting Date",
    "Reported By",
    "Created At",
  ];

  const rows = actions.map((action) => [
    new Date(action.incidentDate).toLocaleDateString(),
    action.incidentType,
    action.severity,
    `"${action.description.replace(/"/g, '""')}"`,
    action.actionTaken ? `"${action.actionTaken.replace(/"/g, '""')}"` : "",
    action.witnesses ? `"${action.witnesses.replace(/"/g, '""')}"` : "",
    action.resolution ? `"${action.resolution.replace(/"/g, '""')}"` : "",
    action.parentMeetingRequired ? "Yes" : "No",
    action.parentMeetingDate
      ? new Date(action.parentMeetingDate).toLocaleDateString()
      : "",
    action.reporter?.name || "Unknown",
    new Date(action.createdAt).toLocaleDateString(),
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

  downloadCSV(
    csvContent,
    `${studentName.replace(/\s+/g, "_")}_disciplinary_actions_${new Date().toISOString().split("T")[0]}.csv`,
  );
}

/**
 * Export medical incidents to JSON format
 */
export function exportMedicalIncidentsToJSON(
  incidents: MedicalIncident[],
  studentName: string,
): void {
  if (!incidents || incidents.length === 0) {
    alert("No medical incidents to export");
    return;
  }

  const exportData = {
    studentName,
    exportDate: new Date().toISOString(),
    totalIncidents: incidents.length,
    incidents: incidents.map((incident) => ({
      date: incident.incidentDate,
      type: incident.incidentType,
      severity: incident.severity,
      description: incident.description,
      treatment: incident.treatment,
      followUpRequired: incident.followUpRequired,
      followUpNotes: incident.followUpNotes,
      parentNotified: incident.parentNotified,
      reportedBy: incident.reporter?.name || "Unknown",
      reportedAt: incident.createdAt,
    })),
  };

  downloadJSON(
    exportData,
    `${studentName.replace(/\s+/g, "_")}_medical_incidents_${new Date().toISOString().split("T")[0]}.json`,
  );
}

/**
 * Export disciplinary actions to JSON format
 */
export function exportDisciplinaryActionsToJSON(
  actions: DisciplinaryAction[],
  studentName: string,
): void {
  if (!actions || actions.length === 0) {
    alert("No disciplinary actions to export");
    return;
  }

  const exportData = {
    studentName,
    exportDate: new Date().toISOString(),
    totalActions: actions.length,
    actions: actions.map((action) => ({
      date: action.incidentDate,
      type: action.incidentType,
      severity: action.severity,
      description: action.description,
      actionTaken: action.actionTaken,
      witnesses: action.witnesses,
      resolution: action.resolution,
      parentMeetingRequired: action.parentMeetingRequired,
      parentMeetingDate: action.parentMeetingDate,
      reportedBy: action.reporter?.name || "Unknown",
      reportedAt: action.createdAt,
    })),
  };

  downloadJSON(
    exportData,
    `${studentName.replace(/\s+/g, "_")}_disciplinary_actions_${new Date().toISOString().split("T")[0]}.json`,
  );
}

/**
 * Generate a comprehensive student report
 */
export function exportStudentReport(
  studentName: string,
  medicalIncidents: MedicalIncident[],
  disciplinaryActions: DisciplinaryAction[],
): void {
  const report = {
    studentName,
    reportGeneratedAt: new Date().toISOString(),
    summary: {
      totalMedicalIncidents: medicalIncidents.length,
      totalDisciplinaryActions: disciplinaryActions.length,
      criticalMedicalIncidents: medicalIncidents.filter(
        (i) => i.severity === "critical",
      ).length,
      severeDisciplinaryActions: disciplinaryActions.filter(
        (a) => a.severity === "Severe",
      ).length,
      medicalFollowUpsRequired: medicalIncidents.filter(
        (i) => i.followUpRequired,
      ).length,
      parentMeetingsRequired: disciplinaryActions.filter(
        (a) => a.parentMeetingRequired,
      ).length,
    },
    medicalIncidents: medicalIncidents.map((incident) => ({
      date: incident.incidentDate,
      type: incident.incidentType,
      severity: incident.severity,
      description: incident.description,
      treatment: incident.treatment,
      followUpRequired: incident.followUpRequired,
      followUpNotes: incident.followUpNotes,
      parentNotified: incident.parentNotified,
      reportedBy: incident.reporter?.name || "Unknown",
    })),
    disciplinaryActions: disciplinaryActions.map((action) => ({
      date: action.incidentDate,
      type: action.incidentType,
      severity: action.severity,
      description: action.description,
      actionTaken: action.actionTaken,
      witnesses: action.witnesses,
      resolution: action.resolution,
      parentMeetingRequired: action.parentMeetingRequired,
      parentMeetingDate: action.parentMeetingDate,
      reportedBy: action.reporter?.name || "Unknown",
    })),
  };

  downloadJSON(
    report,
    `${studentName.replace(/\s+/g, "_")}_comprehensive_report_${new Date().toISOString().split("T")[0]}.json`,
  );
}

/**
 * Helper function to download CSV
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Helper function to download JSON
 */
function downloadJSON(data: Record<string, unknown>, filename: string): void {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Print medical incidents report
 */
export function printMedicalIncidentsReport(
  incidents: MedicalIncident[],
  studentName: string,
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print the report");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Incidents Report - ${studentName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
        }
        h1 {
          color: #2563eb;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
        }
        h2 {
          color: #1e40af;
          margin-top: 30px;
        }
        .summary {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .incident {
          border: 1px solid #e5e7eb;
          padding: 15px;
          margin: 15px 0;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .incident-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .severity {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .severity-critical {
          background: #fee2e2;
          color: #991b1b;
        }
        .severity-major {
          background: #fed7aa;
          color: #9a3412;
        }
        .severity-moderate {
          background: #fef3c7;
          color: #92400e;
        }
        .severity-minor {
          background: #d1fae5;
          color: #065f46;
        }
        .label {
          font-weight: bold;
          color: #374151;
        }
        .value {
          color: #6b7280;
          margin-bottom: 8px;
        }
        @media print {
          body {
            margin: 20px;
          }
        }
      </style>
    </head>
    <body>
      <h1>Medical Incidents Report</h1>
      <div class="summary">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Total Incidents:</strong> ${incidents.length}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>

      ${incidents
        .map(
          (incident, index) => `
        <div class="incident">
          <div class="incident-header">
            <h3>Incident #${index + 1}</h3>
            <span class="severity severity-${incident.severity.toLowerCase()}">
              ${incident.severity.toUpperCase()}
            </span>
          </div>
          <div class="value">
            <span class="label">Date:</span>
            ${new Date(incident.incidentDate).toLocaleString()}
          </div>
          <div class="value">
            <span class="label">Type:</span> ${incident.incidentType}
          </div>
          <div class="value">
            <span class="label">Description:</span> ${incident.description}
          </div>
          <div class="value">
            <span class="label">Treatment:</span> ${incident.treatment}
          </div>
          ${
            incident.followUpRequired
              ? `
          <div class="value">
            <span class="label">Follow-up Notes:</span> ${incident.followUpNotes || "N/A"}
          </div>
          `
              : ""
          }
          <div class="value">
            <span class="label">Parent Notified:</span>
            ${incident.parentNotified ? "Yes" : "No"}
          </div>
          <div class="value">
            <span class="label">Reported By:</span>
            ${incident.reporter?.name || "Unknown"}
          </div>
        </div>
      `,
        )
        .join("")}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}

/**
 * Print disciplinary actions report
 */
export function printDisciplinaryActionsReport(
  actions: DisciplinaryAction[],
  studentName: string,
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print the report");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Disciplinary Actions Report - ${studentName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
        }
        h1 {
          color: #ea580c;
          border-bottom: 2px solid #ea580c;
          padding-bottom: 10px;
        }
        .summary {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .action {
          border: 1px solid #e5e7eb;
          padding: 15px;
          margin: 15px 0;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .action-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .severity {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .severity-severe {
          background: #fee2e2;
          color: #991b1b;
        }
        .severity-major {
          background: #fed7aa;
          color: #9a3412;
        }
        .severity-moderate {
          background: #fef3c7;
          color: #92400e;
        }
        .severity-minor {
          background: #d1fae5;
          color: #065f46;
        }
        .label {
          font-weight: bold;
          color: #374151;
        }
        .value {
          color: #6b7280;
          margin-bottom: 8px;
        }
        @media print {
          body {
            margin: 20px;
          }
        }
      </style>
    </head>
    <body>
      <h1>Disciplinary Actions Report</h1>
      <div class="summary">
        <p><strong>Student:</strong> ${studentName}</p>
        <p><strong>Total Actions:</strong> ${actions.length}</p>
        <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>

      ${actions
        .map(
          (action, index) => `
        <div class="action">
          <div class="action-header">
            <h3>Action #${index + 1}</h3>
            <span class="severity severity-${action.severity.toLowerCase()}">
              ${action.severity.toUpperCase()}
            </span>
          </div>
          <div class="value">
            <span class="label">Date:</span>
            ${new Date(action.incidentDate).toLocaleString()}
          </div>
          <div class="value">
            <span class="label">Type:</span> ${action.incidentType}
          </div>
          <div class="value">
            <span class="label">Description:</span> ${action.description}
          </div>
          <div class="value">
            <span class="label">Action Taken:</span> ${action.actionTaken}
          </div>
          ${
            action.witnesses
              ? `
          <div class="value">
            <span class="label">Witnesses:</span> ${action.witnesses}
          </div>
          `
              : ""
          }
          ${
            action.resolution
              ? `
          <div class="value">
            <span class="label">Resolution:</span> ${action.resolution}
          </div>
          `
              : ""
          }
          ${
            action.parentMeetingRequired
              ? `
          <div class="value">
            <span class="label">Parent Meeting Date:</span>
            ${action.parentMeetingDate ? new Date(action.parentMeetingDate).toLocaleString() : "Not scheduled"}
          </div>
          `
              : ""
          }
          <div class="value">
            <span class="label">Reported By:</span>
            ${action.reporter?.name || "Unknown"}
          </div>
        </div>
      `,
        )
        .join("")}
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 250);
}
