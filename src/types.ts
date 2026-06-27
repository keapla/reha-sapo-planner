export type RoleType = 'PT' | 'OT' | 'ST';

export interface Therapist {
  id: string;
  name: string;
  role: RoleType;
  /** Break start slot index (takes 3 consecutive slots, i.e., 60 minutes) */
  breakStartSlot: number;
  /** External duties or other constraints where the therapist is unavailable */
  busySlots: number[];
  /** Past assigned units in the same week (1 unit = 20 minutes) */
  pastUnits?: number;
}

export interface Patient {
  id: string;
  name: string;
  orders: {
    PT: number;
    OT: number;
    ST: number;
  };
  /** Therapists that this patient cannot be assigned to */
  ngTherapistIds: string[];
}

export interface ScheduleEntry {
  id: string; // unique entry id
  patientId: string;
  therapistId: string;
  slot: number;
  role: RoleType;
  isManual?: boolean; // If manually locked/edited by user
}

export interface ScheduleResult {
  entries: ScheduleEntry[];
  unassignedOrders: {
    patientId: string;
    role: RoleType;
    count: number;
  }[];
  hardViolations: string[];
  softViolations: string[];
  therapistStats: {
    therapistId: string;
    therapistName: string;
    role: RoleType;
    assignedCount: number;
  }[];
  loadVariance: number;
  loadStdDev: number;
  score: number; // Optimization score (lower is better, combines soft penalties + variance)
}

export interface TimeSlotInfo {
  index: number;
  label: string;
  timeRange: string;
}

// 20-minute slots from 09:00 to 17:00 (24 slots total)
export const TIME_SLOTS: TimeSlotInfo[] = [
  { index: 0, label: "1枠目", timeRange: "09:00 - 09:20" },
  { index: 1, label: "2枠目", timeRange: "09:20 - 09:40" },
  { index: 2, label: "3枠目", timeRange: "09:40 - 10:00" },
  { index: 3, label: "4枠目", timeRange: "10:00 - 10:20" },
  { index: 4, label: "5枠目", timeRange: "10:20 - 10:40" },
  { index: 5, label: "6枠目", timeRange: "10:40 - 11:00" },
  { index: 6, label: "7枠目", timeRange: "11:00 - 11:20" },
  { index: 7, label: "8枠目", timeRange: "11:20 - 11:40" },
  { index: 8, label: "9枠目", timeRange: "11:40 - 12:00" },
  { index: 9, label: "10枠目", timeRange: "12:00 - 12:20" },
  { index: 10, label: "11枠目", timeRange: "12:20 - 12:40" },
  { index: 11, label: "12枠目", timeRange: "12:40 - 13:00" },
  { index: 12, label: "13枠目", timeRange: "13:00 - 13:20" },
  { index: 13, label: "14枠目", timeRange: "13:20 - 13:40" },
  { index: 14, label: "15枠目", timeRange: "13:40 - 14:00" },
  { index: 15, label: "16枠目", timeRange: "14:00 - 14:20" },
  { index: 16, label: "17枠目", timeRange: "14:20 - 14:40" },
  { index: 17, label: "18枠目", timeRange: "14:40 - 15:00" },
  { index: 18, label: "19枠目", timeRange: "15:00 - 15:20" },
  { index: 19, label: "20枠目", timeRange: "15:20 - 15:40" },
  { index: 20, label: "21枠目", timeRange: "15:40 - 16:00" },
  { index: 21, label: "22枠目", timeRange: "16:00 - 16:20" },
  { index: 22, label: "23枠目", timeRange: "16:20 - 16:40" },
  { index: 23, label: "24枠目", timeRange: "16:40 - 17:00" },
];
