// Fixed timetable structure - DO NOT MODIFY TIMINGS
// This defines the standard school day structure

export interface PeriodStructure {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakType?: "break" | "lunch";
  displayName: string;
}

export const TIMETABLE_STRUCTURE: PeriodStructure[] = [
  // Period I
  {
    periodNumber: 1,
    startTime: "08:45",
    endTime: "09:25",
    isBreak: false,
    displayName: "Period I",
  },
  // Period II
  {
    periodNumber: 2,
    startTime: "09:25",
    endTime: "10:05",
    isBreak: false,
    displayName: "Period II",
  },
  // BREAK 1 (10:05 - 10:15)
  {
    periodNumber: 0, // Special period number for breaks
    startTime: "10:05",
    endTime: "10:15",
    isBreak: true,
    breakType: "break",
    displayName: "BREAK",
  },
  // Period III
  {
    periodNumber: 3,
    startTime: "10:15",
    endTime: "10:55",
    isBreak: false,
    displayName: "Period III",
  },
  // Period IV
  {
    periodNumber: 4,
    startTime: "10:55",
    endTime: "11:35",
    isBreak: false,
    displayName: "Period IV",
  },
  // Period V
  {
    periodNumber: 5,
    startTime: "11:35",
    endTime: "12:15",
    isBreak: false,
    displayName: "Period V",
  },
  // LUNCH (12:15 - 12:55)
  {
    periodNumber: 0, // Special period number for breaks
    startTime: "12:15",
    endTime: "12:55",
    isBreak: true,
    breakType: "lunch",
    displayName: "LUNCH",
  },
  // Period VI
  {
    periodNumber: 6,
    startTime: "12:55",
    endTime: "13:35",
    isBreak: false,
    displayName: "Period VI",
  },
  // Period VII
  {
    periodNumber: 7,
    startTime: "13:35",
    endTime: "14:15",
    isBreak: false,
    displayName: "Period VII",
  },
  // BREAK 2 (14:15 - 14:25)
  {
    periodNumber: 0, // Special period number for breaks
    startTime: "14:15",
    endTime: "14:25",
    isBreak: true,
    breakType: "break",
    displayName: "BREAK",
  },
  // Period VIII
  {
    periodNumber: 8,
    startTime: "14:25",
    endTime: "15:05",
    isBreak: false,
    displayName: "Period VIII",
  },
  // Period IX
  {
    periodNumber: 9,
    startTime: "15:05",
    endTime: "15:45",
    isBreak: false,
    displayName: "Period IX",
  },
];

// Get all teaching periods (excluding breaks)
export const TEACHING_PERIODS = TIMETABLE_STRUCTURE.filter((p) => !p.isBreak);

// Get all breaks
export const BREAK_PERIODS = TIMETABLE_STRUCTURE.filter((p) => p.isBreak);

// Helper function to get period info
export function getPeriodInfo(
  periodNumber: number,
): PeriodStructure | undefined {
  return TIMETABLE_STRUCTURE.find((p) => p.periodNumber === periodNumber);
}

// Helper function to get current period based on time
export function getCurrentPeriodIndex(currentTime: Date): number {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const currentTimeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

  return TIMETABLE_STRUCTURE.findIndex((period) => {
    return (
      currentTimeStr >= period.startTime && currentTimeStr < period.endTime
    );
  });
}

// Helper function to format time display
export function formatPeriodTime(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}
