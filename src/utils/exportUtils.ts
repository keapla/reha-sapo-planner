import { Therapist, Patient, ScheduleEntry, TIME_SLOTS } from '../types';
import { isTherapistOnBreak } from './scheduler';

interface ExportOptions {
  anonymize: boolean;
}

/**
 * Helper to get patient identifier based on anonymize option
 */
const getPatientLabel = (patientId: string, patients: Patient[], anonymize: boolean): string => {
  if (anonymize) {
    return patientId;
  }
  const patient = patients.find(p => p.id === patientId);
  return patient ? patient.name : patientId;
};

/**
 * Exports schedule to CSV in Matrix format (Rows: Time Slots, Columns: Therapists)
 */
export const exportToMatrixCSV = (
  entries: ScheduleEntry[],
  therapists: Therapist[],
  patients: Patient[],
  options: ExportOptions
) => {
  const { anonymize } = options;

  // Header row: Time slot, and each therapist name (with role)
  const headers = ['時間枠', ...therapists.map(t => `${t.name} (${t.role})`)];
  
  const rows: string[][] = [headers];

  // For each of the 24 time slots
  TIME_SLOTS.forEach(slot => {
    const row: string[] = [slot.label];

    therapists.forEach(therapist => {
      // Check if on break
      if (isTherapistOnBreak(therapist, slot.index)) {
        row.push('休憩');
        return;
      }

      // Check if busy slot
      if (therapist.busySlots.includes(slot.index)) {
        row.push('業務外');
        return;
      }

      // Find schedule entry
      const entry = entries.find(e => e.therapistId === therapist.id && e.slot === slot.index);
      if (entry) {
        row.push(getPatientLabel(entry.patientId, patients, anonymize));
      } else {
        row.push(''); // Empty slot
      }
    });

    rows.push(row);
  });

  // Trigger file download
  downloadCSV(rows, `rehab_schedule_matrix_${anonymize ? 'anonymous_' : ''}${getTodayDateString()}.csv`);
};

/**
 * Exports schedule to CSV in Flat List format
 */
export const exportToListCSV = (
  entries: ScheduleEntry[],
  therapists: Therapist[],
  patients: Patient[],
  options: ExportOptions
) => {
  const { anonymize } = options;

  const headers = ['時間枠', '職種', '療法士氏名', '患者ID', '患者氏名'];
  const rows: string[][] = [headers];

  // Sort entries by slot, then therapist role, then therapist name
  const sortedEntries = [...entries].sort((a, b) => {
    if (a.slot !== b.slot) return a.slot - b.slot;
    const tA = therapists.find(t => t.id === a.therapistId);
    const tB = therapists.find(t => t.id === b.therapistId);
    if (!tA || !tB) return 0;
    return tA.name.localeCompare(tB.name);
  });

  sortedEntries.forEach(entry => {
    const slot = TIME_SLOTS[entry.slot];
    const therapist = therapists.find(t => t.id === entry.therapistId);
    const patient = patients.find(p => p.id === entry.patientId);

    if (!therapist) return;

    rows.push([
      slot.label,
      entry.role,
      therapist.name,
      entry.patientId,
      anonymize ? entry.patientId : (patient?.name || '')
    ]);
  });

  downloadCSV(rows, `rehab_schedule_list_${anonymize ? 'anonymous_' : ''}${getTodayDateString()}.csv`);
};

/**
 * Helper to format and download CSV with UTF-8 BOM for Japanese Excel compatibility
 */
const downloadCSV = (data: string[][], filename: string) => {
  const BOM = '\uFEFF';
  const csvContent = BOM + data.map(row => 
    row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};
